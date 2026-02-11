import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/auth-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { appendAuditLog, writeAuditLog } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);
  const ip = request.headers.get("x-forwarded-for") || "local";
  const identifier = parsed.success ? parsed.data.email.toLowerCase() : "unknown";
  const rateKey = `admin-login:${ip}:${identifier}`;
  const rate = checkRateLimit({ key: rateKey, limit: 8, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) {
    await writeAuditLog({
      request,
      action: "auth.admin.login.rate_limited",
      targetType: "admin_user",
      targetId: identifier,
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: identifier },
      metadata: { retryAfterSec: rate.retryAfterSec }
    });
    return NextResponse.json(
      {
        success: false,
        message: `Muitas tentativas. Tente novamente em ${rate.retryAfterSec}s.`
      },
      { status: 429 }
    );
  }

  if (!parsed.success) {
    await writeAuditLog({
      request,
      action: "auth.admin.login.invalid_payload",
      targetType: "admin_user",
      targetId: "unknown",
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: "anonymous" }
    });
    return NextResponse.json(
      { success: false, message: "Credenciais invalidas." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const user = store.adminUsers.find(
    (item) => item.email.toLowerCase() === parsed.data.email.toLowerCase()
  );

  if (!user) {
    await appendAuditLog(store, {
      request,
      action: "auth.admin.login.failed",
      targetType: "admin_user",
      targetId: parsed.data.email.toLowerCase(),
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: parsed.data.email.toLowerCase() }
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Email ou senha invalidos." },
      { status: 401 }
    );
  }

  const passwordCheck = await verifyPassword(parsed.data.password, user.password);
  if (!passwordCheck.valid) {
    await appendAuditLog(store, {
      request,
      action: "auth.admin.login.failed",
      targetType: "admin_user",
      targetId: user.email,
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: user.email }
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Email ou senha invalidos." },
      { status: 401 }
    );
  }

  if (user.status !== "Ativo") {
    await appendAuditLog(store, {
      request,
      action: "auth.admin.login.blocked_inactive",
      targetType: "admin_user",
      targetId: user.email,
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: user.email }
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Usuario inativo." },
      { status: 403 }
    );
  }

  const role = store.adminRoles.find((item) => item.name === user.role);
  const permissions = role?.permissions ?? user.permissions ?? [];

  user.lastAccessAt = new Date().toISOString();
  user.permissions = permissions;
  if (passwordCheck.needsUpgrade) {
    user.password = await hashPassword(parsed.data.password);
  }
  await appendAuditLog(store, {
    request,
    action: "auth.admin.login.success",
    targetType: "admin_user",
    targetId: user.email,
    actor: { actorType: "admin", actorId: user.email, actorName: user.name },
    metadata: { role: user.role }
  });
  await writeStore(store);

  const token = await createSessionToken(
    {
      kind: "admin",
      email: user.email,
      name: user.name,
      role: user.role,
      permissions
    },
    60 * 60 * 12
  );

  const response = NextResponse.json({
    success: true,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
      permissions
    }
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
