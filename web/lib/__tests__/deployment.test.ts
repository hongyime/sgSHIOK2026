import dataBundle from "../../data-bundle.json";
import { readFileSync } from "fs";
import { join } from "path";

describe("deployment packaging", () => {
  it("uploads the active generated data bundle to Vercel", () => {
    const webIgnore = readFileSync(join(__dirname, "../../.vercelignore"), "utf-8");
    const rootIgnore = readFileSync(join(__dirname, "../../../.vercelignore"), "utf-8");
    const activeBundle = String(dataBundle.bundle);

    expect(webIgnore).toContain("public/data/generated_*/");
    expect(webIgnore).toContain(`!public/data/${activeBundle}/`);
    expect(webIgnore).toContain(`!public/data/${activeBundle}/**`);
    expect(rootIgnore).toContain("web/public/data/generated_*/");
    expect(rootIgnore).toContain(`!web/public/data/${activeBundle}/`);
    expect(rootIgnore).toContain(`!web/public/data/${activeBundle}/**`);
  });

  it("skips Vercel builds for commits outside the web project", () => {
    const config = JSON.parse(readFileSync(join(__dirname, "../../vercel.json"), "utf-8"));

    expect(config.ignoreCommand).toBe("node scripts/ignore-build.mjs");
  });

  it("keeps Git pushes from automatically deploying production", () => {
    const config = JSON.parse(readFileSync(join(__dirname, "../../vercel.json"), "utf-8"));

    expect(config.git).toEqual({ deploymentEnabled: false });
  });

  it("marks versioned data artifacts cacheable to reduce repeated edge requests", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/data/:path*"');
    expect(config).toContain('key: "Cache-Control"');
    expect(config).toContain('value: "public, max-age=31536000, immutable"');
  });

  it("marks Next static chunks cacheable to reduce repeat edge requests", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/_next/static/:path*"');
    expect(config).toContain('value: "public, max-age=31536000, immutable"');
    expect(config).toContain('value: "noindex, nofollow, noarchive"');
  });

  it("registers the optional service worker only after app intent", () => {
    const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
    const registration = readFileSync(
      join(__dirname, "../../components/service-worker-registration.tsx"),
      "utf-8",
    );
    const page = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const helper = readFileSync(join(__dirname, "../service-worker-cache.ts"), "utf-8");

    expect(layout).toContain('import { ServiceWorkerRegistration }');
    expect(layout).toContain("<ServiceWorkerRegistration />");
    expect(registration).toContain('import { ENABLE_SERVICE_WORKER_CACHE_EVENT } from "../lib/service-worker-cache";');
    expect(registration).toContain('process.env.NODE_ENV !== "production"');
    expect(registration).toContain("let registered = false;");
    expect(registration).toContain("if (registered) return;");
    expect(registration).toContain(".getRegistration(\"/\")");
    expect(registration).toContain("if (registration) return registration;");
    expect(registration).toContain('navigator.serviceWorker.register("/sw.js")');
    expect(registration).toContain("window.addEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register)");
    expect(registration).not.toContain('window.addEventListener("load", register');
    expect(page).toContain('import { requestServiceWorkerCache } from "../lib/service-worker-cache";');
    expect(helper).toContain('export const ENABLE_SERVICE_WORKER_CACHE_EVENT = "shiok:enable-service-worker-cache";');
    expect(helper).toContain("export function requestServiceWorkerCache()");
    expect(helper).toContain("if (typeof window === \"undefined\") return;");
    expect(helper).toContain("window.dispatchEvent(new Event(ENABLE_SERVICE_WORKER_CACHE_EVENT));");
    expect(page).toContain("requestServiceWorkerCache();");
  });

  it("keeps the service worker as tracked deployment source", () => {
    const rootIgnore = readFileSync(join(__dirname, "../../../.gitignore"), "utf-8");

    expect(rootIgnore).not.toContain("web/public/sw.js");
  });

  it("keeps service-worker caching scoped to static public assets", () => {
    const serviceWorker = readFileSync(join(__dirname, "../../public/sw.js"), "utf-8");

    expect(serviceWorker).toContain('const CACHE_NAME = "sgshiok-static-v1"');
    for (const path of [
      '"/"',
      '"/icon.svg"',
      '"/favicon.ico"',
      '"/apple-touch-icon.png"',
      '"/apple-touch-icon-precomposed.png"',
      '"/robots.txt"',
      '"/sitemap.xml"',
      '"/site.webmanifest"',
      '"/manifest.json"',
    ]) {
      expect(serviceWorker).toContain(path);
    }
    expect(serviceWorker).toContain('const CACHEABLE_PREFIXES = ["/_next/static/", "/data/"]');
    expect(serviceWorker).toContain('if (url.pathname.startsWith("/api/")) return false;');
    expect(serviceWorker).toContain('const cacheKey = request.mode === "navigate" ? "/" : request;');
    expect(serviceWorker).toContain("caches.match(cacheKey)");
    expect(serviceWorker).toContain("await cache.put(request, response.clone())");
  });

  it("bounds service-worker freshness for stable non-hashed URLs", () => {
    const serviceWorker = readFileSync(join(__dirname, "../../public/sw.js"), "utf-8");

    expect(serviceWorker).toContain('["/", 604_800_000]');
    expect(serviceWorker).toContain('["/robots.txt", 604_800_000]');
    expect(serviceWorker).toContain('["/sitemap.xml", 604_800_000]');
    expect(serviceWorker).toContain('["/site.webmanifest", 604_800_000]');
    expect(serviceWorker).toContain('["/manifest.json", 604_800_000]');
    expect(serviceWorker).toContain('url.pathname === "/icon.svg"');
    expect(serviceWorker).toContain('url.pathname === "/favicon.ico"');
    expect(serviceWorker).toContain('url.pathname === "/apple-touch-icon.png"');
    expect(serviceWorker).toContain('url.pathname === "/apple-touch-icon-precomposed.png"');
    expect(serviceWorker).toContain('Date.parse(response.headers.get("date") || "")');
    expect(serviceWorker).toContain("cached && isFreshEnough(cached, cacheMaxAgeMs(cacheKey))");
  });

  it("sets bounded deployment headers for the service worker script", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/sw.js"');
    expect(config).toContain('value: "public, max-age=86400, stale-while-revalidate=604800"');
    expect(config).toContain('key: "Service-Worker-Allowed"');
    expect(config).toContain('value: "/"');
  });

  it("caches the app shell for one week to reduce repeat edge requests", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/"');
    expect(config).toContain('value: "public, max-age=604800, stale-while-revalidate=2592000"');
  });

  it("keeps crawler controls away from data and API payloads", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");
    const robots = readFileSync(join(__dirname, "../../app/robots.ts"), "utf-8");

    expect(config).toContain('source: "/data/:path*"');
    expect(config).toContain('source: "/api/:path*"');
    expect(config).toContain('key: "X-Robots-Tag"');
    expect(config).toContain('value: "noindex, nofollow, noarchive"');
    expect(robots).toContain("const NON_USER_CRAWLER_BLOCKLIST = [");
    for (const crawler of [
      "GPTBot",
      "ClaudeBot",
      "CCBot",
      "Google-Extended",
      "Applebot-Extended",
      "PerplexityBot",
      "Bytespider",
      "Amazonbot",
      "FacebookBot",
      "meta-externalagent",
      "SemrushBot",
      "AhrefsBot",
      "MJ12bot",
      "DotBot",
      "BLEXBot",
      "PetalBot",
      "Barkrowler",
      "DataForSeoBot",
      "MauiBot",
      "serpstatbot",
    ]) {
      expect(robots).toContain(`"${crawler}"`);
    }
    expect(robots).toContain("userAgent: NON_USER_CRAWLER_BLOCKLIST");
    expect(robots).toContain('disallow: "/"');
    expect(robots).toContain('allow: "/"');
    for (const disallowedPath of [
      '"/api/"',
      '"/data/"',
      '"/_next/"',
      '"/favicon.ico"',
      '"/apple-touch-icon.png"',
      '"/apple-touch-icon-precomposed.png"',
      '"/site.webmanifest"',
      '"/manifest.json"',
      '"/*?*"',
    ]) {
      expect(robots).toContain(disallowedPath);
    }
    expect(robots).toContain("crawlDelay: 300");
    expect(robots).toContain('sitemap: "https://sgshiok.vercel.app/sitemap.xml"');
    expect(robots).not.toContain("OAI-SearchBot");
    expect(robots).not.toContain("Claude-SearchBot");
    expect(robots).not.toContain("Googlebot");
    expect(robots).not.toContain("Bingbot");
  });

  it("discourages duplicate crawling of shared-link query variants", () => {
    const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
    const robots = readFileSync(join(__dirname, "../../app/robots.ts"), "utf-8");

    expect(robots).toContain('"/*?*"');
    expect(layout).toContain("alternates");
    expect(layout).toContain('canonical: "https://sgshiok.vercel.app/"');
  });

  it("publishes a single-page sitemap for polite crawlers", () => {
    const sitemap = readFileSync(join(__dirname, "../../app/sitemap.ts"), "utf-8");

    expect(sitemap).toContain('const SITE_URL = "https://sgshiok.vercel.app/";');
    expect(sitemap).toContain("export default function sitemap()");
    expect(sitemap).toContain("url: SITE_URL");
    expect(sitemap).toContain('changeFrequency: "monthly"');
    expect(sitemap).toContain("priority: 0.3");
    expect(sitemap).not.toContain("/data/");
    expect(sitemap).not.toContain("/api/");
  });

  it("caches robots.txt for one week so crawlers do not revalidate it on every visit", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/robots.txt"');
    expect(config).toContain('value: "public, max-age=604800, stale-while-revalidate=2592000"');
  });

  it("caches sitemap.xml for one week so crawlers do not revalidate it on every visit", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/sitemap.xml"');
    expect(config).toContain('value: "public, max-age=604800, stale-while-revalidate=2592000"');
  });

  it("caches the app icon so browsers do not revalidate it on every visit", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/icon.svg"');
    expect(config).toContain('value: "public, max-age=31536000, immutable"');
  });

  it("rewrites default favicon probes to the cacheable SVG icon", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");
    const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");

    expect(layout).toContain("icons");
    expect(layout).toContain('icon: "/icon.svg"');
    expect(config).toContain("async rewrites()");
    expect(config).toContain("beforeFiles");
    expect(config).toContain('source: "/favicon.ico"');
    expect(config).toContain('destination: "/icon.svg"');
    expect(config).toContain('value: "public, max-age=31536000, immutable"');
    expect(config).not.toContain("async redirects()");
    expect(config).not.toContain("permanent: true");
  });

  it("rewrites common Apple touch icon probes to the cacheable SVG icon", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/apple-touch-icon.png"');
    expect(config).toContain('source: "/apple-touch-icon-precomposed.png"');
    expect(config).toContain('destination: "/icon.svg"');
    expect(config).toContain('value: "public, max-age=31536000, immutable"');
  });

  it("serves conventional manifest probes without linking them from the app shell", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");
    const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
    const manifest = JSON.parse(readFileSync(join(__dirname, "../../public/site.webmanifest"), "utf-8"));

    expect(config).toContain('source: "/site.webmanifest"');
    expect(config).toContain('source: "/manifest.json"');
    expect(config).toContain('destination: "/site.webmanifest"');
    expect(config).toContain('value: "public, max-age=604800, stale-while-revalidate=2592000"');
    expect(config).toContain('value: "noindex, nofollow, noarchive"');
    expect(layout).not.toContain("manifest:");
    expect(layout).not.toContain('rel="manifest"');
    expect(manifest.name).toBe("S.H.I.O.K. Shelter Map");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons[0]).toEqual({
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    });
  });

  it("materializes derived lookup shards during web builds", () => {
    const script = readFileSync(join(__dirname, "../../scripts/ensure-data-bundle.mjs"), "utf-8");

    expect(script).toContain("ensureDerivedLookupShards");
    expect(script).toContain("writePostalPrefixShards");
    expect(script).toContain("writeTransitH3Shards");
  });

  it("does not rewrite existing local data artifacts during web builds", () => {
    const script = readFileSync(join(__dirname, "../../scripts/ensure-data-bundle.mjs"), "utf-8");

    expect(script).toContain("if (!overwrite && existsSync(path)) return;");
    expect(script).toContain('if (existsSync(`${path}.gz`)) return;');
    expect(script).toContain("writePostalPrefixShards(targetRoot, geomPostalIndex, { overwrite: false })");
    expect(script).toContain("writeTransitH3Shards(targetRoot, transitPois, { overwrite: false })");
  });

  it("restores missing deployment data from the Vercel build cache before downloading live data", () => {
    const script = readFileSync(join(__dirname, "../../scripts/ensure-data-bundle.mjs"), "utf-8");

    expect(script).toContain('join(process.cwd(), ".next", "cache", "shiok-data")');
    expect(script).toContain("function restoreCachedBundle(bundle, targetRoot)");
    expect(script).toContain('if (!existsSync(join(cachedRoot, "manifest.json"))) return false;');
    expect(script).toContain("copyBundle(cachedRoot, targetRoot);");
    expect(script).toContain("restored data bundle from build cache");
    expect(script).toContain("const cachedTarget = join(buildCacheRoot(), bundle);");
    expect(script).toContain("await downloadRemoteBundle(bundle, cachedTarget);");
    expect(script).toContain("copyBundle(cachedTarget, target);");
  });

  it("keeps routed browser smoke QA available for launch checks", () => {
    const packageJson = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));
    const script = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(packageJson.scripts["qa:browser"]).toBe("node scripts/browser-smoke.mjs");
    expect(script).toContain("--postals");
    expect(script).toContain("--expected-state");
    expect(script).toContain("--transit-mode");
    expect(script).toContain("--walk-mode");
    expect(script).toContain("--route-mode");
    expect(script).toContain("--must-include");
    expect(script).toContain("result_count");
    expect(script).toContain("Input.dispatchKeyEvent");
    expect(script).toContain("keyboard_search_used");
    expect(script).toContain("transit_mode_selected");
    expect(script).toContain("walk_mode_selected");
    expect(script).toContain("route_mode_selected");
    expect(script).toContain("active_walk_mode");
    expect(script).toContain("debug-runs");
    expect(script).toContain("run_manifest.json");
    expect(script).toContain("shelter_map_panel_loaded");
    expect(script).toContain("route_evidence_panel_loaded");
    expect(script).toContain("shelter_map_panel_excerpt");
    expect(script).toContain("route_evidence_panel_excerpt");
    expect(script).toContain("score_panel_loaded: routeEvidencePanelLoaded");
    expect(script).toContain("rendered_feature_counts");
    expect(script).toContain("route_rendered_features_present");
    expect(script).toContain("required_text_present");
    expect(script).toContain("normalizeSmokeText");
    expect(script).toContain("includesSmokeText(summary.cardText, text)");
    expect(script).toContain("pending_badge_absent");
    expect(script).toContain("not_yet_copy_distinct_from_no_transit");
    expect(script).toContain("Connected walk beyond 1.2 km");
    expect(script).not.toContain("Transit beyond locked range");
    expect(script).toContain("Closest connected shelter-map walk");
    expect(script).toContain("bodyHtml");
    expect(script).toContain("Runtime.exceptionThrown");
    expect(script).toContain("shelter_map_has_locked_score");
    expect(script).toContain("score_has_max_denominator");
    expect(script).toContain("walk_mode_present");
    expect(script).toContain("map_has_text_equivalent");
    expect(script).toContain("short_mobile_card_bottom_visible");
    expect(script).toContain('[aria-label="Transit stop or exit type"] button');
    expect(script).not.toContain('[aria-label="Transit target"] button');
    expect(script).toContain('section[aria-label="Shelter-map panel"]');
    expect(script).not.toContain('section[aria-label="Shelter map panel"]');
    expect(script).not.toContain('section[aria-label="Route evidence panel"]');
    expect(script).not.toContain('section[aria-label="Score panel"]');
  });

  it("keeps data-bundle release dry-run safe by default", () => {
    const script = readFileSync(join(__dirname, "../../../scripts/release-data-bundle.ps1"), "utf-8");

    expect(script).toContain("confirm_production_not_set");
    expect(script).toContain("release=not_started");
    expect(script).toContain("-ConfirmProduction");
  });

  it("does not treat stale LASTEXITCODE as web dependency failure", () => {
    const script = readFileSync(join(__dirname, "../../../scripts/deploy-production.ps1"), "utf-8");

    expect(script).toContain('Join-Path $PSScriptRoot "ensure-web-deps.ps1"');
    expect(script).toContain('if (-not $?) { throw "web dependency install failed" }');
    expect(script).not.toContain('$LASTEXITCODE -ne 0) { throw "web dependency install failed"');
  });

  it("keeps bundle activation packaging-aware", () => {
    const script = readFileSync(join(__dirname, "../../../scripts/activate-data-bundle.ps1"), "utf-8");

    expect(script).toContain('Join-Path $WebDir "data-bundle.json"');
    expect(script).toContain(".vercelignore");
    expect(script).toContain("!web/public/data/$DataBundle/");
    expect(script).toContain("!public/data/$DataBundle/");
  });

  it("keeps launch check local-only and broad enough for release rehearsal", () => {
    const script = readFileSync(join(__dirname, "../../../scripts/launch-check.ps1"), "utf-8");

    expect(script).toContain("deploy=false");
    expect(script).toContain("uv run python run.py test");
    expect(script).toContain("npm --prefix web test");
    expect(script).toContain("npm --prefix web run build");
    expect(script).toContain("uv run python run.py readiness");
    expect(script).toContain("Find-AvailablePort");
    expect(script).toContain("port_adjusted");
    expect(script).toContain("Stop-ProcessTree");
    expect(script).toContain("Stop-NewListenerOnPort");
    expect(script).toContain('"--expected-state", "no_transit"');
    expect(script).toContain('"--expected-state", "not_yet_scored"');
    expect(script).toContain('"--transit-mode", "mrt_lrt"');
    expect(script).toContain('"--walk-mode", "both"');
    expect(script).not.toContain('"--route-mode", "both"');
    expect(script).toContain("qa\\debug-runs\\launch-check-$Timestamp");
    expect(script).toContain("Release plan only");
    expect(script).not.toContain("deploy-production");
    expect(script).not.toContain("vercel deploy");
  });

  it("keeps postal universe prep bounded and non-deploying", () => {
    const script = readFileSync(
      join(__dirname, "../../../scripts/prepare-postal-universe.ps1"),
      "utf-8",
    );

    expect(script).toContain("confirm_bounded_geocode_not_set");
    expect(script).toContain("postal-universe");
    expect(script).toContain("geocode-universe");
    expect(script).toContain("--confirm-bounded-geocode");
    expect(script).toContain("batch-plan");
    expect(script).toContain("score=false");
    expect(script).toContain("deploy=false");
    expect(script).not.toContain("score-batch");
    expect(script).not.toContain("deploy-production");
    expect(script).not.toContain("vercel deploy");
  });
});
