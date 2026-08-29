import { readFileSync } from "fs";
import { join } from "path";

function cssFontSizePx(cssSource: string, selector: string): number {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cssSource.match(new RegExp(`${escapedSelector}\\s*\\{[^}]*font-size:\\s*(\\d+)px;`, "m"));
  if (!match) throw new Error(`Missing font-size for ${selector}`);
  return Number.parseInt(match[1], 10);
}

function cssRuleBody(cssSource: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cssSource.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "m"));
  if (!match) throw new Error(`Missing CSS rule for ${selector}`);
  return match[1];
}

function expectSourceOrder(source: string, snippets: string[]): void {
  let previousIndex = -1;
  for (const snippet of snippets) {
    const index = source.indexOf(snippet);
    expect(index).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

describe("score card copy", () => {
  it("distinguishes far connected shelter-map walks from disconnected walks", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Connected walk beyond 1.2 km");
    expect(source).toContain("No connected shelter-map walk");
    expect(source).not.toContain("Shelter-map walk not connected yet");
    expect(source).toContain("No connected shelter-map walk to ${transitModeLabel(transitMode)} within 1.2 km");
    expect(source).toContain('return "transit stop or exit";');
    expect(source).not.toContain('return "transit";');
    expect(source).not.toContain("No connected shelter-map walk to ${transitModeLabel(transitMode)} within range");
    expect(source).toContain("No shelter-map walk to ${transitModeLabel(transitMode)} was found within the locked 1.2 km transit range.");
    expect(source).toContain("Transit stop or exit found");
    expect(source).not.toContain("Transit target found");
    expect(source).toContain("No qualifying transit stop or exit within 1.2 km");
    expect(source).not.toContain("No qualifying transit target within 1.2 km");
    expect(source).not.toContain("No qualifying transit stop within 1.2 km");
    expect(source).not.toContain("No transit stop within scoring range");
    expect(source).toContain("Transit stops or exits exist, but no connected shelter-map walk is published for this postal.");
    expect(source).not.toContain("Transit stops or exits exist, but the published shelter-map data has no connected shelter-map walk yet.");
    expect(source).not.toContain("Transit targets exist, but the published shelter-map data has no connected shelter-map walk yet.");
    expect(source).toContain("No qualifying MRT/LRT exit or bus stop was found within the locked 1.2 km transit range for this postal.");
    expect(source).not.toContain("Transit beyond scoring range");
    expect(source).not.toContain("Transit beyond locked range");
    expect(source).not.toContain("within the 1.2 km scoring range for this postal");
    expect(source).toContain("Closest connected shelter-map walk to ${label} is ${formatDistance(nearestM)}");
    expect(source).toContain("Closest connected shelter-map walk found is about ${formatDistance(nearestM)}");
    expect(source).toContain("No shelter-map walk to ${label} within 1.2 km locked range");
    expect(source).not.toContain("No shelter-map walk to ${label} within locked transit range");
    expect(source).not.toContain("Closest connected ${label} shelter-map walk is ${formatDistance(nearestM)}");
    expect(source).not.toContain("Closest routed ${label} is ${formatDistance(nearestM)}");
    expect(source).not.toContain("Closest routed transit found is about ${formatDistance(nearestM)}");
    expect(source).not.toContain("No routed ${transitModeLabel(transitMode)} within range");
    expect(source).not.toContain("No ${label} walk within locked transit range");
    expect(source).not.toContain("No ${label} walk within 1.2 km locked range");
    expect(source).not.toContain("No connected ${transitModeLabel(transitMode)} shelter-map walk within range");
    expect(source).not.toContain("No ${transitModeLabel(transitMode)} walk was found within the locked 1.2 km transit range.");
    expect(source).toContain("Locked transit range is 1.2 km");
    expect(source).toContain("Beyond 1.2 km locked range");
    expect(source).not.toContain("Outside locked transit range");
    expect(source).not.toContain("Outside current 1.2 km scoring range");
    expect(source).toContain("Nearby transit may still exist beyond the locked 1.2 km transit range");
    expect(source).not.toContain("current scoring range is 1.2 km");
    expect(source).not.toContain("within the current scoring range");
    expect(source).not.toContain("Current scoring range is 1.2 km");
    expect(source).not.toContain("Outside current scoring range");
    expect(source).toContain('if (option.id === "best_transit") return available ? "displayed walk" : "no published walk";');
    expect(source).not.toContain('if (option.id === "best_transit") return available ? "displayed walk" : "unavailable";');
    expect(source).toContain("No verified shelter-map walk yet");
    expect(source).toContain("Nearby direct bus service without verified shelter-map walk");
    expect(source).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(source).toContain(
      "Direct bus service is shown as fallback evidence; no verified shelter-map walk to an official LTA bus stop is published, so the locked bus score remains 0."
    );
    expect(source).not.toContain("the bus term remains 0");
    expect(source).not.toContain("locked bus term remains 0");
    expect(source).toContain("Straight-line bus estimate");
    expect(source).not.toContain("Direct bus line estimate");
    expect(source).not.toContain("Direct bus estimate");
    expect(source).toContain('displayContextLabel: directBusFallback ? "Evidence display" : "Walk display"');
    expect(source).toContain(
      'routeDisplayLabel: directBusFallback ? "straight-line bus estimate" : routeDisplayAnnouncement(routeMode, sameRoute)'
    );
    expect(source).toContain("selectedWalkPrepPhrase");
    expect(source).toContain("selectedWalkHeadingPhrase");
    expect(source).not.toContain("Shelter-map walk access was not verified");
    expect(source).not.toContain("current walking graph could not connect a route yet");
    expect(source).not.toContain("Transit route not connected yet");
    expect(source).not.toContain("Transit stops or exits exist, but this shelter-map bundle has no connected shelter-map walk yet.");
    expect(source).not.toContain("Transit stops or exits exist, but this shelter-map bundle has no connected walking route yet.");
    expect(source).not.toContain("Walking route not connected yet");
    expect(source).not.toContain("Walking-route shelter not verified yet");
    expect(source).not.toContain("Walking-route access was not verified");
    expect(source).not.toContain("Direct line to bus stop; walking route pending.");
    expect(source).toContain("Straight-line bus estimate; shelter-map walk pending.");
    expect(source).not.toContain("Direct line to bus stop; shelter-map walk pending.");
    expect(source).toContain('const comparisonMetricLabel = directBusFallback ? "Verified shelter-map walk" : "Extra walk";');
    expect(source).toContain('const comparisonMetricValue = directBusFallback ? "Pending" : extraWalkLabel;');
    expect(source).toContain('<Metric label={comparisonMetricLabel} value={comparisonMetricValue} />');
    expect(source).not.toContain('<Metric label="Extra walk" value={extraWalkLabel} />');
    expect(source).not.toContain("Shelter-map route not verified yet");
    expect(source).not.toContain("Shelter-map route access was not verified");
    expect(source).not.toContain("Outside current candidate thresholds");
    expect(source).not.toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
    expect(source).not.toContain("Transit stops or exits exist, but this bundle has no connected walking route evidence yet.");
    expect(source).not.toContain("Transit candidate found");
    expect(source).not.toContain("No transit candidate nearby");
    expect(source).toContain("Transit stop or exit not named");
    expect(source).toContain("MRT/LRT exit or bus stop not named");
    expect(source).not.toContain("No transit stop or exit loaded");
    expect(source).not.toContain("MRT/LRT exit or bus stop loaded");
    expect(source).not.toContain("No transit target loaded");
    expect(source).not.toContain("Transit stop or exit loaded");
    expect(source).not.toContain("No transit found nearby");
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

    expect(smokeSource).toContain('summary.cardText.includes("No full locked score in published shelter-map data")');
    expect(smokeSource).toContain('summary.cardText.includes("Partial shelter-map evidence may be available")');
    expect(smokeSource).not.toContain('summary.cardText.includes("No full locked score in this bundle")');
    expect(smokeSource).not.toContain('summary.cardText.includes("No full score in this bundle")');
    expect(smokeSource).not.toContain("needs usable location evidence");
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    expect(source).toContain(
      "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet."
    );
    expect(source).toContain("unavailable in the published shelter-map data");
    expect(source).toContain("No full locked score in published shelter-map data");
    expect(source).toContain("Partial shelter-map evidence may be available");
    expect(source).not.toContain("Awaiting locked score");
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

  it("names selected MRT/LRT exits and bus stops explicitly in the custom-stop badge", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Viewing selected MRT/LRT exit or bus stop");
    expect(source).toContain("Custom MRT/LRT exit or bus stop selected.");
    expect(source).toContain("selected MRT/LRT exit or bus stop is shown by straight-line distance");
    expect(source).toContain("unavailable for this selected MRT/LRT exit or bus stop");
    expect(source).toContain("Published shelter-map walk selected.");
    expect(source).toContain("↺ Published shelter-map walk");
    expect(source).not.toContain("Viewing selected stop or exit");
    expect(source).not.toContain("Custom stop or exit selected.");
    expect(source).not.toContain("Viewing selected transit target");
    expect(source).not.toContain("Custom transit target selected.");
    expect(source).not.toContain("Viewing selected transit stop");
    expect(source).not.toContain("Custom transit stop selected.");
    expect(source).not.toContain("Published walk selected.");
    expect(source).not.toMatch(/>\s*↺ Published walk\s*</);
    expect(source).toContain('aria-label="Transit stop or exit type"');
    expect(source).not.toContain('aria-label="Transit target type"');
    expect(source).not.toContain('aria-label="Transit target"');
    const pickerSource = readFileSync(join(__dirname, "../../components/transit-stop-picker.tsx"), "utf-8");
    expect(pickerSource).toContain("Nearby transit stops and exits");
    expect(pickerSource).toContain('aria-label="Transit stop and exit picker"');
    expect(pickerSource).toContain('aria-label="Nearby transit stops and exits"');
    expect(pickerSource).not.toContain("Nearby transit targets");
    expect(pickerSource).not.toContain('aria-label="Transit target picker"');
    expect(pickerSource).not.toContain('aria-label="Nearby transit targets"');
    expect(pickerSource).not.toContain('aria-label="Transit stop picker"');
    expect(pickerSource).not.toContain('aria-label="Nearby transit stops"');
    expect(source).toContain('{ id: "best_transit", label: "Auto-picked" }');
    expect(source).toContain('{ id: "mrt_lrt", label: "MRT/LRT exits" }');
    expect(source).toContain('{ id: "bus", label: "Bus stops" }');
    expect(source).not.toContain('{ id: "best_transit", label: "Best transit" }');
    expect(source).not.toContain('{ id: "mrt_lrt", label: "MRT/LRT" }');
    expect(source).not.toContain('{ id: "bus", label: "Bus" }');
    expect(source).toContain('if (mode === "mrt_lrt") return "MRT/LRT exit";');
    expect(source).toContain('if (mode === "bus") return "bus stop";');
    expect(source).not.toContain('if (mode === "mrt_lrt") return "MRT/LRT";');
    expect(source).not.toContain('if (mode === "bus") return "bus";');
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

  it("names shelter correction in copied report while keeping route-mode compatibility", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("Copy correction report");
    expect(source).toContain("walk_mode: routeMode");
    expect(source).toContain("route_mode: routeMode");
    expect(source).toContain('issue: "user_reported_shelter_correction"');
    expect(source).toContain('legacy_issue: "user_reported_better_walk"');
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
    expect(source).toContain(
      "See covered-walkway ratio and exposed gaps on the walk to a transit stop or exit, plus the night-lighting map layer",
    );
    expect(source).not.toContain("See covered-walkway ratio, exposed gaps, and night lighting on the walk to transit");
    expect(source).not.toContain("See covered-walkway ratio, exposed gaps, and night lighting near transit");
    expect(source).not.toContain("See covered-walkway ratio and exposed gaps to transit");
    expect(source).not.toContain("See covered-walkway ratio and exposed gaps on the walk to transit, plus the night-lighting map layer");
    expect(source).not.toContain("Shelter-first walks to transit");
    expect(source).toContain('placeholder="Search OneMap address or 6-digit postal"');
    expect(source).toContain('aria-label="Search OneMap address or 6-digit postal"');
    expect(source).toContain("const SAMPLE_POSTAL_RESULT: SearchResult = {");
    expect(source).toContain('POSTAL: "560234"');
    expect(source).toContain('SEARCHVAL: "Try Mayflower S560234"');
    expect(source).toContain("const loadSamplePostal = async () => {");
    expect(source).toContain('aria-label="Sample search"');
    expect(source).toContain("Try a known address?");
    expect(source).not.toContain("Need a quick look?");
    expect(source).toContain("Try Mayflower S560234");
    expect(source).toContain('{loading ? "Searching" : "Search"}');
    expect(source).not.toContain('{loading ? "Loading" : "Search"}');
    expect(source).not.toContain("Try S560234");
    expect(source).not.toContain('placeholder="Search address or 6-digit postal"');
    expect(source).not.toContain('aria-label="Search address or 6-digit postal"');
    expect(source).toContain("Enter at least 3 characters for OneMap search, or use a 6-digit postal code.");
    expect(source).toContain("Try another address spelling or a 6-digit postal code.");
    expect(source).not.toContain("No OneMap match found. Try a 6-digit postal code.");
    expect(source).not.toContain("Enter at least 3 characters or a 6-digit postal code.");
    expect(source).toContain("This OneMap match has no 6-digit postal code. Choose another match or enter the postal code directly.");
    expect(source).not.toContain("Selected OneMap result has no usable postal code.");
    expect(source).not.toContain("Selected result has no usable postal code.");
    expect(source).toContain("OneMap search is busy. Try again in a moment, or enter a 6-digit postal code.");
    expect(source).not.toContain("OneMap search is busy. Please try again in a moment.");
    expect(source).not.toContain("Search is busy. Please try again in a moment.");
    expect(source).toContain("OneMap address search failed. Try a 6-digit postal code or search again.");
    expect(source).not.toContain("Failed to search OneMap address.");
    expect(source).not.toContain("Failed to search postal location.");
    expect(source).toContain("Failed to load shelter-map data.");
    expect(source).not.toContain("Failed to load score data.");
    expect(source).not.toContain("Singapore walk-to-transit comfort");
    expect(source).toContain(
      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}"
    );
    expect(source).not.toContain(
      "Shelter-map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
    );
    expect(source).not.toContain(
      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
    );
    expect(source).toContain("function formatGeneratedDate(manifest: Manifest | null): string");
    expect(source).toContain('return "Date unavailable";');
    expect(source).toContain('const scoreLabel = previewRoute || displayScore === null || displayScore === undefined');
    expect(source).toContain("${scoreLabel} ${scoreText}");
    expect(source).toContain("function shelterEvidenceAnnouncement(score: ScoreRecord): string");
    expect(source).toContain('evidenceLabel = "Shelter-map walk evidence"');
    expect(source).toContain('`${evidenceLabel} ${parts.join("; ")}.`');
    expect(source).not.toContain('"Walk evidence unavailable"');
    expect(source).toContain("${shelterText} ${scoreLabel} ${scoreText}.");
    expect(source).toContain(
      "Address list: June 2020 OneMap-derived postal scrape; newer developments may be missing."
    );
    expect(source).not.toContain("measured recent-source misses exist.");
    expect(source).not.toContain("newer completions may be missing.");
    expect(source).toContain(
      "{RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}."
    );
    expect(source).toContain('const RECENT_PUBLIC_SOURCE_SAMPLE_LABEL = "P19 v2 28 Aug 2026 public-source sample";');
    expect(source).not.toContain("RECENT_PUBLIC_SOURCE_CHECK_LABEL");
    expect(source).not.toContain('const RECENT_PUBLIC_SOURCE_CHECK_LABEL = "16 Aug 2026 public-source check";');
    expect(source).not.toContain("Recent public-source check: {RECENT_PUBLIC_SOURCE_GAP_COPY}.");
    expect(source).toContain(
      "6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list"
    );
    expect(source).not.toContain("unvalidated MCST proxy rows");
    expect(source).not.toContain("recorded postal");
    expect(source).not.toContain("source-quality warnings");
    expect(source).toContain("This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list");
    expect(source).not.toContain("measured full-universe gap");
    expect(source).not.toContain("approval to promote v2");
    expect(source).not.toContain("Current for gap sizing until 4 Sep 2026 UTC");
    expect(source).not.toContain("out of 976 (0.82%) 2021-2026 public-source rows with postals");
    expect(source).toContain(
      "one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}"
    );
    expect(source).toContain('"521400": "2021-2026 HDB public-source sample"');
    expect(source).not.toContain("HDB 2021-2026 geocoded rows");
    expect(source).not.toContain("MCST 2021-2026 proxy rows");
    expect(source).not.toContain("HDB missing rows from frozen v1");
    expect(source).not.toContain("one of the 6 coordinate-backed HDB missing rows from frozen v1 (${source})");
    expect(source).not.toContain("Recent public-sample check:");
    expect(source).toContain(
      "28 Aug 2026 OSM addr:postcode coverage cross-check: 25,919 valid distinct postcodes measured; 25,899 overlap the 124,443 June 2020 address-list postcodes, with 20 valid OSM-only postcodes. OSM remains geometry evidence, not the address registry."
    );
    expect(source).not.toContain("124,443 frozen postals");
    expect(source).not.toContain("20 Aug 2026 OSM addr:postcode check:");
    expect(source).not.toContain("Live OSM addr:postcode coverage:");
    expect(source).not.toContain("OSM remains the address registry");
    expect(source).toContain(
      "Source-age snapshot: 28 Aug 2026 22:21 UTC source-age check; 11 sources were current, 9 stale, 3 manual, and 1 unknown-age candidate. This was not a live source refresh."
    );
    expect(source).not.toContain("Source-age snapshot: 28 Aug 2026 22:21 UTC manifest-only check");
    expect(source).not.toContain("No upstream URLs were probed.");
    expect(source).not.toContain("Data freshness: 28 Aug 2026 22:21 UTC");
    expect(source).toContain("<summary>Source freshness detail</summary>");
    expect(source).toContain(
      "The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed"
    );
    expect(source).not.toContain("postal-universe seed");
    expect(source).not.toContain("The source policy covers every source in raw/manifest.json");
    expect(source).not.toContain("ACRA, other-UEN");
    expect(source).toContain("Stale sources are ordered by days past their freshness threshold");
    expect(source).toContain(
      "Planning Area Boundaries (MP2019 No Sea), NParks Tracks, NParks Heritage Road Green Buffers, Traffic Signals"
    );
    expect(source).toContain("source refreshes use new dated input versions instead of changing published data in place");
    expect(source).not.toContain("source refreshes use new versioned inputs instead of changing the frozen v1 data in place");
    expect(source).not.toContain("source refreshes use new versioned inputs instead of changing the frozen v1 bundle in place");
    expect(source).not.toContain("Stale-source refreshes require a new numbered input version");
    expect(source).not.toContain("Stale sources include");
    expect(source).toContain(
      "At the 28 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold"
    );
    expect(source).toContain("HDB Existing Building was the oldest current item");
    expect(source).toContain("Freshness may have changed since that snapshot");
    expect(source).not.toContain("zero-mutation source-age check before release work");
    expect(source).not.toContain("Bus Stops, Bus Services, and Bus Routes are current but 1.2 days from stale");
    expect(source).not.toContain("51.2 days until stale");
    expect(source).toContain("NParks Leaf Area Index");
    expect(source).not.toContain("0.0 days until stale");
    expect(source).not.toContain("0.1 days from its 120-day threshold");
    expect(source).not.toContain("0.3 days from its 120-day threshold");
    expect(source).not.toContain("6.4 days from its 120-day threshold");
    expect(source).not.toContain("Data freshness at the 27 Aug 2026 UTC manifest-only check");
    expect(source).not.toContain("Data freshness at the 28 Aug 2026 08:05 UTC manifest-only check");
    expect(source).not.toContain("Data freshness: 28 Aug 2026 11:52 UTC manifest-only check");
    expect(source).not.toContain("Data freshness at the 28 Aug 2026 10:27 UTC manifest-only check: 9 sources current");
    expect(source).not.toContain("Data freshness at the 21 Aug 2026 UTC manifest-only check: 12 sources current, 6 stale");
    expect(source).not.toContain("Stale sources are Traffic Signals, Planning Area Boundaries");
    expect(source).not.toContain("Stale sources are traffic signals, planning area boundary");
    expect(source).not.toContain("Stale sources include Covered Linkway");
    expect(source).not.toContain("1 candidate address source with unknown age");
    expect(source).not.toContain("with NParks Leaf Area Index just under its 120-day quarterly threshold");
    expect(source).not.toContain("Bus Stops, Bus Services, and Bus Routes are current but 1.7 days from stale");
    expect(source).not.toContain("No upstream URLs were probed.");
    expect(source).not.toContain("oldest current source was NParks Leaf Area Index at 112.6 days old");
    expect(source).not.toContain(
      "Data freshness at latest manifest-only check:"
    );
    expect(source).not.toContain("Data freshness at the 21 Aug 2026 manifest-only check");
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
    expect(source).toContain(
      "Covered Linkway follows a quarterly 120-day freshness threshold; published data uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched the published data; stale source data still requires a new dated input version before any refresh."
    );
    expect(source).not.toContain("stale payload ages");
    expect(source).not.toContain("check found current Covered Linkway");
    expect(source).not.toContain("traffic-signal listings still matched frozen v1");
    expect(source).not.toContain("Traffic Signals URLs still match frozen v1");
    expect(source).not.toContain("discovery-only DataMall check");
    expect(source).not.toContain("traffic signals still matched");
    expect(source).not.toContain("21 Aug 2026 metadata-only DataMall check");
    expect(source).not.toContain("discovery URLs differ from frozen v1");
    expect(source).not.toContain("current shelter-layer discovery URLs differ from frozen v1");
    expect(source).not.toContain(
      "frozen v1 uses the Mar 2026 LTA geospatial listing, and any refresh must be a new numbered input version."
    );
    expect(source).not.toContain("refresh the current Covered Linkway in place");
    expect(source).toContain(
      "NParks Leaf Area Index is a freshness-only reference table here; walk heat evidence uses shelter plus sparse walk-adjacent greenery geometry, not LAI or measured temperature."
    );
    expect(source).not.toContain("Leaf Area Index is route heat evidence");
    expect(source).not.toContain("route heat evidence uses shelter");
    expect(source).toContain('import { formatLockedScoreAvailabilityLine } from "../lib/locked-score-availability";');
    expect(source).toContain("formatLockedScoreAvailabilityLine(manifest)");
    expect(source).toContain("styles.coverageLine");
    expect(source).toContain("lockedScoreAvailabilityLine?: string | null;");
    expect(source).toContain("lockedScoreAvailabilityLine={lockedScoreAvailabilityLine}");
    expect(source).toContain("{lockedScoreAvailabilityLine && <span>{lockedScoreAvailabilityLine}</span>}");
    expect(source).toContain("{lockedScoreAvailabilityLine && <p className={styles.coverageLine}>{lockedScoreAvailabilityLine}</p>}");
    expectSourceOrder(source, [
      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}",
      "{lockedScoreAvailabilityLine && <p className={styles.coverageLine}>{lockedScoreAvailabilityLine}</p>}",
      '<form onSubmit={handleSearch} className={styles.searchForm} aria-busy={loading}>',
      "<SearchFeedback results={results} loading={loading} error={error} searched={searchAttempted} />",
      '<details className={styles.dataLimits}>',
      "<summary>Data limits: June 2020 addresses; roughly 1 in 4 lack full locked scores</summary>",
      "Address list: June 2020 OneMap-derived postal scrape; newer developments may be missing.",
      "{RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}.",
      "{OSM_ADDR_POSTCODE_COVERAGE_COPY}",
      "{DATA_FRESHNESS_SUMMARY_COPY}",
      "<summary>Source freshness detail</summary>",
      "{DATA_FRESHNESS_DETAIL_COPY}",
      "{COVERED_LINKWAY_FRESHNESS_COPY}",
      "{LEAF_AREA_INDEX_REFERENCE_COPY}",
    ]);
    expect(readFileSync(join(__dirname, "../locked-score-availability.ts"), "utf-8")).toContain(
      "June 2020 address-list records"
    );
    expect(readFileSync(join(__dirname, "../locked-score-availability.ts"), "utf-8")).toContain(
      "address-list records (${pctText})"
    );
    expect(readFileSync(join(__dirname, "../locked-score-availability.ts"), "utf-8")).not.toContain(
      "of ${formatWholeNumber(recordCount)} records"
    );
    expect(readFileSync(join(__dirname, "../locked-score-availability.ts"), "utf-8")).not.toContain(
      "Locked score coverage:"
    );
    expect(source).not.toContain("<summary>Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores</summary>");
    expect(source).not.toContain("<summary>Data limits: frozen v1 addresses; incomplete locked scores</summary>");
    expect(source).not.toContain("<summary>Data limits: frozen v1 address list</summary>");
    expect(source).not.toContain("<summary>Data limits</summary>");
    expect(readFileSync(join(__dirname, "../locked-score-availability.ts"), "utf-8")).toContain(
      "missing full scores"
    );
    expect(readFileSync(join(__dirname, "../locked-score-availability.ts"), "utf-8")).not.toContain(
      "full locked sorting index"
    );
    expect(source).toContain(
      "Sources: LTA/data.gov.sg and OneMap/SLA for official data; OpenStreetMap contributes geometry evidence, not the address registry"
    );
    expect(source).toContain("© OpenStreetMap contributors");
    expect(source).not.toContain("Sources: LTA/data.gov.sg, OneMap/SLA, © OpenStreetMap contributors");
    expect(source).toContain("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(source).toContain("ATTRIBUTION.md");
    expect(source).toContain("Heat estimate: shelter plus sparse nearby greenery, not measured temperature");
    expect(source).toContain("Night lighting");
    expect(source).toContain("Exposed gaps {selectedWalkHeadingPhrase}");
    expect(source).not.toContain("Exposed gaps on this walk");
    expect(source).not.toContain("Exposed gaps on {selectedWalkLabel}");
    expect(source).toContain("${formatDistance(score.paths.sheltered_m)} sheltered walk to ${transitModeLabel(transitMode)}");
    expect(source).not.toContain("${formatDistance(score.paths.sheltered_m)} to ${transitModeLabel(transitMode)}");
    expect(source).toContain('${gapsWithCoordinates === 1 ? "includes" : "include"} map coordinates.');
    expect(source).not.toContain("} include map coordinates.");
    expect(source).toContain('exposureGaps.length === 1 ? "this exposed gap" : "these exposed gaps"');
    expect(source).toContain("Showing the ${visibleExposureGaps.length} longest exposed gaps;");
    expect(source).toContain("const hiddenExposureGaps = exposureGaps.slice(visibleExposureGaps.length);");
    expect(source).toContain("const hiddenGapsWithCoordinates = hiddenExposureGaps.filter((gap) => formatGapLocation(gap)).length;");
    expect(source).toContain("Show {hiddenExposureGaps.length} shorter exposed gap");
    expect(source).toContain("with map coordinate");
    expect(source).not.toContain("Showing the longest ${visibleExposureGaps.length};");
    expect(source).toContain("styles.gapAction");
    expect(source).toContain("Focus on map");
    expect(source).toContain("Selected on map");
    expect(source).not.toContain(">Focus map</small>");
    expect(readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8")).toContain(
      "grid-template-columns: 58px minmax(0, 1fr) auto;"
    );
    expect(source).toContain("nightLightingLayerNote(lampOverlayEnabled)");
    expect(source).toContain("export function nightLightingLayerNote(lampOverlayEnabled: boolean): string");
    expect(source).toContain("LTA lamp-post locations can be shown on the map.");
    expect(source).toContain("LTA lamp-post locations are shown on the map.");
    expect(source).toContain("Map layer only; not part of the locked score.");
    expect(source).not.toContain("LTA lamp-post locations load from the published lamp-post layer.");
    expect(source).not.toContain("LTA lamp-post locations load from the published night-lighting artifact.");
    expect(source).toContain("Switch on and zoom into a neighbourhood to load lamp-post points.");
    expect(source).toContain("Zoom into a neighbourhood to load lamp-post points.");
    expect(source).not.toContain("Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026.");
    expect(source).not.toContain("LTA lamp-post layer: 126,144 points");
    expect(source).not.toContain("Heat: shelter + NParks shade proxy");
    expect(source).not.toContain("Heat: shelter plus NParks shade proxy");
    expect(source).not.toContain("Heat proxy: shelter + sparse NParks greenery");
    expect(source).not.toContain("Heat proxy: shelter plus sparse nearby greenery, not measured temperature");
    expect(layoutSource).toContain(
      "Explore covered-walkway ratio, exposed gaps, the night-lighting map layer, and the secondary locked SHIOK score on Singapore walks to transit."
    );
    expect(layoutSource).not.toContain("night lighting evidence");
    expect(layoutSource).not.toContain("secondary locked SHIOK score for Singapore walks to transit");
    expect(layoutSource).not.toContain("covered-walkway exposure gaps");
    expect(layoutSource).not.toContain("night-lighting evidence");
    expect(layoutSource).not.toContain("measuring rain shelter, provisional heat proxy, crossing friction");
    expect(layoutSource).not.toContain("Singapore walk-to-transit comfort score");
  });

  it("keeps the footer aligned with covered-walkway and night-lighting evidence framing", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain(
      "Walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.",
    );
    expect(source).not.toContain(
      "Source-derived walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.",
    );
    expect(source).not.toContain("Source-derived covered-walkway ratio, exposed gaps, and night lighting map evidence.");
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
    expect(source).not.toContain("Trace shelter correction");
    expect(source).toContain("Done tracing shelter");
    expect(source).toContain("Report missing shelter");
    expect(source).toContain("Copy correction report");
    expect(source).toContain('placeholder="Optional shelter note"');
    expect(source).not.toContain("Suggest better walk");
    expect(source).not.toContain("Copy walk QA JSON");
    expect(source).not.toContain('placeholder="Optional walk note"');
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
    expect(source).toContain("shelterEvidenceText: shelterEvidenceAnnouncementFromValues(");
    expect(source).toContain("longest gap ${formatDistance(longestGap.len_m)}");
    // Copy shape: "Shortest walk has 45% covered-walkway ratio (30pp lower than sheltered walk)"
    expect(source).toContain("${otherLabel} has ${otherPct}% covered-walkway ratio (${magnitude}pp ${direction} than ${viewedLabel})");
    expect(source).toContain('const viewedLabel = viewedIsShortest ? "shortest walk" : "sheltered walk";');
    expect(source).toContain('const otherLabel = viewedIsShortest ? "Sheltered walk" : "Shortest walk";');
    expect(source).not.toContain('const otherLabel = viewedIsShortest ? "Sheltered route" : "Shortest";');
    // Skip note when routes match or magnitude is trivial.
    expect(source).toContain("if (sameRoute || directBusFallback) return null;");
    expect(source).toContain("if (magnitude < 5) return null;");
    expect(source).toContain("className={styles.compareNote}");
    expect(source).toContain('aria-label="Walk comparison"');
    expect(source).not.toContain('aria-label="Route comparison"');
  });

  it("keeps nearby greenery and access link in a subtle walk-details strip, not a duplicate metric row", () => {
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
    const tsxSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(cssSource).toContain(".compareNote");
    expect(cssSource).toContain(".routeDetails");
    expect(cssSource).toContain(".routeDetails small");
    expect(cssSource).not.toContain(".routeSecondary {");
    expect(cssSource).not.toContain(".routeTertiary {");

    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Nearby greenery\"");
    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Greenery proxy\"");
    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Shade proxy\"");
    expect(tsxSource.indexOf('label: "Night lighting"')).toBeLessThan(
      tsxSource.indexOf('routeDetailItems.push({ label: "Nearby greenery"')
    );
    expect(tsxSource).toContain(
      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
    );
    expect(tsxSource).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Access link\"");
    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Snap connector\"");
    expect(tsxSource).toContain("value: nightLightingRouteDetailValue(lampOverlayEnabled),");
    expect(tsxSource).toContain("export function nightLightingRouteDetailValue(lampOverlayEnabled: boolean): string");
    expect(tsxSource).toContain("Night-lighting layer off; switch on night lighting, then zoom in");
    expect(tsxSource).toContain('{lampOverlayEnabled ? "Night-lighting layer shown" : "Show night-lighting layer"}');
    expect(tsxSource).not.toContain('{lampOverlayEnabled ? "Night-lighting layer on" : "Night-lighting layer off"}');
    expect(tsxSource).not.toContain('{lampOverlayEnabled ? "Night lighting on" : "Night lighting off"}');
    expect(tsxSource).not.toContain('value: lampOverlayEnabled ? "Map layer on; zoom in for points" : "Map layer off",');
    expect(tsxSource).not.toContain('value: lampOverlayEnabled ? "Map layer on; zoom in for lamp-post points" : "Map layer off",');
    expect(tsxSource).not.toContain("Available; map layer off");
    expect(tsxSource).not.toContain('routeDetailItems.push({ label: "Night lighting", value: lampOverlayEnabled ? "Layer on" : "Layer off" });');
    expect(tsxSource).toContain("lampOverlayEnabled?: boolean;");
    expect(tsxSource).toContain("setLampOverlayEnabled?: (enabled: boolean) => void;");
    expect(tsxSource).toContain("lampOverlayEnabled={lampOverlayEnabled}");
    expect(tsxSource).toContain("setLampOverlayEnabled={setLampOverlayEnabled}");
    expect(tsxSource).toContain("Switch on night lighting");
    expect(tsxSource).toContain("onClick={() => setLampOverlayEnabled(true)}");
    expect(tsxSource).toContain(
      "Night lighting uses LTA lamp-post points as a night-lighting map layer outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
    );
    expect(tsxSource).not.toContain("night-lighting map evidence outside the locked score");
    expect(tsxSource).toContain(
      "Access link is the short walk from the postal or transit point onto the shelter-map walk."
    );
    expect(tsxSource).toContain(
      "Access link is the short connector from the postal or transit point onto the straight-line bus estimate."
    );
    expect(tsxSource).not.toContain("Snap connector is the short link");
    expect(tsxSource).not.toContain("onto the shelter-map route");
    expect(tsxSource).not.toContain("onto mapped walking-route evidence");
    expect(tsxSource).not.toContain("onto the walking graph");
    expect(tsxSource).toContain('aria-label={directBusFallback ? "Direct-bus fallback details" : "Walk details"}');
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
    expect(source).toContain('label: "Sorting-only score"');
    expect(source).not.toContain('label: "Locked score", value: formatScoreWithMax(value)');
    expect(source).toContain('label: "No full locked score"');
    expect(source).not.toContain('label: "No full score"');
    expect(source).toContain('value: "Walk evidence"');
    expect(source).not.toContain('value: "Published data"');
    expect(source).toContain("shelterEvidenceAnnouncement(selection.score)");
  });

  it("shows four display rows without changing the locked weights", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const proposalSource = readFileSync(join(__dirname, "../../section10-presentation-proposal.md"), "utf-8");
    const weightsYaml = readFileSync(join(__dirname, "../../../pipeline/config/weights.yaml"), "utf-8");

    expect(source).toContain("Shelter-map evidence and locked score");
    expect(source).toContain('aria-label="Shelter-map evidence and locked score breakdown"');
    expect(source).toContain("aria-label={reasonListLabel}");
    expect(source).toContain('"Shelter-map evidence reasons"');
    expect(source).toContain("35% locked walk-to-transit");
    expect(source).toContain("20% locked bus support");
    expect(source).toContain("40% locked shelter exposure");
    expect(source).not.toContain("35% locked access");
    expect(source).not.toContain('"20% locked bus",');
    expect(source).not.toContain("40% locked rain+heat");
    expect(source).toContain("Shelter-map evidence preview");
    expect(source).toContain("Not in published shelter-map data");
    expect(source).not.toContain("Not in published data");
    expect(source).toContain("No shelter-map walk selected.");
    expect(source).toContain("Preview shelter-map evidence");
    expect(source).not.toContain("Preview shelter-map evidence only");
    expect(source).toContain("Preview shelter-map evidence selected.");
    expect(source).toContain("this clicked MRT/LRT exit or bus stop has shelter-map evidence");
    expect(source).not.toContain("this clicked transit target has shelter-map evidence");
    expect(source).not.toContain("this clicked transit stop has shelter-map evidence");
    expect(source).not.toContain("this clicked stop has shelter-map evidence");
    expect(source).not.toContain("this clicked stop or exit has shelter-map evidence");
    expect(source).not.toContain("No shelter map walk selected.");
    expect(source).not.toContain("Preview shelter map evidence only");
    expect(source).not.toContain("Preview shelter map evidence selected.");
    expect(source).not.toContain("this clicked transit stop has shelter map evidence");
    expect(source).not.toContain("Not scored in the current bundle");
    expect(source).toContain("Shelter-map evidence unavailable");
    expect(source).toContain("Shelter-map evidence available");
    expect(source).toContain("Locked score unavailable");
    expect(source).toContain("Unavailable locked-score rows");
    expect(source).not.toContain("Missing score factors");
    expect(source).not.toContain("Missing locked-score factors");
    expect(source).not.toContain("Locked score inputs unavailable");
    expect(source).not.toContain("Locked terms unavailable");
    expect(source).not.toContain("Locked score incomplete");
    expect(source).toContain(
      "Partial locked score: shelter-map evidence may still be present, but unavailable locked-score rows count as zero in the locked scoring rule."
    );
    expect(source).not.toContain("missing score factors count as zero in the locked scoring rule");
    expect(source).not.toContain("unavailable score inputs count as zero");
    expect(source).not.toContain("the locked formula counts unavailable terms as zero");
    expect(source).not.toContain("missing score factors count as zero in the locked formula");
    expect(source).not.toContain(
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
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).toContain(
      '{ id: "overall", label: "Locked score order" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).toContain(
      '{ id: "rain", label: "Covered-walkway evidence" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).toContain(
      '{ id: "access", label: "Walk-distance evidence" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).toContain(
      '{ id: "bus", label: "Bus service support" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).toContain(
      '{ id: "heat", label: "Heat estimate" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).toContain(
      '{ id: "crossing", label: "Crossing friction" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).not.toContain(
      '{ id: "crossing", label: "Crossing-friction locked term" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).not.toContain(
      '{ id: "overall", label: "Locked SHIOK score" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).not.toContain(
      '{ id: "rain", label: "Rain-shelter evidence" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).not.toContain(
      '{ id: "rain", label: "Rain covered-walkway evidence" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).not.toContain(
      '{ id: "bus", label: "Bus service-support evidence" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).not.toContain(
      '{ id: "heat", label: "Heat proxy evidence" }'
    );
    expect(readFileSync(join(__dirname, "../subscore-ranking.ts"), "utf-8")).not.toContain(
      "score factor"
    );
    expect(source).toContain('?? "Locked score order"');
    expect(source).toContain('"Sorting-only score"');
    expect(source).not.toContain('"Release sorting index"');
    expect(source).toContain("Start with covered-walkway ratio and exposed gaps; use the locked score only to sort the published shelter-map data.");
    expect(source).not.toContain("Start with the shelter trace and exposed gaps; use the locked score only to sort the published shelter-map data.");
    expect(source).not.toContain("Start with the shelter trace and exposed gaps; use the locked score only to sort the current bundle.");
    expect(source).not.toContain("Use this locked score to sort the current bundle");
    expect(source).not.toContain('label: "Overall SHIOK"');
    expect(source).not.toContain("Use this locked composite");
    expect(source).toContain('aria-label="Planning-area comparison"');
    expect(source).toContain("Compare nearby addresses");
    expect(source).toContain("Show comparison");
    expect(source).not.toContain("Compare nearby records");
    expect(source).not.toContain(">Show</button>");
    expect(source).not.toContain("Show ranks");
    expect(source).toContain("Choose planning-area comparison view");
    expect(source).not.toContain("Choose planning-area evidence view");
    expect(source).not.toContain("Rank records by");
    expect(source).not.toContain('aria-label="Rank by view"');
    expect(source).not.toContain("<strong>Rank by</strong>");
    expect(source).toContain(
      "Nearby-address list orders by locked score; shelter-map walk evidence remains the primary view."
    );
    expect(source).not.toContain(
      "Planning-area list uses locked score only as a sorting index; shelter-map walk evidence remains the primary view."
    );
    expect(source).not.toContain("Planning-area list sorted by locked score; shelter-map walk evidence remains the primary view.");
    expect(source).toContain("Nearby-address comparison for this evidence row; locked SHIOK score is unchanged.");
    expect(source).toContain("Nearby-address comparison for this locked-score row; locked SHIOK score is unchanged.");
    expect(source).not.toContain("Planning-area locked-score factor view; locked SHIOK score is unchanged.");
    expect(source).not.toContain("Planning-area locked-term view; locked SHIOK score is unchanged.");
    expect(source).not.toContain("Planning-area component evidence view; locked SHIOK score is unchanged.");
    expect(source).toContain("const rankLoadingText = rankMetricLabel.endsWith(\"order\")");
    expect(source).toContain("{rankLoadingText}");
    expect(source).not.toContain("Loading planning-area {rankSentenceLabel} ranks.");
    expect(source).not.toContain("Loading planning-area ${rankSentenceLabel} ranks.");
    expect(source).not.toContain("Loading planning-area locked score order ranks.");
    expect(source).not.toContain("Loading planning-area ${sentenceLabel} ranks.");
    expect(source).toContain("Loading planning-area ${rankSentenceLabel} comparison.");
    expect(source).toContain("Loading planning-area ${sentenceLabel}.");
    expect(source).toContain("Loading planning-area ${sentenceLabel} comparison.");
    expect(source).not.toContain("Loading planning-area ranks...");
    expect(source).toContain("No comparable full locked scores in this planning area.");
    expect(source).toContain("No comparable planning-area addresses for ${rankSentenceMetricLabel(rankMetricLabel)}.");
    expect(source).toContain('rankEmptyMessage(rankMetric, rankMetricLabel)');
    expect(source).not.toContain("No comparable scored records in this planning area.");
    expect(source).not.toContain("Authoritative composite order.");
    expect(source).not.toContain("Planning-area order by locked score.");
    expect(source).not.toContain("locked score sorting index ranks");
    expect(source).not.toContain("Planning-area sub-score view; locked SHIOK score is unchanged.");
    expect(source).not.toContain("Planning-area component-score view; locked SHIOK score is unchanged.");
    expect(source).toContain("Four display rows; weights unchanged");
    expect(source).toContain('"No full locked score"');
    expect(source).not.toContain('"No locked score"');
    expect(source).toContain('"Bus support unavailable"');
    expect(source).not.toContain('"Bus evidence unavailable"');
    expect(source).toContain('"Bus service not scored"');
    expect(source).toContain("Bus service support is not computed for addresses outside the locked 1.2 km transit range.");
    expect(source).not.toContain('"Locked bus term unavailable"');
    expect(source).not.toContain("Locked bus evidence is not computed for records outside the 1.2 km transit range.");
    expect(source).not.toContain('"No bus score"');
    expect(source).toContain('label: "Shelter exposure"');
    expect(source).toContain('label: "Walk to stop or exit"');
    expect(source).not.toContain('label: "Walk to transit"');
    expect(source).toContain('access: { low: "Longer walk to stop or exit", high: "Short walk to stop or exit" }');
    expect(source).not.toContain('access: { low: "Longer walk to transit", high: "Short walk to transit" }');
    expect(source).toContain('label: "Bus service support"');
    expect(source).toContain(
      "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop."
    );
    expect(source).toContain(
      "Direct bus service is shown as fallback evidence; no verified shelter-map walk to an official LTA bus stop is published, so the locked bus score remains 0."
    );
    expect(source).not.toContain("Shelter-map walk access was not verified");
    expect(source).toContain("Nearby direct bus service without verified shelter-map walk");
    expect(source).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(source).toContain("nearby direct bus service evidence could not be connected");
    expect(source).not.toContain("nearby bus evidence could not be connected");
    expect(source).toContain("Nearby direct bus service found");
    expect(source).not.toContain("Nearby bus service found");
    expect(source).toContain("No verified shelter-map walk yet");
    expect(source).not.toContain("Nearby bus stop with service data");
    expect(source).not.toContain("Shelter-map walk not verified yet");
    expect(source).not.toContain("Nearby bus service not walk-verified");
    expect(source).not.toContain("trusted walk to a DataMall bus stop");
    expect(source).toContain('bus: { low: "Limited bus-service evidence", high: "Stronger bus-service evidence" }');
    expect(source).not.toContain("Limited bus connectivity");
    expect(source).not.toContain("Strong bus connectivity");
    expect(source).toContain(
      "In this locked release, rain shelter and the heat estimate share mostly the same covered-walkway evidence."
    );
    expect(source).not.toContain(
      "Rain shelter and heat comfort currently share mostly the same covered-walkway evidence."
    );
    expect(source).not.toContain("rain shelter and heat comfort share mostly the same covered-walkway evidence.");
    expect(source).toContain("Heat also includes sparse nearby greenery, so SHIOK shows covered-walkway ratio first.");
    expect(source).not.toContain("Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first.");
    expect(source).toContain("Heat estimate evidence: covered ${formatDistance(score.paths.covered_m)}");
    expect(source).not.toContain("greenery proxy ${formatDistance(score.paths.shade_m)}");
    expect(source).toContain('heat: { low: "Low heat-estimate evidence", high: "Stronger heat-estimate evidence" }');
    expect(source).not.toContain('heat: { low: "Low heat-proxy evidence", high: "Stronger heat-proxy evidence" }');
    expect(source).not.toContain("Better heat-proxy score");
    expect(source).toContain(
      "Crossing friction still contributes 5% to the locked score, but has low separation in this release."
    );
    expect(source).not.toContain("Crossing friction remains a 5% locked term");
    expect(source).not.toContain('label: "Rain shelter"');
    expect(source).not.toContain('label: "Heat proxy"');
    expect(source).not.toContain('label: "Crossing friction"');
    expect(proposalSource).toContain("# Section 10 Presentation Reference");
    expect(proposalSource).toContain("Status: implemented in P18.");
    expect(proposalSource).toContain("## Implemented State");
    expect(proposalSource).toContain("| Position | Display row | On-screen copy | Detail copy |");
    expect(proposalSource).not.toContain("# Section 10 Presentation Proposal");
    expect(proposalSource).not.toContain("Status: proposal only.");
    expect(proposalSource).not.toContain("## Proposed State");
    expect(proposalSource).toContain("stop presenting the prior five locked-term rows");
    expect(proposalSource).not.toContain("stop presenting the prior five component-score rows");
    expect(proposalSource).toContain(
      "In this locked release, rain shelter and the heat estimate share mostly the same covered-walkway evidence."
    );
    expect(proposalSource).toContain("Use it to sort the published shelter-map data");
    expect(proposalSource).not.toContain("stop presenting the current five component-score rows");
    expect(proposalSource).not.toContain("Rain shelter and heat comfort currently share mostly");
    expect(proposalSource).not.toContain("sort the current bundle");
    expect(proposalSource).toContain("{covered_ratio}% covered-walkway ratio on the displayed walk");
    expect(proposalSource).toContain("Exposed gaps show where the displayed walk leaves shelter.");
    expect(proposalSource).toContain("Exposed gaps on the displayed walk");
    expect(proposalSource).not.toContain("{covered_ratio}% of the selected walk is covered.");
    expect(proposalSource).not.toContain("Exposed gaps show where the selected walk leaves shelter.");
    expect(proposalSource).toContain("{sheltered_m} to {stop_or_exit}");
    expect(proposalSource).toContain("Sheltered walk distance from this postal code to the chosen MRT/LRT exit or bus stop.");
    expect(proposalSource).not.toContain("{sheltered_m} to {transit_target}");
    expect(proposalSource).not.toContain("chosen MRT/LRT or bus access point");
    expect(proposalSource).not.toContain("Selected walk distance from this postal code");
    expect(proposalSource).toContain(
      "the published shelter-map walk\ncould not prove access to an official LTA bus stop"
    );
    expect(proposalSource).not.toContain("trusted walk to a DataMall bus stop");
    expect(proposalSource).toContain("Heat: shelter plus sparse NParks greenery proxy");
    expect(proposalSource).not.toContain("Heat: shelter + NParks shade proxy");
    expect(proposalSource).toContain("deciding whether the walk actually works");
    expect(proposalSource).toContain("[shelter-map walk]");
    expect(proposalSource).toContain("the shelter-map\nwalk evidence and its exposed gaps");
    expect(proposalSource).toContain("walk distance and the chosen stop or exit rather than above walk exposure");
    expect(proposalSource).toContain(
      "strongest evidence in this locked release is the covered-walkway ratio and exposed gaps on the shelter-map walk"
    );
    expect(proposalSource).toContain("SHIOK shows covered-walkway ratio first");
    expect(proposalSource).not.toContain("SHIOK shows the shelter trace first");
    expect(proposalSource).not.toContain("strongest evidence in this locked release is the shelter-map walk trace");
    expect(proposalSource).not.toContain("current strongest evidence is the shelter-map walk trace");
    expect(proposalSource).not.toContain("five subscore rows");
    expect(proposalSource).not.toContain("Selected route distance from this postal code");
    expect(proposalSource).not.toContain("deciding whether a route actually works");
    expect(proposalSource).not.toContain("[route map]");
    expect(proposalSource).not.toContain("routed shelter trace");
    expect(proposalSource).not.toContain("route distance and transit target");
    expect(proposalSource).not.toContain("walk distance and transit target");
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
    const lockedScoreLabelRule = cssRuleBody(cssSource, ".scoreBadge span");
    expect(cssSource).toContain("font-size: 9px;");
    expect(lockedScoreLabelRule).toContain("overflow-wrap: anywhere;");
    expect(lockedScoreLabelRule).toContain("white-space: normal;");
    expect(lockedScoreLabelRule).not.toContain("white-space: nowrap;");
    expect(cssSource).not.toContain(".scoreBadge strong {\n    font-size: 18px;");
  });

  it("renders zero exposed gaps as evidence instead of hiding the gap section", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain('aria-label="Exposed gap evidence"');
    expect(source).toContain('<div className={styles.gapList} aria-label="Exposed gap evidence">');
    expect(source).toContain("const zeroGapCoverageText = `All mapped segments for this ${selectedWalkLabel} stay under covered-walkway or connector evidence.`;");
    expect(source).toContain("{zeroGapCoverageText}");
    expect(source).not.toContain("All recorded segments for this display stay under covered-walkway or connector evidence.");
    expect(source).not.toContain("All recorded segments for this ${selectedWalkLabel} stay under covered-walkway or connector evidence.");
    expect(source).toContain("No exposed gaps are listed for this ${selectedWalkLabel}.");
    expect(source).not.toContain("No exposed gaps are recorded for this ${selectedWalkLabel}.");
    expect(source).not.toContain("0 m exposed across 0 gaps");
  });

  it("keeps exposed-gap button labels aligned with active map selection state", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");

    expect(source).toContain("function exposureGapMapActionLabel");
    expect(source).toContain('const action = active ? "Selected on map for" : "Focus on map for";');
    expect(source).toContain("No map location is available for ${");
    expect(source).not.toContain("No map coordinates are recorded for ${");
    expect(source).toContain("const actionLocation = location ?? `${focusTarget.lat.toFixed(5)}, ${focusTarget.lon.toFixed(5)}`;");
    expect(source).toContain("aria-label={exposureGapMapActionLabel(gap, index, actionLocation, activeGap)}");
    expect(source).not.toContain("aria-label={exposureGapMapActionLabel(gap, index, location, activeGap)}");
    expect(source).not.toContain("aria-label={`Focus on map for ${exposureGapCopy(gap.len_m, index)}");
    expect(cssSource).toContain("@media (max-width: 560px)");
    expect(cssSource).toContain(".gapItem {\n    grid-template-columns: 58px minmax(0, 1fr);");
    expect(cssSource).toContain(".gapAction {\n    grid-column: 2;\n    grid-row: auto;");
    expect(cssSource).toContain("justify-self: start;");
    expect(cssSource).toContain("white-space: normal;");
  });

  it("announces preview route locked score state as preview-only", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain('const scoreText = previewRoute');
    expect(source).toContain('"preview only; published locked score unchanged"');
    expect(source).toContain('<Metric label="Locked score" value="Preview only" />');
    expect(source).not.toContain('"not an authoritative SHIOK score"');
  });

  it("announces direct-bus fallback evidence without implying a verified shelter-map walk", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain('evidenceLabel = "Shelter-map walk evidence"');
    expect(source).toContain('directBusFallback ? "Straight-line bus estimate evidence" : undefined');
    expect(source).not.toContain("Direct bus service estimate evidence");
  });

  it("announces direct-bus fallback selection without implying a published shelter-map walk", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain("selectedStateText?: string;");
    expect(source).toContain("selectedStateText ??");
    expect(source).toContain('directBusFallback ? "Published direct-bus fallback evidence selected." : undefined');
  });

  it("labels direct-bus fallback evidence regions without implying shelter-map evidence", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(source).toContain('directBusFallback ? "Direct-bus fallback source evidence" : "Shelter source evidence"');
    expect(source).toContain('directBusFallback ? "Direct-bus fallback evidence reasons" : "Shelter-map evidence reasons"');
    expect(source).toContain("aria-label={sourceEvidenceLabel}");
    expect(source).toContain("aria-label={reasonListLabel}");
  });
});
