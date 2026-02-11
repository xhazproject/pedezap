import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { makeId, readStore, writeStore } from "@/lib/store";

function verifySignature(body: string, signature: string | null, publicKey: string | null) {
  if (!signature || !publicKey) return false;
  const expected = createHmac("sha256", publicKey).update(body).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
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
      method: "Pix",
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
    method: "Pix",
    status: args.paid ? "Pago" : args.store.invoices[invoiceIndex].status,
    paidAt: args.paid ? now : args.store.invoices[invoiceIndex].paidAt ?? null,
    externalId: args.externalId
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET || null;
  const signature = request.headers.get("x-webhook-signature");
  const publicKey = process.env.ABACATEPAY_PUBLIC_KEY || null;
  const url = new URL(request.url);
  const providedSecret = url.searchParams.get("webhookSecret");
  const hasValidSecret = !!secret && providedSecret === secret;

  if (secret && !hasValidSecret) {
    return NextResponse.json({ success: false, message: "Webhook secret invalido." }, { status: 401 });
  }

  if (!hasValidSecret && publicKey && !verifySignature(rawBody, signature, publicKey)) {
    return NextResponse.json({ success: false, message: "Assinatura invalida." }, { status: 401 });
  }

  let payload: {
    event?: string;
    type?: string;
    externalId?: string;
    metadata?: {
      restaurantSlug?: string;
      planId?: string;
    };
    data?: {
      externalId?: string;
      transaction?: {
        id?: string;
        externalId?: string;
        status?: string;
        receiptUrl?: string;
      };
      billing?: {
        id?: string;
        externalId?: string;
        status?: string;
        url?: string;
      };
      metadata?: {
        restaurantSlug?: string;
        planId?: string;
      };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, message: "Payload JSON invalido." }, { status: 400 });
  }

  const event = (payload.event ?? payload.type ?? "").toLowerCase();
  const transaction = payload.data?.transaction ?? {};
  if (!event) {
    return NextResponse.json({ success: true });
  }

  const store = await readStore();
  const payout =
    store.payouts.find((item) => item.id === transaction.externalId) ??
    store.payouts.find((item) => item.withdrawId === transaction.id);

  if (payout) {
    if (event === "withdraw.done") payout.status = "Pago";
    if (event === "withdraw.failed") payout.status = "Falha";
    if (transaction.receiptUrl) payout.receiptUrl = transaction.receiptUrl;
    payout.updatedAt = new Date().toISOString();
    await writeStore(store);
  }

  const billing = payload.data?.billing ?? null;
  const externalId =
    transaction.externalId ??
    billing?.externalId ??
    payload.data?.externalId ??
    payload.externalId ??
    "";
  const metadataRestaurantSlug =
    payload.data?.metadata?.restaurantSlug ?? payload.metadata?.restaurantSlug ?? null;
  const metadataPlanId = payload.data?.metadata?.planId ?? payload.metadata?.planId ?? null;
  const paidEvents = [
    "billing.paid",
    "billing.approved",
    "payment.approved",
    "payment.paid",
    "charge.paid",
    "transaction.paid"
  ];
  if (externalId.startsWith("plan_") || paidEvents.includes(event)) {
    let restaurantIndex = store.restaurants.findIndex(
      (item) => item.pendingCheckoutExternalId && item.pendingCheckoutExternalId === externalId
    );
    if (restaurantIndex === -1 && metadataRestaurantSlug) {
      restaurantIndex = store.restaurants.findIndex((item) => item.slug === metadataRestaurantSlug);
    }
    if (restaurantIndex === -1 && externalId.startsWith("plan_")) {
      const slugMatch = externalId.match(/^plan_(.+?)_\d+$/);
      const slug = slugMatch?.[1] ?? null;
      if (slug) {
        restaurantIndex = store.restaurants.findIndex((item) => item.slug === slug);
      }
    }
    if (restaurantIndex !== -1) {
      const current = store.restaurants[restaurantIndex];
      const nextPlanId = current.pendingPlanId ?? metadataPlanId ?? current.subscribedPlanId ?? null;
      const nextPlan = nextPlanId ? store.plans.find((item) => item.id === nextPlanId) : null;
      const nextPlanName = nextPlan?.name ?? current.plan;
      const nextPlanPrice = nextPlan?.price ?? 0;
      const nextBillingAt = new Date();
      nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);
      store.restaurants[restaurantIndex] = {
        ...current,
        plan: nextPlanName,
        subscribedPlanId: nextPlanId,
        subscriptionStatus: "active",
        subscriptionStartedAt: current.subscriptionStartedAt ?? new Date().toISOString(),
        trialEndsAt: null,
        pendingPlanId: null,
        pendingCheckoutExternalId: null,
        lastCheckoutUrl: billing?.url ?? current.lastCheckoutUrl ?? null,
        nextBillingAt: nextBillingAt.toISOString(),
        subscriptionEndsAt: nextBillingAt.toISOString()
      };
      upsertWebhookPlanInvoice({
        store,
        restaurantSlug: current.slug,
        restaurantName: current.name,
        planName: nextPlanName,
        amount: nextPlanPrice,
        externalId: externalId || current.pendingCheckoutExternalId || `plan_${current.slug}_${Date.now()}`,
        paid: true
      });
      await writeStore(store);
    }
  }

  return NextResponse.json({ success: true });
}
