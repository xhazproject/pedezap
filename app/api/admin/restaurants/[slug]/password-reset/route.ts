import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { checkRateLimit } from "@/lib/rate-limit";
import { appendAuditLog, writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rate = checkRateLimit({
    key: `admin-reset-link:${ip}:${params.slug}`,
    limit: 10,
    windowMs: 10 * 60 * 1000
  });
  if (!rate.allowed) {
    await writeAuditLog({
      request,
      action: "admin.restaurant.password_reset_link.rate_limited",
      targetType: "restaurant",
      targetId: params.slug,
      metadata: { retryAfterSec: rate.retryAfterSec }
    });
    return NextResponse.json(
      { success: false, message: `Muitas tentativas. Aguarde ${rate.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);

  if (index === -1) {
    await appendAuditLog(store, {
      request,
      action: "admin.restaurant.password_reset_link.not_found",
      targetType: "restaurant",
      targetId: params.slug
    });
    await writeStore(store);
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

  store.restaurants[index] = {
    ...store.restaurants[index],
    passwordResetToken: token,
    passwordResetExpiresAt: expiresAt
  };

  await appendAuditLog(store, {
    request,
    action: "admin.restaurant.password_reset_link.created",
    targetType: "restaurant",
    targetId: store.restaurants[index].slug,
    metadata: { expiresAt }
  });

  await writeStore(store);

  return NextResponse.json({
    success: true,
    slug: store.restaurants[index].slug,
    token,
    expiresAt,
    ownerEmail: store.restaurants[index].ownerEmail,
    whatsapp: store.restaurants[index].whatsapp,
    restaurantName: store.restaurants[index].name
  });
}
