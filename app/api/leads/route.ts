import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const leadSchema = z.object({
  responsibleName: z.string().min(2),
  restaurantName: z.string().min(2),
  whatsapp: z.string().min(10),
  cityState: z.string().min(3),
  plan: z.string().min(2),
  message: z.string().optional()
});

type LeadPayload = z.infer<typeof leadSchema>;

async function sendLeadNotificationEmail(lead: LeadPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY nao configurada.");
  }

  const toEmail = process.env.LEADS_NOTIFY_EMAIL || "support@pedezap.site";
  const fromEmail = process.env.LEADS_FROM_EMAIL || "PedeZap <noreply@pedezap.site>";

  const messageLine = lead.message?.trim()
    ? `<p><strong>Mensagem:</strong> ${lead.message.trim()}</p>`
    : "<p><strong>Mensagem:</strong> (nao informada)</p>";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Nova solicitacao de contato - PedeZap</h2>
      <p><strong>Responsavel:</strong> ${lead.responsibleName}</p>
      <p><strong>Restaurante:</strong> ${lead.restaurantName}</p>
      <p><strong>WhatsApp:</strong> ${lead.whatsapp}</p>
      <p><strong>Cidade/Estado:</strong> ${lead.cityState}</p>
      <p><strong>Plano:</strong> ${lead.plan}</p>
      ${messageLine}
    </div>
  `;

  const text = [
    "Nova solicitacao de contato - PedeZap",
    `Responsavel: ${lead.responsibleName}`,
    `Restaurante: ${lead.restaurantName}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Cidade/Estado: ${lead.cityState}`,
    `Plano: ${lead.plan}`,
    `Mensagem: ${lead.message?.trim() || "(nao informada)"}`
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `Novo lead: ${lead.restaurantName}`,
      html,
      text
    })
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail do lead (${response.status}): ${payload}`);
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  store.leads.unshift({
    id: makeId("lead"),
    ...parsed.data,
    createdAt: new Date().toISOString()
  });
  await writeStore(store);

  let emailSent = true;
  try {
    await sendLeadNotificationEmail(parsed.data);
  } catch (error) {
    emailSent = false;
    console.error("[leads] erro ao enviar notificacao por e-mail:", error);
  }

  return NextResponse.json({
    success: true,
    message: emailSent
      ? "Solicitacao enviada com sucesso! Em breve entraremos em contato."
      : "Solicitacao registrada com sucesso! Nossa equipe vera seu contato em breve."
  });
}
