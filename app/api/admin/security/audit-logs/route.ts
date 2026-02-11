import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").toLowerCase();
  const action = searchParams.get("action") ?? "all";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  const store = await readStore();
  const filtered = (store.auditLogs ?? [])
    .filter((log) => {
      const matchesQuery =
        !query ||
        log.action.toLowerCase().includes(query) ||
        log.actorName.toLowerCase().includes(query) ||
        log.targetId.toLowerCase().includes(query) ||
        log.ip.toLowerCase().includes(query);
      const matchesAction = action === "all" || log.action === action;
      return matchesQuery && matchesAction;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const start = (Math.max(1, page) - 1) * Math.max(1, pageSize);
  const logs = filtered.slice(start, start + Math.max(1, pageSize));
  const actions = Array.from(new Set((store.auditLogs ?? []).map((item) => item.action))).sort();

  return NextResponse.json({
    success: true,
    total: filtered.length,
    logs,
    actions
  });
}
