import { readStore } from "@/lib/store";

function escapeCsv(value: string | number | null | undefined) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/\"/g, "\"\"")}"`;
  }
  return stringValue;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const status = searchParams.get("status") ?? "all";

  const store = await readStore();
  const rows = store.invoices
    .map((invoice) => {
      const derivedStatus =
        invoice.status === "Pago" || invoice.status === "Estornado"
          ? invoice.status
          : new Date(invoice.dueDate) < new Date()
          ? "Vencido"
          : "Pendente";
      return { ...invoice, status: derivedStatus };
    })
    .filter((invoice) => {
      const matchQuery =
        invoice.id.toLowerCase().includes(query) ||
        invoice.restaurantName.toLowerCase().includes(query) ||
        invoice.restaurantSlug.toLowerCase().includes(query);
      const matchStatus = status === "all" || invoice.status === status;
      return matchQuery && matchStatus;
    })
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const header = [
    "ID",
    "Restaurante",
    "Slug",
    "Plano",
    "Valor",
    "Vencimento",
    "Status",
    "Metodo",
    "Criado em"
  ];

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.restaurantName,
        row.restaurantSlug,
        row.plan,
        row.value.toFixed(2).replace(".", ","),
        row.dueDate,
        row.status,
        row.method,
        row.createdAt
      ]
        .map(escapeCsv)
        .join(",")
    )
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=financeiro.csv"
    }
  });
}
