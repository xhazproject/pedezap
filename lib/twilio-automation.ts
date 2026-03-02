import { appendAuditLog } from "@/lib/audit";
import { renderNotificationTemplate } from "@/lib/message-templates";
import { makeId, readStore, writeStore } from "@/lib/store";
import { AppStore, Invoice, Restaurant } from "@/lib/store-data";
import { sendTwilioWhatsApp } from "@/lib/twilio";

export type TwilioAutomationMode = "due" | "overdue" | "all";

export function deriveInvoiceStatus(status: string, dueDate: string) {
  if (status === "Pago" || status === "Estornado") return status;
  return new Date(dueDate) < new Date() ? "Vencido" : "Pendente";
}

export function buildInvoiceVariables(
  invoice: Pick<Invoice, "restaurantName" | "id" | "value" | "dueDate" | "method">,
  restaurant?: Pick<Restaurant, "whatsapp"> | null
) {
  return {
    nome_restaurante: invoice.restaurantName,
    numero_fatura: invoice.id,
    valor_fatura: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(invoice.value),
    vencimento_fatura: invoice.dueDate || "-",
    forma_pagamento: invoice.method,
    link_painel: `${process.env.NEXT_PUBLIC_APP_URL || "https://pedezap.site"}/master/login`,
    telefone_restaurante: restaurant?.whatsapp ?? ""
  };
}

export async function runTwilioInvoiceAutomation(
  store: AppStore,
  mode: TwilioAutomationMode
) {
  const twilioConfig = store.adminSettings.integrations.twilio;
  const dueTemplate = store.adminSettings.notificationTemplates.find(
    (item) => item.id === "tpl_invoice_due" && item.active
  );
  const overdueTemplate = store.adminSettings.notificationTemplates.find(
    (item) => item.id === "tpl_invoice_overdue" && item.active
  );

  const candidates = store.invoices.filter((invoice) => {
    const currentStatus = deriveInvoiceStatus(invoice.status, invoice.dueDate);
    if (currentStatus === "Pago" || currentStatus === "Estornado") return false;
    if (mode === "due") return currentStatus === "Pendente";
    if (mode === "overdue") return currentStatus === "Vencido";
    return currentStatus === "Pendente" || currentStatus === "Vencido";
  });

  const summary = { total: candidates.length, sent: 0, failed: 0, skipped: 0 };

  for (const invoice of candidates) {
    const restaurant = store.restaurants.find((item) => item.slug === invoice.restaurantSlug);
    const phone = restaurant?.whatsapp?.trim() ?? "";
    const currentStatus = deriveInvoiceStatus(invoice.status, invoice.dueDate);
    const template =
      currentStatus === "Vencido" ? overdueTemplate ?? dueTemplate : dueTemplate ?? overdueTemplate;

    if (!restaurant || !phone || !template) {
      summary.skipped += 1;
      continue;
    }

    const renderedMessage = renderNotificationTemplate(
      template.message,
      buildInvoiceVariables(invoice, restaurant)
    );

    const result = await sendTwilioWhatsApp({
      to: phone,
      body: renderedMessage,
      from: twilioConfig.whatsappFrom,
      statusCallbackUrl: twilioConfig.statusCallbackUrl
    });

    const now = new Date().toISOString();
    if (!result.success) {
      summary.failed += 1;
      store.twilioMessages.unshift({
        id: makeId("twilio"),
        to: phone,
        from: twilioConfig.whatsappFrom,
        body: renderedMessage,
        templateId: template.id,
        targetType: "invoice",
        targetId: invoice.id,
        status: "failed",
        messageSid: null,
        errorMessage: result.error,
        createdAt: now,
        updatedAt: now
      });
      continue;
    }

    summary.sent += 1;
    invoice.lastTwilioSentAt = now;
    invoice.lastTwilioMessageSid = result.sid;
    invoice.lastTwilioStatus = result.status ?? "queued";
    store.twilioMessages.unshift({
      id: makeId("twilio"),
      to: phone,
      from: twilioConfig.whatsappFrom,
      body: renderedMessage,
      templateId: template.id,
      targetType: "invoice",
      targetId: invoice.id,
      status: result.status ?? "queued",
      messageSid: result.sid,
      errorMessage: null,
      createdAt: now,
      updatedAt: now
    });
  }

  return summary;
}

export async function persistTwilioAutomationAudit(request: Request | undefined, mode: TwilioAutomationMode, summary: { total: number; sent: number; failed: number; skipped: number }, store?: AppStore) {
  const targetStore = store ?? (await readStore());
  await appendAuditLog(targetStore, {
    request,
    action: "admin.twilio.automation.run",
    targetType: "twilio_automation",
    targetId: mode,
    metadata: {
      total: summary.total,
      sent: summary.sent,
      failed: summary.failed,
      skipped: summary.skipped
    }
  });
  if (!store) await writeStore(targetStore);
}
