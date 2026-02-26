import { NextResponse } from "next/server";
import { z } from "zod";
import { isRestaurantBlocked, isSubscriptionBlocked, readStore, writeStore } from "@/lib/store";
import { createSessionToken, MASTER_SESSION_COOKIE } from "@/lib/auth-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { appendAuditLog, writeAuditLog } from "@/lib/audit";
import { registerActiveSession } from "@/lib/session-registry";
import { PlanMasterTab } from "@/lib/store-data";

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
  const loginEmail = parsed.data.email.toLowerCase();
  const index = store.restaurants.findIndex(
    (item) =>
      item.ownerEmail.toLowerCase() === loginEmail ||
      (item.panelUsers ?? []).some((user) => user.email.toLowerCase() === loginEmail)
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

  if (isRestaurantBlocked(restaurant)) {
    await appendAuditLog(store, {
      request,
      action: "auth.master.login.blocked_by_admin",
      targetType: "restaurant",
      targetId: restaurant.slug,
      actor: { actorType: "master", actorId: restaurant.slug, actorName: restaurant.ownerEmail }
    });
    await writeStore(store);
    return NextResponse.json(
      {
        success: false,
        message: "Sistema bloqueado. Entre em contato com o suporte."
      },
      { status: 403 }
    );
  }

  const panelUserIndex = (restaurant.panelUsers ?? []).findIndex(
    (item) => item.email.toLowerCase() === loginEmail
  );
  const panelUser = panelUserIndex >= 0 ? (restaurant.panelUsers ?? [])[panelUserIndex] : null;
  const isOwnerLogin = restaurant.ownerEmail.toLowerCase() === loginEmail;

  if (panelUser && panelUser.status !== "Ativo") {
    await appendAuditLog(store, {
      request,
      action: "auth.master.login.blocked_user_inactive",
      targetType: "restaurant_panel_user",
      targetId: panelUser.id,
      actor: { actorType: "anonymous", actorId: "anonymous", actorName: loginEmail }
    });
    await writeStore(store);
    return NextResponse.json({ success: false, message: "Usuario do painel inativo." }, { status: 403 });
  }

  const passwordCheck = await verifyPassword(
    parsed.data.password,
    isOwnerLogin ? restaurant.ownerPassword : panelUser?.password ?? ""
  );
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
    if (isOwnerLogin) {
    store.restaurants[index] = {
      ...restaurant,
      ownerPassword: await hashPassword(parsed.data.password)
    };
    } else if (panelUser && panelUserIndex >= 0) {
      const updatedPanelUsers = [...(restaurant.panelUsers ?? [])];
      updatedPanelUsers[panelUserIndex] = {
        ...panelUser,
        password: await hashPassword(parsed.data.password)
      };
      store.restaurants[index] = {
        ...restaurant,
        panelUsers: updatedPanelUsers
      };
    }
  }
  const masterPermissions: PlanMasterTab[] = isOwnerLogin
    ? [
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
      ]
    : ((panelUser?.permissions ?? []) as PlanMasterTab[]);

  if (!isOwnerLogin && panelUser && panelUserIndex >= 0) {
    const updatedPanelUsers = [...(store.restaurants[index].panelUsers ?? [])];
    updatedPanelUsers[panelUserIndex] = {
      ...updatedPanelUsers[panelUserIndex],
      lastAccessAt: new Date().toISOString()
    };
    store.restaurants[index] = {
      ...store.restaurants[index],
      panelUsers: updatedPanelUsers
    };
  }
  await appendAuditLog(store, {
    request,
    action: "auth.master.login.success",
    targetType: "restaurant",
    targetId: restaurant.slug,
    actor: {
      actorType: "master",
      actorId: isOwnerLogin ? restaurant.slug : panelUser?.id ?? restaurant.slug,
      actorName: isOwnerLogin ? restaurant.ownerEmail : panelUser?.email ?? restaurant.ownerEmail
    },
    metadata: {
      role: isOwnerLogin ? "owner" : panelUser?.role ?? "unknown"
    }
  });
  await writeStore(store);

  const token = await createSessionToken(
    {
      kind: "master",
      restaurantSlug: restaurant.slug,
      email: isOwnerLogin ? restaurant.ownerEmail : panelUser?.email ?? restaurant.ownerEmail,
      userId: isOwnerLogin ? `owner:${restaurant.slug}` : panelUser?.id,
      userName: isOwnerLogin ? restaurant.name : panelUser?.name,
      role: isOwnerLogin ? "owner" : panelUser?.role,
      permissions: masterPermissions,
      isOwner: isOwnerLogin
    },
    60 * 60 * 12
  );
  registerActiveSession(store, request, token, {
    kind: "master",
    restaurantSlug: restaurant.slug,
    email: isOwnerLogin ? restaurant.ownerEmail : panelUser?.email ?? restaurant.ownerEmail,
    userId: isOwnerLogin ? `owner:${restaurant.slug}` : panelUser?.id,
    userName: isOwnerLogin ? restaurant.name : panelUser?.name,
    role: isOwnerLogin ? "owner" : panelUser?.role,
    permissions: masterPermissions,
    isOwner: isOwnerLogin,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
  });
  await writeStore(store);

  const response = NextResponse.json({
    success: true,
    user: {
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.name,
      email: isOwnerLogin ? restaurant.ownerEmail : panelUser?.email ?? restaurant.ownerEmail,
      userName: isOwnerLogin ? restaurant.name : panelUser?.name ?? restaurant.name,
      role: isOwnerLogin ? "owner" : panelUser?.role ?? "owner",
      permissions: masterPermissions,
      isOwner: isOwnerLogin
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
