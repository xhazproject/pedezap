import { NextResponse } from "next/server";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit";
import { renderNotificationTemplate } from "@/lib/message-templates";
import { makeId, readStore, writeStore } from "@/lib/store";
import { sendTwilioWhatsApp } from "@/lib/twilio";

const sendSchema = z.object({
  to: z.string().min(8),
  message: z.string().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  targetType: z.string().default("message"),
  targetId: z.string().default("manual")
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para envio Twilio." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const twilioConfig = store.adminSettings.integrations.twilio;
  if (!twilioConfig.connected) {
    return NextResponse.json(
      { success: false, message: "Integracao Twilio desativada nas configuracoes do admin." },
      { status: 400 }
    );
  }

  const template = parsed.data.templateId
    ? store.adminSettings.notificationTemplates.find((item) => item.id === parsed.data.templateId)
    : null;

  const rawMessage = parsed.data.message?.trim() || template?.message?.trim() || "";
  if (!rawMessage) {
    return NextResponse.json(
      { success: false, message: "Mensagem nao informada." },
      { status: 400 }
    );
  }

  const renderedMessage = renderNotificationTemplate(rawMessage, parsed.data.variables ?? {});
  const result = await sendTwilioWhatsApp({
    to: parsed.data.to,
    body: renderedMessage,
    from: twilioConfig.whatsappFrom,
    statusCallbackUrl: twilioConfig.statusCallbackUrl
  });

  if (!result.success) {
    store.twilioMessages.unshift({
      id: makeId("twilio"),
      to: parsed.data.to,
      from: twilioConfig.whatsappFrom,
      body: renderedMessage,
      templateId: parsed.data.templateId ?? null,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      status: "failed",
      messageSid: null,
      errorMessage: result.error,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: result.error, status: result.status ?? null },
      { status: result.status && result.status >= 400 ? result.status : 502 }
    );
  }

  store.twilioMessages.unshift({
    id: makeId("twilio"),
    to: parsed.data.to,
    from: twilioConfig.whatsappFrom,
    body: renderedMessage,
    templateId: parsed.data.templateId ?? null,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    status: result.status ?? "queued",
    messageSid: result.sid,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (parsed.data.targetType === "invoice") {
    const invoice = store.invoices.find((item) => item.id === parsed.data.targetId);
    if (invoice) {
      invoice.lastTwilioSentAt = new Date().toISOString();
      invoice.lastTwilioMessageSid = result.sid;
      invoice.lastTwilioStatus = result.status ?? "queued";
    }
  }

  await appendAuditLog(store, {
    request,
    action: "admin.twilio.send",
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    metadata: {
      to: parsed.data.to,
      templateId: parsed.data.templateId ?? null,
      messageSid: result.sid
    }
  });
  await writeStore(store);

  return NextResponse.json({
    success: true,
    sid: result.sid,
    renderedMessage
  });
}

export const dynamic = "force-dynamic";
