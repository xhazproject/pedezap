import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const createTicketSchema = z.object({
  subject: z.string().min(3),
  requesterName: z.string().min(2),
  requesterEmail: z.string().trim().min(3),
  requesterType: z.enum(["Parceiro", "Cliente"]),
  restaurantName: z.string().min(2).optional(),
  restaurantSlug: z.string().min(2).optional(),
  category: z.string().min(2).optional()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const type = searchParams.get("type") ?? "all";
  const status = searchParams.get("status") ?? "all";

  const store = await readStore();
  const messagesByTicket = store.supportMessages.reduce<
    Record<string, { body: string; createdAt: string }>
  >((acc, msg) => {
    const current = acc[msg.ticketId];
    if (!current || new Date(msg.createdAt) > new Date(current.createdAt)) {
      acc[msg.ticketId] = { body: msg.body, createdAt: msg.createdAt };
    }
    return acc;
  }, {});

  const tickets = store.supportTickets
    .filter((ticket) => {
      const matchQuery =
        ticket.subject.toLowerCase().includes(query) ||
        ticket.requesterName.toLowerCase().includes(query) ||
        ticket.requesterEmail.toLowerCase().includes(query);
      const matchType = type === "all" || ticket.requesterType === type;
      const matchStatus = status === "all" || ticket.status === status;
      return matchQuery && matchType && matchStatus;
    })
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .map((ticket) => ({
      ...ticket,
      lastMessagePreview: messagesByTicket[ticket.id]?.body ?? ""
    }));

  return NextResponse.json({ success: true, tickets });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = createTicketSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const now = new Date().toISOString();
  const ticket = {
    id: makeId("TCK"),
    subject: parsed.data.subject,
    requesterName: parsed.data.requesterName,
    requesterEmail: parsed.data.requesterEmail,
    requesterType: parsed.data.requesterType,
    restaurantName: parsed.data.restaurantName,
    restaurantSlug: parsed.data.restaurantSlug,
    status: "Aberto" as const,
    category: parsed.data.category ?? "Suporte",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    assigneeName: null as string | null
  };

  store.supportTickets.push(ticket);
  await writeStore(store);

  return NextResponse.json({ success: true, ticket }, { status: 201 });
}
