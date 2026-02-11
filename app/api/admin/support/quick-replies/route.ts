import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const quickReplySchema = z.object({
  label: z.string().min(2),
  body: z.string().min(2),
  status: z.enum(["Aberto", "Em andamento", "Aguardando", "Fechado"])
});

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ success: true, quickReplies: store.supportQuickReplies });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = quickReplySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const exists = store.supportQuickReplies.some(
    (item) => item.label.toLowerCase() === parsed.data.label.toLowerCase()
  );
  if (exists) {
    return NextResponse.json(
      { success: false, message: "Chave ja existe." },
      { status: 409 }
    );
  }

  const quickReply = {
    id: makeId("qr"),
    label: parsed.data.label,
    body: parsed.data.body,
    status: parsed.data.status,
    createdAt: new Date().toISOString()
  };

  store.supportQuickReplies.push(quickReply);
  await writeStore(store);

  return NextResponse.json({ success: true, quickReply });
}
