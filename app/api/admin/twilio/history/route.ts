import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim().toLowerCase() ?? "all";
  const templateId = searchParams.get("templateId")?.trim() ?? "all";

  const store = await readStore();
  const recent = [...store.twilioMessages]
    .filter((item) => {
      const matchesQuery =
        !query ||
        item.to.toLowerCase().includes(query) ||
        item.targetId.toLowerCase().includes(query) ||
        item.body.toLowerCase().includes(query);
      const matchesStatus = status === "all" || item.status.toLowerCase() === status;
      const matchesTemplate =
        templateId === "all" || (item.templateId ?? "").toLowerCase() === templateId.toLowerCase();
      return matchesQuery && matchesStatus && matchesTemplate;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  const summary = {
    total: store.twilioMessages.length,
    sent: store.twilioMessages.filter((item) =>
      ["queued", "accepted", "sending", "sent", "delivered", "read"].includes(item.status)
    ).length,
    failed: store.twilioMessages.filter((item) => item.status === "failed").length,
    delivered: store.twilioMessages.filter((item) => item.status === "delivered").length
  };

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 6);
  periodStart.setHours(0, 0, 0, 0);
  const periodItems = store.twilioMessages.filter((item) => new Date(item.createdAt) >= periodStart);
  const deliveredCount = periodItems.filter((item) => item.status === "delivered").length;
  const failedCount = periodItems.filter((item) => item.status === "failed").length;
  const sentBase = periodItems.filter((item) =>
    ["queued", "accepted", "sending", "sent", "delivered", "read", "failed"].includes(item.status)
  ).length;
  const byDay = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(periodStart);
    date.setDate(periodStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const dayItems = periodItems.filter((item) => item.createdAt.slice(0, 10) === key);
    return {
      date: key,
      sent: dayItems.length,
      delivered: dayItems.filter((item) => item.status === "delivered").length,
      failed: dayItems.filter((item) => item.status === "failed").length
    };
  });

  return NextResponse.json({
    success: true,
    summary,
    messages: recent,
    performance: {
      last7Days: {
        sent: periodItems.length,
        delivered: deliveredCount,
        failed: failedCount,
        deliveryRate: sentBase ? Number(((deliveredCount / sentBase) * 100).toFixed(1)) : 0,
        failureRate: sentBase ? Number(((failedCount / sentBase) * 100).toFixed(1)) : 0
      },
      byDay
    },
    templates: Array.from(
      new Set(
        store.twilioMessages
          .map((item) => item.templateId)
          .filter((value): value is string => Boolean(value))
      )
    )
  });
}

export const dynamic = "force-dynamic";
