import { NextResponse } from "next/server";
import { z } from "zod";
import { getNormalizedSubscriptionStatus, makeId, readStore, writeStore } from "@/lib/store";

const subscribeSchema = z.object({
  planId: z.string().min(2)
});

const confirmSchema = z.object({
  externalId: z.string().min(2).optional()
});

function extractCheckoutUrl(data: any): string | null {
  return (
    data?.data?.billingUrl ??
    data?.data?.checkoutUrl ??
    data?.data?.url ??
    data?.billingUrl ??
    data?.checkoutUrl ??
    data?.url ??
    null
  );
}

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
      lastCheckoutUrl: restaurant.lastCheckoutUrl ?? null
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

  const configKey = store.paymentsConfig?.gatewayApiKey;
  const apiKey = process.env.ABACATEPAY_API_KEY || configKey;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "API key do AbacatePay nao configurada." },
      { status: 400 }
    );
  }

  const restaurant = store.restaurants[restaurantIndex];
  const cellphone = restaurant.whatsapp.replace(/\D/g, "");
  const taxId = (restaurant.taxId ?? "").replace(/\D/g, "");
  if (taxId.length !== 11 && taxId.length !== 14) {
    return NextResponse.json(
      {
        success: false,
        message:
          "CPF/CNPJ do restaurante nao configurado. Atualize em Admin > Restaurantes > Documento."
      },
      { status: 400 }
    );
  }
  const externalId = `plan_${restaurant.slug}_${Date.now()}`;
  const amountInCents = Math.round(plan.price * 100);

  const requestBody = {
    frequency: "ONE_TIME",
    methods: ["PIX"],
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/master?checkout=return`,
    completionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/master?checkout=success&externalId=${encodeURIComponent(externalId)}`,
    products: [
      {
        externalId: plan.id,
        name: plan.name,
        description: plan.description,
        quantity: 1,
        price: amountInCents
      }
    ],
    customer: {
      name: restaurant.name,
      email: restaurant.ownerEmail,
      cellphone,
      taxId
    },
    metadata: {
      restaurantSlug: restaurant.slug,
      planId: plan.id,
      externalId
    },
    externalId
  };

  const response = await fetch("https://api.abacatepay.com/v1/billing/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const providerMessage =
      data?.error?.message ??
      data?.error ??
      data?.message ??
      (typeof data === "string" ? data : null);
    return NextResponse.json(
      {
        success: false,
        message:
          providerMessage ??
          `Erro ao iniciar contratacao no AbacatePay (HTTP ${response.status}).`,
        details: data ?? null
      },
      { status: response.status }
    );
  }

  const checkoutUrl = extractCheckoutUrl(data);
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
    method: "Pix"
  });
  await writeStore(store);

  return NextResponse.json({
    success: true,
    checkoutUrl,
    provider: data,
    message: checkoutUrl
      ? "Checkout gerado com sucesso."
      : "Solicitacao enviada ao AbacatePay, mas sem URL direta de checkout."
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
    method: "Pix",
    paid: true
  });

  await writeStore(store);
  return NextResponse.json({ success: true, message: "Assinatura confirmada." });
}
