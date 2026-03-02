import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { readStore, writeStore } from "@/lib/store";

async function readWebhookPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    return {
      messageSid: String(form.get("MessageSid") ?? ""),
      messageStatus: String(form.get("MessageStatus") ?? ""),
      errorCode: String(form.get("ErrorCode") ?? ""),
      errorMessage: String(form.get("ErrorMessage") ?? "")
    };
  }

  const json = await request.json().catch(() => null);
  return {
    messageSid: String(json?.MessageSid ?? json?.messageSid ?? ""),
    messageStatus: String(json?.MessageStatus ?? json?.messageStatus ?? ""),
    errorCode: String(json?.ErrorCode ?? json?.errorCode ?? ""),
    errorMessage: String(json?.ErrorMessage ?? json?.errorMessage ?? "")
  };
}

export async function POST(request: Request) {
  const payload = await readWebhookPayload(request);
  if (!payload.messageSid) {
    return NextResponse.json({ success: false, message: "MessageSid nao informado." }, { status: 400 });
  }

  const store = await readStore();
  const log = store.twilioMessages.find((item) => item.messageSid === payload.messageSid);
  if (!log) {
    return NextResponse.json({ success: true, ignored: true });
  }

  log.status = payload.messageStatus || log.status;
  log.errorMessage = payload.errorMessage || payload.errorCode || log.errorMessage || null;
  log.updatedAt = new Date().toISOString();

  if (log.targetType === "invoice") {
    const invoice = store.invoices.find((item) => item.id === log.targetId);
    if (invoice) {
      invoice.lastTwilioStatus = log.status;
      invoice.lastTwilioMessageSid = payload.messageSid;
    }
  }

  await writeStore(store);
  await writeAuditLog({
    request,
    action: "admin.twilio.status",
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: {
      messageSid: payload.messageSid,
      status: log.status,
      errorCode: payload.errorCode || null
    }
  });

  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
