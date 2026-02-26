type AiTextOptions = {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
};

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === "PLACEHOLDER_API_KEY") return null;
  return key;
}

function getGeminiModel() {
  const model = process.env.GEMINI_MODEL?.trim();
  if (!model) return "gemini-2.0-flash";
  return model.replace(/^models\//i, "");
}

export function isOpenAiConfigured() {
  return Boolean(getGeminiApiKey());
}

function extractGeminiText(payload: any) {
  const parts =
    payload?.candidates?.[0]?.content?.parts &&
    Array.isArray(payload.candidates[0].content.parts)
      ? payload.candidates[0].content.parts
      : [];

  return parts
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .join(" ")
    .trim();
}

export async function generateOpenAiText(options: AiTextOptions): Promise<{
  ok: boolean;
  text?: string;
  errorMessage?: string;
}> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, errorMessage: "IA nao configurada (GEMINI_API_KEY)." };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(getGeminiModel())}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          maxOutputTokens: options.maxOutputTokens ?? 500
        }
      })
    }
  ).catch(() => null);

  if (!response) {
    return { ok: false, errorMessage: "Falha de comunicacao com a IA." };
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage =
      payload?.error?.message ||
      payload?.message ||
      "Falha ao gerar conteudo com a IA.";
    return { ok: false, errorMessage };
  }

  const text = extractGeminiText(payload);
  if (!text) {
    return { ok: false, errorMessage: "A IA nao retornou texto valido." };
  }

  return { ok: true, text };
}

export function cleanJsonResponseText(raw: string) {
  return raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
}
