import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const leadSchema = z.object({
  responsibleName: z.string().min(2),
  restaurantName: z.string().min(2),
  whatsapp: z.string().min(10),
  cityState: z.string().min(3),
  plan: z.string().min(2),
  message: z.string().optional()
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  store.leads.unshift({
    id: makeId("lead"),
    ...parsed.data,
    createdAt: new Date().toISOString()
  });
  await writeStore(store);

  return NextResponse.json({
    success: true,
    message: "Solicitacao enviada com sucesso! Em breve entraremos em contato."
  });
}
