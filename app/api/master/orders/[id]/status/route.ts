import { NextResponse } from "next/server";
import { z } from "zod";
import { isSubscriptionBlocked, readStore, writeStore } from "@/lib/store";

const schema = z.object({
  restaurantSlug: z.string().min(1),
  status: z.enum(["Recebido", "Em preparo", "Concluido"])
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.orders.findIndex(
    (order) =>
      order.id === params.id &&
      order.restaurantSlug === parsed.data.restaurantSlug
  );

  if (index < 0) {
    return NextResponse.json(
      { success: false, message: "Pedido nao encontrado." },
      { status: 404 }
    );
  }

  const restaurant = store.restaurants.find((item) => item.slug === parsed.data.restaurantSlug);
  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (isSubscriptionBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Assinatura expirada. Renove o plano para operar pedidos." },
      { status: 402 }
    );
  }

  store.orders[index] = {
    ...store.orders[index],
    status: parsed.data.status
  };
  await writeStore(store);

  return NextResponse.json({
    success: true,
    order: store.orders[index]
  });
}
