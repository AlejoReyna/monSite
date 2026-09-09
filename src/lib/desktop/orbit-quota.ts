import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const QUOTA_COOKIE = "orbit_quota_v1";
export const MAX_TURNS = 30;
export const WINDOW_MS = 2.5 * 60 * 60 * 1000;

/** In-memory IP budget (cookie alone is forgeable / insufficient). */
const IP_RATE_WINDOW_MS = 60_000;
const IP_RATE_LIMIT = 30;
const ipHits = new Map<string, { count: number; resetAt: number }>();

export type Quota = { remaining: number; resetAt: number };

function getSecret(): string {
  return (
    process.env.ORBIT_QUOTA_SECRET ||
    process.env.MOONSHOT_API_KEY ||
    process.env.KIMI_API_KEY ||
    "orbit-dev-insecure"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function freshQuota(): Quota {
  return { remaining: MAX_TURNS, resetAt: Date.now() + WINDOW_MS };
}

/** Encode as `base64url(json).hmac` — clients cannot forge remaining without the secret. */
export function encodeQuotaCookie(quota: Quota): string {
  const payload = Buffer.from(JSON.stringify(quota), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * Decode + verify HMAC. Invalid / tampered / expired cookies reset to a fresh
 * server-side quota — never trust the client blob alone.
 */
export function decodeQuotaCookie(raw: string | undefined): Quota {
  if (!raw) return freshQuota();
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return freshQuota();
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!payload || !sig) return freshQuota();

  const expected = sign(payload);
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return freshQuota();
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Quota;
    if (typeof parsed.remaining !== "number" || typeof parsed.resetAt !== "number") {
      return freshQuota();
    }
    if (!Number.isFinite(parsed.remaining) || !Number.isFinite(parsed.resetAt)) {
      return freshQuota();
    }
    if (Date.now() > parsed.resetAt) return freshQuota();
    return {
      remaining: Math.max(0, Math.min(MAX_TURNS, Math.floor(parsed.remaining))),
      resetAt: parsed.resetAt,
    };
  } catch {
    return freshQuota();
  }
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Returns true if the request is allowed under the in-memory IP rate limit. */
export function allowIpTurn(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + IP_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= IP_RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}
