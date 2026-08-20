import { readFileSync } from "fs";
import { join } from "path";

describe("score card copy", () => {
  it("distinguishes far reachable transit from no routed transit", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Transit beyond scoring range");
    expect(source).toContain("Transit route not connected yet");
    expect(source).toContain("Transit stop or exit found");
    expect(source).toContain("No transit stop within scoring range");
    expect(source).toContain("Transit stops or exits exist, but this shelter-map bundle has no connected shelter-map walk yet.");
    expect(source).toContain("No qualifying MRT/LRT exit or bus stop was found within the 1.2 km scoring range for this postal.");
    expect(source).toContain("Closest routed ${label} is ${formatDistance(nearestM)}");
    expect(source).toContain("Current scoring range is 1.2 km");
    expect(source).toContain("Walking route not connected yet");
    expect(source).toContain("Outside current 1.2 km scoring range");
    expect(source).toContain("Nearby transit may still exist beyond the 1.2 km scoring range");
    expect(source).toContain("Shelter-map walk not verified yet");
    expect(source).toContain("Direct line to bus stop; shelter-map walk pending.");
    expect(source).toContain("Shelter-map walk access was not verified, so this component score remains 0.");
    expect(source).not.toContain("current walking graph could not connect a route yet");
    expect(source).not.toContain("Transit stops or exits exist, but this shelter-map bundle has no connected walking route yet.");
    expect(source).not.toContain("Walking-route shelter not verified yet");
    expect(source).not.toContain("Walking-route access was not verified");
    expect(source).not.toContain("Direct line to bus stop; walking route pending.");
    expect(source).not.toContain("Shelter-map route not verified yet");
    expect(source).not.toContain("Shelter-map route access was not verified");
    expect(source).not.toContain("Outside current candidate thresholds");
    expect(source).not.toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
    expect(source).not.toContain("Transit stops or exits exist, but this bundle has no connected walking route evidence yet.");
    expect(source).not.toContain("Transit candidate found");
    expect(source).not.toContain("No transit candidate nearby");
    expect(source).not.toContain("No nearby transit candidate selected");
    expect(source).not.toContain("Outside current transit-candidate limits");
    expect(source).not.toContain("Nearby transit may still exist outside the current threshold");
  });

  it("keeps shortest walk context visible when it matches the sheltered walk", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Shortest same as sheltered walk.");
    expect(source).not.toContain("Shortest same as sheltered route.");
    expect(source).toContain('sameRoute ? "Shortest (same)" : "Shortest"');
  });

  it("keeps browser smoke aligned with awaiting bundle-score copy", () => {
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(smokeSource).toContain('summary.cardText.includes("No full score in this bundle")');
    expect(smokeSource).toContain('summary.cardText.includes("Awaiting bundle score")');
    expect(smokeSource).not.toContain("needs usable location evidence");
  });

  it("keeps browser smoke aligned with walk-display controls", () => {
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(smokeSource).toContain('[aria-label="Walk display"] button');
    expect(smokeSource).not.toContain('[aria-label="Route display"] button');
  });

  it("accepts walk-mode browser smoke arguments while preserving route-mode compatibility", () => {
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(smokeSource).toContain('arg === "--walk-mode" || arg === "--route-mode"');
  });

  it("reports invalid browser smoke walk modes with walk wording", () => {
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(smokeSource).toContain("invalid walk mode");
    expect(smokeSource).not.toContain("invalid route mode");
  });

  it("names walk mode in copied walk QA JSON while keeping route-mode compatibility", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Copy walk QA JSON");
    expect(source).toContain("walk_mode: routeMode");
    expect(source).toContain("route_mode: routeMode");
  });

  it("puts data freshness and heat proxy copy in the title card", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const layoutSource = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");

    expect(source).toContain("S.H.I.O.K. Shelter Map");
    expect(source).not.toContain("S.H.I.O.K. Index");
    expect(layoutSource).toContain('title: "S.H.I.O.K. Shelter Map"');
    expect(layoutSource).not.toContain('title: "S.H.I.O.K. Index"');
    expect(source).toContain("Shelter-first walks to transit");
    expect(source).toContain('placeholder="Search address or 6-digit postal"');
    expect(source).toContain('aria-label="Search address or 6-digit postal"');
    expect(source).toContain("Enter at least 3 characters for OneMap search, or use a 6-digit postal code.");
    expect(source).not.toContain("Enter at least 3 characters or a 6-digit postal code.");
    expect(source).not.toContain("Singapore walk-to-transit comfort");
    expect(source).toContain(
      "Shelter map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
    );
    expect(source).not.toContain(
      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
    );
    expect(source).toContain("function formatGeneratedDate(manifest: Manifest | null): string");
    expect(source).toContain("Locked score ${scoreText}");
    expect(source).toContain(
      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; measured recent-source misses exist."
    );
    expect(source).not.toContain("newer completions may be missing.");
    expect(source).toContain(
      "Recent public-sample check: 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026 with postals."
    );
    expect(source).not.toContain(
      "Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals."
    );
    expect(source).toContain(
      "Data freshness: 12 sources current, 6 stale, 2 manual, and 1 candidate address source with unknown age; stale sources are traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers."
    );
    expect(source).not.toContain("Source freshness audit:");
    expect(source).not.toContain("1 unknown-age; stale sources");
    expect(source).not.toContain("some greenery and boundary references");
    expect(source).not.toContain(
      "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
    );
    expect(source).not.toContain("6 supporting sources are stale.");
    expect(source).toContain('import { formatScoreCoverageLine } from "../lib/score-coverage";');
    expect(source).toContain("formatScoreCoverageLine(manifest)");
    expect(source).toContain("styles.coverageLine");
    expect(readFileSync(join(__dirname, "../score-coverage.ts"), "utf-8")).toContain(
      "Bundle score availability:"
    );
    expect(source).toContain("© OpenStreetMap contributors");
    expect(source).toContain("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(source).toContain("ATTRIBUTION.md");
    expect(source).toContain("Heat proxy: shelter plus sparse NParks greenery, not measured temperature");
    expect(source).toContain("Night lighting");
    expect(source).toContain("Exposed gaps on this walk");
    expect(source).toContain("include map coordinates.");
    expect(source).toContain(
      "LTA lamp-post layer: 126,144 points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load points. Map evidence only; not part of the locked score."
    );
    expect(source).not.toContain("Heat: shelter + NParks shade proxy");
    expect(source).not.toContain("Heat: shelter plus NParks shade proxy");
    expect(source).not.toContain("Heat proxy: shelter + sparse NParks greenery");
    expect(layoutSource).toContain(
      "Explore covered-walkway exposure gaps, night-lighting evidence, and the secondary locked SHIOK score"
    );
    expect(layoutSource).not.toContain("measuring rain shelter, provisional heat proxy, crossing friction");
  });

  it("keeps the footer aligned with shelter map framing", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Source-derived shelter map evidence.");
    expect(source).not.toContain("Source-derived route evidence.");
    expect(source).not.toContain("Source-derived comfort index.");
  });

  it("does not duplicate the sheltered % across primary and secondary rows", () => {
    // The primary summary grid already shows `Sheltered X%` for the active
    // route. The old secondary row rendered `Shiokest sheltered X%` and
    // `Shortest sheltered X%` at the same time, which duplicated one of
    // the two values with the primary row for the current route mode.
    // See 2026-08-05 refactor: decisions.md.
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Sheltered\n      </button>");
    expect(source).toContain('"Sheltered walk"');
    expect(source).toContain('"Sheltered route"');
    expect(source).toContain('aria-label="Walk display"');
    expect(source).toContain("Suggest better walk");
    expect(source).toContain("Copy walk QA JSON");
    expect(source).toContain('placeholder="Optional walk note"');
    expect(source).not.toContain(">Covered");
    expect(source).not.toContain('"Covered walk"');
    expect(source).not.toContain('"Covered route"');
    expect(source).not.toContain('label="Shiokest sheltered"');
    expect(source).not.toContain('label="Shortest sheltered"');
    expect(source).not.toContain('aria-label="Route display"');
    expect(source).not.toContain("Suggest better route");
    expect(source).not.toContain(">Copy QA JSON<");
    expect(source).not.toContain('placeholder="Optional route note"');
    expect(source).not.toContain("styles.routeSecondary");
    expect(source).not.toContain("styles.routeTertiary");
  });

  it("adds an inline comparison note when the alternate route's shelter % differs meaningfully", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("buildRouteCompareNote");
    // Copy shape: "Shortest walk is 45% sheltered (30pp less shelter)"
    expect(source).toContain("${otherLabel} is ${otherPct}% sheltered (${magnitude}pp ${direction} shelter)");
    expect(source).toContain('const otherLabel = viewedIsShortest ? "Sheltered walk" : "Shortest walk";');
    expect(source).not.toContain('const otherLabel = viewedIsShortest ? "Sheltered route" : "Shortest";');
    // Skip note when routes match or magnitude is trivial.
    expect(source).toContain("if (sameRoute || directBusFallback) return null;");
    expect(source).toContain("if (magnitude < 5) return null;");
    expect(source).toContain("className={styles.compareNote}");
    expect(source).toContain('aria-label="Walk comparison"');
    expect(source).not.toContain('aria-label="Route comparison"');
  });

  it("keeps greenery proxy and snap connector in a subtle walk-details strip, not a duplicate metric row", () => {
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
    const tsxSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(cssSource).toContain(".compareNote");
    expect(cssSource).toContain(".routeDetails");
    expect(cssSource).toContain(".routeDetails small");
    expect(cssSource).not.toContain(".routeSecondary {");
    expect(cssSource).not.toContain(".routeTertiary {");

    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Greenery proxy\"");
    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Shade proxy\"");
    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Snap connector\"");
    expect(tsxSource).toContain('routeDetailItems.push({ label: "Night lighting", value: lampOverlayEnabled ? "Layer on" : "Layer off" });');
    expect(tsxSource).toContain("lampOverlayEnabled?: boolean;");
    expect(tsxSource).toContain("lampOverlayEnabled={lampOverlayEnabled}");
    expect(tsxSource).toContain(
      "Night lighting uses LTA lamp-post points as map evidence outside the locked score."
    );
    expect(tsxSource).toContain(
      "Snap connector is the short link from the postal or transit point onto the shelter-map route."
    );
    expect(tsxSource).not.toContain("onto mapped walking-route evidence");
    expect(tsxSource).not.toContain("onto the walking graph");
    expect(tsxSource).toContain('aria-label="Walk details"');
    expect(tsxSource).not.toContain('aria-label="Route details"');
  });

  it("removes presentation reweighting and displays the authoritative bundle total", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).not.toContain("COMFORT_MODES");
    expect(source).not.toContain("normalizeComfortMode");
    expect(source).not.toContain("modeAdjustedTotal");
    expect(source).not.toContain("ComfortModeControl");
    expect(source).not.toContain("comfortMode");
    expect(source).toContain("const displayScore = score.total;");
    expect(source).toContain("<span>Locked score</span>");
  });

  it("shows four display rows without changing the locked weights", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const weightsYaml = readFileSync(join(__dirname, "../../../pipeline/config/weights.yaml"), "utf-8");

    expect(source).toContain("Shelter map evidence and locked score");
    expect(source).toContain('aria-label="Shelter map evidence and locked score breakdown"');
    expect(source).toContain('aria-label="Shelter map evidence reasons"');
    expect(source).toContain("Shelter map evidence preview");
    expect(source).toContain("Shelter map evidence unavailable");
    expect(source).toContain("Shelter map evidence available");
    expect(source).toContain("Locked score unavailable");
    expect(source).toContain("Locked score incomplete");
    expect(source).not.toContain("Route evidence and locked score");
    expect(source).not.toContain('aria-label="Route evidence and locked score breakdown"');
    expect(source).not.toContain('aria-label="Route evidence reasons"');
    expect(source).not.toContain("Route evidence preview");
    expect(source).not.toContain("Route evidence unavailable");
    expect(source).not.toContain("Route evidence available");
    expect(source).not.toContain("Bundle score unavailable");
    expect(source).not.toContain("Bundle score incomplete");
    expect(source).toContain('label: "Locked SHIOK score"');
    expect(source).toContain("Start with the shelter trace and exposed gaps; use the locked score only to sort the current bundle.");
    expect(source).not.toContain("Use this locked score to sort the current bundle");
    expect(source).not.toContain('label: "Overall SHIOK"');
    expect(source).not.toContain("Use this locked composite");
    expect(source).toContain('aria-label="Planning-area comparison"');
    expect(source).toContain("Compare nearby records");
    expect(source).not.toContain('aria-label="Rank by view"');
    expect(source).not.toContain("<strong>Rank by</strong>");
    expect(source).toContain("Planning-area list sorted by locked score; shelter evidence remains the primary view.");
    expect(source).toContain("Planning-area component-score view; locked SHIOK score is unchanged.");
    expect(source).not.toContain("Authoritative composite order.");
    expect(source).not.toContain("Planning-area order by locked score.");
    expect(source).not.toContain("Planning-area sub-score view; locked SHIOK score is unchanged.");
    expect(source).toContain("Four display rows; weights unchanged");
    expect(source).toContain('"No locked score"');
    expect(source).toContain('label: "Shelter exposure"');
    expect(source).toContain('label: "Walk to transit"');
    expect(source).toContain('label: "Bus service support"');
    expect(source).toContain("Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.");
    expect(source).toContain("Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first.");
    expect(source).toContain("Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}");
    expect(source).toContain("Crossing friction remains a 5% locked term, but has low separation in this release.");
    expect(source).not.toContain('label: "Rain shelter"');
    expect(source).not.toContain('label: "Heat proxy"');
    expect(source).not.toContain('label: "Crossing friction"');

    expect(weightsYaml).toContain("transit_access: 0.35");
    expect(weightsYaml).toContain("bus_connectivity: 0.20");
    expect(weightsYaml).toContain("rain_shelter: 0.25");
    expect(weightsYaml).toContain("heat_comfort: 0.15");
    expect(weightsYaml).toContain("crossing_friction: 0.05");
  });

  it("keeps the locked score visually secondary to the shelter evidence", () => {
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");

    expect(cssSource).toContain(".exposureHero strong");
    expect(cssSource).toContain("font-size: 17px;");
    expect(cssSource).toContain(".scoreBadge strong");
    expect(cssSource).toContain("font-size: 13px;");
    expect(cssSource).toContain(".scoreBadge span");
    expect(cssSource).toContain("font-size: 9px;");
    expect(cssSource).not.toContain(".scoreBadge strong {\n    font-size: 18px;");
  });
});
