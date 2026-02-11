import { NextResponse } from "next/server";
import { z } from "zod";
import { isSubscriptionBlocked, makeId, readStore, writeStore } from "@/lib/store";
import { Order, OrderPaymentMethod } from "@/lib/store-data";

const orderSchema = z.object({
  restaurantSlug: z.string().min(1),
  customerName: z.string().min(2),
  customerWhatsapp: z.string().min(10),
  customerAddress: z.string().min(5),
  paymentMethod: z.enum(["money", "card", "pix"]),
  generalNotes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number().min(0),
      quantity: z.number().int().positive(),
      notes: z.string().optional()
    })
  )
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const store = await readStore();

  const orders = slug
    ? store.orders.filter((item) => item.restaurantSlug === slug)
    : store.orders;

  return NextResponse.json({ success: true, orders });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Pedido invalido." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurant = store.restaurants.find(
    (item) => item.slug === parsed.data.restaurantSlug
  );

  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (restaurant.openForOrders === false) {
    return NextResponse.json(
      { success: false, message: "Loja fechada no momento para novos pedidos." },
      { status: 409 }
    );
  }
  if (isSubscriptionBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Restaurante com assinatura inativa no momento." },
      { status: 402 }
    );
  }

  const subtotal = parsed.data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = restaurant.deliveryFee;
  const total = subtotal + deliveryFee;

  const paymentLabels: Record<OrderPaymentMethod, string> = {
    money: "Dinheiro",
    card: "Cartao",
    pix: "Pix"
  };

  const createdOrder: Order = {
    id: makeId("order"),
    restaurantSlug: restaurant.slug,
    customerName: parsed.data.customerName,
    customerWhatsapp: parsed.data.customerWhatsapp,
    customerAddress: parsed.data.customerAddress,
    paymentMethod: parsed.data.paymentMethod,
    items: parsed.data.items,
    subtotal,
    deliveryFee,
    total,
    generalNotes: parsed.data.generalNotes,
    status: "Recebido",
    createdAt: new Date().toISOString()
  };

  store.orders.unshift(createdOrder);

  const normalizedWhatsapp = parsed.data.customerWhatsapp.replace(/\D/g, "");
  const customerIndex = store.customers.findIndex(
    (item) =>
      item.restaurantSlug === restaurant.slug &&
      item.whatsapp.replace(/\D/g, "") === normalizedWhatsapp
  );

  if (customerIndex >= 0) {
    const current = store.customers[customerIndex];
    store.customers[customerIndex] = {
      ...current,
      name: parsed.data.customerName,
      whatsapp: parsed.data.customerWhatsapp,
      totalOrders: current.totalOrders + 1,
      totalSpent: current.totalSpent + total,
      lastOrderAt: new Date().toISOString()
    };
  } else {
    store.customers.unshift({
      id: makeId("customer"),
      restaurantSlug: restaurant.slug,
      name: parsed.data.customerName,
      whatsapp: parsed.data.customerWhatsapp,
      totalOrders: 1,
      totalSpent: total,
      lastOrderAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }

  await writeStore(store);

  let message = `*NOVO PEDIDO - ${restaurant.name}*\n`;
  message += "------------------------------\n";
  parsed.data.items.forEach((item) => {
    message += `${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)})\n`;
    if (item.notes) message += `Obs: ${item.notes}\n`;
  });
  message += "------------------------------\n";
  message += `Subtotal: R$ ${subtotal.toFixed(2)}\n`;
  message += `Taxa entrega: R$ ${deliveryFee.toFixed(2)}\n`;
  message += `*TOTAL: R$ ${total.toFixed(2)}*\n\n`;
  message += "*DADOS DO CLIENTE*\n";
  message += `Nome: ${parsed.data.customerName}\n`;
  message += `WhatsApp: ${parsed.data.customerWhatsapp}\n`;
  message += `Endereco: ${parsed.data.customerAddress}\n`;
  message += `Pagamento: ${paymentLabels[parsed.data.paymentMethod]}\n`;
  if (parsed.data.generalNotes) {
    message += `\nObs geral: ${parsed.data.generalNotes}`;
  }

  return NextResponse.json({
    success: true,
    order: createdOrder,
    whatsappUrl: `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(message)}`
  });
}
