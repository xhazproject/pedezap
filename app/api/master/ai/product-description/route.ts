import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { generateOpenAiText, isOpenAiConfigured } from "@/lib/openai";

const requestSchema = z.object({
  slug: z.string().min(1),
  mode: z.enum(["generate", "improve"]).default("generate"),
  product: z.object({
    name: z.string().min(1),
    kind: z.enum(["padrao", "pizza", "bebida", "acai"]).optional(),
    categoryName: z.string().optional(),
    currentDescription: z.string().optional(),
    ingredients: z.array(z.string()).optional(),
    flavors: z.array(z.object({ name: z.string(), ingredients: z.string().optional() })).optional(),
    complements: z.array(z.string()).optional()
  })
});

function buildPrompt(input: z.infer<typeof requestSchema>) {
  const { mode, product } = input;
  const lines = [
    "Voce e um assistente para cardapio de restaurante no Brasil.",
    "Responda APENAS com a descricao final do produto em portugues-BR.",
    "Nao use aspas, nao use markdown, nao use lista.",
    "Texto objetivo, apetitoso e facil de entender.",
    "Evite exageros e promessas irreais.",
    "",
    `Modo: ${mode === "generate" ? "GERAR nova descricao" : "MELHORAR descricao existente"}`,
    `Nome do produto: ${product.name}`,
    `Tipo: ${product.kind ?? "padrao"}`,
    `Categoria: ${product.categoryName ?? "Nao informada"}`
  ];

  if (product.currentDescription?.trim()) {
    lines.push(`Descricao atual: ${product.currentDescription.trim()}`);
  }
  if (product.ingredients?.length) {
    lines.push(`Ingredientes/itens informados: ${product.ingredients.join(", ")}`);
  }
  if (product.flavors?.length) {
    lines.push(
      `Sabores (pizza): ${product.flavors
        .map((f) => `${f.name}${f.ingredients ? ` (${f.ingredients})` : ""}`)
        .join("; ")}`
    );
  }
  if (product.complements?.length) {
    lines.push(`Complementos: ${product.complements.join(", ")}`);
  }

  lines.push(
    "",
    "Regras:",
    "- Maximo 220 caracteres.",
    "- Se for pizza, cite sabores/tamanhos de forma generica sem inventar preco.",
    "- Se for bebida, foque volume/sabor/temperatura se aplicavel.",
    "- Se for acai, destaque base e opcoes de complementos.",
    "- Use linguagem clara para venda no delivery."
  );

  return lines.join("\n");
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
    return NextResponse.json(
      { success: false, message: "IA nao configurada. Defina GEMINI_API_KEY no ambiente." },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(parsed.data);
  const ai = await generateOpenAiText({ prompt, temperature: 0.6, maxOutputTokens: 180 });
  if (!ai.ok || !ai.text) {
    return NextResponse.json({ success: false, message: ai.errorMessage ?? "Falha ao gerar descricao com IA." }, { status: 502 });
  }
  const text = ai.text.replace(/^["']|["']$/g, "").trim();

  return NextResponse.json({ success: true, text });
}
