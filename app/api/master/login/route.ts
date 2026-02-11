import { NextResponse } from "next/server";
import { z } from "zod";
import { isSubscriptionBlocked, readStore, writeStore } from "@/lib/store";
import { createSessionToken, MASTER_SESSION_COOKIE } from "@/lib/auth-session";
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
  const rateKey = `master-login:${ip}:${identifier}`;
  const rate = checkRateLimit({ key: rateKey, limit: 8, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) {
    await writeAuditLog({
      request,
      action: "auth.master.login.rate_limited",
      targetType: "restaurant",
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
      action: "auth.master.login.invalid_payload",
      targetType: "restaurant",
      targetId: "unknown",
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: "anonymous" }
    });
    return NextResponse.json(
      { success: false, message: "Credenciais invalidas." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.restaurants.findIndex(
    (item) => item.ownerEmail.toLowerCase() === parsed.data.email.toLowerCase()
  );
  const restaurant = index >= 0 ? store.restaurants[index] : null;

  if (!restaurant) {
    await appendAuditLog(store, {
      request,
      action: "auth.master.login.failed",
      targetType: "restaurant",
      targetId: parsed.data.email.toLowerCase(),
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: parsed.data.email.toLowerCase() }
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Email ou senha invalidos." },
      { status: 401 }
    );
  }

  const passwordCheck = await verifyPassword(parsed.data.password, restaurant.ownerPassword);
  if (!passwordCheck.valid) {
    await appendAuditLog(store, {
      request,
      action: "auth.master.login.failed",
      targetType: "restaurant",
      targetId: restaurant.slug,
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: parsed.data.email.toLowerCase() }
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Email ou senha invalidos." },
      { status: 401 }
    );
  }

  if (isSubscriptionBlocked(restaurant)) {
    await appendAuditLog(store, {
      request,
      action: "auth.master.login.blocked_subscription",
      targetType: "restaurant",
      targetId: restaurant.slug,
      actor: { actorType: "master", actorId: restaurant.slug, actorName: restaurant.ownerEmail },
      metadata: { status: restaurant.subscriptionStatus ?? "expired" }
    });
    await writeStore(store);
    return NextResponse.json(
      {
        success: false,
        message: "Assinatura expirada. Escolha/renove um plano para voltar a usar o painel."
      },
      { status: 402 }
    );
  }

  if (passwordCheck.needsUpgrade && index >= 0) {
    store.restaurants[index] = {
      ...restaurant,
      ownerPassword: await hashPassword(parsed.data.password)
    };
  }
  await appendAuditLog(store, {
    request,
    action: "auth.master.login.success",
    targetType: "restaurant",
    targetId: restaurant.slug,
    actor: { actorType: "master", actorId: restaurant.slug, actorName: restaurant.ownerEmail }
  });
  await writeStore(store);

  const token = await createSessionToken(
    {
      kind: "master",
      restaurantSlug: restaurant.slug,
      email: restaurant.ownerEmail
    },
    60 * 60 * 12
  );

  const response = NextResponse.json({
    success: true,
    user: {
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.name,
      email: restaurant.ownerEmail
    }
  });
  response.cookies.set(MASTER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
