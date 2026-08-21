import { readFileSync } from "fs";
import { join } from "path";

function cssFontSizePx(cssSource: string, selector: string): number {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cssSource.match(new RegExp(`${escapedSelector}\\s*\\{[^}]*font-size:\\s*(\\d+)px;`, "m"));
  if (!match) throw new Error(`Missing font-size for ${selector}`);
  return Number.parseInt(match[1], 10);
}

describe("score card copy", () => {
  it("distinguishes far connected shelter-map walks from disconnected walks", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Transit beyond locked range");
    expect(source).toContain("Shelter-map walk not connected yet");
    expect(source).toContain("No connected ${transitModeLabel(transitMode)} shelter-map walk within range");
    expect(source).toContain("Transit stop or exit found");
    expect(source).toContain("No qualifying transit stop within 1.2 km");
    expect(source).not.toContain("No transit stop within scoring range");
    expect(source).toContain("Transit stops or exits exist, but the published shelter-map bundle has no connected shelter-map walk yet.");
    expect(source).toContain("No qualifying MRT/LRT exit or bus stop was found within the locked 1.2 km transit range for this postal.");
    expect(source).not.toContain("Transit beyond scoring range");
    expect(source).not.toContain("within the 1.2 km scoring range for this postal");
    expect(source).toContain("Closest connected ${label} shelter-map walk is ${formatDistance(nearestM)}");
    expect(source).toContain("Closest connected shelter-map walk found is about ${formatDistance(nearestM)}");
    expect(source).not.toContain("Closest routed ${label} is ${formatDistance(nearestM)}");
    expect(source).not.toContain("Closest routed transit found is about ${formatDistance(nearestM)}");
    expect(source).not.toContain("No routed ${transitModeLabel(transitMode)} within range");
    expect(source).toContain("Locked transit range is 1.2 km");
    expect(source).toContain("Outside locked transit range");
    expect(source).not.toContain("Outside current 1.2 km scoring range");
    expect(source).toContain("Nearby transit may still exist beyond the locked 1.2 km transit range");
    expect(source).not.toContain("current scoring range is 1.2 km");
    expect(source).not.toContain("within the current scoring range");
    expect(source).not.toContain("Current scoring range is 1.2 km");
    expect(source).not.toContain("Outside current scoring range");
    expect(source).toContain("Shelter-map walk not verified yet");
    expect(source).toContain("Direct line to bus stop; shelter-map walk pending.");
    expect(source).toContain("Shelter-map walk access was not verified, so the locked bus term remains 0.");
    expect(source).toContain("Direct bus line estimate");
    expect(source).not.toContain("Direct bus estimate");
    expect(source).not.toContain("Shelter-map walk access was not verified, so this component score remains 0.");
    expect(source).not.toContain("current walking graph could not connect a route yet");
    expect(source).not.toContain("Transit route not connected yet");
    expect(source).not.toContain("Transit stops or exits exist, but this shelter-map bundle has no connected shelter-map walk yet.");
    expect(source).not.toContain("Transit stops or exits exist, but this shelter-map bundle has no connected walking route yet.");
    expect(source).not.toContain("Walking route not connected yet");
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
    expect(source).toContain('sameRoute ? "Shortest walk (same)" : "Shortest walk"');
    expect(source).not.toContain('sameRoute ? "Shortest (same)" : "Shortest"');
  });

  it("keeps browser smoke aligned with awaiting bundle-score copy", () => {
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(smokeSource).toContain('summary.cardText.includes("No full locked score in published shelter-map bundle")');
    expect(smokeSource).toContain('summary.cardText.includes("Awaiting locked score")');
    expect(smokeSource).not.toContain('summary.cardText.includes("No full locked score in this bundle")');
    expect(smokeSource).not.toContain('summary.cardText.includes("No full score in this bundle")');
    expect(smokeSource).not.toContain("needs usable location evidence");
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    expect(source).toContain(
      "This postal is in the frozen v1 address universe, but the published shelter-map bundle has no full locked score for it yet."
    );
    expect(source).toContain("unavailable in the published shelter-map bundle");
    expect(source).toContain("No full locked score in published shelter-map bundle");
    expect(source).not.toContain("unavailable in this bundle");
    expect(source).not.toContain("No full locked score in this bundle");
    expect(source).not.toContain("this shelter-map bundle has no published full locked score for it yet");
    expect(source).not.toContain("the current published bundle has not scored it yet");
  });

  it("keeps browser smoke aligned with walk-display controls", () => {
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(smokeSource).toContain('[aria-label="Walk display"] button');
    expect(smokeSource).not.toContain('[aria-label="Route display"] button');
  });

  it("names selected transit stops explicitly in the selected-stop badge", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Viewing selected transit stop");
    expect(source).toContain("Custom transit stop selected.");
    expect(source).not.toContain("Viewing selected stop");
    expect(source).not.toContain("Custom stop selected.");
    const pickerSource = readFileSync(join(__dirname, "../../components/transit-stop-picker.tsx"), "utf-8");
    expect(pickerSource).toContain("Nearby transit targets");
    expect(pickerSource).toContain('aria-label="Nearby transit targets"');
    expect(pickerSource).not.toContain('aria-label="Nearby transit stops"');
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
    expect(source).toContain('issue: "user_reported_better_walk"');
    expect(source).not.toContain('issue: "user_reported_better_walk_route"');
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");
    expect(smokeSource).toContain("shelter_map_panel_loaded");
    expect(smokeSource).toContain("shelter_map_panel_excerpt");
  });

  it("puts data freshness and heat proxy copy in the title card", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const layoutSource = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");

    expect(source).toContain("S.H.I.O.K. Shelter Map");
    expect(source).not.toContain("S.H.I.O.K. Index");
    expect(layoutSource).toContain('const metadataTitle = "S.H.I.O.K. Shelter Map";');
    expect(layoutSource).toContain("const metadataDescription =");
    expect(layoutSource).toContain("openGraph: {");
    expect(layoutSource).toContain("twitter: {");
    expect(layoutSource).toContain('siteName: "S.H.I.O.K. Shelter Map"');
    expect(layoutSource).toContain('url: "https://sgshiok.vercel.app/"');
    expect(layoutSource).toContain('card: "summary"');
    expect(layoutSource).not.toContain('title: "S.H.I.O.K. Index"');
    expect(source).toContain("See covered-walkway ratio, exposed gaps, and night lighting near transit");
    expect(source).not.toContain("See covered-walkway ratio and exposed gaps to transit");
    expect(source).not.toContain("Shelter-first walks to transit");
    expect(source).toContain('placeholder="Search OneMap address or 6-digit postal"');
    expect(source).toContain('aria-label="Search OneMap address or 6-digit postal"');
    expect(source).not.toContain('placeholder="Search address or 6-digit postal"');
    expect(source).not.toContain('aria-label="Search address or 6-digit postal"');
    expect(source).toContain("Enter at least 3 characters for OneMap search, or use a 6-digit postal code.");
    expect(source).not.toContain("Enter at least 3 characters or a 6-digit postal code.");
    expect(source).toContain("Selected OneMap result has no usable postal code.");
    expect(source).not.toContain("Selected result has no usable postal code.");
    expect(source).toContain("OneMap search is busy. Please try again in a moment.");
    expect(source).not.toContain("Search is busy. Please try again in a moment.");
    expect(source).toContain("Failed to search OneMap address.");
    expect(source).not.toContain("Failed to search postal location.");
    expect(source).toContain("Failed to load shelter-map data.");
    expect(source).not.toContain("Failed to load score data.");
    expect(source).not.toContain("Singapore walk-to-transit comfort");
    expect(source).toContain(
      "Shelter map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
    );
    expect(source).not.toContain(
      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
    );
    expect(source).toContain("function formatGeneratedDate(manifest: Manifest | null): string");
    expect(source).toContain("Locked score ${scoreText}");
    expect(source).toContain("function shelterEvidenceAnnouncement(score: ScoreRecord): string");
    expect(source).toContain('return parts.length > 0 ? `Shelter evidence ${parts.join("; ")}.` : "Shelter evidence unavailable.";');
    expect(source).toContain("${shelterText} Locked score ${scoreText}.");
    expect(source).toContain(
      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape."
    );
    expect(source).not.toContain(
      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; a 2021-2026 public-source sample found 8 missing rows out of 976."
    );
    expect(source).not.toContain("measured recent-source misses exist.");
    expect(source).not.toContain("newer completions may be missing.");
    expect(source).toContain(
      "Recent public-source check: {RECENT_PUBLIC_SOURCE_GAP_COPY}."
    );
    expect(source).toContain(
      "6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals"
    );
    expect(source).toContain("one of the 6 coordinate-backed HDB missing rows from frozen v1");
    expect(source).not.toContain("one of the 8 recent public-source postals missing from frozen v1");
    expect(source).not.toContain("8 missing rows out of 976 HDB completion and MCST proxy rows");
    expect(source).not.toContain("8 missing rows out of 976 (0.82%) HDB completion and MCST proxy rows");
    expect(source).not.toContain("Recent public-sample check:");
    expect(source).not.toContain(
      "Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals."
    );
    expect(source).toContain(
      "Data freshness at the 21 Aug 2026 manifest-only check: 12 sources current, with NParks Leaf Area Index just under its 120-day quarterly threshold; 6 stale, 2 manual, and 1 candidate address source with unknown age. No upstream URLs were probed. Stale sources are traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers."
    );
    expect(source).toContain("No upstream URLs were probed.");
    expect(source).not.toContain("oldest current source was NParks Leaf Area Index at 112.6 days old");
    expect(source).not.toContain(
      "Data freshness at latest manifest-only check:"
    );
    expect(source).not.toContain(
      "Data freshness: 12 sources current, oldest current source is NParks Leaf Area Index at 112.6 days old;"
    );
    expect(source).not.toContain(
      "Data freshness: 12 sources current, 6 stale, 2 manual, and 1 candidate address source with unknown age;"
    );
    expect(source).not.toContain("Source freshness audit:");
    expect(source).not.toContain("1 unknown-age; stale sources");
    expect(source).not.toContain("some greenery and boundary references");
    expect(source).not.toContain(
      "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
    );
    expect(source).not.toContain("6 supporting sources are stale.");
    expect(source).toContain('import { formatLockedScoreAvailabilityLine } from "../lib/locked-score-availability";');
    expect(source).toContain("formatLockedScoreAvailabilityLine(manifest)");
    expect(source).toContain("styles.coverageLine");
    expect(readFileSync(join(__dirname, "../locked-score-availability.ts"), "utf-8")).toContain(
      "Locked score availability:"
    );
    expect(source).toContain("© OpenStreetMap contributors");
    expect(source).toContain("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(source).toContain("ATTRIBUTION.md");
    expect(source).toContain("Heat proxy: shelter plus sparse NParks greenery, not measured temperature");
    expect(source).toContain("Night lighting");
    expect(source).toContain("Exposed gaps on {selectedWalkLabel}");
    expect(source).not.toContain("Exposed gaps on this walk");
    expect(source).toContain("include map coordinates.");
    expect(source).toContain(
      "Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load lamp-post points. Map evidence only; not part of the locked score."
    );
    expect(source).not.toContain("LTA lamp-post layer: 126,144 points");
    expect(source).not.toContain("Heat: shelter + NParks shade proxy");
    expect(source).not.toContain("Heat: shelter plus NParks shade proxy");
    expect(source).not.toContain("Heat proxy: shelter + sparse NParks greenery");
    expect(layoutSource).toContain(
      "Explore covered-walkway ratio, exposed gaps, night lighting evidence, and the secondary locked SHIOK score"
    );
    expect(layoutSource).not.toContain("covered-walkway exposure gaps");
    expect(layoutSource).not.toContain("night-lighting evidence");
    expect(layoutSource).not.toContain("measuring rain shelter, provisional heat proxy, crossing friction");
    expect(layoutSource).not.toContain("Singapore walk-to-transit comfort score");
  });

  it("keeps the footer aligned with covered-walkway and night-lighting evidence framing", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Source-derived covered-walkway ratio, exposed gaps, and night lighting map evidence.");
    expect(source).not.toContain("Source-derived covered-walkway ratio, exposed gaps, and night-lighting map evidence.");
    expect(source).not.toContain("Source-derived covered-walkway and exposure-gap evidence.");
    expect(source).not.toContain("Source-derived shelter map evidence.");
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
    const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");

    expect(source).toContain("Sheltered walk\n      </button>");
    expect(source).not.toContain("Sheltered\n      </button>");
    expect(source).toContain("Both walks\n      </button>");
    expect(source).not.toContain("Both\n      </button>");
    expect(source).toContain('"Sheltered walk"');
    expect(source).not.toContain('"Sheltered route"');
    expect(smokeSource).toContain('summary.cardText.includes("Sheltered walk")');
    expect(smokeSource).not.toContain('summary.cardText.includes("Sheltered route")');
    expect(source).toContain('aria-label="Walk display"');
    expect(source).toContain("Suggest better walk");
    expect(source).toContain("Copy walk QA JSON");
    expect(source).toContain('placeholder="Optional walk note"');
    expect(source).toContain("formatFeedbackTraceCount(feedbackPoints.length)");
    expect(source).toContain("walk segment${");
    expect(source).toContain("Walk segment {index + 1}");
    expect(source).not.toContain("sheltered route and shortest route");
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
    expect(source).toContain("function shelterEvidenceAnnouncementFromValues");
    expect(source).toContain("const sortedGaps = [...gaps].sort((a, b) => b.len_m - a.len_m);");
    expect(source).toContain("shelterEvidenceText: shelterEvidenceAnnouncementFromValues(selectedCoverage, exposureGaps)");
    expect(source).toContain("longest gap ${formatDistance(longestGap.len_m)}");
    // Copy shape: "Shortest walk has 45% covered-walkway ratio (30pp lower)"
    expect(source).toContain("${otherLabel} has ${otherPct}% covered-walkway ratio (${magnitude}pp ${direction})");
    expect(source).toContain('const otherLabel = viewedIsShortest ? "Sheltered walk" : "Shortest walk";');
    expect(source).not.toContain('const otherLabel = viewedIsShortest ? "Sheltered route" : "Shortest";');
    // Skip note when routes match or magnitude is trivial.
    expect(source).toContain("if (sameRoute || directBusFallback) return null;");
    expect(source).toContain("if (magnitude < 5) return null;");
    expect(source).toContain("className={styles.compareNote}");
    expect(source).toContain('aria-label="Walk comparison"');
    expect(source).not.toContain('aria-label="Route comparison"');
  });

  it("keeps greenery proxy and access link in a subtle walk-details strip, not a duplicate metric row", () => {
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
    const tsxSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(cssSource).toContain(".compareNote");
    expect(cssSource).toContain(".routeDetails");
    expect(cssSource).toContain(".routeDetails small");
    expect(cssSource).not.toContain(".routeSecondary {");
    expect(cssSource).not.toContain(".routeTertiary {");

    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Greenery proxy\"");
    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Shade proxy\"");
    expect(tsxSource).toContain(
      "Greenery proxy uses sparse NParks walk-adjacent greenery geometry for heat only; it is not measured temperature or Leaf Area Index."
    );
    expect(tsxSource).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Access link\"");
    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Snap connector\"");
    expect(tsxSource).toContain('value: lampOverlayEnabled ? "Map layer on; zoom in for lamp-post points" : "Map layer off",');
    expect(tsxSource).not.toContain('value: lampOverlayEnabled ? "Map layer on; zoom in for points" : "Map layer off",');
    expect(tsxSource).not.toContain('routeDetailItems.push({ label: "Night lighting", value: lampOverlayEnabled ? "Layer on" : "Layer off" });');
    expect(tsxSource).toContain("lampOverlayEnabled?: boolean;");
    expect(tsxSource).toContain("lampOverlayEnabled={lampOverlayEnabled}");
    expect(tsxSource).toContain(
      "Night lighting uses LTA lamp-post points as map evidence outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
    );
    expect(tsxSource).toContain(
      "Access link is the short walk from the postal or transit point onto the shelter-map walk."
    );
    expect(tsxSource).not.toContain("Snap connector is the short link");
    expect(tsxSource).not.toContain("onto the shelter-map route");
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
    expect(source).toContain("shelterEvidenceAnnouncement(selection.score)");
  });

  it("shows four display rows without changing the locked weights", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const proposalSource = readFileSync(join(__dirname, "../../section10-presentation-proposal.md"), "utf-8");
    const weightsYaml = readFileSync(join(__dirname, "../../../pipeline/config/weights.yaml"), "utf-8");

    expect(source).toContain("Shelter map evidence and locked score");
    expect(source).toContain('aria-label="Shelter map evidence and locked score breakdown"');
    expect(source).toContain('aria-label="Shelter map evidence reasons"');
    expect(source).toContain("Shelter map evidence preview");
    expect(source).toContain("Map evidence only");
    expect(source).not.toContain("Not scored in the current bundle");
    expect(source).toContain("Shelter map evidence unavailable");
    expect(source).toContain("Shelter map evidence available");
    expect(source).toContain("Locked score unavailable");
    expect(source).toContain("Locked terms unavailable");
    expect(source).not.toContain("Locked score incomplete");
    expect(source).toContain(
      "Partial locked score: shelter-map evidence may still be present, but one or more locked terms are unavailable; locked weights count missing terms as zero."
    );
    expect(source).not.toContain(
      "Partial locked score: shelter-map evidence may still be present, but one or more component scores are unavailable; locked weights count missing terms as zero."
    );
    expect(source).not.toContain(
      "Partial locked score: one or more component scores are unavailable; locked weights count missing terms as zero."
    );
    expect(source).not.toContain("Route evidence and locked score");
    expect(source).not.toContain('aria-label="Route evidence and locked score breakdown"');
    expect(source).not.toContain('aria-label="Route evidence reasons"');
    expect(source).not.toContain("Route evidence preview");
    expect(source).not.toContain("Route evidence unavailable");
    expect(source).not.toContain("Route evidence available");
    expect(source).not.toContain("Bundle score unavailable");
    expect(source).not.toContain("Bundle score incomplete");
    expect(source).toContain('label: "Locked SHIOK score"');
    expect(source).toContain("Start with the shelter trace and exposed gaps; use the locked score only to sort the published shelter-map bundle.");
    expect(source).not.toContain("Start with the shelter trace and exposed gaps; use the locked score only to sort the current bundle.");
    expect(source).not.toContain("Use this locked score to sort the current bundle");
    expect(source).not.toContain('label: "Overall SHIOK"');
    expect(source).not.toContain("Use this locked composite");
    expect(source).toContain('aria-label="Planning-area comparison"');
    expect(source).toContain("Compare planning-area records");
    expect(source).not.toContain("Compare nearby records");
    expect(source).toContain("Choose planning-area evidence view");
    expect(source).not.toContain("Rank records by");
    expect(source).not.toContain('aria-label="Rank by view"');
    expect(source).not.toContain("<strong>Rank by</strong>");
    expect(source).toContain("Planning-area list sorted by locked score; shelter evidence remains the primary view.");
    expect(source).toContain("Planning-area evidence view; locked SHIOK score is unchanged.");
    expect(source).not.toContain("Planning-area component evidence view; locked SHIOK score is unchanged.");
    expect(source).toContain("Loading planning-area {rankMetricLabel} ranks.");
    expect(source).not.toContain("Loading planning-area ranks...");
    expect(source).toContain("No comparable full locked scores in this planning area.");
    expect(source).toContain("No comparable planning-area records for ${rankMetricLabel}.");
    expect(source).toContain('rankEmptyMessage(rankMetric, rankMetricLabel)');
    expect(source).not.toContain("No comparable scored records in this planning area.");
    expect(source).not.toContain("Authoritative composite order.");
    expect(source).not.toContain("Planning-area order by locked score.");
    expect(source).not.toContain("Planning-area sub-score view; locked SHIOK score is unchanged.");
    expect(source).not.toContain("Planning-area component-score view; locked SHIOK score is unchanged.");
    expect(source).toContain("Four display rows; weights unchanged");
    expect(source).toContain('"No full locked score"');
    expect(source).not.toContain('"No locked score"');
    expect(source).toContain('"Bus evidence unavailable"');
    expect(source).not.toContain('"No bus score"');
    expect(source).toContain('label: "Shelter exposure"');
    expect(source).toContain('label: "Walk to transit"');
    expect(source).toContain('label: "Bus service support"');
    expect(source).toContain('bus: { low: "Limited bus-service evidence", high: "Stronger bus-service evidence" }');
    expect(source).not.toContain("Limited bus connectivity");
    expect(source).not.toContain("Strong bus connectivity");
    expect(source).toContain(
      "In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence."
    );
    expect(source).not.toContain(
      "Rain shelter and heat comfort currently share mostly the same covered-walkway evidence."
    );
    expect(source).toContain("Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first.");
    expect(source).toContain("Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}");
    expect(source).toContain('heat: { low: "Low heat-proxy evidence", high: "Stronger heat-proxy evidence" }');
    expect(source).not.toContain("Better heat-proxy score");
    expect(source).toContain("Crossing friction remains a 5% locked term, but has low separation in this release.");
    expect(source).not.toContain('label: "Rain shelter"');
    expect(source).not.toContain('label: "Heat proxy"');
    expect(source).not.toContain('label: "Crossing friction"');
    expect(proposalSource).toContain("stop presenting the prior five locked-term rows");
    expect(proposalSource).not.toContain("stop presenting the prior five component-score rows");
    expect(proposalSource).toContain(
      "In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence."
    );
    expect(proposalSource).toContain("Use it to sort the published shelter-map bundle");
    expect(proposalSource).not.toContain("stop presenting the current five component-score rows");
    expect(proposalSource).not.toContain("Rain shelter and heat comfort currently share mostly");
    expect(proposalSource).not.toContain("sort the current bundle");
    expect(proposalSource).toContain("Selected walk distance from this postal code to the chosen MRT/LRT or bus access point.");
    expect(proposalSource).toContain("deciding whether the walk actually works");
    expect(proposalSource).toContain("[shelter-map walk]");
    expect(proposalSource).toContain("the shelter-map\nwalk trace and its exposed gaps");
    expect(proposalSource).toContain("walk distance and transit target rather than above walk exposure");
    expect(proposalSource).toContain("strongest evidence in this locked release is the shelter-map walk trace");
    expect(proposalSource).not.toContain("current strongest evidence is the shelter-map walk trace");
    expect(proposalSource).not.toContain("five subscore rows");
    expect(proposalSource).not.toContain("Selected route distance from this postal code");
    expect(proposalSource).not.toContain("deciding whether a route actually works");
    expect(proposalSource).not.toContain("[route map]");
    expect(proposalSource).not.toContain("routed shelter trace");
    expect(proposalSource).not.toContain("route distance and transit target");
    expect(proposalSource).not.toContain("above route exposure");

    expect(weightsYaml).toContain("transit_access: 0.35");
    expect(weightsYaml).toContain("bus_connectivity: 0.20");
    expect(weightsYaml).toContain("rain_shelter: 0.25");
    expect(weightsYaml).toContain("heat_comfort: 0.15");
    expect(weightsYaml).toContain("crossing_friction: 0.05");
  });

  it("keeps the locked score visually secondary to the shelter evidence", () => {
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");

    const exposureHeroFontSize = cssFontSizePx(cssSource, ".exposureHero strong");
    const lockedScoreFontSize = cssFontSizePx(cssSource, ".scoreBadge strong");

    expect(exposureHeroFontSize).toBeGreaterThan(lockedScoreFontSize);
    expect(exposureHeroFontSize).toBe(17);
    expect(lockedScoreFontSize).toBe(13);
    expect(cssSource).toContain(".scoreBadge span");
    expect(cssSource).toContain("font-size: 9px;");
    expect(cssSource).not.toContain(".scoreBadge strong {\n    font-size: 18px;");
  });
});
