import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MASTER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";

export async function GET() {
  const token = cookies().get(MASTER_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "master") {
    return NextResponse.json(
      { success: false, message: "Sessao invalida." },
      { status: 401 }
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
