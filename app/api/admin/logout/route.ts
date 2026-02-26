import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-session";
import { readStore, writeStore } from "@/lib/store";
import { revokeActiveSessionByToken } from "@/lib/session-registry";

export async function POST() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    const store = await readStore();
    if (revokeActiveSessionByToken(store, token)) {
      await writeStore(store);
    }
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
