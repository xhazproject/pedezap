import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";

const updateTicketSchema = z.object({
  status: z.enum(["Aberto", "Em andamento", "Aguardando", "Fechado"]).optional(),
  assigneeName: z.string().min(2).optional()
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const store = await readStore();
  const ticket = store.supportTickets.find((item) => item.id === params.id);
  if (!ticket) {
    return NextResponse.json(
      { success: false, message: "Chamado nao encontrado." },
      { status: 404 }
    );
  }

  const messages = store.supportMessages
    .filter((msg) => msg.ticketId === ticket.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json({ success: true, ticket, messages });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = updateTicketSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.supportTickets.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Chamado nao encontrado." },
      { status: 404 }
    );
  }

  store.supportTickets[index] = {
    ...store.supportTickets[index],
    ...parsed.data,
    updatedAt: new Date().toISOString()
  };

  await writeStore(store);
  return NextResponse.json({ success: true, ticket: store.supportTickets[index] });
}
