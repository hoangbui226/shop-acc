/**
 * In-memory rate limit for registration by IP.
 * Limits: 3 per hour, 5 per day per IP.
 * Resets and cleanup run on each check.
 */

const LIMIT_PER_HOUR = 3;
const LIMIT_PER_DAY = 5;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type Entry = {
  hour: { count: number; resetAt: number };
  day: { count: number; resetAt: number };
};

const store = new Map<string, Entry>();

function getOrCreate(ip: string, now: number): Entry {
  let e = store.get(ip);
  if (!e) {
    e = {
      hour: { count: 0, resetAt: now + HOUR_MS },
      day: { count: 0, resetAt: now + DAY_MS },
    };
    store.set(ip, e);
  }
  return e;
}

function maybeReset(ip: string, now: number): void {
  const e = store.get(ip);
  if (!e) return;
  if (now >= e.hour.resetAt) {
    e.hour = { count: 0, resetAt: now + HOUR_MS };
  }
  if (now >= e.day.resetAt) {
    e.day = { count: 0, resetAt: now + DAY_MS };
  }
}

/** Remove entries whose day window has passed to avoid unbounded growth. */
function cleanup(now: number): void {
  for (const [key, e] of store.entries()) {
    if (now >= e.day.resetAt && e.hour.count === 0 && e.day.count === 0) {
      store.delete(key);
    }
  }
}

/**
 * Returns null if allowed, or an error message if rate limited.
 * Call this before creating a user; call recordSuccess(ip) after successful creation.
 */
export function checkRegisterRateLimit(ip: string): string | null {
  if (!ip || ip === "unknown") return null; // no limit if we can't identify IP
  const now = Date.now();
  maybeReset(ip, now);
  cleanup(now);
  const e = getOrCreate(ip, now);
  if (e.hour.count >= LIMIT_PER_HOUR) {
    return "Quá nhiều lần đăng ký từ IP của bạn. Vui lòng thử lại sau 1 giờ.";
  }
  if (e.day.count >= LIMIT_PER_DAY) {
    return "Đã đạt giới hạn đăng ký trong ngày từ IP của bạn. Vui lòng thử lại vào ngày mai.";
  }
  return null;
}

/** Call after a successful registration to increment the counter for this IP. */
export function recordRegisterSuccess(ip: string): void {
  if (!ip || ip === "unknown") return;
  const now = Date.now();
  const e = getOrCreate(ip, now);
  maybeReset(ip, now);
  e.hour.count += 1;
  e.day.count += 1;
}
