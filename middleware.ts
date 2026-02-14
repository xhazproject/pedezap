import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  MASTER_SESSION_COOKIE,
  verifySessionToken
} from "@/lib/auth-session";

function isPublicPath(pathname: string) {
  return (
    pathname === "/awserver/login" ||
    pathname === "/master/login" ||
    pathname === "/master/reset-password" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout") ||
    pathname.startsWith("/api/master/login") ||
    pathname.startsWith("/api/master/logout") ||
    pathname.startsWith("/api/master/password-reset") ||
    pathname.startsWith("/api/webhooks/abacatepay")
  );
}

function getAdminApiRequiredPermission(pathname: string) {
  if (pathname.startsWith("/api/admin/stats")) return "dashboard";
  if (pathname.startsWith("/api/admin/restaurants")) return "restaurants";
  if (pathname.startsWith("/api/admin/leads")) return "leads";
  if (pathname.startsWith("/api/admin/finance")) return "financial";
  if (pathname.startsWith("/api/admin/plans")) return "financial";
  if (pathname.startsWith("/api/admin/payments")) return "payments";
  if (pathname.startsWith("/api/admin/abacatepay")) return "payments";
  if (pathname.startsWith("/api/admin/team")) return "team";
  if (pathname.startsWith("/api/admin/roles")) return "team";
  if (pathname.startsWith("/api/admin/support")) return "support";
  if (pathname.startsWith("/api/admin/settings")) return "settings";
  if (pathname.startsWith("/api/admin/security")) return "security";
  return null;
}

function unauthorizedResponse(request: NextRequest, loginPath: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, message: "Nao autenticado." },
      { status: 401 }
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const isSupportTicketsApi =
    pathname.startsWith("/api/admin/support/tickets");

  if (isSupportTicketsApi) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const adminPayload = await verifySessionToken(adminToken);
    if (adminPayload && adminPayload.kind === "admin") {
      const hasPermission =
        adminPayload.role === "Admin Master" ||
        (adminPayload.permissions ?? []).includes("support");
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: "Sem permissao para esta acao." },
          { status: 403 }
        );
      }
      return NextResponse.next();
    }

    const masterToken = request.cookies.get(MASTER_SESSION_COOKIE)?.value;
    const masterPayload = await verifySessionToken(masterToken);
    if (masterPayload && masterPayload.kind === "master") {
      return NextResponse.next();
    }

    return unauthorizedResponse(request, "/awserver/login");
  }

  const needsAdminSession =
    pathname.startsWith("/awserver") || pathname.startsWith("/api/admin");
  const needsMasterSession =
    pathname.startsWith("/master") || pathname.startsWith("/api/master");

  if (needsAdminSession) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const payload = await verifySessionToken(token);
    if (!payload || payload.kind !== "admin") {
      return unauthorizedResponse(request, "/awserver/login");
    }

    const requiredPermission = getAdminApiRequiredPermission(pathname);
    if (requiredPermission && pathname.startsWith("/api/admin")) {
      const hasPermission =
        payload.role === "Admin Master" ||
        (payload.permissions ?? []).includes(requiredPermission);
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: "Sem permissao para esta acao." },
          { status: 403 }
        );
      }
    }
  }

  if (needsMasterSession) {
    const token = request.cookies.get(MASTER_SESSION_COOKIE)?.value;
    const payload = await verifySessionToken(token);
    if (!payload || payload.kind !== "master") {
      return unauthorizedResponse(request, "/master/login");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/awserver/:path*", "/master/:path*", "/api/admin/:path*", "/api/master/:path*"]
};
