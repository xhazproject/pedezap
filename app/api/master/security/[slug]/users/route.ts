import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { appendAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { makeId, readStore, writeStore } from "@/lib/store";
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

const roleDefaults: Record<RestaurantPanelRole, PlanMasterTab[]> = {
  owner: ["dashboard","orders","menu","highlights","clients","billing","promotions","banners","marketing","settings","plans","support"],
  gerente: ["dashboard","orders","menu","highlights","clients","billing","promotions","banners","marketing","settings","support"],
  atendente: ["dashboard","orders","clients","promotions","support"],
  cozinha: ["orders"]
};

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["gerente", "atendente", "cozinha"]),
  status: z.enum(["Ativo", "Inativo"]).default("Ativo"),
  password: z.string().min(6),
  permissions: z.array(masterTabEnum).optional()
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

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
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

  const users = (restaurant.panelUsers ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: user.permissions ?? [],
    createdAt: user.createdAt,
    lastAccessAt: user.lastAccessAt ?? null
  }));
  return NextResponse.json({ success: true, users, roleDefaults });
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const token = cookies().get(MASTER_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "master" || payload.restaurantSlug !== params.slug) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados invalidos." }, { status: 400 });
  }

  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (index < 0) {
    return NextResponse.json({ success: false, message: "Restaurante nao encontrado." }, { status: 404 });
  }
  const restaurant = store.restaurants[index];
  if (!canManageUsers(payload, restaurant.ownerEmail)) {
    return NextResponse.json({ success: false, message: "Sem permissao." }, { status: 403 });
  }
  const email = parsed.data.email.toLowerCase();
  if (restaurant.ownerEmail.toLowerCase() === email || (restaurant.panelUsers ?? []).some((u) => u.email.toLowerCase() === email)) {
    return NextResponse.json({ success: false, message: "Email ja utilizado neste painel." }, { status: 409 });
  }

  const permissions = (parsed.data.permissions?.length ? parsed.data.permissions : roleDefaults[parsed.data.role]) as PlanMasterTab[];
  restaurant.panelUsers = restaurant.panelUsers ?? [];
  restaurant.panelUsers.push({
    id: makeId("mpu"),
    name: parsed.data.name,
    email,
    role: parsed.data.role,
    status: parsed.data.status,
    password: await hashPassword(parsed.data.password),
    permissions,
    createdAt: new Date().toISOString(),
    lastAccessAt: null
  });

  await appendAuditLog(store, {
    request,
    action: "security.master_user.create",
    targetType: "restaurant_panel_user",
    targetId: email,
    actor: {
      actorType: "master",
      actorId: payload.userId ?? payload.restaurantSlug,
      actorName: payload.userName ?? payload.email
    },
    metadata: { restaurantSlug: params.slug, role: parsed.data.role }
  });
  await writeStore(store);
  return NextResponse.json({ success: true });
}
