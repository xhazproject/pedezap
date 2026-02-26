import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { cleanJsonResponseText, generateOpenAiText, isOpenAiConfigured } from "@/lib/openai";

const requestSchema = z.object({
  slug: z.string().min(1),
  restaurantName: z.string().min(1),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  marketingLink: z.string().url().optional(),
  metrics: z.object({
    totalOrders: z.number(),
    totalSales: z.number(),
    avgTicket: z.number(),
    conversionRate: z.number()
  }),
  benchmark: z.object({
    sourceLabel: z.string(),
    peakHour: z.object({ hour: z.number(), orders: z.number() }).nullable().optional(),
    bestWeekday: z.object({ label: z.string(), orders: z.number() }).nullable().optional(),
    weakWindows: z.array(z.object({ hour: z.number(), orders: z.number(), sales: z.number(), avgTicket: z.number() })).default([])
  }),
  topProducts: z.array(z.object({ name: z.string(), soldQuantity: z.number(), revenue: z.number() })).default([]),
  leastSoldProducts: z.array(z.object({ name: z.string(), soldQuantity: z.number(), revenue: z.number() })).default([]),
  activeCampaigns: z.array(z.string()).default([])
});

const responseSchema = z.object({
  campaignName: z.string(),
  campaignObjective: z.string(),
  suggestedPeriod: z.string(),
  targetAudience: z.string(),
  recommendedRadiusKm: z.number(),
  dailyBudgetSuggestion: z.string(),
  channels: z.array(z.string()).min(1),
  couponSuggestion: z.string(),
  couponDiscountHint: z.string(),
  bannerHeadline: z.string(),
  bannerDescription: z.string(),
  adCopyPrimary: z.string(),
  adCopyVariants: z.array(z.string()).min(2),
  headline: z.string(),
  cta: z.string(),
  implementationChecklist: z.array(z.string()).min(4),
  trackingSuggestion: z.string(),
  reason: z.string()
});

function buildPrompt(input: z.infer<typeof requestSchema>) {
  const weakWindows = input.benchmark.weakWindows
    .slice(0, 4)
    .map((w) => `${String(w.hour).padStart(2, "0")}:00 (${w.orders} pedidos, ticket R$ ${w.avgTicket.toFixed(2)})`)
    .join(", ");
  const topProducts = input.topProducts
    .slice(0, 4)
    .map((p) => `${p.name} (${p.soldQuantity} un / R$ ${p.revenue.toFixed(2)})`)
    .join("; ");
  const leastSold = input.leastSoldProducts
    .slice(0, 4)
    .map((p) => `${p.name} (${p.soldQuantity} un / R$ ${p.revenue.toFixed(2)})`)
    .join("; ");
  const cityLabel = [input.city, input.state].filter(Boolean).join("/");

  return [
    "Voce e um especialista em marketing local para delivery no Brasil.",
    "Crie um plano simples de impulsionamento de anuncios (Meta/Instagram/WhatsApp) para uma loja.",
    "Responda somente JSON valido sem markdown.",
    "",
    `Loja: ${input.restaurantName}`,
    `Cidade/UF: ${cityLabel || "nao informado"}`,
    `Link do cardapio: ${input.marketingLink ?? "nao informado"}`,
    `Pedidos (${input.benchmark.sourceLabel}): ${input.metrics.totalOrders}`,
    `Vendas: R$ ${input.metrics.totalSales.toFixed(2)}`,
    `Ticket medio: R$ ${input.metrics.avgTicket.toFixed(2)}`,
    `Conversao: ${input.metrics.conversionRate.toFixed(2)}%`,
    `Horario de pico: ${input.benchmark.peakHour ? `${String(input.benchmark.peakHour.hour).padStart(2, "0")}:00` : "nao informado"}`,
    `Melhor dia: ${input.benchmark.bestWeekday?.label ?? "nao informado"}`,
    `Janelas fracas: ${weakWindows || "nao informado"}`,
    `Produtos campeoes: ${topProducts || "nao informado"}`,
    `Produtos menos vendidos: ${leastSold || "nao informado"}`,
    `Campanhas ativas: ${input.activeCampaigns.join(", ") || "nenhuma"}`,
    "",
    "Retorne JSON com estas chaves exatas:",
    "{",
    '  "campaignName": "nome curto da campanha",',
    '  "campaignObjective": "string",',
    '  "suggestedPeriod": "ex: Seg a Qui, 15h-18h",',
    '  "targetAudience": "string",',
    '  "recommendedRadiusKm": 3,',
    '  "dailyBudgetSuggestion": "ex: R$ 20 a R$ 35 por dia",',
    '  "channels": ["Instagram Stories", "Feed", "WhatsApp"],',
    '  "couponSuggestion": "codigo de cupom sugerido (ex: TARDE10)",',
    '  "couponDiscountHint": "ex: 10% acima de R$40",',
    '  "bannerHeadline": "frase curta para banner",',
    '  "bannerDescription": "descricao curta para banner",',
    '  "adCopyPrimary": "texto principal do anuncio",',
    '  "adCopyVariants": ["variacao 1", "variacao 2", "variacao 3"],',
    '  "headline": "titulo curto",',
    '  "cta": "CTA curto",',
    '  "implementationChecklist": ["passo 1", "passo 2", "passo 3", "passo 4"],',
    '  "trackingSuggestion": "como marcar o link/campanha para medir resultado",',
    '  "reason": "explicacao objetiva da estrategia escolhida"',
    "}",
    "",
    "Regras:",
    "- Priorize publico local e objetivo de gerar pedidos.",
    "- Considere janelas fracas para promocao de reativacao.",
    "- Seja pratico e implementavel por pequeno restaurante.",
    "- Nao invente integracoes nao solicitadas."
  ].join("\n");
}

function parseResponse(raw: string) {
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
    temperature: 0.6,
    maxOutputTokens: 900
  });
  if (!ai.ok || !ai.text) {
    return NextResponse.json({ success: false, message: ai.errorMessage ?? "Falha ao gerar plano de ADS." }, { status: 502 });
  }

  const plan = parseResponse(ai.text);
  if (!plan) {
    return NextResponse.json({ success: false, message: "A IA nao retornou JSON valido." }, { status: 502 });
  }

  return NextResponse.json({ success: true, plan });
}
