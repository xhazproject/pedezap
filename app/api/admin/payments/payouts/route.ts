import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "agenda";
  const query = searchParams.get("q")?.toLowerCase().trim();
  const store = await readStore();

  let items = store.payouts ?? [];
  if (query) {
    items = items.filter((item) => {
      return (
        item.restaurant.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.pixKey.toLowerCase().includes(query)
      );
    });
  }

  if (tab === "agenda") {
    items = items.filter((item) => item.group === "today" || item.group === "late");
  } else if (tab === "requests") {
    items = items.filter((item) => item.status === "Pendente");
  } else if (tab === "history") {
    items = items.filter((item) => item.status !== "Pendente");
  }

  return NextResponse.json({ success: true, payouts: items });
}
