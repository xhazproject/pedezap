import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, sanitizeSlug, writeStore } from "@/lib/store";
import { hashPassword } from "@/lib/password";
import { geocodeAddress, parseFiniteNumber } from "@/lib/geo";

const createRestaurantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  whatsapp: z.string().min(10),
  plan: z.string().min(2).optional(),
  subscribedPlanId: z.string().min(2).optional(),
  document: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  ownerPassword: z.string().min(6).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional()
});

export async function GET() {
  const store = await readStore();
  const restaurants = store.restaurants.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    whatsapp: item.whatsapp,
    plan: item.plan,
    active: item.active,
    ordersCount: store.orders.filter((order) => order.restaurantSlug === item.slug).length,
    ownerEmail: item.ownerEmail,
    document: item.taxId ?? "",
    address: item.address ?? "",
    city: item.city ?? "",
    state: item.state ?? "",
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    subscribedPlanId: item.subscribedPlanId ?? null,
    trialEndsAt: item.trialEndsAt ?? null,
    subscriptionStatus: item.subscriptionStatus ?? "expired"
  }));
  return NextResponse.json({ success: true, restaurants });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = createRestaurantSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const slug = sanitizeSlug(parsed.data.slug);
  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  const selectedPlan =
    (parsed.data.subscribedPlanId
      ? store.plans.find((plan) => plan.id === parsed.data.subscribedPlanId && plan.active)
      : null) ??
    (parsed.data.plan
      ? store.plans.find((plan) => plan.name === parsed.data.plan && plan.active)
      : null) ??
    store.plans.find((plan) => plan.active) ??
    null;

  if (store.restaurants.some((item) => item.slug === slug)) {
    return NextResponse.json(
      { success: false, message: "Slug ja existe." },
      { status: 409 }
    );
  }
  const nextAddress = parsed.data.address || "Endereco nao informado";
  const nextCity = parsed.data.city || "Cidade";
  const nextState = parsed.data.state || "UF";
  const latitudeInput = parseFiniteNumber(parsed.data.latitude);
  const longitudeInput = parseFiniteNumber(parsed.data.longitude);
  const geocoded =
    latitudeInput !== null && longitudeInput !== null
      ? { latitude: latitudeInput, longitude: longitudeInput }
      : await geocodeAddress(nextAddress, nextCity, nextState);

  store.restaurants.push({
    id: makeId("r"),
    name: parsed.data.name,
    slug,
    whatsapp: parsed.data.whatsapp,
    plan: selectedPlan?.name ?? parsed.data.plan ?? "Sem plano",
    active: true,
    createdAt: new Date().toISOString(),
    canceledAt: null,
    openingHours: "Seg a Dom - 18h as 23h",
    address: nextAddress,
    city: nextCity,
    state: nextState,
    latitude: geocoded?.latitude ?? null,
    longitude: geocoded?.longitude ?? null,
    minOrderValue: 15,
    deliveryFee: 5,
    logoUrl: "https://picsum.photos/200/200?random=66",
    coverUrl: "https://picsum.photos/1200/500?random=67",
    ownerEmail: parsed.data.ownerEmail || `${slug}@pedezap.app`,
    ownerPassword: await hashPassword(parsed.data.ownerPassword || "123456"),
    taxId: parsed.data.document ? parsed.data.document.replace(/\D/g, "") : null,
    subscribedPlanId: selectedPlan?.id ?? null,
    subscriptionStatus: "trial",
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    nextBillingAt: null,
    subscriptionStartedAt: null,
    subscriptionEndsAt: null,
    pendingPlanId: null,
    pendingCheckoutExternalId: null,
    lastCheckoutUrl: null,
    viewCount: 0,
    lastViewAt: null,
    categories: [{ id: makeId("cat"), name: "Categoria 1", active: true }],
    products: [
      {
        id: makeId("prod"),
        categoryId: "",
        name: "Produto exemplo",
        description: "Edite no painel master.",
        price: 10,
        active: true
      }
    ]
  });

  const newest = store.restaurants[store.restaurants.length - 1];
  if (newest.products[0]) {
    newest.products[0].categoryId = newest.categories[0].id;
  }

  await writeStore(store);
  return NextResponse.json({ success: true, restaurant: newest });
}
