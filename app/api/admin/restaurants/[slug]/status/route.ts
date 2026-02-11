import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";

const statusSchema = z.object({
  active: z.boolean()
});

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Status invalido." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  store.restaurants[index].active = parsed.data.active;
  store.restaurants[index].canceledAt = parsed.data.active ? null : new Date().toISOString();
  await writeStore(store);
  return NextResponse.json({ success: true, restaurant: store.restaurants[index] });
}
