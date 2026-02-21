import { NextResponse } from "next/server";
import { z } from "zod";
import { getNormalizedSubscriptionStatus, makeId, readStore, writeStore } from "@/lib/store";

const subscribeSchema = z.object({
  planId: z.string().min(2)
});

const confirmSchema = z.object({
  externalId: z.string().min(2).optional()
});

function upsertPlanInvoice(args: {
  store: Awaited<ReturnType<typeof readStore>>;
  restaurantSlug: string;
  restaurantName: string;
  planName: string;
  amount: number;
  externalId: string;
  method: "Pix" | "Cartao de Credito" | "Boleto";
  paid?: boolean;
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
      method: args.method,
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
    method: args.method,
    status: args.paid ? "Pago" : args.store.invoices[invoiceIndex].status,
    paidAt: args.paid ? now : args.store.invoices[invoiceIndex].paidAt ?? null,
    externalId: args.externalId
  };
}

function buildStripeFormBody(values: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    params.append(key, value);
  });
  return params.toString();
}

function isStripeCheckoutUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname === "checkout.stripe.com" || url.hostname.endsWith(".stripe.com");
  } catch {
    return false;
  }
}

function resolveAppBaseUrl(request: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (fromEnv) {
    const hasScheme = /^https?:\/\//i.test(fromEnv);
    const normalized = hasScheme ? fromEnv : `https://${fromEnv}`;
    try {
      return new URL(normalized).origin;
    } catch {
      // fallback below
    }
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);
  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const normalizedStatus = getNormalizedSubscriptionStatus(restaurant);
  const now = new Date();
  const trialEndsAtDate = restaurant.trialEndsAt ? new Date(restaurant.trialEndsAt) : null;
  const trialDaysLeft =
    normalizedStatus === "trial" && trialEndsAtDate
      ? Math.max(0, Math.ceil((trialEndsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const plans = store.plans
    .filter((item) => item.active)
    .map((plan) => ({
      ...plan,
      subscribers: store.restaurants.filter((restaurantItem) => restaurantItem.subscribedPlanId === plan.id).length
    }));

  return NextResponse.json({
    success: true,
    plans,
    subscription: {
      status: normalizedStatus,
      subscribedPlanId: restaurant.subscribedPlanId ?? null,
      trialEndsAt: restaurant.trialEndsAt ?? null,
      trialDaysLeft,
      nextBillingAt: restaurant.nextBillingAt ?? null,
      lastCheckoutUrl: isStripeCheckoutUrl(restaurant.lastCheckoutUrl) ? restaurant.lastCheckoutUrl : null
    }
  });
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Plano invalido para contratacao." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurantIndex = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (restaurantIndex === -1) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const plan = store.plans.find((item) => item.id === parsed.data.planId && item.active);
  if (!plan) {
    return NextResponse.json(
      { success: false, message: "Plano nao encontrado ou inativo." },
      { status: 404 }
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { success: false, message: "STRIPE_SECRET_KEY nao configurada." },
      { status: 400 }
    );
  }

  const restaurant = store.restaurants[restaurantIndex];
  const externalId = `plan_${restaurant.slug}_${Date.now()}`;
  const appUrl = resolveAppBaseUrl(request);
  const amountInCents = Math.round(plan.price * 100);

  const body = buildStripeFormBody({
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(amountInCents),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": plan.name,
    "line_items[0][price_data][product_data][description]": plan.description,
    "customer_email": restaurant.ownerEmail,
    "client_reference_id": externalId,
    "metadata[restaurantSlug]": restaurant.slug,
    "metadata[planId]": plan.id,
    "metadata[externalId]": externalId,
    "subscription_data[metadata][restaurantSlug]": restaurant.slug,
    "subscription_data[metadata][planId]": plan.id,
    "subscription_data[metadata][externalId]": externalId,
    "success_url": `${appUrl}/master?checkout=success&externalId=${encodeURIComponent(externalId)}`,
    "cancel_url": `${appUrl}/master?checkout=cancel`
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const providerMessage =
      data?.error?.message ??
      data?.message ??
      (typeof data === "string" ? data : null);
    return NextResponse.json(
      {
        success: false,
        message: providerMessage ?? `Erro ao iniciar contratacao na Stripe (HTTP ${response.status}).`,
        details: data ?? null
      },
      { status: response.status }
    );
  }

  const checkoutUrl = data?.url ?? null;
  if (!isStripeCheckoutUrl(checkoutUrl)) {
    return NextResponse.json(
      {
        success: false,
        message: "A Stripe nao retornou um checkout valido. Verifique as chaves e produtos no dashboard Stripe.",
        details: data ?? null
      },
      { status: 502 }
    );
  }
  const sessionId = data?.id ?? null;
  const nextBillingAt = new Date();
  nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

  store.restaurants[restaurantIndex] = {
    ...restaurant,
    pendingPlanId: plan.id,
    pendingCheckoutExternalId: externalId,
    lastCheckoutUrl: checkoutUrl,
    nextBillingAt: nextBillingAt.toISOString(),
    subscriptionStatus: "pending_payment"
  };

  upsertPlanInvoice({
    store,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    planName: plan.name,
    amount: plan.price,
    externalId,
    method: "Cartao de Credito"
  });
  await writeStore(store);

  return NextResponse.json({
    success: true,
    checkoutUrl,
    sessionId,
    provider: "stripe",
    message: checkoutUrl
      ? "Checkout gerado com sucesso."
      : "Solicitacao enviada a Stripe, mas sem URL direta de checkout."
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para confirmacao." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurantIndex = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (restaurantIndex === -1) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const restaurant = store.restaurants[restaurantIndex];
  if (!restaurant.pendingCheckoutExternalId || !restaurant.pendingPlanId) {
    return NextResponse.json({
      success: true,
      message: "Sem checkout pendente para confirmar."
    });
  }

  if (parsed.data.externalId && parsed.data.externalId !== restaurant.pendingCheckoutExternalId) {
    return NextResponse.json(
      { success: false, message: "Checkout nao corresponde ao pagamento pendente." },
      { status: 409 }
    );
  }

  const nextBillingAt = new Date();
  nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);
  const targetPlanId = restaurant.pendingPlanId ?? restaurant.subscribedPlanId ?? null;
  const targetPlan = targetPlanId
    ? store.plans.find((item) => item.id === targetPlanId)
    : null;
  const targetPlanName = targetPlan?.name ?? restaurant.plan;
  const targetPlanPrice = targetPlan?.price ?? 0;

  store.restaurants[restaurantIndex] = {
    ...restaurant,
    plan: targetPlanName,
    subscribedPlanId: targetPlanId,
    subscriptionStatus: "active",
    subscriptionStartedAt: restaurant.subscriptionStartedAt ?? new Date().toISOString(),
    trialEndsAt: null,
    pendingPlanId: null,
    pendingCheckoutExternalId: null,
    nextBillingAt: nextBillingAt.toISOString(),
    subscriptionEndsAt: nextBillingAt.toISOString()
  };
  upsertPlanInvoice({
    store,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    planName: targetPlanName,
    amount: targetPlanPrice,
    externalId: restaurant.pendingCheckoutExternalId,
    method: "Cartao de Credito",
    paid: true
  });

  await writeStore(store);
  return NextResponse.json({ success: true, message: "Assinatura confirmada." });
}
