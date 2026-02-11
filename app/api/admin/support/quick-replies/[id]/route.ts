import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";

const quickReplySchema = z.object({
  label: z.string().min(2).optional(),
  body: z.string().min(2).optional(),
  status: z.enum(["Aberto", "Em andamento", "Aguardando", "Fechado"]).optional()
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = quickReplySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.supportQuickReplies.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Mensagem rapida nao encontrada." },
      { status: 404 }
    );
  }

  if (parsed.data.label) {
    const exists = store.supportQuickReplies.some(
      (item, idx) =>
        idx !== index && item.label.toLowerCase() === parsed.data.label!.toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Chave ja existe." },
        { status: 409 }
      );
    }
  }

  store.supportQuickReplies[index] = {
    ...store.supportQuickReplies[index],
    ...parsed.data,
    label: parsed.data.label ?? store.supportQuickReplies[index].label,
    body: parsed.data.body ?? store.supportQuickReplies[index].body,
    status: parsed.data.status ?? store.supportQuickReplies[index].status
  };

  await writeStore(store);
  return NextResponse.json({ success: true, quickReply: store.supportQuickReplies[index] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const store = await readStore();
  const index = store.supportQuickReplies.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Mensagem rapida nao encontrada." },
      { status: 404 }
    );
  }

  store.supportQuickReplies.splice(index, 1);
  await writeStore(store);
  return NextResponse.json({ success: true });
}
