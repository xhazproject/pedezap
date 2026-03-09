import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";

const statusSchema = z.object({
  active: z.boolean().optional(),
  reactivateSubscription: z.boolean().optional()
}).refine((value) => typeof value.active === "boolean" || value.reactivateSubscription === true, {
  message: "Status invalido."
});

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Status invalido." },
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

  if (parsed.data.reactivateSubscription) {
    const now = new Date();
    const graceEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    store.restaurants[index].active = true;
    store.restaurants[index].canceledAt = null;
    store.restaurants[index].subscriptionStatus = "pending_payment";
    store.restaurants[index].trialEndsAt = null;
    store.restaurants[index].nextBillingAt = graceEnd.toISOString();
    store.restaurants[index].subscriptionEndsAt = null;
  } else if (typeof parsed.data.active === "boolean") {
    store.restaurants[index].active = parsed.data.active;
    store.restaurants[index].canceledAt = parsed.data.active ? null : new Date().toISOString();
  }
  await writeStore(store);
  return NextResponse.json({ success: true, restaurant: store.restaurants[index] });
}
