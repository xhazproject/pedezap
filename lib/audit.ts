import { AppStore } from "@/lib/store-data";
import { makeId, readStore, writeStore } from "@/lib/store";
import { verifySessionToken } from "@/lib/auth-session";

type Actor = {
  actorType: "admin" | "master" | "system" | "anonymous";
  actorId: string;
  actorName: string;
};

type AuditInput = {
  request?: Request;
  action: string;
  targetType: string;
  targetId: string;
  actor?: Actor;
  metadata?: Record<string, string | number | boolean | null>;
};

function parseCookieHeader(cookieHeader: string | null) {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const chunks = cookieHeader.split(";");
  for (const chunk of chunks) {
    const [rawKey, ...rawValue] = chunk.trim().split("=");
    if (!rawKey) continue;
    result[rawKey] = decodeURIComponent(rawValue.join("=") || "");
  }
  return result;
}

export function getClientIp(request?: Request) {
  if (!request) return "unknown";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function resolveActorFromRequest(request?: Request): Promise<Actor> {
  if (!request) {
    return { actorType: "system", actorId: "system", actorName: "system" };
  }
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const adminToken = cookies.pz_admin_session;
  if (adminToken) {
    const payload = await verifySessionToken(adminToken);
    if (payload && payload.kind === "admin") {
      return {
        actorType: "admin",
        actorId: payload.email,
        actorName: payload.name || payload.email
      };
    }
  }

  const masterToken = cookies.pz_master_session;
  if (masterToken) {
    const payload = await verifySessionToken(masterToken);
    if (payload && payload.kind === "master") {
      return {
        actorType: "master",
        actorId: payload.restaurantSlug,
        actorName: payload.email
      };
    }
  }

  return { actorType: "anonymous", actorId: "anonymous", actorName: "anonymous" };
}

export async function appendAuditLog(store: AppStore, input: AuditInput) {
  const actor = input.actor ?? (await resolveActorFromRequest(input.request));
  store.auditLogs = store.auditLogs ?? [];
  store.auditLogs.unshift({
    id: makeId("audit"),
    createdAt: new Date().toISOString(),
    action: input.action,
    ip: getClientIp(input.request),
    actorType: actor.actorType,
    actorId: actor.actorId,
    actorName: actor.actorName,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata
  });
  if (store.auditLogs.length > 3000) {
    store.auditLogs = store.auditLogs.slice(0, 3000);
  }
}

export async function writeAuditLog(input: AuditInput) {
  const store = await readStore();
  await appendAuditLog(store, input);
  await writeStore(store);
}
