import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import {
  persistTwilioAutomationAudit,
  runTwilioInvoiceAutomation
} from "@/lib/twilio-automation";

function isAuthorized(request: Request) {
  const expected = process.env.TWILIO_CRON_SECRET?.trim();
  if (!expected) return false;
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return token && token === expected;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: "Nao autorizado." }, { status: 401 });
  }

  const store = await readStore();
  if (!store.adminSettings.integrations.twilio.connected) {
    return NextResponse.json(
      { success: false, message: "Integracao Twilio desativada nas configuracoes do admin." },
      { status: 400 }
    );
  }

  const summary = await runTwilioInvoiceAutomation(store, "all");
  await persistTwilioAutomationAudit(request, "all", summary, store);
  await writeStore(store);

  return NextResponse.json({ success: true, summary });
}

export const dynamic = "force-dynamic";
