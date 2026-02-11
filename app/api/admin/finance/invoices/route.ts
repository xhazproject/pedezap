import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const createInvoiceSchema = z.object({
  restaurantSlug: z.string().min(2),
  value: z.number().positive(),
  dueDate: z.string().min(8),
  method: z.enum(["Cartao de Credito", "Boleto", "Pix"])
});

function deriveStatus(status: string, dueDate: string) {
  if (status === "Pago" || status === "Estornado") return status;
  return new Date(dueDate) < new Date() ? "Vencido" : "Pendente";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const status = searchParams.get("status") ?? "all";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "5");

  const store = await readStore();
  const filtered = store.invoices
    .map((invoice) => ({
      ...invoice,
      status: deriveStatus(invoice.status, invoice.dueDate)
    }))
    .filter((invoice) => {
      const matchQuery =
        invoice.id.toLowerCase().includes(query) ||
        invoice.restaurantName.toLowerCase().includes(query) ||
        invoice.restaurantSlug.toLowerCase().includes(query);
      const matchStatus = status === "all" || invoice.status === status;
      return matchQuery && matchStatus;
    })
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    success: true,
    total: filtered.length,
    invoices: paged
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = createInvoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurant = store.restaurants.find(
    (item) => item.slug === parsed.data.restaurantSlug
  );
  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const invoice = {
    id: makeId("INV").toUpperCase(),
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    plan: restaurant.plan,
    value: parsed.data.value,
    dueDate: parsed.data.dueDate,
    status: "Pendente" as const,
    method: parsed.data.method,
    createdAt: new Date().toISOString(),
    paidAt: null
  };

  store.invoices.unshift(invoice);
  await writeStore(store);

  return NextResponse.json({ success: true, invoice });
}
