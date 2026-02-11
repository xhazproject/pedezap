import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

type CreatePayload = {
  payoutId?: string;
  amount?: number;
  pixKey?: string;
  pixType?: "CNPJ" | "CPF" | "EMAIL" | "RANDOM" | "PHONE" | "BR_CODE";
  externalId?: string;
  description?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as CreatePayload | null;
  if (!payload) {
    return NextResponse.json({ success: false, message: "Dados invalidos." }, { status: 400 });
  }

  const store = await readStore();
  const configKey = store.paymentsConfig?.gatewayApiKey;
  const apiKey = process.env.ABACATEPAY_API_KEY || configKey;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "API key do AbacatePay nao configurada." },
      { status: 400 }
    );
  }

  let payout = null;
  if (payload.payoutId) {
    payout = store.payouts.find((item) => item.id === payload.payoutId) ?? null;
    if (!payout) {
      return NextResponse.json({ success: false, message: "Repasse nao encontrado." }, { status: 404 });
    }
  }

  const amountValue = payout ? payout.amount : payload.amount;
  const pixKey = payout ? payout.pixKey : payload.pixKey;
  const pixType = (payout?.pixType || payload.pixType || "RANDOM") as CreatePayload["pixType"];
  if (!amountValue || !pixKey) {
    return NextResponse.json(
      { success: false, message: "Informe valor e chave Pix para criar o repasse." },
      { status: 400 }
    );
  }

  const amountInCents = Math.round(amountValue * 100);
  if (amountInCents < 350) {
    return NextResponse.json(
      { success: false, message: "Valor minimo para saque: R$ 3,50." },
      { status: 400 }
    );
  }

  const requestBody = {
    externalId: payload.externalId || payout?.id || `payout_${Date.now()}`,
    method: "PIX",
    amount: amountInCents,
    pix: {
      type: pixType,
      key: pixKey
    },
    description: payload.description || `Repasse ${payout?.restaurant ?? ""}`.trim()
  };

  const response = await fetch("https://api.abacatepay.com/v1/withdraw/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { success: false, message: data?.error?.message ?? data?.message ?? "Erro ao criar repasse." },
      { status: response.status }
    );
  }

  if (payout) {
    payout.withdrawId = data?.data?.id ?? payout.withdrawId ?? null;
    payout.receiptUrl = data?.data?.receiptUrl ?? payout.receiptUrl ?? null;
    payout.status = "Pendente";
    payout.updatedAt = new Date().toISOString();
    await writeStore(store);
  }

  return NextResponse.json({ success: true, payout, provider: data });
}
