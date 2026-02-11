import { NextResponse } from "next/server";
import { z } from "zod";
import { isSubscriptionBlocked, makeId, readStore, writeStore } from "@/lib/store";

const customerUpsertSchema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().min(8)
});

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);
  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (isSubscriptionBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Assinatura expirada. Renove o plano para acessar clientes." },
      { status: 402 }
    );
  }

  let customers = store.customers
    .filter((item) => item.restaurantSlug === params.slug)
    .sort((a, b) => {
      const aDate = a.lastOrderAt ?? a.createdAt;
      const bDate = b.lastOrderAt ?? b.createdAt;
      return aDate < bDate ? 1 : -1;
    });

  if (query) {
    customers = customers.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.whatsapp.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    success: true,
    customers
  });
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = customerUpsertSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados de cliente invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);
  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (isSubscriptionBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Assinatura expirada. Nao foi possivel cadastrar cliente." },
      { status: 402 }
    );
  }

  const normalizedWhatsapp = parsed.data.whatsapp.replace(/\D/g, "");
  const now = new Date().toISOString();

  const customerIndex = store.customers.findIndex(
    (item) =>
      item.restaurantSlug === params.slug &&
      item.whatsapp.replace(/\D/g, "") === normalizedWhatsapp
  );

  if (customerIndex >= 0) {
    const current = store.customers[customerIndex];
    store.customers[customerIndex] = {
      ...current,
      name: parsed.data.name.trim(),
      whatsapp: parsed.data.whatsapp.trim()
    };
  } else {
    store.customers.unshift({
      id: makeId("customer"),
      restaurantSlug: params.slug,
      name: parsed.data.name.trim(),
      whatsapp: parsed.data.whatsapp.trim(),
      totalOrders: 0,
      totalSpent: 0,
      lastOrderAt: null,
      createdAt: now
    });
  }

  await writeStore(store);

  return NextResponse.json({ success: true });
}
