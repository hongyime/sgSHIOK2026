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

    expect(source).toContain("Data as of {formatDataDate(manifest)}");
    expect(source).toContain("© OpenStreetMap contributors");
    expect(source).toContain("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(source).toContain("ATTRIBUTION.md");
    expect(source).toContain("Heat: shelter + NParks shade proxy");
    expect(source).not.toContain("Heat: shelter plus NParks shade proxy");
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

  it("keeps shade proxy and map connector in a subtle route-details strip, not a duplicate metric row", () => {
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
    const tsxSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(cssSource).toContain(".compareNote");
    expect(cssSource).toContain(".routeDetails");
    expect(cssSource).not.toContain(".routeSecondary {");
    expect(cssSource).not.toContain(".routeTertiary {");

    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Shade proxy\"");
    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Map connector\"");
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
    expect(source).toContain("Four display rows; weights unchanged");
    expect(source).toContain('label: "Shelter exposure"');
    expect(source).toContain('label: "Walk to transit"');
    expect(source).toContain('label: "Bus service support"');
    expect(source).toContain('label: "Locked SHIOK score"');
    expect(source).toContain("Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.");
    expect(source).toContain("Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first.");
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
});
