import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { appendAuditLog } from "@/lib/audit";
import { listVisibleSessions, revokeActiveSessionById } from "@/lib/session-registry";
import { readStore, writeStore } from "@/lib/store";

export async function GET(request: Request) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const scope = new URL(request.url).searchParams.get("scope") ?? "all";
  const store = await readStore();
  const currentSessionHash = token ? await import("node:crypto").then(({ createHash }) => createHash("sha256").update(token).digest("hex")) : null;
  const sessions = listVisibleSessions(store)
    .filter((item) => (scope === "all" ? true : item.kind === scope))
    .map((item) => ({
      ...item,
      isCurrent: currentSessionHash ? item.sessionId === currentSessionHash : false
    }));

  return NextResponse.json({ success: true, sessions });
}

export async function DELETE(request: Request) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) {
    return NextResponse.json({ success: false, message: "Sessao nao informada." }, { status: 400 });
  }

  const store = await readStore();
  const revoked = revokeActiveSessionById(store, sessionId);
  if (!revoked) {
    return NextResponse.json({ success: false, message: "Sessao nao encontrada." }, { status: 404 });
  }

  await appendAuditLog(store, {
    request,
    action: "security.session.revoke",
    targetType: "session",
    targetId: sessionId,
    actor: {
      actorType: "admin",
      actorId: payload.email,
      actorName: payload.name
    }
  });
  await writeStore(store);

  return NextResponse.json({ success: true });
}

