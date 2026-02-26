import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { appendAuditLog } from "@/lib/audit";
import { readStore, writeStore } from "@/lib/store";
import { buildTotpOtpauthUri, generateTotpSecret, verifyTotpCode } from "@/lib/totp";

async function requireAdmin() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") return null;
  return payload;
}

function issuerName() {
  return process.env.NEXT_PUBLIC_PLATFORM_NAME?.trim() || "PedeZap Admin";
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const store = await readStore();
  const user = store.adminUsers.find((item) => item.email.toLowerCase() === admin.email.toLowerCase());
  if (!user) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado." }, { status: 404 });
  }

  const pendingSecret = user.twoFactorPendingSecret ?? null;
  return NextResponse.json({
    success: true,
    twoFactor: {
      enabled: !!user.twoFactorEnabled,
      pending: !!pendingSecret,
      secretPreview: pendingSecret ? pendingSecret : null,
      otpauthUri: pendingSecret
        ? buildTotpOtpauthUri({
            secret: pendingSecret,
            accountName: user.email,
            issuer: issuerName()
          })
        : null
    }
  });
}

const postSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("confirm"), code: z.string().min(6) }),
  z.object({ action: z.literal("disable"), code: z.string().min(6) })
]);

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados invalidos." }, { status: 400 });
  }

  const store = await readStore();
  const user = store.adminUsers.find((item) => item.email.toLowerCase() === admin.email.toLowerCase());
  if (!user) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado." }, { status: 404 });
  }

  if (parsed.data.action === "start") {
    user.twoFactorPendingSecret = generateTotpSecret();
    await appendAuditLog(store, {
      request,
      action: "security.2fa.admin.start",
      targetType: "admin_user",
      targetId: user.email,
      actor: { actorType: "admin", actorId: user.email, actorName: user.name }
    });
    await writeStore(store);
    return NextResponse.json({
      success: true,
      twoFactor: {
        enabled: !!user.twoFactorEnabled,
        pending: true,
        secretPreview: user.twoFactorPendingSecret,
        otpauthUri: buildTotpOtpauthUri({
          secret: user.twoFactorPendingSecret!,
          accountName: user.email,
          issuer: issuerName()
        })
      }
    });
  }

  if (parsed.data.action === "confirm") {
    if (!user.twoFactorPendingSecret) {
      return NextResponse.json(
        { success: false, message: "Nenhuma configuracao pendente de 2FA." },
        { status: 400 }
      );
    }
    const valid = verifyTotpCode(user.twoFactorPendingSecret, parsed.data.code);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Codigo 2FA invalido." }, { status: 400 });
    }
    user.twoFactorSecret = user.twoFactorPendingSecret;
    user.twoFactorPendingSecret = null;
    user.twoFactorEnabled = true;
    await appendAuditLog(store, {
      request,
      action: "security.2fa.admin.enabled",
      targetType: "admin_user",
      targetId: user.email,
      actor: { actorType: "admin", actorId: user.email, actorName: user.name }
    });
    await writeStore(store);
    return NextResponse.json({ success: true, twoFactor: { enabled: true, pending: false } });
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ success: false, message: "2FA nao esta ativo." }, { status: 400 });
  }
  const valid = verifyTotpCode(user.twoFactorSecret, parsed.data.code);
  if (!valid) {
    return NextResponse.json({ success: false, message: "Codigo 2FA invalido." }, { status: 400 });
  }
  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  user.twoFactorPendingSecret = null;
  await appendAuditLog(store, {
    request,
    action: "security.2fa.admin.disabled",
    targetType: "admin_user",
    targetId: user.email,
    actor: { actorType: "admin", actorId: user.email, actorName: user.name }
  });
  await writeStore(store);
  return NextResponse.json({ success: true, twoFactor: { enabled: false, pending: false } });
}

