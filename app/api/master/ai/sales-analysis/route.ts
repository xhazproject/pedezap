import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { cleanJsonResponseText, generateOpenAiText, isOpenAiConfigured } from "@/lib/openai";

const requestSchema = z.object({
  slug: z.string().min(1),
  restaurantName: z.string().min(1),
  metrics: z.object({
    totalOrders: z.number(),
    totalSales: z.number(),
    totalViews: z.number(),
    conversionRate: z.number(),
    avgTicket: z.number(),
    manualOrders: z.number()
  }),
  benchmark: z.object({
    sourceLabel: z.string(),
    peakHour: z.object({ hour: z.number(), orders: z.number(), sales: z.number() }).nullable().optional(),
    bestWeekday: z.object({ label: z.string(), orders: z.number(), sales: z.number() }).nullable().optional(),
    weakWindows: z.array(z.object({ hour: z.number(), orders: z.number(), sales: z.number(), avgTicket: z.number() })).default([])
  }),
  topProducts: z.array(z.object({ name: z.string(), soldQuantity: z.number(), revenue: z.number() })).default([]),
  leastSoldProducts: z.array(z.object({ name: z.string(), soldQuantity: z.number(), revenue: z.number() })).default([]),
  activeCoupons: z.array(z.string()).default([]),
  activeCampaigns: z.array(z.string()).default([])
});

const responseSchema = z.object({
  executiveSummary: z.string(),
  alerts: z.array(z.string()),
  recommendations: z.array(z.string()),
  implementationIdeas: z.array(z.string())
});

function buildPrompt(input: z.infer<typeof requestSchema>) {
  const weakWindows = input.benchmark.weakWindows
    .slice(0, 5)
    .map((w) => `${String(w.hour).padStart(2, "0")}:00 (${w.orders} pedidos, ticket R$ ${w.avgTicket.toFixed(2)})`)
    .join(", ");
  const topProducts = input.topProducts
    .slice(0, 5)
    .map((p) => `${p.name} (${p.soldQuantity} un / R$ ${p.revenue.toFixed(2)})`)
    .join("; ");
  const lowProducts = input.leastSoldProducts
    .slice(0, 5)
    .map((p) => `${p.name} (${p.soldQuantity} un / R$ ${p.revenue.toFixed(2)})`)
    .join("; ");

  return [
    "Voce e um consultor de crescimento para delivery no Brasil.",
    "Analise dados de vendas e retorne insights praticos em JSON.",
    "Responda somente JSON valido sem markdown.",
    "",
    `Loja: ${input.restaurantName}`,
    `Pedidos (${input.benchmark.sourceLabel}): ${input.metrics.totalOrders}`,
    `Vendas totais: R$ ${input.metrics.totalSales.toFixed(2)}`,
    `Ticket medio: R$ ${input.metrics.avgTicket.toFixed(2)}`,
    `Visualizacoes: ${input.metrics.totalViews}`,
    `Conversao: ${input.metrics.conversionRate.toFixed(2)}%`,
    `Pedidos manuais no periodo: ${input.metrics.manualOrders}`,
    `Horario de pico: ${input.benchmark.peakHour ? `${String(input.benchmark.peakHour.hour).padStart(2, "0")}:00` : "nao informado"}`,
    `Melhor dia: ${input.benchmark.bestWeekday?.label ?? "nao informado"}`,
    `Janelas fracas: ${weakWindows || "nao informado"}`,
    `Produtos campeoes: ${topProducts || "nao informado"}`,
    `Produtos menos vendidos: ${lowProducts || "nao informado"}`,
    `Cupons ativos: ${input.activeCoupons.join(", ") || "nenhum"}`,
    `Campanhas ativas: ${input.activeCampaigns.join(", ") || "nenhuma"}`,
    "",
    "Retorne JSON com essas chaves:",
    "{",
    '  "executiveSummary": "resumo em 2-4 frases",',
    '  "alerts": ["alerta 1", "alerta 2", "..."],',
    '  "recommendations": ["acao prioritaria 1", "acao 2", "..."],',
    '  "implementationIdeas": ["o que implementar no sistema/processo 1", "..."]',
    "}",
    "",
    "Regras:",
    "- Foque em acoes praticas.",
    "- Nao invente dados.",
    "- Cite horarios e produtos quando possivel.",
    "- Seja objetivo."
  ].join("\n");
}

function tryParseJson(raw: string) {
  const cleaned = cleanJsonResponseText(raw);
  try {
    return responseSchema.parse(JSON.parse(cleaned));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const token = cookies().get(MASTER_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session || session.kind !== "master") {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados invalidos." }, { status: 400 });
  }
  if (session.restaurantSlug !== parsed.data.slug) {
    return NextResponse.json({ success: false, message: "Slug invalido para esta sessao." }, { status: 403 });
  }

  if (!isOpenAiConfigured()) {
    return NextResponse.json({ success: false, message: "IA nao configurada (GEMINI_API_KEY)." }, { status: 400 });
  }

  const ai = await generateOpenAiText({
    prompt: buildPrompt(parsed.data),
    temperature: 0.5,
    maxOutputTokens: 700
  });
  if (!ai.ok || !ai.text) {
    return NextResponse.json({ success: false, message: ai.errorMessage ?? "Falha ao gerar analise." }, { status: 502 });
  }

  const parsedResponse = tryParseJson(ai.text);
  if (!parsedResponse) {
    return NextResponse.json({ success: false, message: "A IA nao retornou JSON valido." }, { status: 502 });
  }

  return NextResponse.json({ success: true, analysis: parsedResponse });
}
