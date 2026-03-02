import { NextResponse } from "next/server";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit";
import { makeId, readStore, writeStore } from "@/lib/store";
import { sendTwilioWhatsApp } from "@/lib/twilio";

const resendSchema = z.object({
  messageId: z.string().min(2)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = resendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Mensagem Twilio invalida." },
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

  const original = store.twilioMessages.find((item) => item.id === parsed.data.messageId);
  if (!original) {
    return NextResponse.json(
      { success: false, message: "Mensagem nao encontrada no historico Twilio." },
      { status: 404 }
    );
  }

  const result = await sendTwilioWhatsApp({
    to: original.to,
    body: original.body,
    from: twilioConfig.whatsappFrom,
    statusCallbackUrl: twilioConfig.statusCallbackUrl
  });

  const now = new Date().toISOString();
  if (!result.success) {
    store.twilioMessages.unshift({
      id: makeId("twilio"),
      to: original.to,
      from: twilioConfig.whatsappFrom,
      body: original.body,
      templateId: original.templateId ?? null,
      targetType: original.targetType,
      targetId: original.targetId,
      status: "failed",
      messageSid: null,
      errorMessage: result.error,
      createdAt: now,
      updatedAt: now
    });
    await writeStore(store);
    return NextResponse.json({ success: false, message: result.error }, { status: 502 });
  }

  store.twilioMessages.unshift({
    id: makeId("twilio"),
    to: original.to,
    from: twilioConfig.whatsappFrom,
    body: original.body,
    templateId: original.templateId ?? null,
    targetType: original.targetType,
    targetId: original.targetId,
    status: result.status ?? "queued",
    messageSid: result.sid,
    errorMessage: null,
    createdAt: now,
    updatedAt: now
  });

  if (original.targetType === "invoice") {
    const invoice = store.invoices.find((item) => item.id === original.targetId);
    if (invoice) {
      invoice.lastTwilioSentAt = now;
      invoice.lastTwilioMessageSid = result.sid;
      invoice.lastTwilioStatus = result.status ?? "queued";
    }
  }

  await appendAuditLog(store, {
    request,
    action: "admin.twilio.resend",
    targetType: original.targetType,
    targetId: original.targetId,
    metadata: {
      originalMessageId: original.id,
      messageSid: result.sid
    }
  });
  await writeStore(store);

  return NextResponse.json({ success: true, sid: result.sid });
}

export const dynamic = "force-dynamic";
