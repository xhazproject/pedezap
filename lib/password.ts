import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PREFIX = "scrypt$";

export function isPasswordHashed(password: string) {
  return password.startsWith(PREFIX);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${PREFIX}${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  inputPassword: string,
  storedPassword: string
) {
  if (!isPasswordHashed(storedPassword)) {
    return {
      valid: inputPassword === storedPassword,
      needsUpgrade: inputPassword === storedPassword
    };
  }

  const [, salt, hashHex] = storedPassword.split("$");
  if (!salt || !hashHex) {
    return { valid: false, needsUpgrade: false };
  }

  const derived = (await scrypt(inputPassword, salt, 64)) as Buffer;
  const stored = Buffer.from(hashHex, "hex");
  if (stored.length !== derived.length) {
    return { valid: false, needsUpgrade: false };
  }

  return {
    valid: timingSafeEqual(stored, derived),
    needsUpgrade: false
  };
}
