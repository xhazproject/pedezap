import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { appendAuditLog } from "@/lib/audit";
import { listVisibleSessions, revokeActiveSessionById } from "@/lib/session-registry";
import { readStore, writeStore } from "@/lib/store";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function canManageSessions(payload: Awaited<ReturnType<typeof verifySessionToken>>, ownerEmail?: string) {
  if (!payload || payload.kind !== "master") return false;
  return (
    payload.isOwner === true ||
    payload.role === "owner" ||
    payload.role === "gerente" ||
    (!!ownerEmail && payload.email.toLowerCase() === ownerEmail.toLowerCase())
  );
}

export async function GET(
  request: Request,
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
  if (!canManageSessions(payload, restaurant.ownerEmail)) {
    return NextResponse.json({ success: false, message: "Sem permissao." }, { status: 403 });
  }
  const currentHash = token ? hashSessionToken(token) : null;
  const sessions = listVisibleSessions(store)
    .filter((item) => item.kind === "master" && item.restaurantSlug === params.slug)
    .map((item) => ({
      ...item,
      isCurrent: currentHash ? item.sessionId === currentHash : false
    }));

  return NextResponse.json({ success: true, sessions });
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const token = cookies().get(MASTER_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "master" || payload.restaurantSlug !== params.slug) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) {
    return NextResponse.json({ success: false, message: "Sessao nao informada." }, { status: 400 });
  }

  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);
  if (!restaurant) {
    return NextResponse.json({ success: false, message: "Restaurante nao encontrado." }, { status: 404 });
  }
  if (!canManageSessions(payload, restaurant.ownerEmail)) {
    return NextResponse.json({ success: false, message: "Sem permissao." }, { status: 403 });
  }
  const revoked = revokeActiveSessionById(store, sessionId);
  if (!revoked) {
    return NextResponse.json({ success: false, message: "Sessao nao encontrada." }, { status: 404 });
  }
  await appendAuditLog(store, {
    request,
    action: "security.master.session.revoke",
    targetType: "session",
    targetId: sessionId,
    actor: {
      actorType: "master",
      actorId: payload.userId ?? payload.restaurantSlug,
      actorName: payload.userName ?? payload.email
    },
    metadata: { restaurantSlug: params.slug }
  });
  await writeStore(store);
  return NextResponse.json({ success: true });
}
