import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";
import { appendAuditLog } from "@/lib/audit";

const planTabEnum = z.enum([
  "dashboard",
  "orders",
  "menu",
  "highlights",
  "clients",
  "billing",
  "promotions",
  "banners",
  "marketing",
  "settings",
  "plans",
  "support"
]);

const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().positive().optional(),
  color: z.string().min(4).optional(),
  description: z.string().min(4).optional(),
  features: z.array(z.string().min(1)).min(1).optional(),
  allowedTabs: z.array(planTabEnum).min(1).optional(),
  manualOrderLimitEnabled: z.boolean().optional(),
  manualOrderLimitPerMonth: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional()
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = updatePlanSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para atualizar plano." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.plans.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Plano nao encontrado." },
      { status: 404 }
    );
  }

  store.plans[index] = {
    ...store.plans[index],
    ...parsed.data,
    manualOrderLimitPerMonth:
      parsed.data.manualOrderLimitEnabled === false
        ? null
        : parsed.data.manualOrderLimitPerMonth ?? store.plans[index].manualOrderLimitPerMonth ?? null,
    updatedAt: new Date().toISOString()
  };
  await appendAuditLog(store, {
    request,
    action: "admin.plan.update",
    targetType: "plan",
    targetId: params.id
  });
  await writeStore(store);
  return NextResponse.json({ success: true, plan: store.plans[index] });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const store = await readStore();
  const index = store.plans.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Plano nao encontrado." },
      { status: 404 }
    );
  }

  const planId = store.plans[index].id;
  store.plans.splice(index, 1);
  store.restaurants = store.restaurants.map((restaurant) =>
    restaurant.subscribedPlanId === planId
      ? {
          ...restaurant,
          subscribedPlanId: null,
          subscriptionStatus: "expired"
        }
      : restaurant
  );
  await appendAuditLog(store, {
    request,
    action: "admin.plan.delete",
    targetType: "plan",
    targetId: params.id
  });
  await writeStore(store);
  return NextResponse.json({ success: true });
}
