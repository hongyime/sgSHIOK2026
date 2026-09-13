import { NextRequest, NextResponse } from "next/server";
import { ONEMAP_NO_STORE_HEADERS, OneMapRequestEnded, withOneMapDeadline } from "../onemap-deadline";
import {
  checkThrottle,
  expireOneMapTokenForRetry,
  getOneMapToken,
  parseClientIp,
  type ThrottleRecord,
} from "../onemap";

// Simple in-memory rate limiting map: IP -> { count, windowStart }
const ipThrottleMap = new Map<string, ThrottleRecord>();
const MAX_REQ_PER_MINUTE = 30;
const SEARCH_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=604800",
  "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
  "Vercel-CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
};
const CLIENT_ERROR_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300",
  "CDN-Cache-Control": "public, s-maxage=300",
  "Vercel-CDN-Cache-Control": "public, s-maxage=300",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchVal = searchParams.get("searchVal");

  if (!searchVal) {
    return NextResponse.json(
      { error: "Missing searchVal query parameter" },
      { status: 400, headers: CLIENT_ERROR_CACHE_HEADERS }
    );
  }

  const throttle = checkThrottle(ipThrottleMap, parseClientIp(request.headers), MAX_REQ_PER_MINUTE);
  if (throttle.limited) {
    return NextResponse.json(
      { error: "Too Many Requests. Rate limit exceeded (30 req/min)." },
      { status: 429, headers: { ...ONEMAP_NO_STORE_HEADERS, "Retry-After": "60" } }
    );
  }

  const searchUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
    searchVal
  )}&returnGeom=Y&getAddrDetails=Y`;

  try {
    return await withOneMapDeadline(request.signal, (signal) => querySearch(searchUrl, signal));
  } catch (err) {
    if (err instanceof OneMapRequestEnded) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status, headers: ONEMAP_NO_STORE_HEADERS });
    }
    console.error("Error proxying OneMap search:", err);
    return NextResponse.json({ error: "Failed to query OneMap search API" }, { status: 500, headers: ONEMAP_NO_STORE_HEADERS });
  }
}

async function querySearch(searchUrl: string, signal: AbortSignal) {
  const token = await getOneMapToken("search", signal);
  signal.throwIfAborted();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  let response = await fetch(searchUrl, { headers, signal });
  signal.throwIfAborted();

  // Handle token 401 expiry
  if (response.status === 401 && token) {
    expireOneMapTokenForRetry();
    void response.body?.cancel().catch(() => {});
    const newToken = await getOneMapToken("search retry", signal);
    signal.throwIfAborted();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(searchUrl, { headers, signal });
      signal.throwIfAborted();
    }
  }

  if (!response.ok) {
    void response.body?.cancel().catch(() => {});
    return NextResponse.json(
      { error: `OneMap upstream error: ${response.statusText}` },
      { status: response.status, headers: ONEMAP_NO_STORE_HEADERS }
    );
  }

  const data = await response.json();
  signal.throwIfAborted();
  const results = (data.results || []).slice(0, 5);

  return NextResponse.json(
    {
      found: data.found || 0,
      results,
    },
    { headers: SEARCH_CACHE_HEADERS }
  );
}
