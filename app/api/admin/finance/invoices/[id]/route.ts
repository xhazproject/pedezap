import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";
import { appendAuditLog } from "@/lib/audit";

const invoiceActionSchema = z.object({
  action: z.enum(["confirm", "refund", "mark_pending", "second_copy"]),
  dueDate: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = invoiceActionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Acao invalida." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const invoiceIndex = store.invoices.findIndex((item) => item.id === params.id);
  if (invoiceIndex === -1) {
    return NextResponse.json(
      { success: false, message: "Fatura nao encontrada." },
      { status: 404 }
    );
  }

  const current = store.invoices[invoiceIndex];
  const now = new Date().toISOString();
  if (parsed.data.action === "second_copy") {
    const dueDate = String(parsed.data.dueDate ?? "").trim();
    if (!dueDate) {
      return NextResponse.json(
        { success: false, message: "Informe o novo vencimento." },
        { status: 400 }
      );
    }
    store.invoices[invoiceIndex] = {
      ...current,
      dueDate,
      status: "Pendente",
      paidAt: null
    };
    await appendAuditLog(store, {
      request,
      action: "admin.finance.invoice.second_copy",
      targetType: "invoice",
      targetId: current.id,
      metadata: { dueDate }
    });
    await writeStore(store);
    return NextResponse.json({ success: true, invoice: store.invoices[invoiceIndex] });
  }

  const nextStatus =
    parsed.data.action === "confirm"
      ? "Pago"
      : parsed.data.action === "refund"
      ? "Estornado"
      : "Pendente";

  store.invoices[invoiceIndex] = {
    ...current,
    status: nextStatus,
    paidAt:
      nextStatus === "Pago"
        ? now
        : parsed.data.action === "mark_pending"
        ? null
        : current.paidAt ?? null
  };

  await appendAuditLog(store, {
    request,
    action: `admin.finance.invoice.${parsed.data.action}`,
    targetType: "invoice",
    targetId: current.id,
    metadata: { status: nextStatus }
  });

  await writeStore(store);
  return NextResponse.json({ success: true, invoice: store.invoices[invoiceIndex] });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const store = await readStore();
  const nextInvoices = store.invoices.filter((item) => item.id !== params.id);
  if (nextInvoices.length === store.invoices.length) {
    return NextResponse.json(
      { success: false, message: "Fatura nao encontrada." },
      { status: 404 }
    );
  }

  store.invoices = nextInvoices;
  await appendAuditLog(store, {
    request,
    action: "admin.finance.invoice.delete",
    targetType: "invoice",
    targetId: params.id
  });
  await writeStore(store);
  return NextResponse.json({ success: true });
}
