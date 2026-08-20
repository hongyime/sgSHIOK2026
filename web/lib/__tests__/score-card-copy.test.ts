import { readFileSync } from "fs";
import { join } from "path";

describe("score card copy", () => {
  it("distinguishes far reachable transit from no routed transit", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Transit beyond scoring range");
    expect(source).toContain("Transit route not connected yet");
    expect(source).toContain("No transit candidate nearby");
    expect(source).toContain("Closest routed ${label} is ${formatDistance(nearestM)}");
    expect(source).toContain("Current scoring range is 1.2 km");
    expect(source).toContain("Walking route not connected yet");
    expect(source).toContain("Outside current candidate thresholds");
  });

  it("keeps shortest route context visible when it matches the covered route", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Shortest same as covered route.");
    expect(source).toContain('sameRoute ? "Shortest (same)" : "Shortest"');
  });

  it("puts data freshness and heat proxy copy in the title card", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const layoutSource = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");

    expect(source).toContain("Shelter-first walks to transit");
    expect(source).not.toContain("Singapore walk-to-transit comfort");
    expect(source).toContain("Route evidence as of {formatDataDate(manifest)}");
    expect(source).toContain("Locked score ${scoreText}");
    expect(source).toContain(
      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; newer completions may be missing."
    );
    expect(source).toContain(
      "Recent public-sample check: 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026 with postals."
    );
    expect(source).not.toContain(
      "Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals."
    );
    expect(source).toContain(
      "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
    );
    expect(source).not.toContain("6 supporting sources are stale.");
    expect(source).toContain('import { formatScoreCoverageLine } from "../lib/score-coverage";');
    expect(source).toContain("formatScoreCoverageLine(manifest)");
    expect(source).toContain("styles.coverageLine");
    expect(source).toContain("© OpenStreetMap contributors");
    expect(source).toContain("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(source).toContain("ATTRIBUTION.md");
    expect(source).toContain("Heat proxy: shelter + sparse NParks greenery");
    expect(source).toContain("Night lighting");
    expect(source).toContain(
      "LTA lamp-post layer: 126,144 points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load points. Map evidence only; not part of the locked score."
    );
    expect(source).not.toContain("Heat: shelter + NParks shade proxy");
    expect(source).not.toContain("Heat: shelter plus NParks shade proxy");
    expect(layoutSource).toContain(
      "Explore covered-walkway exposure gaps, night-lighting evidence, and the secondary locked SHIOK score"
    );
    expect(layoutSource).not.toContain("measuring rain shelter, provisional heat proxy, crossing friction");
  });

  it("keeps the footer aligned with route evidence framing", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Source-derived route evidence.");
    expect(source).not.toContain("Source-derived comfort index.");
  });

  it("does not duplicate the sheltered % across primary and secondary rows", () => {
    // The primary summary grid already shows `Sheltered X%` for the active
    // route. The old secondary row rendered `Shiokest sheltered X%` and
    // `Shortest sheltered X%` at the same time, which duplicated one of
    // the two values with the primary row for the current route mode.
    // See 2026-08-05 refactor: decisions.md.
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).not.toContain('label="Shiokest sheltered"');
    expect(source).not.toContain('label="Shortest sheltered"');
    expect(source).not.toContain("styles.routeSecondary");
    expect(source).not.toContain("styles.routeTertiary");
  });

  it("adds an inline comparison note when the alternate route's shelter % differs meaningfully", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("buildRouteCompareNote");
    // Copy shape: "Shortest is 45% sheltered (30pp less shelter)"
    expect(source).toContain("${otherLabel} is ${otherPct}% sheltered (${magnitude}pp ${direction} shelter)");
    // Skip note when routes match or magnitude is trivial.
    expect(source).toContain("if (sameRoute || directBusFallback) return null;");
    expect(source).toContain("if (magnitude < 5) return null;");
    expect(source).toContain("className={styles.compareNote}");
  });

  it("keeps shade proxy and snap connector in a subtle route-details strip, not a duplicate metric row", () => {
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
    const tsxSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(cssSource).toContain(".compareNote");
    expect(cssSource).toContain(".routeDetails");
    expect(cssSource).toContain(".routeDetails small");
    expect(cssSource).not.toContain(".routeSecondary {");
    expect(cssSource).not.toContain(".routeTertiary {");

    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Shade proxy\"");
    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Snap connector\"");
    expect(tsxSource).toContain("Snap connector is the short link from the postal or transit point onto the walking graph.");
    expect(tsxSource).toContain('aria-label="Route details"');
  });

  it("removes presentation reweighting and displays the authoritative bundle total", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).not.toContain("COMFORT_MODES");
    expect(source).not.toContain("normalizeComfortMode");
    expect(source).not.toContain("modeAdjustedTotal");
    expect(source).not.toContain("ComfortModeControl");
    expect(source).not.toContain("comfortMode");
    expect(source).toContain("const displayScore = score.total;");
  });

  it("shows four display rows without changing the locked weights", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const weightsYaml = readFileSync(join(__dirname, "../../../pipeline/config/weights.yaml"), "utf-8");

    expect(source).toContain("Route evidence and locked score");
    expect(source).toContain('label: "Locked SHIOK score"');
    expect(source).not.toContain('label: "Overall SHIOK"');
    expect(source).toContain("Planning-area order by locked score.");
    expect(source).not.toContain("Authoritative composite order.");
    expect(source).toContain("Four display rows; weights unchanged");
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
    expect(cssSource).not.toContain(".scoreBadge strong {\n    font-size: 18px;");
  });
});
