import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string) {
  const normalized = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateTotpSecret(lengthBytes = 20) {
  return base32Encode(randomBytes(lengthBytes));
}

function hotp(secretBase32: string, counter: number, digits = 6) {
  const secret = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const mod = 10 ** digits;
  return String(code % mod).padStart(digits, "0");
}

export function verifyTotpCode(
  secretBase32: string,
  rawCode: string,
  options?: { window?: number; stepSeconds?: number; digits?: number; at?: number }
) {
  const digits = options?.digits ?? 6;
  const stepSeconds = options?.stepSeconds ?? 30;
  const window = options?.window ?? 1;
  const now = options?.at ?? Date.now();
  const counter = Math.floor(now / 1000 / stepSeconds);
  const code = (rawCode || "").replace(/\D/g, "");
  if (code.length !== digits) return false;

  for (let drift = -window; drift <= window; drift += 1) {
    const expected = hotp(secretBase32, counter + drift, digits);
    const a = Buffer.from(expected);
    const b = Buffer.from(code);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export function buildTotpOtpauthUri(params: {
  secret: string;
  accountName: string;
  issuer: string;
}) {
  const issuer = params.issuer.trim();
  const account = params.accountName.trim();
  const label = encodeURIComponent(`${issuer}:${account}`);
  const qs = new URLSearchParams({
    secret: params.secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30"
  });
  return `otpauth://totp/${label}?${qs.toString()}`;
}
