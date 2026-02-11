import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";
import { appendAuditLog, writeAuditLog } from "@/lib/audit";

const verifySchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(1)
});

const resetSchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(1),
  newPassword: z.string().min(6)
});

function hasValidResetToken(
  token: string | null | undefined,
  expiresAt: string | null | undefined
) {
  if (!token || !expiresAt) return false;
  const expiration = new Date(expiresAt).getTime();
  if (Number.isNaN(expiration)) return false;
  return expiration > Date.now();
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rate = checkRateLimit({ key: `master-reset-verify:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, message: `Muitas tentativas. Aguarde ${rate.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = verifySchema.safeParse({
    slug: searchParams.get("slug"),
    token: searchParams.get("token")
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Link invalido." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === parsed.data.slug);

  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const valid =
    restaurant.passwordResetToken === parsed.data.token &&
    hasValidResetToken(restaurant.passwordResetToken, restaurant.passwordResetExpiresAt);

  if (!valid) {
    return NextResponse.json(
      { success: false, message: "Link expirado ou invalido." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    restaurantName: restaurant.name
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rate = checkRateLimit({ key: `master-reset-post:${ip}`, limit: 8, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) {
    await writeAuditLog({
      request,
      action: "auth.master.password_reset.rate_limited",
      targetType: "restaurant",
      targetId: "unknown",
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: "anonymous" },
      metadata: { retryAfterSec: rate.retryAfterSec }
    });
    return NextResponse.json(
      { success: false, message: `Muitas tentativas. Aguarde ${rate.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = resetSchema.safeParse(payload);

  if (!parsed.success) {
    await writeAuditLog({
      request,
      action: "auth.master.password_reset.invalid_payload",
      targetType: "restaurant",
      targetId: "unknown",
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: "anonymous" }
    });
    return NextResponse.json(
      { success: false, message: "Dados invalidos para redefinir senha." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === parsed.data.slug);

  if (index === -1) {
    await appendAuditLog(store, {
      request,
      action: "auth.master.password_reset.not_found",
      targetType: "restaurant",
      targetId: parsed.data.slug,
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: parsed.data.slug }
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const restaurant = store.restaurants[index];
  const valid =
    restaurant.passwordResetToken === parsed.data.token &&
    hasValidResetToken(restaurant.passwordResetToken, restaurant.passwordResetExpiresAt);

  if (!valid) {
    await appendAuditLog(store, {
      request,
      action: "auth.master.password_reset.invalid_token",
      targetType: "restaurant",
      targetId: parsed.data.slug,
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: parsed.data.slug }
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Link expirado ou invalido." },
      { status: 400 }
    );
  }

  store.restaurants[index] = {
    ...restaurant,
    ownerPassword: await hashPassword(parsed.data.newPassword),
    passwordResetToken: null,
    passwordResetExpiresAt: null
  };

  await appendAuditLog(store, {
    request,
    action: "auth.master.password_reset.success",
    targetType: "restaurant",
    targetId: parsed.data.slug,
    actor: { actorType: "master", actorId: parsed.data.slug, actorName: parsed.data.slug }
  });

  await writeStore(store);

  return NextResponse.json({ success: true, message: "Senha redefinida com sucesso." });
}
