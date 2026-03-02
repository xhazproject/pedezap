import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { cleanJsonResponseText, generateOpenAiText, isOpenAiConfigured } from "@/lib/openai";

const requestSchema = z.object({
  slug: z.string().min(1),
  restaurantName: z.string().min(1),
  lessSoldItems: z.array(
    z.object({
      name: z.string(),
      soldQuantity: z.number(),
      revenue: z.number()
    })
  ).default([]),
  benchmark: z.object({
    sourceLabel: z.string(),
    peakHour: z.object({ hour: z.number(), orders: z.number() }).nullable().optional(),
    bestWeekday: z.object({ label: z.string(), orders: z.number() }).nullable().optional(),
    weakWindows: z.array(z.object({ hour: z.number(), orders: z.number(), sales: z.number(), avgTicket: z.number() })).default([])
  }),
  availableCoupons: z.array(z.string()).default([]),
  availableBanners: z.array(z.string()).default([])
});

type CampaignSuggestion = {
  campaignName: string;
  period: string;
  couponSuggestion: string;
  bannerHeadline: string;
  bannerDescription: string;
  whatsappMessage: string;
  strategyReason: string;
};

function buildPrompt(input: z.infer<typeof requestSchema>) {
  const weakHours = input.benchmark.weakWindows
    .slice(0, 3)
    .map((w) => `${String(w.hour).padStart(2, "0")}:00 (${w.orders} pedidos)`)
    .join(", ");
  const lowItems = input.lessSoldItems
    .slice(0, 5)
    .map((i) => `${i.name} (vendidos: ${i.soldQuantity}, receita: R$ ${i.revenue.toFixed(2)})`)
    .join("; ");

  return [
    "Voce e um estrategista de marketing para delivery no Brasil.",
    "Crie UMA sugestao de campanha para aumentar vendas de itens menos vendidos.",
    "Responda somente em JSON valido (sem markdown).",
    "",
    `Loja: ${input.restaurantName}`,
    `Base benchmark: ${input.benchmark.sourceLabel}`,
    `Melhor dia: ${input.benchmark.bestWeekday?.label ?? "nao informado"}`,
    `Horario de pico: ${input.benchmark.peakHour ? `${String(input.benchmark.peakHour.hour).padStart(2, "0")}:00` : "nao informado"}`,
    `Janelas fracas: ${weakHours || "nao informado"}`,
    `Itens menos vendidos: ${lowItems || "nao informado"}`,
    `Cupons disponiveis (opcional vincular): ${input.availableCoupons.join(", ") || "nenhum"}`,
    `Banners disponiveis (opcional vincular): ${input.availableBanners.join(", ") || "nenhum"}`,
    "",
    "Retorne JSON com estas chaves exatas:",
    "{",
    '  "campaignName": "string curta e comercial",',
    '  "period": "ex: Seg a Qui, 15h-18h",',
    '  "couponSuggestion": "codigo existente se fizer sentido ou nova ideia de codigo",',
    '  "bannerHeadline": "frase curta de destaque",',
    '  "bannerDescription": "descricao curta para banner",',
    '  "whatsappMessage": "mensagem curta para divulgar no WhatsApp",',
    '  "strategyReason": "explicacao objetiva de por que a campanha foi sugerida" ',
    "}",
    "",
    "Regras:",
    "- Priorize itens menos vendidos.",
    "- Use as janelas fracas como horario sugerido.",
    "- Seja objetivo e pratico.",
    "- Nao invente dados da loja."
  ].join("\n");
}

function parseSuggestion(raw: string): CampaignSuggestion | null {
  const schema = z.object({
    campaignName: z.string().min(1),
    period: z.string().min(1),
    couponSuggestion: z.string().min(1),
    bannerHeadline: z.string().min(1),
    bannerDescription: z.string().min(1),
    whatsappMessage: z.string().min(1),
    strategyReason: z.string().min(1)
  });

  const tryParse = (value: string) => {
    try {
      return schema.parse(JSON.parse(value));
    } catch {
      return null;
    }
  };

  const cleaned = cleanJsonResponseText(raw)
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  const direct = tryParse(cleaned);
  if (direct) return direct;

  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const objectParsed = tryParse(objectMatch[0]);
    if (objectParsed) return objectParsed;
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const sliced = tryParse(cleaned.slice(start, end + 1));
    if (sliced) return sliced;
  }

  try {
    return schema.parse({
      campaignName: 'Campanha sugerida',
      period: 'Horario sugerido pela IA',
      couponSuggestion: 'CUPOM10',
      bannerHeadline: cleaned.slice(0, 80) || 'Oferta especial',
      bannerDescription: cleaned.slice(0, 140) || 'Promocao sugerida automaticamente pela IA.',
      whatsappMessage: cleaned.slice(0, 220) || 'Confira nossa promocao especial no cardapio.',
      strategyReason: 'A IA retornou texto fora do formato ideal e o sistema aplicou um fallback seguro.'
    });
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
    temperature: 0.7,
    maxOutputTokens: 500
  });
  if (!ai.ok || !ai.text) {
    return NextResponse.json({ success: false, message: ai.errorMessage ?? "Falha ao gerar sugestao." }, { status: 502 });
  }

  const suggestion = parseSuggestion(ai.text);
  if (!suggestion) {
    return NextResponse.json({ success: false, message: "A IA nao retornou JSON valido." }, { status: 502 });
  }

  return NextResponse.json({ success: true, suggestion });
}

