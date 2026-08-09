import crypto from "crypto";
import { cookies } from "next/headers";

export type Role = "worker" | "admin";

export const COOKIE_NAME = "idp_session";
const MAX_AGE = 60 * 60 * 12; // 12 hours

/**
 * Passwords are stored as SHA-256 hashes so no plaintext lives in the repo.
 * Override either one in Vercel → Settings → Environment Variables
 * (WORKER_PASSWORD / ADMIN_PASSWORD) and the env value wins.
 */
const DEFAULT_HASHES: Record<Role, string> = {
  worker: "e1758189e385d0df7e28dcd943bdc19194746b61501c5b2fe4cb99b2356386ab",
  admin: "b750a9185b0b7c8c9fb6b791fb4a250ec5c82bb46a103b3c981ae3bc6d3ad556",
};

const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

function expectedHash(role: Role): string {
  const override = role === "admin" ? process.env.ADMIN_PASSWORD : process.env.WORKER_PASSWORD;
  return override ? sha256(override) : DEFAULT_HASHES[role];
}

/** Constant-time compare so timing can't be used to guess the password. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(role: Role, password: string): boolean {
  if (!password) return false;
  return safeEqual(sha256(password), expectedHash(role));
}

function secret(): string {
  return process.env.PORTAL_SECRET || "infinite-distributions-portal-fallback-secret";
}

/** token = role.expiry.hmac(role.expiry) */
export function createToken(role: Role): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const body = `${role}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined): Role | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, exp, sig] = parts;
  if (role !== "worker" && role !== "admin") return null;
  const expected = crypto.createHmac("sha256", secret()).update(`${role}.${exp}`).digest("hex");
  if (!safeEqual(sig, expected)) return null;
  if (Number(exp) < Date.now()) return null;
  return role;
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

/** Role of the caller, read from the signed session cookie. */
export function currentRole(): Role | null {
  return verifyToken(cookies().get(COOKIE_NAME)?.value);
}

/** Admins can reach worker routes too. */
export function hasAccess(required: Role): boolean {
  const role = currentRole();
  if (!role) return false;
  return role === "admin" || role === required;
}
