P4 security, rank payload, and bus saturation verification

Command: git log --oneline -6
Output:
```text
8ad91c4 fix: repair rank record type guard
c8e39d1 test: add bus saturation analysis
e321c07 fix: defer rank payload loading
1ea9f26 fix: harden onemap api routes
9d66d97 docs: record bus zero investigation correction
4c26254 test: add bus defect investigation handback
```

Command: git diff --stat 4c26254..HEAD
Output:
```text
 decisions.md                                       |   8 +
 .../P4-strand3-bus-saturation-analysis.txt         | Bin 0 -> 9163 bytes
 scripts/analysis/p4_bus_saturation_analysis.py     | 538 +++++++++++++++++++++
 web/app/api/onemap-route/route.ts                  |  83 +---
 web/app/api/onemap-search/route.ts                 |  85 +---
 web/app/api/onemap.ts                              | 126 +++++
 web/app/page.module.css                            |  12 +
 web/app/page.tsx                                   | 122 +++--
 web/lib/__tests__/accessibility-render.test.tsx    |   3 +
 web/lib/__tests__/onemap-api-security.test.ts      |  61 +++
 web/lib/__tests__/rank-payload.test.ts             |  40 ++
 web/lib/data.ts                                    |  27 ++
 web/lib/subscore-ranking.ts                        |  14 +-
 web/next.config.js                                 |  25 +
 14 files changed, 967 insertions(+), 177 deletions(-)
```

Command: git diff 4c26254..HEAD -- pipeline/
Output:
```text
```

Command: npm --prefix web test -- onemap-api-security
Output:
```text
 RUN  v4.1.10 C:/shiok/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  09:08:08
   Duration  295ms (transform 37ms, setup 0ms, import 98ms, tests 47ms, environment 0ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-api-security
```

Command: temporarily restored old route files from 4c26254, then npm --prefix web test -- onemap-api-security
Output:
```text
 RUN  v4.1.10 C:/shiok/web

 ❯ lib/__tests__/onemap-api-security.test.ts (3 tests | 1 failed) 49ms
     × rate limits spoofed forwarded prefixes at the actual search route 15ms

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  09:08:01
   Duration  294ms (transform 38ms, setup 0ms, import 92ms, tests 49ms, environment 0ms)

AssertionError: expected 200 to be 429 // Object.is equality

- Expected
+ Received

- 429
+ 200
```

Command: rg -n "console\.|catch \(|error:" web\app\api\onemap-search web\app\api\onemap-route web\app\api\onemap.ts
Output:
```text
web\app\api\onemap.ts:93:      console.warn("OneMap credentials not set; proceeding with unauthenticated search.");
web\app\api\onemap.ts:106:      console.error(`OneMap auth failed for ${context}:`, res.status);
web\app\api\onemap.ts:116:  } catch (err) {
web\app\api\onemap.ts:117:    console.error(`Error fetching OneMap token for ${context}:`, err);
web\app\api\onemap-route\route.ts:30:      { ok: false, error: "Missing required coordinate parameters (startLat, startLng, endLat, endLng)" },
web\app\api\onemap-route\route.ts:47:      { ok: false, error: "Coordinates must be valid numbers" },
web\app\api\onemap-route\route.ts:64:      { ok: false, error: "Coordinates outside Singapore bounding box" },
web\app\api\onemap-route\route.ts:72:      { ok: false, error: "Too Many Requests. Rate limit exceeded (60 req/min)." },
web\app\api\onemap-route\route.ts:100:        { ok: false, error: `OneMap routing upstream error: ${response.statusText}` },
web\app\api\onemap-route\route.ts:108:        { ok: false, error: data.status_message || "No route geometry returned by OneMap" },
web\app\api\onemap-route\route.ts:123:  } catch (err) {
web\app\api\onemap-route\route.ts:124:    console.error("Error proxying OneMap route:", err);
web\app\api\onemap-route\route.ts:125:    return NextResponse.json({ ok: false, error: "Failed to query OneMap route API" }, { status: 500 });
web\app\api\onemap-search\route.ts:19:    return NextResponse.json({ error: "Missing searchVal query parameter" }, { status: 400 });
web\app\api\onemap-search\route.ts:25:      { error: "Too Many Requests. Rate limit exceeded (30 req/min)." },
web\app\api\onemap-search\route.ts:55:        { error: `OneMap upstream error: ${response.statusText}` },
web\app\api\onemap-search\route.ts:67:  } catch (err) {
web\app\api\onemap-search\route.ts:68:    console.error("Error proxying OneMap search:", err);
web\app\api\onemap-search\route.ts:69:    return NextResponse.json({ error: "Failed to query OneMap search API" }, { status: 500 });
```

Command: rg -n "ONEMAP_PASSWORD|access_token|Authorization|Bearer|cachedToken|tokenExpiresAt" web\app\api
Output:
```text
web\app\api\onemap.ts:5:let cachedToken: string | null = null;
web\app\api\onemap.ts:6:let tokenExpiresAt = 0;
web\app\api\onemap.ts:21:  cachedToken = null;
web\app\api\onemap.ts:22:  tokenExpiresAt = 0;
web\app\api\onemap.ts:84:  if (cachedToken && now < tokenExpiresAt) {
web\app\api\onemap.ts:85:    return cachedToken;
web\app\api\onemap.ts:89:  const password = process.env.ONEMAP_PASSWORD;
web\app\api\onemap.ts:111:    if (data.access_token) {
web\app\api\onemap.ts:112:      cachedToken = data.access_token;
web\app\api\onemap.ts:113:      tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
web\app\api\onemap.ts:114:      return cachedToken;
web\app\api\onemap.ts:124:  cachedToken = null;
web\app\api\onemap.ts:125:  tokenExpiresAt = 0;
web\app\api\onemap-route\route.ts:82:    headers["Authorization"] = `Bearer ${token}`;
web\app\api\onemap-route\route.ts:93:        headers["Authorization"] = `Bearer ${newToken}`;
web\app\api\onemap-search\route.ts:37:    headers["Authorization"] = `Bearer ${token}`;
web\app\api\onemap-search\route.ts:48:        headers["Authorization"] = `Bearer ${newToken}`;
```

Command: BEDOK rank-payload measurement
Output:
```text
method: local static BEDOK score-shard read plus Node JSON.parse/projection timing; viewport does not affect file payload; CPU throttling not applied in this file-level reproduction
postal: 460001 (BEDOK area measurement)
bedok_shards: 36
bedok_records: 15570
before_eager_initial_search_transferred_raw_bytes: 184826667 (176.264 MiB)
before_eager_initial_search_parsed_json_bytes: 126626097 (120.760 MiB)
before_eager_initial_search_retained_state_bytes: 126626097 (120.760 MiB)
before_eager_initial_search_parse_blocking_ms: 347.218
after_closed_panel_initial_search_transferred_raw_bytes: 0 (0.000 MiB)
after_closed_panel_initial_search_parsed_json_bytes: 0 (0.000 MiB)
after_closed_panel_initial_search_retained_state_bytes: 0 (0.000 MiB)
after_closed_panel_initial_search_parse_blocking_ms: 0.000
after_open_panel_transferred_raw_bytes: 184826667 (176.264 MiB)
after_open_panel_parsed_json_bytes: 126626097 (120.760 MiB)
after_open_panel_retained_compact_rank_bytes: 1610515 (1.536 MiB)
after_open_panel_parse_plus_projection_blocking_ms: 353.392
retained_state_reduction_bytes_when_open: 125015582 (119.224 MiB)
retained_state_reduction_pct_when_open: 98.728%
```

Command: node -e "const c=require('./web/next.config.js'); c.headers().then(h=>console.log(JSON.stringify(h.find(x=>x.source==='/:path*').headers,null,2)))"
Output:
```json
[
  {
    "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg; font-src 'self' data:; connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  },
  {
    "key": "X-Content-Type-Options",
    "value": "nosniff"
  },
  {
    "key": "Referrer-Policy",
    "value": "strict-origin-when-cross-origin"
  }
]
```

Command: Chrome CDP 380x780 postal 560231 map attribution check against local production server
Output:
```json
{
  "url": "http://localhost:3114/",
  "viewport": {
    "width": 380,
    "height": 780
  },
  "scorePanelPresent": true,
  "mapCanvasPresent": true,
  "mapDebugPresent": true,
  "attributionText": " \nOneMap\n © contributors | \nSingapore Land Authority",
  "logoSrc": "https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png",
  "attributionRect": {
    "x": 104,
    "y": 752,
    "width": 268,
    "height": 24,
    "display": "flex",
    "visibility": "visible",
    "opacity": "1"
  },
  "searchOverlayRect": {
    "x": 10,
    "y": 10,
    "width": 360,
    "height": 555,
    "display": "grid",
    "visibility": "visible",
    "opacity": "1"
  },
  "detailOverlayRect": {
    "x": 10,
    "y": 170,
    "width": 358,
    "height": 359,
    "display": "block",
    "visibility": "visible",
    "opacity": "1"
  },
  "occludedBySearchOverlay": false,
  "occludedByDetailOverlay": false
}
```

Command: Get-NetTCPConnection -LocalPort 3114 -ErrorAction SilentlyContinue
Output:
```text
```

Command: python scripts\analysis\p4_bus_saturation_analysis.py
Output:
```text
See tracked full output in qa/verification/P4-strand3-bus-saturation-analysis.txt.
Key lines:
subscores.bus > 0: 74354/114140 numeric-bus records, 65.143%.
bus exactly 100 among bus-positive records: 55891/74354, 75.169%.
current SCORED bus==100: 42637/95157, 44.807%.
Spearman(service_count, lower expected_wait_min): 0.982070349.
hypothetical-fixed SCORED bus==100: 60359/95157, 63.431%.
Spearman(current totals, drop-bus renormalised): 0.91136309.
Spearman(hypothetical-fixed totals, drop-bus renormalised): 0.926919106.
```

Command: npm --prefix web test
Output:
```text
 RUN  v4.1.10 C:/shiok/web


 Test Files  20 passed (20)
      Tests  98 passed (98)
   Start at  09:14:32
   Duration  1.16s (transform 1.65s, setup 0ms, import 2.57s, tests 898ms, environment 4ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

Command: npm --prefix web run build
Output:
```text
using local data bundle C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.js took 20ms

  Creating an optimized production build ...
✓ Compiled successfully in 502ms
  Running TypeScript ...
  Finished TypeScript in 480ms ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/6) ...
  Generating static pages using 7 workers (1/6) 
  Generating static pages using 7 workers (2/6) 
  Generating static pages using 7 workers (4/6) 
✓ Generating static pages using 7 workers (6/6) in 786ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/onemap-route
├ ƒ /api/onemap-search
└ ○ /icon.svg


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

npm notice run shiok-web@0.1.0 build
npm notice run node scripts/ensure-data-bundle.mjs && next build
```

Command: uv run python run.py test
Output:
```text
collected 312 items
============================ 312 passed in 25.32s =============================
```

Strand 1.5 worst-case assessment:
```text
The fixed code improves correctness for spoofed X-Forwarded-For prefixes and bounds per-instance memory, but it remains structurally per-instance. Worst case remains N lambda instances multiplied by each route's per-instance limiter: search allows 30 upstream search calls/min/instance, route allows 60 upstream route calls/min/instance. An unauthenticated attacker can therefore force about 30N OneMap search calls/minute and 60N OneMap route calls/minute if traffic is spread across N warm instances. The fix meaningfully prevents single-instance XFF bucket bypass and unbounded map growth, but it does not create a global limiter.
```

Strand 3.5 alternatives:
```text
- distinct destinations/interchanges reachable: current bus route sequences likely support terminal/interchange proxies, but true destination demand needs an added destination taxonomy.
- service-count saturating curve: current ingestion has enough unique service counts per stop/radius; risk is over-rewarding overlapping services on one corridor.
- wait to single best service rather than pooled wait: current ingestion has per-service headways; avoids pooled saturation but measures best bus rather than breadth.
- independent corridors: current bus_routes may support an approximate corridor grouping; robust corridor independence needs more route geometry/shape processing.
```

Strand 3.6 judgement:
```text
P5 should not proceed as a blind fallback-wait promotion if the product goal is bus ranking discrimination. A narrow promotion can be an honesty correction for records whose own provenance has bus evidence, but durable bus quality needs owner-approved sub-score remodelling because current pooled-wait scoring is already saturated.
```

FINDINGS:
```text
1. The user BEDOK payload estimate was directionally right but not exact for the local bundle: local raw BEDOK JSON totals 176.264 MiB, parsed/retained full records measured 120.760 MiB, and no local .gz score shards exist.
2. The web-only rank fix cannot reduce bytes when the panel is opened; true transferred-byte reduction needs a future export-side rank index.
3. API throttling is still per-instance and therefore not a real global rate limit across horizontally scaled serverless instances.
4. P3's dominant fallback reason string is misleading for the 20.280% of affected records with nearest_direct_m in [250,305], outside routed_max_m 250 by construction.
5. The bus sub-score is already saturated: 75.169% of bus-positive records are exactly 100, and pooled wait strongly tracks service_count.
```

DISAGREEMENTS:
```text
No disagreement with the security or bus-saturation premises. Strand 2 measurement corrected the exact payload numbers and notes that CPU throttling was not applied in the file-level reproduction.
```
