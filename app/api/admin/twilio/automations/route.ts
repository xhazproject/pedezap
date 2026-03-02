import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";
import {
  persistTwilioAutomationAudit,
  runTwilioInvoiceAutomation
} from "@/lib/twilio-automation";

const automationSchema = z.object({
  mode: z.enum(["due", "overdue", "all"]).default("overdue")
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = automationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Modo de automacao invalido." },
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

  const summary = await runTwilioInvoiceAutomation(store, parsed.data.mode);
  await persistTwilioAutomationAudit(request, parsed.data.mode, summary, store);
  await writeStore(store);

  return NextResponse.json({
    success: true,
    summary
  });
}

export const dynamic = "force-dynamic";
