interface RateLimitData {
  count: number;
  reset: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, RateLimitData> | undefined;
}

const store: Map<string, RateLimitData> =
  global.__rateLimitStore || (global.__rateLimitStore = new Map());

export function hitRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.reset <= now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  if (entry.count >= limit) {
    return true;
  }
  entry.count += 1;
  return false;
}
