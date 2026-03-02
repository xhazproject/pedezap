type SendTwilioWhatsAppInput = {
  to: string;
  body: string;
  from?: string;
  statusCallbackUrl?: string;
};

type SendTwilioWhatsAppResult =
  | { success: true; sid: string; status?: string | null }
  | { success: false; error: string; status?: number };

function normalizeWhatsappAddress(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `whatsapp:+${digits}`;
}

export async function sendTwilioWhatsApp(
  input: SendTwilioWhatsAppInput
): Promise<SendTwilioWhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fallbackFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken) {
    return {
      success: false,
      error: "Twilio nao configurado. Defina TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN."
    };
  }

  const from = normalizeWhatsappAddress(input.from || fallbackFrom || "");
  const to = normalizeWhatsappAddress(input.to);
  const body = String(input.body || "").trim();

  if (!from) {
    return {
      success: false,
      error: "Numero remetente do Twilio nao configurado."
    };
  }

  if (!to) {
    return {
      success: false,
      error: "Numero de destino invalido para WhatsApp."
    };
  }

  if (!body) {
    return {
      success: false,
      error: "Mensagem vazia."
    };
  }

  const payload = new URLSearchParams();
  payload.set("From", from);
  payload.set("To", to);
  payload.set("Body", body);

  if (input.statusCallbackUrl?.trim()) {
    payload.set("StatusCallback", input.statusCallbackUrl.trim());
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload.toString(),
      cache: "no-store"
    }
  );

  const raw = await response.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.detail === "string"
        ? data.detail
        : "Falha ao enviar mensagem pelo Twilio.";
    return {
      success: false,
      error: errorMessage,
      status: response.status
    };
  }

  return {
    success: true,
    sid: typeof data?.sid === "string" ? data.sid : "",
    status: typeof data?.status === "string" ? data.status : null
  };
}
