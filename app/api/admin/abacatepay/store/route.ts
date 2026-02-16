import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

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

  const response = await fetch("https://api.abacatepay.com/v1/store/get", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { success: false, message: data?.error?.message ?? data?.message ?? "Erro ao carregar carteira." },
      { status: response.status }
    );
  }

  return NextResponse.json({ success: true, store: data?.data ?? data });
}
