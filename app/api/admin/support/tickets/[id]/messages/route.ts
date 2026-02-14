import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const attachmentSchema = z.object({
  name: z.string().min(1),
  url: z
    .string()
    .refine(
      (value) =>
        value.startsWith("data:") ||
        value.startsWith("http://") ||
        value.startsWith("https://"),
      "Anexo invalido."
    ),
  type: z.string().optional(),
  size: z.number().int().nonnegative().optional()
});

const messageSchema = z.object({
  body: z.string().optional().default(""),
  authorName: z.string().min(2),
  authorRole: z.enum(["agent", "customer"]).optional(),
  internal: z.boolean().optional(),
  attachments: z.array(attachmentSchema).optional().default([])
}).refine(
  (value) => value.body.trim().length > 0 || (value.attachments?.length ?? 0) > 0,
  { message: "Mensagem vazia.", path: ["body"] }
);

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
    body: parsed.data.body.trim(),
    createdAt: new Date().toISOString(),
    internal: parsed.data.internal ?? false,
    attachments: parsed.data.attachments ?? []
  };

  store.supportMessages.push(message);
  ticket.updatedAt = message.createdAt;
  ticket.lastMessageAt = message.createdAt;
  await writeStore(store);

  return NextResponse.json({ success: true, message });
}
