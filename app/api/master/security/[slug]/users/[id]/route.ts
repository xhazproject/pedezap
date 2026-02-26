import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { appendAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { readStore, writeStore } from "@/lib/store";
import { PlanMasterTab, RestaurantPanelRole } from "@/lib/store-data";

const masterTabEnum = z.enum([
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

const roleDefaults: Record<Exclude<RestaurantPanelRole, "owner">, PlanMasterTab[]> = {
  gerente: ["dashboard","orders","menu","highlights","clients","billing","promotions","banners","marketing","settings","support"],
  atendente: ["dashboard","orders","clients","promotions","support"],
  cozinha: ["orders"]
};

const updateSchema = z.object({
  name: z.string().min(2),
  role: z.enum(["gerente", "atendente", "cozinha"]),
  status: z.enum(["Ativo", "Inativo"]),
  password: z.string().min(6).optional().or(z.literal("")),
  permissions: z.array(masterTabEnum)
});

function canManageUsers(session: Awaited<ReturnType<typeof verifySessionToken>>, ownerEmail?: string) {
  if (!session || session.kind !== "master") return false;
  return (
    session.isOwner === true ||
    session.role === "owner" ||
    session.role === "gerente" ||
    (!!ownerEmail && session.email.toLowerCase() === ownerEmail.toLowerCase())
  );
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const token = cookies().get(MASTER_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "master" || payload.restaurantSlug !== params.slug) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados invalidos." }, { status: 400 });
  }

  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);
  if (!restaurant) {
    return NextResponse.json({ success: false, message: "Restaurante nao encontrado." }, { status: 404 });
  }
  if (!canManageUsers(payload, restaurant.ownerEmail)) {
    return NextResponse.json({ success: false, message: "Sem permissao." }, { status: 403 });
  }
  const users = restaurant.panelUsers ?? [];
  const userIndex = users.findIndex((u) => u.id === params.id);
  if (userIndex < 0) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado." }, { status: 404 });
  }
  const current = users[userIndex];
  const nextPermissions = parsed.data.permissions?.length ? parsed.data.permissions : roleDefaults[parsed.data.role];
  users[userIndex] = {
    ...current,
    name: parsed.data.name,
    role: parsed.data.role,
    status: parsed.data.status,
    permissions: nextPermissions as PlanMasterTab[],
    password: parsed.data.password ? await hashPassword(parsed.data.password) : current.password
  };
  restaurant.panelUsers = users;
  await appendAuditLog(store, {
    request,
    action: "security.master_user.update",
    targetType: "restaurant_panel_user",
    targetId: current.id,
    actor: {
      actorType: "master",
      actorId: payload.userId ?? payload.restaurantSlug,
      actorName: payload.userName ?? payload.email
    }
  });
  await writeStore(store);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const token = cookies().get(MASTER_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "master" || payload.restaurantSlug !== params.slug) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }
  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);
  if (!restaurant) {
    return NextResponse.json({ success: false, message: "Restaurante nao encontrado." }, { status: 404 });
  }
  if (!canManageUsers(payload, restaurant.ownerEmail)) {
    return NextResponse.json({ success: false, message: "Sem permissao." }, { status: 403 });
  }
  const before = restaurant.panelUsers ?? [];
  const target = before.find((u) => u.id === params.id);
  if (!target) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado." }, { status: 404 });
  }
  restaurant.panelUsers = before.filter((u) => u.id !== params.id);
  await appendAuditLog(store, {
    request,
    action: "security.master_user.delete",
    targetType: "restaurant_panel_user",
    targetId: params.id,
    actor: {
      actorType: "master",
      actorId: payload.userId ?? payload.restaurantSlug,
      actorName: payload.userName ?? payload.email
    }
  });
  await writeStore(store);
  return NextResponse.json({ success: true });
}
