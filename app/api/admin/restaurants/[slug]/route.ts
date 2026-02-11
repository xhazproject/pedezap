import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, sanitizeSlug, writeStore } from "@/lib/store";
import { hashPassword } from "@/lib/password";

const updateRestaurantSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  whatsapp: z.string().min(10).optional(),
  plan: z.string().min(2).optional(),
  subscribedPlanId: z.string().min(2).nullable().optional(),
  document: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  ownerPassword: z.string().min(6).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional()
});

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = updateRestaurantSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const current = store.restaurants[index];
  const { document, ...nextData } = parsed.data;
  const nextOwnerPassword = nextData.ownerPassword
    ? await hashPassword(nextData.ownerPassword)
    : current.ownerPassword;
  const nextSlug = parsed.data.slug ? sanitizeSlug(parsed.data.slug) : current.slug;
  const selectedPlan =
    parsed.data.subscribedPlanId === undefined
      ? null
      : parsed.data.subscribedPlanId === null
      ? null
      : store.plans.find((plan) => plan.id === parsed.data.subscribedPlanId && plan.active) ?? null;

  if (
    nextSlug !== current.slug &&
    store.restaurants.some((item, idx) => idx !== index && item.slug === nextSlug)
  ) {
    return NextResponse.json(
      { success: false, message: "Slug ja existe." },
      { status: 409 }
    );
  }

  store.restaurants[index] = {
    ...current,
    ...nextData,
    plan: selectedPlan?.name ?? nextData.plan ?? current.plan,
    subscribedPlanId:
      nextData.subscribedPlanId === undefined
        ? current.subscribedPlanId ?? null
        : selectedPlan?.id ?? null,
    taxId:
      document === undefined
        ? current.taxId ?? null
        : document
        ? document.replace(/\D/g, "")
        : null,
    slug: nextSlug,
    ownerEmail: nextData.ownerEmail ?? current.ownerEmail,
    ownerPassword: nextOwnerPassword
  };

  if (nextSlug !== current.slug) {
    store.orders = store.orders.map((order) =>
      order.restaurantSlug === current.slug
        ? { ...order, restaurantSlug: nextSlug }
        : order
    );
  }

  await writeStore(store);
  return NextResponse.json({ success: true, restaurant: store.restaurants[index] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const removed = store.restaurants[index];
  store.restaurants.splice(index, 1);
  store.orders = store.orders.filter((order) => order.restaurantSlug !== removed.slug);

  await writeStore(store);
  return NextResponse.json({ success: true });
}
