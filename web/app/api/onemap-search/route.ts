import { NextRequest, NextResponse } from "next/server";
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
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const token = await getOneMapToken("search");
  const searchUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
    searchVal
  )}&returnGeom=Y&getAddrDetails=Y`;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(searchUrl, { headers });

    // Handle token 401 expiry
    if (response.status === 401 && token) {
      expireOneMapTokenForRetry();
      const newToken = await getOneMapToken("search retry");
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(searchUrl, { headers });
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `OneMap upstream error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const results = (data.results || []).slice(0, 5);

    return NextResponse.json(
      {
        found: data.found || 0,
        results,
      },
      { headers: SEARCH_CACHE_HEADERS }
    );
  } catch (err) {
    console.error("Error proxying OneMap search:", err);
    return NextResponse.json({ error: "Failed to query OneMap search API" }, { status: 500 });
  }
}
