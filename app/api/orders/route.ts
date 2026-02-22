import { NextResponse } from "next/server";
import { z } from "zod";
import { isSubscriptionBlocked, makeId, readStore, writeStore } from "@/lib/store";
import { Order, OrderPaymentMethod } from "@/lib/store-data";

const orderSchema = z.object({
  restaurantSlug: z.string().min(1),
  source: z.enum(["catalog", "panel"]).optional(),
  customerName: z.string().min(2),
  customerWhatsapp: z.string().min(10),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().min(5),
  couponCode: z.string().optional(),
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

function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase();
}

function isCouponWithinDateTime(coupon: {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const parseTime = (time: string) => {
    const [hh, mm] = time.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  };

  if (coupon.startDate && coupon.startDate > today) return false;
  if (coupon.endDate && coupon.endDate < today) return false;

  const startMinutes = coupon.startTime ? parseTime(coupon.startTime) : null;
  const endMinutes = coupon.endTime ? parseTime(coupon.endTime) : null;
  if (startMinutes !== null && currentMinutes < startMinutes) return false;
  if (endMinutes !== null && currentMinutes > endMinutes) return false;

  return true;
}

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
  const normalizedCoupon = parsed.data.couponCode
    ? normalizeCouponCode(parsed.data.couponCode)
    : "";
  let discountValue = 0;
  let appliedCouponCode = "";

  if (normalizedCoupon) {
    const couponIndex = (restaurant.coupons ?? []).findIndex(
      (coupon) => normalizeCouponCode(coupon.code) === normalizedCoupon
    );
    if (couponIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Cupom invalido para esta loja." },
        { status: 400 }
      );
    }

    const coupon = restaurant.coupons![couponIndex];
    if (!coupon.active || !isCouponWithinDateTime(coupon)) {
      return NextResponse.json(
        { success: false, message: "Cupom inativo ou fora da validade." },
        { status: 400 }
      );
    }
    if (subtotal < (coupon.minOrderValue ?? 0)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cupom disponivel apenas para pedidos acima de R$ ${Number(coupon.minOrderValue ?? 0).toFixed(2)}.`
        },
        { status: 400 }
      );
    }

    const normalizedWhatsapp = parsed.data.customerWhatsapp.replace(/\D/g, "");
    const customer = store.customers.find(
      (item) =>
        item.restaurantSlug === restaurant.slug &&
        item.whatsapp.replace(/\D/g, "") === normalizedWhatsapp
    );

    if (customer?.usedCouponCodes?.includes(normalizedCoupon)) {
      return NextResponse.json(
        { success: false, message: "Este cupom ja foi utilizado por este cliente nesta loja." },
        { status: 409 }
      );
    }

    discountValue =
      coupon.discountType === "percent"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
    discountValue = Math.max(0, Math.min(subtotal, Number(discountValue.toFixed(2))));
    appliedCouponCode = normalizedCoupon;
  }

  const deliveryFee = restaurant.deliveryFee;
  const total = subtotal - discountValue + deliveryFee;

  const paymentLabels: Record<OrderPaymentMethod, string> = {
    money: "Dinheiro",
    card: "Cartao",
    pix: "Pix"
  };

  const createdOrder: Order = {
    id: makeId("order"),
    restaurantSlug: restaurant.slug,
    source: parsed.data.source ?? "catalog",
    customerName: parsed.data.customerName,
    customerWhatsapp: parsed.data.customerWhatsapp,
    customerAddress: parsed.data.customerAddress,
    paymentMethod: parsed.data.paymentMethod,
    items: parsed.data.items,
    subtotal,
    discountValue,
    couponCode: appliedCouponCode || undefined,
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
      usedCouponCodes:
        appliedCouponCode && !current.usedCouponCodes?.includes(appliedCouponCode)
          ? [...(current.usedCouponCodes ?? []), appliedCouponCode]
          : current.usedCouponCodes ?? [],
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
      usedCouponCodes: appliedCouponCode ? [appliedCouponCode] : [],
      lastOrderAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }

  if (appliedCouponCode) {
    const targetRestaurant = store.restaurants.find((item) => item.slug === restaurant.slug);
    if (targetRestaurant?.coupons?.length) {
      targetRestaurant.coupons = targetRestaurant.coupons.map((coupon) =>
        normalizeCouponCode(coupon.code) === appliedCouponCode
          ? { ...coupon, uses: (coupon.uses ?? 0) + 1 }
          : coupon
      );
    }
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
  if (discountValue > 0) {
    message += `Desconto (${appliedCouponCode}): -R$ ${discountValue.toFixed(2)}\n`;
  }
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
