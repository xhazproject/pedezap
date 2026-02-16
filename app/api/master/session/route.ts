import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { isRestaurantBlocked, readStore } from "@/lib/store";

export async function GET() {
  const token = cookies().get(MASTER_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "master") {
    return NextResponse.json(
      { success: false, message: "Sessao invalida." },
      { status: 401 }
    );
  }

  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === payload.restaurantSlug);
  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (isRestaurantBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Sistema bloqueado. Entre em contato com o suporte." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      restaurantSlug: payload.restaurantSlug,
      email: payload.email
    }
  });
}
