import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { cleanJsonResponseText, generateOpenAiText, isOpenAiConfigured } from "@/lib/openai";

const requestSchema = z.object({
  slug: z.string().min(1),
  restaurantName: z.string().min(1),
  kind: z.enum([
    "catalog_opening",
    "order_preparing",
    "order_out_for_delivery",
    "catalog_config",
    "order_flow_config"
  ]),
  mode: z.enum(["generate", "improve", "config"]).default("generate"),
  currentText: z.string().optional().default(""),
  variables: z.array(z.string()).default([])
});

const responseSchema = z.object({
  text: z.string().default(""),
  configTips: z.array(z.string()).default([]),
  recommendedTone: z.string().default(""),
  recommendedVariables: z.array(z.string()).default([])
});

function buildPrompt(input: z.infer<typeof requestSchema>) {
  const kindLabelMap: Record<z.infer<typeof requestSchema>["kind"], string> = {
    catalog_opening: "Mensagem inicial enviada pelo cliente ao finalizar pedido no catalogo",
    order_preparing: "Mensagem enviada ao cliente quando o pedido entra em preparo",
    order_out_for_delivery: "Mensagem enviada ao cliente quando o pedido sai para entrega",
    catalog_config: "Sugestao de configuracao da mensagem inicial do catalogo",
    order_flow_config: "Sugestao de configuracao para mensagens do fluxo de pedido"
  };

  const isOrderFlowMessage =
    input.kind === "order_preparing" || input.kind === "order_out_for_delivery";

  const exactOrderStructure =
    input.kind === "order_preparing"
      ? [
          "Formato EXATO esperado para o campo text (mantendo quebras de linha):",
          "Ola, {nome} Seu pedido Nº {id}, esta sendo Preparado",
          "",
          "Items:",
          " {itens}",
          "Obs. {obs}",
          "",
          "Total: {total}",
          "Forma Pag: {pagamento}",
          "Endereco: {endereco}"
        ]
      : input.kind === "order_out_for_delivery"
        ? [
            "Formato EXATO esperado para o campo text (mantendo quebras de linha):",
            "Ola, {nome} Seu pedido Nº {id}, Saiu para a Entrega!",
            "",
            "Items:",
            " {itens}",
            "Obs. {obs}",
            "",
            "Total: {total}",
            "Forma Pag: {pagamento}",
            "Endereco: {endereco}"
          ]
        : [];

  return [
    "Voce e um assistente de atendimento para restaurantes no Brasil.",
    "Gere mensagens de WhatsApp curtas, claras e profissionais para delivery.",
    "Responda APENAS em JSON valido (sem markdown).",
    "O campo text deve ser uma mensagem pronta para enviar no WhatsApp (texto normal).",
    "Nao escreva pseudo-codigo, comandos, scripts, if/else, placeholders tecnicos ou templates de programacao.",
    "",
    `Loja: ${input.restaurantName}`,
    `Tipo de solicitacao: ${kindLabelMap[input.kind]}`,
    `Modo: ${input.mode}`,
    `Variaveis disponiveis: ${input.variables.join(", ") || "nenhuma"}`,
    input.currentText?.trim() ? `Texto atual: ${input.currentText.trim()}` : "Texto atual: (vazio)",
    "",
    "Regras:",
    "- Tom amigavel e profissional.",
    "- Portugues-BR.",
    isOrderFlowMessage
      ? "- Para mensagens de pedido, mantenha a estrutura em multiplas linhas exatamente no formato solicitado."
      : "- Mensagens curtas (preferencia abaixo de 220 caracteres) quando houver campo text.",
    "- Use SOMENTE variaveis da lista disponivel, no formato exato (ex: {nome}, {id}).",
    "- Se nao precisar de variavel, escreva texto normal.",
    "- Nao use formatos como {{nome}}, ${nome}, <nome>, [nome], %%nome%% ou placeholders inventados.",
    "- Se for configuracao, foque em boas praticas de tom, personalizacao e uso de variaveis.",
    ...(exactOrderStructure.length ? ["", ...exactOrderStructure] : []),
    "",
    "Retorne JSON com estas chaves exatas:",
    "{",
    '  "text": "mensagem sugerida (ou vazio se for apenas configuracao)",',
    '  "configTips": ["dica 1", "dica 2", "dica 3"],',
    '  "recommendedTone": "ex: amigavel e objetivo",',
    '  "recommendedVariables": ["{nome}", "{id}"]',
    "}"
  ].join("\n");
}

function sanitizeTemplateText(raw: string, allowedVariables: string[]) {
  let text = String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Remove fences/markdown residuals
  text = text.replace(/```[\s\S]*?```/g, "").trim();

  // If model still returns "text: ...", extract after colon (common fallback behavior)
  const textFieldLike = text.match(/^(?:texto?|mensagem)\s*:\s*(.+)$/i);
  if (textFieldLike?.[1]) text = textFieldLike[1].trim();

  // Normalize double-curly vars to single-curly
  text = text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, "{$1}");

  // Remove common programming placeholders patterns
  text = text
    .replace(/\$\{\s*([^{}]+?)\s*\}/g, "$1")
    .replace(/<([a-zA-Z_][^>]*)>/g, "$1")
    .replace(/\[([a-zA-Z_][^\]]*)\]/g, "$1");

  const allowed = new Set(allowedVariables);

  // Remove/neutralize invented curly variables while keeping allowed ones
  text = text.replace(/\{[^{}]+\}/g, (token) => (allowed.has(token) ? token : ""));

  // Remove raw "variavel: xxx" style leftovers if they look technical
  text = text.replace(/\b(?:if|else|return|const|let|var|function|prompt|template|json|payload)\b/gi, "");

  // Restore line formatting when model flattened known sections
  text = text
    .replace(/\s*Items:\s*/i, "\n\nItems:\n ")
    .replace(/\s*Obs\.\s*/i, "\nObs. ")
    .replace(/\s*Total:\s*/i, "\n\nTotal: ")
    .replace(/\s*Forma Pag:\s*/i, "\nForma Pag: ")
    .replace(/\s*Endereco:\s*/i, "\nEndereco: ");

  // Final cleanup preserving new lines
  text = text
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.slice(0, 500);
}

function sanitizeTips(tips: string[] | undefined) {
  return (tips ?? [])
    .map((tip) => String(tip).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function parseResponse(raw: string) {
  const tryParse = (value: string) => {
    try {
      return responseSchema.parse(JSON.parse(value));
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
    // fallback de emergencia: usa o texto bruto como sugestao simples
    return responseSchema.parse({
      text: cleaned.slice(0, 260),
      configTips: [],
      recommendedTone: "amigavel e objetivo",
      recommendedVariables: []
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
    temperature: parsed.data.mode === "config" ? 0.5 : 0.7,
    maxOutputTokens: 500
  });
  if (!ai.ok || !ai.text) {
    return NextResponse.json({ success: false, message: ai.errorMessage ?? "Falha ao gerar mensagem com IA." }, { status: 502 });
  }

  const result = parseResponse(ai.text);
  if (!result) {
    return NextResponse.json({ success: false, message: "A IA nao retornou JSON valido." }, { status: 502 });
  }

  const isConfigOnly = parsed.data.mode === "config";
  let sanitizedText = isConfigOnly ? "" : sanitizeTemplateText(result.text, parsed.data.variables);

  if (!isConfigOnly && (parsed.data.kind === "order_preparing" || parsed.data.kind === "order_out_for_delivery")) {
    const heading =
      parsed.data.kind === "order_preparing"
        ? "Ola, {nome} Seu pedido Nº {id}, esta sendo Preparado"
        : "Ola, {nome} Seu pedido Nº {id}, Saiu para a Entrega!";
    const lower = sanitizedText.toLowerCase();
    const hasOrderBlocks =
      lower.includes("items:") &&
      lower.includes("obs.") &&
      lower.includes("total:") &&
      lower.includes("forma pag:") &&
      lower.includes("endereco:");

    if (!hasOrderBlocks) {
      sanitizedText = `${heading}\n\nItems:\n {itens}\nObs. {obs}\n\nTotal: {total}\nForma Pag: {pagamento}\nEndereco: {endereco}`;
    }
  }
  const recommendedVariables = (result.recommendedVariables ?? []).filter((token) => parsed.data.variables.includes(token));

  return NextResponse.json({
    success: true,
    text: sanitizedText,
    configTips: sanitizeTips(result.configTips),
    recommendedTone: String(result.recommendedTone ?? "").trim(),
    recommendedVariables
  });
}
