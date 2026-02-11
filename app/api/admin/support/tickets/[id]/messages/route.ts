import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const messageSchema = z.object({
  body: z.string().min(1),
  authorName: z.string().min(2),
  authorRole: z.enum(["agent", "customer"]).optional(),
  internal: z.boolean().optional()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const ticket = store.supportTickets.find((item) => item.id === params.id);
  if (!ticket) {
    return NextResponse.json(
      { success: false, message: "Chamado nao encontrado." },
      { status: 404 }
    );
  }

  const message = {
    id: makeId("msg"),
    ticketId: ticket.id,
    authorName: parsed.data.authorName,
    authorRole: parsed.data.authorRole ?? ("agent" as const),
    body: parsed.data.body,
    createdAt: new Date().toISOString(),
    internal: parsed.data.internal ?? false
  };

  store.supportMessages.push(message);
  ticket.updatedAt = message.createdAt;
  ticket.lastMessageAt = message.createdAt;
  await writeStore(store);

  return NextResponse.json({ success: true, message });
}
