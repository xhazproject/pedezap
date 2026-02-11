import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";

export async function GET() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") {
    return NextResponse.json(
      { success: false, message: "Sessao invalida." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions ?? []
    }
  });
}
