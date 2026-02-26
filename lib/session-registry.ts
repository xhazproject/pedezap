import { createHash } from "node:crypto";
import { AppStore, ActiveSession } from "@/lib/store-data";
import { SessionPayload } from "@/lib/auth-session";
import { makeId } from "@/lib/store";

function tokenSessionId(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getIpFromHeaders(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function getUserAgentFromHeaders(request: Request) {
  return request.headers.get("user-agent") || null;
}

export function registerActiveSession(
  store: AppStore,
  request: Request,
  token: string,
  payload: SessionPayload
) {
  const now = new Date();
  const expiresAt = new Date(payload.exp * 1000).toISOString();
  const sessionId = tokenSessionId(token);
  const existingIndex = (store.activeSessions ?? []).findIndex(
    (item) => item.sessionId === sessionId
  );

  const record: ActiveSession = {
    id: existingIndex >= 0 ? store.activeSessions[existingIndex].id : makeId("sess"),
    kind: payload.kind,
    sessionId,
    subjectId: payload.kind === "admin" ? payload.email : payload.restaurantSlug,
    subjectName:
      payload.kind === "admin"
        ? payload.name || payload.email
        : payload.restaurantSlug,
    actorEmail: payload.email,
    restaurantSlug: payload.kind === "master" ? payload.restaurantSlug : undefined,
    role: payload.kind === "admin" ? payload.role ?? null : "Owner",
    ip: getIpFromHeaders(request),
    userAgent: getUserAgentFromHeaders(request),
    createdAt:
      existingIndex >= 0 ? store.activeSessions[existingIndex].createdAt : now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt,
    revokedAt: null
  };

  if (!store.activeSessions) store.activeSessions = [];
  if (existingIndex >= 0) {
    store.activeSessions[existingIndex] = record;
  } else {
    store.activeSessions.unshift(record);
  }

  cleanupActiveSessions(store);
}

export function touchActiveSession(store: AppStore, token: string) {
  const sessionId = tokenSessionId(token);
  const item = (store.activeSessions ?? []).find((entry) => entry.sessionId === sessionId);
  if (!item || item.revokedAt) return false;
  item.lastSeenAt = new Date().toISOString();
  return true;
}

export function revokeActiveSessionByToken(store: AppStore, token: string) {
  const sessionId = tokenSessionId(token);
  return revokeActiveSessionBySessionHash(store, sessionId);
}

export function revokeActiveSessionById(store: AppStore, id: string) {
  const item = (store.activeSessions ?? []).find((entry) => entry.id === id);
  if (!item || item.revokedAt) return false;
  item.revokedAt = new Date().toISOString();
  return true;
}

function revokeActiveSessionBySessionHash(store: AppStore, sessionId: string) {
  const item = (store.activeSessions ?? []).find((entry) => entry.sessionId === sessionId);
  if (!item || item.revokedAt) return false;
  item.revokedAt = new Date().toISOString();
  return true;
}

export function isActiveSessionValid(store: AppStore, token: string) {
  const sessionId = tokenSessionId(token);
  const item = (store.activeSessions ?? []).find((entry) => entry.sessionId === sessionId);
  if (!item) {
    // Compatibilidade com sessoes antigas sem registro.
    return true;
  }
  if (item.revokedAt) return false;
  if (new Date(item.expiresAt).getTime() < Date.now()) return false;
  return true;
}

export function cleanupActiveSessions(store: AppStore) {
  const now = Date.now();
  store.activeSessions = (store.activeSessions ?? [])
    .filter((item) => {
      const expired = new Date(item.expiresAt).getTime() < now - 24 * 60 * 60 * 1000;
      const revokedLongAgo =
        item.revokedAt && new Date(item.revokedAt).getTime() < now - 7 * 24 * 60 * 60 * 1000;
      return !expired && !revokedLongAgo;
    })
    .slice(0, 2000);
}

export function listVisibleSessions(store: AppStore) {
  cleanupActiveSessions(store);
  return [...(store.activeSessions ?? [])].sort((a, b) =>
    b.lastSeenAt.localeCompare(a.lastSeenAt)
  );
}

