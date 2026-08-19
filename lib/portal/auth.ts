import crypto from "crypto";
import { cookies } from "next/headers";

export type Role = "worker" | "admin";

export type Session = { role: Role; userId: number | null };

export const COOKIE_NAME = "idp_session";
const MAX_AGE = 60 * 60 * 24 * 14;   // 14 days
/**
 * "Stay signed in" means stay signed in — ten years, which is as close to
 * forever as a cookie gets. Signing out still ends it immediately.
 */
const REMEMBER_AGE = 60 * 60 * 24 * 365 * 10;

/**
 * Admin password, stored as a SHA-256 hash so no plaintext lives in the repo.
 * Override with ADMIN_PASSWORD in Vercel and the env value wins.
 */
const ADMIN_HASH = "b750a9185b0b7c8c9fb6b791fb4a250ec5c82bb46a103b3c981ae3bc6d3ad556";

/** Shared team password, required to create a worker account. Override: WORKER_PASSWORD. */
const TEAM_HASH = "de7d1b721a1e0632b7cf04edf5032c8ecffa9f9a08492152b926f1a5a7e765d7";

const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function checkAdminPassword(password: string): boolean {
  if (!password) return false;
  const expected = process.env.ADMIN_PASSWORD ? sha256(process.env.ADMIN_PASSWORD) : ADMIN_HASH;
  return safeEqual(sha256(password), expected);
}

/** Gate for creating a worker account, so only the team can sign up. */
export function checkTeamPassword(password: string): boolean {
  if (!password) return false;
  const expected = process.env.WORKER_PASSWORD ? sha256(process.env.WORKER_PASSWORD) : TEAM_HASH;
  return safeEqual(sha256(password), expected);
}

/**
 * The password everyone starts on: their first name, capitalised.
 *
 * Accounts are made for people rather than signed up for, so there has to be
 * something to tell them. It only works until they pick their own in settings,
 * and it's deliberately easy to say out loud — treat it as a way in, not as
 * security. Compared without case so "dilan" gets them in as well as "Dilan".
 */
export function defaultPasswordFor(fullName: string): string {
  const first = (fullName || "").trim().split(/\s+/)[0] || "";
  return first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : "";
}

export function isDefaultPassword(fullName: string, password: string): boolean {
  const expected = defaultPasswordFor(fullName);
  return Boolean(expected) && password.trim().toLowerCase() === expected.toLowerCase();
}

/* ------------------------- per-user password hashing ----------------------- */
/** scrypt with a random per-user salt. No complexity rules — any password works. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
    return safeEqual(candidate, hash);
  } catch {
    return false;
  }
}

/* -------------------------------- sessions -------------------------------- */

function secret(): string {
  return process.env.PORTAL_SECRET || "infinite-distributions-portal-fallback-secret";
}

/** token = role.userId.exp.hmac */
export function createToken(role: Role, userId: number | null, remember = false): string {
  // The token has to outlive its cookie, or "remember me" expires early anyway.
  const exp = Date.now() + (remember ? REMEMBER_AGE : MAX_AGE) * 1000;
  const body = `${role}.${userId ?? 0}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined): Session | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [role, uid, exp, sig] = parts;
  if (role !== "worker" && role !== "admin") return null;
  const expected = crypto.createHmac("sha256", secret()).update(`${role}.${uid}.${exp}`).digest("hex");
  if (!safeEqual(sig, expected)) return null;
  if (Number(exp) < Date.now()) return null;
  const userId = Number(uid);
  return { role, userId: userId > 0 ? userId : null };
}

export function sessionCookie(token: string, remember = false) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: remember ? REMEMBER_AGE : MAX_AGE,
  };
}

export function currentSession(): Session | null {
  return verifyToken(cookies().get(COOKIE_NAME)?.value);
}

export function isAdmin(): boolean {
  return currentSession()?.role === "admin";
}

/** Any signed-in user (worker or admin). */
export function isSignedIn(): boolean {
  return currentSession() !== null;
}
