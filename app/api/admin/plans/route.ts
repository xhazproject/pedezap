import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";
import { appendAuditLog } from "@/lib/audit";

const planSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  color: z.string().min(4),
  description: z.string().min(4),
  features: z.array(z.string().min(1)).min(1),
  active: z.boolean().optional()
});

function countSubscribers(store: Awaited<ReturnType<typeof readStore>>, planId: string) {
  return store.restaurants.filter((item) => item.subscribedPlanId === planId).length;
}

export async function GET() {
  const store = await readStore();
  const plans = store.plans.map((plan) => ({
    ...plan,
    subscribers: countSubscribers(store, plan.id)
  }));
  return NextResponse.json({ success: true, plans });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = planSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para criar plano." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const now = new Date().toISOString();
  const plan = {
    id: makeId("plan"),
    name: parsed.data.name,
    price: parsed.data.price,
    color: parsed.data.color,
    description: parsed.data.description,
    features: parsed.data.features,
    active: parsed.data.active ?? true,
    createdAt: now,
    updatedAt: now
  };

  store.plans.push(plan);
  await appendAuditLog(store, {
    request,
    action: "admin.plan.create",
    targetType: "plan",
    targetId: plan.id,
    metadata: { name: plan.name, price: plan.price }
  });
  await writeStore(store);
  return NextResponse.json({ success: true, plan });
}
