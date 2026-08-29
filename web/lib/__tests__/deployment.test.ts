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

  it("caches the app shell to reduce repeat edge requests", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");

    expect(config).toContain('source: "/"');
    expect(config).toContain('value: "public, max-age=86400, stale-while-revalidate=604800"');
  });

  it("keeps crawler controls away from data and API payloads", () => {
    const config = readFileSync(join(__dirname, "../../next.config.js"), "utf-8");
    const robots = readFileSync(join(__dirname, "../../app/robots.ts"), "utf-8");

    expect(config).toContain('source: "/data/:path*"');
    expect(config).toContain('source: "/api/:path*"');
    expect(config).toContain('key: "X-Robots-Tag"');
    expect(config).toContain('value: "noindex, nofollow, noarchive"');
    expect(robots).toContain('allow: "/"');
    expect(robots).toContain('disallow: ["/api/", "/data/", "/_next/", "/*?*"]');
    expect(robots).toContain("crawlDelay: 300");
    expect(robots).toContain('sitemap: "https://sgshiok.vercel.app/sitemap.xml"');
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
    expect(sitemap).toContain('changeFrequency: "weekly"');
    expect(sitemap).toContain("priority: 1");
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
