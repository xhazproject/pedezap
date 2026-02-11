import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  const configKey = store.paymentsConfig?.gatewayApiKey;
  const apiKey = process.env.ABACATEPAY_API_KEY || configKey;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "API key do AbacatePay nao configurada." },
      { status: 400 }
    );
  }

  const response = await fetch("https://api.abacatepay.com/v1/withdraw/list", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { success: false, message: data?.error?.message ?? data?.message ?? "Erro ao listar repasses." },
      { status: response.status }
    );
  }

  return NextResponse.json({ success: true, payouts: data?.data ?? data });
}
