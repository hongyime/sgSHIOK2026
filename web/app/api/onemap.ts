const TOKEN_TTL_MS = 241920 * 1000;
const THROTTLE_WINDOW_MS = 60_000;
const MAX_THROTTLE_KEYS = 2_000;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export interface ThrottleRecord {
  count: number;
  windowStart: number;
  lastSeen: number;
}

export interface ThrottleBucket {
  key: string;
  limited: boolean;
  size: number;
}

export function resetOneMapTokenCacheForTest() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

export function parseClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = headers.get("x-forwarded-for");
  const parts = forwardedFor
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts?.at(-1) ?? "127.0.0.1";
}

export function checkThrottle(
  ipThrottleMap: Map<string, ThrottleRecord>,
  ip: string,
  maxRequestsPerMinute: number,
  now = Date.now()
): ThrottleBucket {
  for (const [key, record] of ipThrottleMap) {
    if (now - record.windowStart >= THROTTLE_WINDOW_MS) {
      ipThrottleMap.delete(key);
    }
  }

  while (ipThrottleMap.size >= MAX_THROTTLE_KEYS) {
    let oldestKey: string | null = null;
    let oldestSeen = Number.POSITIVE_INFINITY;
    for (const [key, record] of ipThrottleMap) {
      if (record.lastSeen < oldestSeen) {
        oldestSeen = record.lastSeen;
        oldestKey = key;
      }
    }
    if (!oldestKey) break;
    ipThrottleMap.delete(oldestKey);
  }

  const throttleRecord = ipThrottleMap.get(ip);
  if (!throttleRecord) {
    ipThrottleMap.set(ip, { count: 1, windowStart: now, lastSeen: now });
    return { key: ip, limited: false, size: ipThrottleMap.size };
  }

  throttleRecord.lastSeen = now;
  if (now - throttleRecord.windowStart >= THROTTLE_WINDOW_MS) {
    ipThrottleMap.set(ip, { count: 1, windowStart: now, lastSeen: now });
    return { key: ip, limited: false, size: ipThrottleMap.size };
  }

  if (throttleRecord.count >= maxRequestsPerMinute) {
    return { key: ip, limited: true, size: ipThrottleMap.size };
  }

  throttleRecord.count += 1;
  return { key: ip, limited: false, size: ipThrottleMap.size };
}

export async function getOneMapToken(context: string): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.ONEMAP_EMAIL;
  const password = process.env.ONEMAP_PASSWORD;

  if (!email || !password) {
    if (context === "search") {
      console.warn("OneMap credentials not set; proceeding with unauthenticated search.");
    }
    return null;
  }

  try {
    const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      console.error(`OneMap auth failed for ${context}:`, res.status);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
      return cachedToken;
    }
  } catch (err) {
    console.error(`Error fetching OneMap token for ${context}:`, err);
  }

  return null;
}

export function expireOneMapTokenForRetry() {
  cachedToken = null;
  tokenExpiresAt = 0;
}
