type SessionKind = "admin" | "master";

type SessionPayloadBase = {
  kind: SessionKind;
  exp: number;
  sid?: string;
};

export type AdminSessionPayload = SessionPayloadBase & {
  kind: "admin";
  email: string;
  name: string;
  role?: string;
  permissions?: string[];
};

export type MasterSessionPayload = SessionPayloadBase & {
  kind: "master";
  restaurantSlug: string;
  email: string;
  userId?: string;
  userName?: string;
  role?: string;
  permissions?: string[];
  isOwner?: boolean;
};

export type SessionPayload = AdminSessionPayload | MasterSessionPayload;
type SessionInput = Omit<AdminSessionPayload, "exp"> | Omit<MasterSessionPayload, "exp">;

export const ADMIN_SESSION_COOKIE = "pz_admin_session";
export const MASTER_SESSION_COOKIE = "pz_master_session";

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET || "dev-insecure-session-secret-change-me";
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toBase64Url(input: string) {
  const base64 = bytesToBase64(new TextEncoder().encode(input));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesToBase64Url(bytes: Uint8Array) {
  const base64 = bytesToBase64(bytes);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return new TextDecoder().decode(base64ToBytes(normalized + padding));
}

async function signHmac(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(
  payload: SessionInput,
  ttlSeconds: number
) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  } as SessionPayload;
  const encodedPayload = toBase64Url(JSON.stringify(fullPayload));
  const signature = await signHmac(encodedPayload, getSessionSecret());
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signHmac(encodedPayload, getSessionSecret());
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.kind !== "admin" && payload.kind !== "master") return null;
    return payload;
  } catch {
    return null;
  }
}
