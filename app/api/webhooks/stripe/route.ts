import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { makeId, readStore, writeStore } from "@/lib/store";

function verifyStripeSignature(rawBody: string, signatureHeader: string | null, webhookSecret: string | null) {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(",").map((item) => item.trim());
  const timestamp = parts.find((item) => item.startsWith("t="))?.slice(2);
  const signatures = parts.filter((item) => item.startsWith("v1=")).map((item) => item.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const payload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", webhookSecret).update(payload).digest("hex");

  return signatures.some((candidate) => {
    try {
      return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

function upsertWebhookPlanInvoice(args: {
  store: Awaited<ReturnType<typeof readStore>>;
  restaurantSlug: string;
  restaurantName: string;
  planName: string;
  amount: number;
  externalId: string;
  paid: boolean;
}) {
  const now = new Date().toISOString();
  const dueDate = now.slice(0, 10);
  const invoiceIndex = args.store.invoices.findIndex(
    (item) => item.externalId && item.externalId === args.externalId
  );

  if (invoiceIndex === -1) {
    args.store.invoices.unshift({
      id: makeId("INV").toUpperCase(),
      restaurantSlug: args.restaurantSlug,
      restaurantName: args.restaurantName,
      plan: args.planName,
      value: args.amount,
      dueDate,
      status: args.paid ? "Pago" : "Pendente",
      method: "Cartao de Credito",
      createdAt: now,
      paidAt: args.paid ? now : null,
      externalId: args.externalId
    });
    return;
  }

  args.store.invoices[invoiceIndex] = {
    ...args.store.invoices[invoiceIndex],
    restaurantSlug: args.restaurantSlug,
    restaurantName: args.restaurantName,
    plan: args.planName,
    value: args.amount,
    dueDate,
    method: "Cartao de Credito",
    status: args.paid ? "Pago" : args.store.invoices[invoiceIndex].status,
    paidAt: args.paid ? now : args.store.invoices[invoiceIndex].paidAt ?? null,
    externalId: args.externalId
  };
}

function getEventData(payload: any) {
  return payload?.data?.object ?? null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET || null;

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ success: false, message: "Assinatura do webhook invalida." }, { status: 401 });
  }

  let payload: any = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, message: "Payload JSON invalido." }, { status: 400 });
  }

  const eventType = String(payload?.type ?? "").toLowerCase();
  if (!eventType) return NextResponse.json({ success: true });

  const data = getEventData(payload);
  const metadata = data?.metadata ?? {};
  const externalId =
    metadata?.externalId ??
    data?.client_reference_id ??
    data?.id ??
    "";
  const restaurantSlug = metadata?.restaurantSlug ?? null;
  const planId = metadata?.planId ?? null;

  const store = await readStore();

  const restaurantIndexByExternalId = store.restaurants.findIndex(
    (item) => item.pendingCheckoutExternalId && item.pendingCheckoutExternalId === externalId
  );
  const restaurantIndexBySlug = restaurantSlug
    ? store.restaurants.findIndex((item) => item.slug === restaurantSlug)
    : -1;
  const restaurantIndex =
    restaurantIndexByExternalId !== -1 ? restaurantIndexByExternalId : restaurantIndexBySlug;

  if (restaurantIndex === -1) {
    return NextResponse.json({ success: true });
  }

  const restaurant = store.restaurants[restaurantIndex];
  const targetPlanId = restaurant.pendingPlanId ?? planId ?? restaurant.subscribedPlanId ?? null;
  const targetPlan = targetPlanId ? store.plans.find((item) => item.id === targetPlanId) : null;
  const targetPlanName = targetPlan?.name ?? restaurant.plan;
  const targetPlanPrice = targetPlan?.price ?? 0;

  if (eventType === "checkout.session.completed") {
    const paymentStatus = String(data?.payment_status ?? "");
    const shouldActivate = paymentStatus === "paid" || paymentStatus === "no_payment_required";
    if (!shouldActivate) return NextResponse.json({ success: true });

    const nextBillingAt = new Date();
    nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

    store.restaurants[restaurantIndex] = {
      ...restaurant,
      plan: targetPlanName,
      subscribedPlanId: targetPlanId,
      subscriptionStatus: "active",
      subscriptionStartedAt: restaurant.subscriptionStartedAt ?? new Date().toISOString(),
      trialEndsAt: null,
      pendingPlanId: null,
      pendingCheckoutExternalId: null,
      lastCheckoutUrl: data?.url ?? restaurant.lastCheckoutUrl ?? null,
      nextBillingAt: nextBillingAt.toISOString(),
      subscriptionEndsAt: nextBillingAt.toISOString()
    };

    upsertWebhookPlanInvoice({
      store,
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.name,
      planName: targetPlanName,
      amount: targetPlanPrice,
      externalId: externalId || restaurant.pendingCheckoutExternalId || `plan_${restaurant.slug}_${Date.now()}`,
      paid: true
    });
    await writeStore(store);
    return NextResponse.json({ success: true });
  }

  if (eventType === "invoice.payment_failed") {
    store.restaurants[restaurantIndex] = {
      ...restaurant,
      subscriptionStatus: "pending_payment"
    };
    await writeStore(store);
    return NextResponse.json({ success: true });
  }

  if (eventType === "customer.subscription.deleted") {
    store.restaurants[restaurantIndex] = {
      ...restaurant,
      subscriptionStatus: "canceled"
    };
    await writeStore(store);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: true });
}

