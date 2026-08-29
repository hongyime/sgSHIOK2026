import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

import Home, {
  ScoreCard,
  SearchFeedback,
  formatFeedbackTraceCount,
  formatDataDate,
  formatGeneratedDate,
  nightLightingLayerNote,
  nightLightingRouteDetailValue,
  routeDisplayAnnouncement,
  rankAnnouncement,
  rankEmptyMessage,
  rankPanelDescription,
  scoreCardAnnouncement,
  searchResultsAnnouncement,
  type FeedbackSegmentLabel,
  type LoadedSelection,
} from "../../app/page";
import { RouteEvidenceMap } from "../../components/route-evidence-map";
import type { ScoreRecord, TransitPoiCollection } from "../types";

const emptyTransitPois: TransitPoiCollection = {
  type: "FeatureCollection",
  features: [],
};

function cssRuleBody(selector: string): string {
  const css = readFileSync("app/page.module.css", "utf8");
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  if (!match) {
    throw new Error(`Missing CSS rule for ${selector}`);
  }
  return match[1];
}

function cssPxValue(ruleBody: string, property: string): number {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = ruleBody.match(new RegExp(`${escapedProperty}\\s*:\\s*([0-9.]+)px`));
  if (!match) {
    throw new Error(`Missing ${property} px value`);
  }
  return Number(match[1]);
}

const scoredRecord: ScoreRecord = {
  postal: "560231",
  state: "SCORED",
  total: 72,
  subscores: { access: 78, rain: 69, heat: 58, bus: 82, crossing: 90 },
  best_node: {
    type: "bus_stop",
    name: "Blk 231",
    routed_m: 240,
    exit: "560231",
    station: "Blk 231",
    straight_line_m: 160,
    snap_distance_m: 6,
  },
  paths: {
    shortest_m: 210,
    sheltered_m: 240,
    detour_pct: 14,
    covered_m: 149,
    covered_ratio: 0.62,
    shade_m: 23,
    shortest_covered_ratio: 0.48,
    routing_type: "sheltered",
    shade_ratio: 0.31,
  },
  exposure_gaps: [
    { len_m: 142.4, label: "gap-long", location: { lat: 1.37123, lon: 103.84235 } },
    { len_m: 38.2, label: "gap-short", location: { lat: 1.37091, lon: 103.84101 } },
  ],
  data_as_of: null,
  provenance: {},
};

const selection: LoadedSelection = {
  result: {
    BUILDING: "Postal 560231",
    ROAD_NAME: "",
    POSTAL: "560231",
    LATITUDE: "1.3700",
    LONGITUDE: "103.8400",
    SEARCHVAL: "S560231",
  },
  score: scoredRecord,
  geom: {
    postal: "560231",
    shortest: "",
    sheltered: "",
    exposure_gaps: [],
    route_segments: {
      sheltered: [
        { geom: "", len_m: 72, is_covered: true, source_class: "lta_covered_linkway" },
        { geom: "", len_m: 45, is_covered: true, source_class: "osm_covered" },
        { geom: "", len_m: 32, is_covered: false, source_class: "exposed" },
      ],
    },
  },
};

function renderScoreCard(overrides: Partial<React.ComponentProps<typeof ScoreCard>> = {}) {
  const noop = () => undefined;
  const props: React.ComponentProps<typeof ScoreCard> = {
    selection,
    routeMode: "shiokest",
    setRouteMode: noop,
    transitMode: "best_transit",
    setTransitMode: noop,
    feedbackEnabled: false,
    setFeedbackEnabled: noop,
    feedbackPoints: [],
    feedbackSegmentLabels: [] as FeedbackSegmentLabel[],
    setFeedbackSegmentLabel: noop,
    clearFeedback: noop,
    feedbackNote: "",
    setFeedbackNote: noop,
    copyFeedback: noop,
    copyStatus: "",
    isCustomStopSelected: false,
    onResetChosenStop: noop,
    rankMetric: "overall",
    setRankMetric: noop,
    rankingRecords: [scoredRecord],
    rankingLoading: false,
    rankPanelOpen: true,
    setRankPanelOpen: noop,
    onFocusExposureGap: noop,
    lampOverlayEnabled: false,
    setLampOverlayEnabled: noop,
    ...overrides,
  };
  return renderToStaticMarkup(<ScoreCard {...props} />);
}

describe("rendered accessibility output", () => {
  it("formats manifest data dates for the title-card honesty line", () => {
    const manifest = {
      generated_at: "2026-08-05T14:00:15.974693+00:00",
      data_as_of: "2026-08-01T21:49:20.977890+00:00",
      provenance: {},
    };

    expect(formatDataDate(manifest)).toBe("2 Aug 2026");
    expect(formatGeneratedDate(manifest)).toBe("5 Aug 2026");
    expect(formatDataDate(null)).toBe("Unavailable");
    expect(formatGeneratedDate(null)).toBe("Unavailable");
  });

  it("renders visible map attribution instead of relying on source-only checks", () => {
    const html = renderToStaticMarkup(
      <RouteEvidenceMap
        routes={[]}
        mode="shiokest"
        transitPois={emptyTransitPois}
        feedbackEnabled={false}
        feedbackPoints={[]}
      />
    );

    expect(html).toContain("OneMap");
    expect(html).toContain("Singapore Land Authority");
    expect(html).toContain("https://www.onemap.gov.sg/");
    expect(html).toContain("om_logo.png");
  });

  it("renders search result announcements and assertive error alerts", () => {
    const resultsHtml = renderToStaticMarkup(
      <SearchFeedback results={[selection.result]} loading={false} error={null} />
    );
    expect(resultsHtml).toContain('role="status"');
    expect(resultsHtml).toContain('aria-live="polite"');
    expect(resultsHtml).toContain("1 search result available.");

    const errorHtml = renderToStaticMarkup(
      <SearchFeedback results={[]} loading={false} error="Failed to search postal location." />
    );
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain('aria-live="assertive"');
    expect(errorHtml).toContain("Failed to search postal location.");

    const noResultsHtml = renderToStaticMarkup(
      <SearchFeedback results={[]} loading={false} error={null} searched={true} />
    );
    expect(searchResultsAnnouncement([], false, null, true)).toBe(
      "No OneMap address result found for this search. Try a 6-digit postal code. The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list."
    );
    expect(noResultsHtml).toContain("No OneMap address result found.");
    expect(noResultsHtml).toContain("Try a 6-digit postal code");
    expect(noResultsHtml).toContain(
      "The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list."
    );
    expect(noResultsHtml).toContain("emptyBoxNote");
    expect(noResultsHtml).not.toContain("the recent public-source check found");
    expect(noResultsHtml).not.toContain("Separately, the published shelter-map data");
    expect(noResultsHtml).not.toContain("the frozen shelter-map bundle&#x27;s recent public-source check found");
    expect(noResultsHtml).not.toContain("the frozen shelter-map bundle has measured recent-source misses");
    expect(noResultsHtml).not.toContain("the frozen score bundle has measured recent-source misses");
    expect(noResultsHtml).not.toContain("Try a 6-digit postal code; the frozen shelter-map bundle");
    expect(noResultsHtml).not.toContain("newer completions may still be outside");
  });

  it("renders the current public-source sample in data limits", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Data limits: June 2020 addresses; roughly 1 in 4 lack full locked scores");
    expect(html).not.toContain("Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores");
    expect(html).not.toContain("Data limits: frozen v1 addresses; incomplete locked scores");
    expect(html).toContain("P19 v2 28 Aug 2026 public-source sample");
    expect(html).toContain("This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list.");
    expect(html).not.toContain("Current for gap sizing until 4 Sep 2026 UTC");
    expect(html).toContain(
      "25,919 valid distinct postcodes measured; 25,899 overlap the 124,443 June 2020 address-list postcodes, with 20 valid OSM-only postcodes."
    );
    expect(html).toContain(
      "Source-age snapshot: 28 Aug 2026 22:21 UTC source-age check; 11 sources were current, 9 stale, 3 manual, and 1 unknown-age candidate. This was not a live source refresh."
    );
    expect(html).not.toContain("Source-age snapshot: 28 Aug 2026 22:21 UTC manifest-only check");
    expect(html).not.toContain("No upstream URLs were probed.");
    expect(html).not.toContain("Data freshness: 28 Aug 2026 22:21 UTC");
    expect(html).toContain(
      "At the 28 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold"
    );
    expect(html).toContain("Freshness may have changed since that snapshot");
    expect(html).toContain("source refreshes use new dated input versions instead of changing published data in place");
    expect(html).not.toContain("source refreshes use new versioned inputs instead of changing the frozen v1 data in place");
    expect(html).not.toContain("source refreshes use new versioned inputs instead of changing the frozen v1 bundle in place");
    expect(html).toContain(
      "The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed"
    );
    expect(html).not.toContain("postal-universe seed");
    expect(html).not.toContain("raw/manifest.json");
    expect(html).not.toContain("ACRA, other-UEN");
    expect(html).not.toContain("zero-mutation source-age check before release work");
    expect(html).not.toContain("Bus Stops, Bus Services, and Bus Routes are current but 1.2 days from stale");
    expect(html).not.toContain("Data freshness: 28 Aug 2026 11:52 UTC manifest-only check");
    expect(html).not.toContain("16 Aug 2026 public-source sample");
    expect(html).not.toContain("20 Aug 2026 OSM addr:postcode coverage cross-check");
  });

  it("formats the night-lighting layer note for off and on states", () => {
    expect(nightLightingLayerNote(false)).toBe(
      "Night lighting layer: LTA lamp-post locations can be shown on the map. Switch on and zoom into a neighbourhood to load lamp-post points. Map layer only; not part of the locked score."
    );
    expect(nightLightingLayerNote(true)).toBe(
      "Night lighting layer: LTA lamp-post locations are shown on the map. Zoom into a neighbourhood to load lamp-post points. Map layer only; not part of the locked score."
    );
  });

  it("formats selected-walk night-lighting detail values for off and on states", () => {
    expect(nightLightingRouteDetailValue(false)).toBe(
      "Night-lighting layer off; switch on night lighting, then zoom in"
    );
    expect(nightLightingRouteDetailValue(true)).toBe("Night-lighting layer on; zoom in for lamp-post points");
  });

  it("introduces the shelter-map panel before search", () => {
    const html = renderScoreCard({
      selection: null,
      rankingRecords: [],
      lockedScoreAvailabilityLine:
        "Full locked scores: 95,157 of 124,443 June 2020 address-list records; 29,286 address-list records (23.5%, roughly a quarter) missing full scores.",
    });

    expect(html).toContain("Find an address or postal code");
    expect(html).not.toContain("Find a postal code");
    expect(html).toContain('aria-label="Shelter-map panel"');
    expect(html).toContain("No shelter-map walk selected.");
    expect(html).toContain(
      "Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio and exposed gaps on the walk to transit, plus the night-lighting map layer.",
    );
    expect(html).toContain("The published shelter-map data is tied to the June 2020 address list.");
    expect(html).not.toContain("The published shelter-map data is tied to the frozen June 2020 address universe.");
    expect(html).toContain(
      "Full locked scores: 95,157 of 124,443 June 2020 address-list records; 29,286 address-list records (23.5%, roughly a quarter) missing full scores."
    );
    expect(html).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting on the walk to transit.");
    expect(html).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting near transit.");
    expect(html).not.toContain("Search a Singapore postal code to inspect the covered-walkway ratio, exposed gaps, and night lighting near transit.");
    expect(html).not.toContain("No shelter map walk selected.");
    expect(html).not.toContain("No shelter map route selected.");
    expect(html).not.toContain('aria-label="Route evidence panel"');
    expect(html).not.toContain('aria-label="Score panel"');
    expect(html).not.toContain("No score selected.");
    expect(html).not.toContain("No route evidence selected.");
    expect(html).not.toContain("Search any Singapore address to see its walk-to-transit comfort score.");
  });

  it("renders live status for shelter-map panel load, walk mode, stop selection, and planning-area comparison", () => {
    const html = renderScoreCard({
      routeMode: "shortest",
      isCustomStopSelected: true,
      rankingLoading: true,
      rankPanelOpen: true,
    });

    expect(html).toContain('role="status"');
    expect(html).toContain("Postal 560231 shelter-map panel loaded.");
    expect(html).toContain("Shelter-map walk evidence 48% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
    expect(html).not.toContain("Shelter-map walk evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
    expect(html).toContain("Sorting-only score 72 out of 100.");
    expect(html.indexOf("Shelter-map walk evidence 48% covered-walkway ratio")).toBeLessThan(
      html.indexOf("Sorting-only score 72 out of 100.")
    );
    expect(html).not.toContain("Locked score 72 out of 100.");
    expect(html).toContain("<span>Sorting-only score</span><strong>72/100</strong>");
    expect(html).not.toContain("<span>Locked score</span><strong>72/100</strong>");
    expect(html).toContain("<strong>72/100</strong><small>Sorting-only score</small>");
    expect(html).not.toContain("<strong>72/100</strong><small>Release sorting index</small>");
    expect(html).toContain("Custom MRT/LRT exit or bus stop selected.");
    expect(html).not.toContain("Custom transit target selected.");
    expect(html).not.toContain("Custom transit stop selected.");
    expect(html).not.toContain("Custom stop selected.");
    expect(html).toContain("Walk display shortest walk");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading planning-area locked score order.");
    expect(html).not.toContain("Loading planning-area locked score order ranks.");
    expect(html).not.toContain("Loading planning-area locked score sorting index ranks.");
    expect(html).not.toContain("Loading planning-area Locked SHIOK score ranks.");
    expect(html).not.toContain("Loading planning-area Locked score sorting index ranks.");
    expect(html).toContain('aria-label="Shelter-map panel"');
    expect(html).not.toContain("Postal 560231 route evidence panel loaded.");
    expect(html).not.toContain("Postal 560231 score panel loaded.");
    expect(html).not.toContain("Score 72 out of 100.");
    expect(html).not.toContain("Published route selected.");
    expect(html).not.toContain("Published shelter-map walk selected.");
    expect(html).not.toContain("Route display shortest");
    expect(html).not.toContain('aria-label="Route evidence panel"');
    expect(html).not.toContain('aria-label="Score panel"');
  });

  it("announces the default walk display as sheltered walk instead of the internal mode name", () => {
    const html = renderScoreCard();

    expect(html).toContain("Walk display sheltered walk");
    expect(html).toContain("Published shelter-map walk selected.");
    expect(html).not.toContain("Walk display shiokest");
    expect(html).not.toContain("Walk display sheltered;");
    expect(html).not.toContain("Published route selected.");
    expect(html).not.toContain("Route display sheltered");
  });

  it("uses transit stop-or-exit fallback copy when a scored walk has no named best node", () => {
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: {
          ...scoredRecord,
          best_node: null,
        },
      },
    });

    expect(html).toContain("No transit stop or exit loaded");
    expect(html).not.toContain("No Transit Stop Or Exit Loaded");
    expect(html).not.toContain("No Transit Target Loaded");
    expect(html).not.toContain("No Transit Found Nearby");
  });

  it("announces same shortest and sheltered display as a walk state", () => {
    expect(routeDisplayAnnouncement("shortest", true)).toBe("shortest walk same as sheltered walk");
    expect(routeDisplayAnnouncement("shortest", false)).toBe("shortest walk");
    expect(routeDisplayAnnouncement("shortest", true)).not.toBe("shortest same as sheltered walk");
    expect(routeDisplayAnnouncement("shortest", true)).not.toBe("shortest same as sheltered route");
    expect(routeDisplayAnnouncement("both", false)).toBe("both walks");
    expect(routeDisplayAnnouncement("both", false)).not.toBe("both routes");
  });

  it("falls back to walk active when no selected walk label is available", () => {
    expect(scoreCardAnnouncement({ selection, routeMode: "shiokest" })).toContain("walk active.");
    expect(scoreCardAnnouncement({ selection, routeMode: "shiokest" })).toContain(
      "Shelter-map walk evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
    );
    expect(scoreCardAnnouncement({ selection, routeMode: "shiokest" })).toContain(
      "longest gap 142 m"
    );
    expect(scoreCardAnnouncement({ selection, routeMode: "shiokest" })).not.toContain("route active.");
  });

  it("shows when clicked-stop route preview falls back to straight-line evidence", () => {
    const previewRecord: ScoreRecord = {
      ...scoredRecord,
      state: "NOT_YET_SCORED",
      total: null,
      subscores: null,
      paths: {
        ...scoredRecord.paths!,
        routing_type: "live_onemap_preview",
      },
      provenance: {
        source: "live_onemap_preview",
        authoritative_score: false,
      },
    };
    const html = renderScoreCard({
      selection: { ...selection, score: previewRecord },
      isCustomStopSelected: true,
      liveRoutePreviewStatus: "unavailable",
      rankingRecords: [],
    });

    expect(html).toContain("Preview shelter-map evidence");
    expect(html).toContain("↺ Published shelter-map walk");
    expect(html).not.toContain(">↺ Published walk</button>");
    expect(html).toContain("Shelter-map evidence preview");
    expect(html).toContain("Not in published data");
    expect(html).not.toContain("Not scored in the current bundle");
    expect(html).toContain("Preview shelter-map evidence selected.");
    expect(html).toContain("Locked score preview only; published locked score unchanged.");
    expect(html).not.toContain("Locked score unavailable in the published shelter-map data. Preview shelter-map evidence selected.");
    expect(html).toContain("Shelter-map preview");
    expect(html).toContain("OneMap preview walk");
    expect(html).not.toContain("Preview walk");
    expect(html).toContain("<span>Locked score</span><strong>Preview only</strong>");
    expect(html).toContain(
      "OneMap walking preview is unavailable for this selected MRT/LRT exit or bus stop; showing straight-line distance only."
    );
    expect(html).toContain(
      "Preview only: this clicked MRT/LRT exit or bus stop has shelter-map evidence, but it is not part of the published shelter-map data yet."
    );
    expect(html).not.toContain("this selected transit target");
    expect(html).not.toContain("this clicked transit target");
    expect(html).not.toContain("this selected transit stop");
    expect(html).not.toContain("this selected stop or exit");
    expect(html).not.toContain("this clicked transit stop");
    expect(html).not.toContain("this clicked stop or exit");
    expect(html).not.toContain("this clicked stop has shelter map evidence");
    expect(html).not.toContain("not part of the published score bundle yet");
    expect(html).not.toContain("not an authoritative SHIOK score");
    expect(html).not.toContain("Preview route");
    expect(html).not.toContain("↺ Scored route");
    expect(html).not.toContain("Preview route evidence only");
    expect(html).not.toContain("Preview route evidence selected.");
    expect(html).not.toContain("this clicked stop has route evidence");
    expect(html).not.toContain("Route evidence preview");
    expect(html).not.toContain("until an offline bundle includes it");
    expect(html).not.toContain("offline scoring pipeline includes it");
  });

  it("explains when a searched postal has no published shelter-map walk", () => {
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: null,
        geom: null,
      },
      rankingRecords: [],
    });

    expect(html).toContain(
      "Postal 560231 is outside the published shelter-map data tied to the June 2020 address list; the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
    );
    expect(html).toContain("Outside published shelter-map data");
    expect(html).not.toContain("Outside shelter-map bundle");
    expect(html).not.toContain("outside the shelter-map bundle tied to the frozen June 2020 address universe");
    expect(html).not.toContain("Postal 560231 is not in the current shelter-map bundle.");
    expect(html).not.toContain("Postal 560231 is not in the current score bundle.");
    expect(html).not.toContain("Outside current bundle");
    expect(html).toContain(
      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
    );
    expect(html).not.toContain("No shelter-map walk is published for this postal; this shelter-map bundle is tied");
    expect(html).not.toContain(
      "No shelter-map walk is published for this postal; the current bundle is tied to the frozen June 2020 address universe.</span>"
    );
    expect(html).not.toContain("recent public-source check found");
    expect(html).not.toContain("No shelter map route is published for this postal");
    expect(html).not.toContain("No shelter map route is published for this postal in the frozen June 2020 address universe.");
    expect(html).not.toContain("No route evidence is published for this postal");
  });

  it("names known P19 recent-source misses when the selected postal matches the cached list", () => {
    const hdbHtml = renderScoreCard({
      selection: {
        ...selection,
        result: {
          ...selection.result,
          BUILDING: "Postal 521400",
          POSTAL: "521400",
          SEARCHVAL: "S521400",
        },
        score: null,
        geom: null,
      },
      rankingRecords: [],
    });
    const mcstHtml = renderScoreCard({
      selection: {
        ...selection,
        result: {
          ...selection.result,
          BUILDING: "Postal 935456",
          POSTAL: "935456",
          SEARCHVAL: "S935456",
        },
        score: null,
        geom: null,
      },
      rankingRecords: [],
    });

    expect(hdbHtml).toContain(
      "Postal 521400 is outside the published shelter-map data tied to the June 2020 address list; this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (2021-2026 HDB public-source sample)."
    );
    expect(hdbHtml).toContain(
      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (2021-2026 HDB public-source sample)."
    );
    expect(hdbHtml).not.toContain("HDB missing rows from frozen v1");
    expect(hdbHtml).not.toContain("geocoded rows");
    expect(hdbHtml).not.toContain("recent public-source check found");
    expect(hdbHtml).not.toContain("cached recent public-source misses");
    expect(mcstHtml).toContain(
      "Postal 935456 is outside the published shelter-map data tied to the June 2020 address list; this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the recorded postal, so it is an address-quality warning rather than a confirmed missing address."
    );
    expect(mcstHtml).toContain(
      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the recorded postal, so it is an address-quality warning rather than a confirmed missing address."
    );
    expect(mcstHtml).not.toContain("unvalidated MCST proxy row");
    expect(mcstHtml).not.toContain("source-quality evidence");
    expect(mcstHtml).not.toContain("cached recent public-source misses");
  });

  it("renders the route exposure lead and four-row score presentation", () => {
    const recordWithEqualRainHeat: ScoreRecord = {
      ...scoredRecord,
      paths: { ...scoredRecord.paths!, endpoint_snap_connector_m: 9 },
      subscores: { access: 78, rain: 69, heat: 69, bus: 82, crossing: 90 },
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: recordWithEqualRainHeat,
      },
      rankingRecords: [recordWithEqualRainHeat],
    });
    const closedRankHtml = renderScoreCard({
      selection: {
        ...selection,
        score: recordWithEqualRainHeat,
      },
      rankingRecords: [recordWithEqualRainHeat],
      rankPanelOpen: false,
    });
    const breakdownHtml = html.slice(
      html.indexOf('aria-label="Shelter-map evidence and locked score breakdown"'),
      html.indexOf('aria-label="Planning-area comparison"')
    );

    expect(html).toContain("Where the walk is exposed");
    expect(html).toContain('aria-label="Walk exposure evidence"');
    expect(html).not.toContain('aria-label="Walk shelter evidence"');
    expect(html).toContain("62% covered-walkway ratio on the sheltered walk.");
    expect(html).not.toContain("62% covered-walkway ratio on the selected walk.");
    expect(html).not.toContain("62% of the selected walk is covered.");
    expect(html).toContain("181 m exposed across 2 gaps; 142 m is the longest exposed gap.");
    expect(html).toContain("142 m is the longest exposed gap.");
    expect(html).toContain('aria-label="Shelter source evidence"');
    expect(html).toContain("LTA covered linkway");
    expect(html).toContain("OSM shelter tags");
    expect(html).toContain("Bridge/underpass shelter");
    expect(html).not.toContain("Bridge/underpass</span>");
    expect(html).not.toContain("OSM covered");
    expect(html).toContain('aria-label="Map legend"');
    expect(html).toContain("Sheltered walk");
    expect(html).toContain("Both walks");
    expect(html).toContain("Shortest walk");
    expect(html).toContain("Exposed gaps");
    expect(html).toContain("HDB void-deck shelter");
    expect(html).not.toContain("HDB inferred");
    expect(html).not.toContain(">Exposed</span>");
    expect(html).not.toContain("LTA lamp points");
    expect(html).not.toContain("Sheltered route");
    expect(html).toContain("Shelter-map evidence and locked score");
    expect(html).toContain('aria-label="Shelter-map evidence and locked score breakdown"');
    expect(html).toContain("Four display rows; weights unchanged");
    expect(html).toContain('aria-label="Shelter-map evidence reasons"');
    expect(html).not.toContain("Route evidence and locked score");
    expect(html).not.toContain('aria-label="Route shelter evidence"');
    expect(html).not.toContain('aria-label="Route evidence and locked score breakdown"');
    expect(html).not.toContain('aria-label="Route evidence reasons"');
    expect(html).not.toContain('aria-label="Score breakdown"');
    expect(html).not.toContain('aria-label="Score reasons"');
    expect(html).toContain("Shelter exposure");
    expect(html).not.toContain("40% locked rain+heat");
    expect(html).toContain("Walk to transit");
    expect(html).toContain("Sheltered walk distance to transit.");
    expect(html).toContain("240 m sheltered walk to transit");
    expect(html).not.toContain("Selected walk distance to transit.");
    expect(html).not.toContain("240 m to transit");
    expect(html).not.toContain("Selected route distance to transit.");
    const busHtml = renderScoreCard({ transitMode: "bus" });
    expect(busHtml).toContain("Sheltered walk distance to bus stop.");
    expect(busHtml).toContain("240 m sheltered walk to bus stop");
    expect(busHtml).not.toContain("Sheltered walk distance to bus.");
    expect(busHtml).not.toContain("240 m sheltered walk to bus</span>");
    const mrtHtml = renderScoreCard({ transitMode: "mrt_lrt" });
    expect(mrtHtml).toContain("Sheltered walk distance to MRT/LRT exit.");
    expect(mrtHtml).toContain("240 m sheltered walk to MRT/LRT exit");
    expect(mrtHtml).not.toContain("Sheltered walk distance to MRT/LRT.");
    expect(mrtHtml).not.toContain("240 m sheltered walk to MRT/LRT</span>");
    expect(html).toContain("Bus service support");
    expect(html).toContain(
      "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop."
    );
    expect(html).not.toContain("trusted walk to a DataMall bus stop");
    expect(html).toContain("Locked SHIOK score");
    expect(html).toContain('aria-label="Planning-area comparison"');
    expect(html).toContain("Compare planning-area records");
    expect(closedRankHtml).toContain("Show comparison");
    expect(html).not.toContain("Compare nearby records");
    expect(closedRankHtml).not.toContain(">Show</button>");
    expect(closedRankHtml).not.toContain("Show ranks");
    expect(html).toContain("Choose planning-area comparison view");
    expect(html).not.toContain("Choose planning-area evidence view");
    expect(html).not.toContain("Rank records by");
    expect(html).toContain(
      "Planning-area list orders by locked score; shelter-map walk evidence remains the primary view."
    );
    expect(html).not.toContain(
      "Planning-area list uses locked score only as a sorting index; shelter-map walk evidence remains the primary view."
    );
    expect(html).not.toContain("Planning-area list sorted by locked score; shelter-map walk evidence remains the primary view.");
    expect(html).not.toContain("Planning-area order by locked score.");
    expect(html).not.toContain('aria-label="Rank by view"');
    expect(html).not.toContain("<strong>Rank by</strong>");
    expect(html).not.toContain("Authoritative composite order.");
    expect(html).toContain('aria-label="Walk comparison"');
    expect(html).toContain("Shortest walk has 48% covered-walkway ratio (14pp lower than sheltered walk)");
    expect(html).not.toContain("Shortest walk has 48% covered-walkway ratio (14pp lower)</p>");
    expect(html).not.toContain('aria-label="Route comparison"');
    expect(html).not.toContain("Shortest is 48% sheltered (14pp less shelter)");
    expect(breakdownHtml).not.toContain(">Heat proxy<");
    expect(breakdownHtml).not.toContain(">Rain shelter<");
    expect(breakdownHtml).not.toContain(">Crossing friction<");
    expect(html).toContain(
      "In this locked release, rain shelter and the heat estimate share mostly the same covered-walkway evidence."
    );
    expect(html).not.toContain("rain shelter and heat comfort share mostly the same covered-walkway evidence.");
    expect(html).not.toContain("Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.");
    expect(html).toContain(
      "Heat also includes sparse nearby greenery, so SHIOK shows covered-walkway ratio first."
    );
    expect(html).not.toContain("SHIOK shows the shelter trace first.");
    expect(html).toContain("Same displayed value as rain shelter for this postal.");
    expect(html).toContain("Heat estimate evidence: covered 149 m; nearby greenery 23 m.");
    expect(html).not.toContain("Heat proxy evidence: covered 149 m; nearby greenery 23 m.");
    expect(html).not.toContain("Better heat-proxy score");
    expect(html).toContain(
      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
    );
    expect(html).not.toContain(">Greenery proxy</strong>");
    expect(html).not.toContain("greenery proxy");
    expect(html).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
    expect(html).toContain("Night lighting");
    expect(html).toContain("Night-lighting layer off; switch on night lighting, then zoom in");
    expect(html).not.toContain("Available; map layer off");
    expect(html).not.toContain("Map layer on; zoom in for points");
    expect(html).not.toContain(">Map layer off</strong>");
    expect(html).not.toContain(">Layer off</strong>");
    expect(html).toContain("Access link");
    expect(html).not.toContain("Snap connector");
    expect(html).toContain("9 m");
    expect(html).toContain('aria-label="Walk details"');
    expect(html).not.toContain('aria-label="Route details"');
    expect(html).toContain(
      "Access link is the short walk from the postal or transit point onto the shelter-map walk."
    );
    expect(html).not.toContain("Snap connector is the short link");
    expect(html).not.toContain("onto the shelter-map route");
    expect(html).not.toContain("onto mapped walking-route evidence");
    expect(html).not.toContain("onto the walking graph");
  });

  it("keeps covered-walkway evidence visually larger than the locked score badge", () => {
    const exposureLead = cssPxValue(cssRuleBody(".exposureHero strong"), "font-size");
    const lockedScoreBadge = cssPxValue(cssRuleBody(".scoreBadge strong"), "font-size");

    expect(exposureLead).toBeGreaterThan(lockedScoreBadge);
  });

  it("matches planning-area empty copy to the selected comparison view", () => {
    expect(rankEmptyMessage("overall", "Locked score order")).toBe(
      "No comparable full locked scores in this planning area."
    );
    expect(rankEmptyMessage("rain", "Covered-walkway evidence")).toBe(
      "No comparable planning-area records for covered-walkway evidence."
    );

    const evidenceHtml = renderScoreCard({
      rankMetric: "rain",
      rankingRecords: [],
    });
    expect(evidenceHtml).toContain("No comparable planning-area records for covered-walkway evidence.");
    expect(evidenceHtml).not.toContain("No comparable planning-area records for Rain-shelter evidence.");
    expect(evidenceHtml).not.toContain("No comparable planning-area records for rain covered-walkway evidence.");
    expect(evidenceHtml).not.toContain("No comparable full locked scores in this planning area.");
  });

  it("uses sentence-case comparison labels in planning-area status copy", () => {
    expect(
      rankAnnouncement({
        loading: true,
        rankedCount: 0,
        rankMetricLabel: "Covered-walkway evidence",
      })
    ).toBe("Loading planning-area covered-walkway evidence comparison.");
    expect(
      rankAnnouncement({
        loading: false,
        rankedCount: 0,
        rankMetricLabel: "Bus service support",
      })
    ).toBe("No planning-area bus service support comparison available.");
    expect(
      rankAnnouncement({
        loading: false,
        rankedCount: 5,
        rankMetricLabel: "Locked score order",
      })
    ).toBe("5 planning-area records in locked score order.");
  });

  it("does not call crossing friction an evidence view in planning-area helper copy", () => {
    expect(rankPanelDescription("overall", false)).toBe("Loads planning-area comparison only when opened.");
    expect(rankPanelDescription("overall", true)).toBe(
      "Planning-area list orders by locked score; shelter-map walk evidence remains the primary view."
    );
    expect(rankPanelDescription("overall", true)).not.toBe(
      "Planning-area list uses locked score only as a sorting index; shelter-map walk evidence remains the primary view."
    );
    expect(rankPanelDescription("rain", true)).toBe(
      "Planning-area evidence view; locked SHIOK score is unchanged."
    );
    expect(rankPanelDescription("bus", true)).toBe(
      "Planning-area locked-score detail view; locked SHIOK score is unchanged."
    );
    expect(rankPanelDescription("heat", true)).toBe(
      "Planning-area locked-score detail view; locked SHIOK score is unchanged."
    );
    expect(rankPanelDescription("crossing", true)).toBe(
      "Planning-area locked-score detail view; locked SHIOK score is unchanged."
    );
    expect(rankPanelDescription("crossing", true)).not.toBe(
      "Planning-area locked-score factor view; locked SHIOK score is unchanged."
    );
    expect(rankPanelDescription("crossing", true)).not.toBe(
      "Planning-area locked-term view; locked SHIOK score is unchanged."
    );
  });

  it("renders access-walk source labels without connector jargon", () => {
    const connectorSelection: LoadedSelection = {
      ...selection,
      geom: {
        ...selection.geom!,
        route_segments: {
          sheltered: [
            { geom: "", len_m: 85, is_covered: false, source_layer: "origin_graph_snap_connector" },
            { geom: "", len_m: 74, is_covered: false, source_layer: "destination_graph_snap_connector" },
            { geom: "", len_m: 63, is_covered: false, source_layer: "bus_stop_access_connector" },
          ],
        },
      },
    };

    const html = renderScoreCard({ selection: connectorSelection });

    expect(html).toContain("Postal access walk");
    expect(html).toContain("Transit access walk");
    expect(html).toContain("Bus-stop access walk");
    expect(html).not.toContain("Postal connector");
    expect(html).not.toContain("Transit connector");
    expect(html).not.toContain("Bus stop connector");
  });

  it("reflects the night-lighting map layer state in route details", () => {
    const offHtml = renderScoreCard({ lampOverlayEnabled: false });
    const onHtml = renderScoreCard({ lampOverlayEnabled: true });

    expect(offHtml).toContain("Night lighting");
    expect(offHtml).toContain("Night-lighting layer off; switch on night lighting, then zoom in");
    expect(offHtml).toContain("Switch on night lighting");
    expect(offHtml).not.toContain("Available; map layer off");
    expect(onHtml).toContain("Night-lighting layer on; zoom in for lamp-post points");
    expect(onHtml).not.toContain("Switch on night lighting");
    expect(onHtml).toContain("LTA lamp-post points");
    expect(onHtml).not.toContain("LTA lamp points");
    expect(onHtml).not.toContain("Map layer on; zoom in for points");
    expect(onHtml).not.toContain("Layer on");
    expect(onHtml).toContain(
      "Night lighting uses LTA lamp-post points as a night-lighting map layer outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
    );
  });

  it("frames traced correction notes as shelter feedback", () => {
    const html = renderScoreCard({
      feedbackEnabled: true,
      feedbackPoints: [
        { lat: 1.3701, lng: 103.8401 },
        { lat: 1.3702, lng: 103.8402 },
      ],
      feedbackSegmentLabels: ["exposed"],
    });

    expect(html).toContain('placeholder="Optional shelter note"');
    expect(html).toContain("Copy correction report");
    expect(html).toContain("Done tracing shelter");
    expect(html).toContain("2 points / 1 walk segment");
    expect(html).toContain("Walk segment 1");
    expect(formatFeedbackTraceCount(1)).toBe("1 point / 0 walk segments");
    expect(formatFeedbackTraceCount(2)).toBe("2 points / 1 walk segment");
    expect(formatFeedbackTraceCount(3)).toBe("3 points / 2 walk segments");
    expect(html).not.toContain("2 points / 1 walk segments");
    expect(html).not.toContain("2 points / 1 segments");
    expect(html).not.toContain(">Segment 1</span>");
    expect(html).not.toContain("Copy walk QA JSON");
    expect(html).not.toContain('placeholder="Optional route note"');
    expect(html).not.toContain('placeholder="Optional walk note"');
    expect(html).not.toContain("Copy QA JSON");
    expect(html).not.toContain("Suggest better route");
  });

  it("renders exposed gap lengths with coordinates", () => {
    const html = renderScoreCard();

    expect(html).toContain("Exposed gaps on sheltered walk");
    expect(html).not.toContain("Exposed gaps on this walk");
    expect(html).toContain("142 m");
    expect(html).toContain("181 m exposed across 2 gaps on the sheltered walk.");
    expect(html).not.toContain("181 m exposed across 2 gaps on the selected walk.");
    expect(html).toContain('aria-label="Exposed gap evidence"');
    expect(html).toContain("All recorded exposed gaps are shown.");
    expect(html).toContain("2 of 2 exposed gaps include map coordinates.");
    expect(html).toContain("Longest open-air stretch");
    expect(html).toContain("Map coordinate 1.37123, 103.84235");
    expect(html).toContain("Map coordinate 1.37091, 103.84101");
    expect(html).toContain("Focus on map");
    expect(html).not.toContain("Near 1.37123, 103.84235");
    expect(html).toContain(
      'aria-label="Focus on map for Longest open-air stretch at map coordinate 1.37123, 103.84235"'
    );
  });

  it("uses singular grammar when one exposed gap includes map coordinates", () => {
    const recordWithOneGap: ScoreRecord = {
      ...scoredRecord,
      exposure_gaps: [{ len_m: 64.2, label: "solo-gap", location: { lat: 1.37123, lon: 103.84235 } }],
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: recordWithOneGap,
      },
      rankingRecords: [recordWithOneGap],
    });

    expect(html).toContain("1 of 1 exposed gap includes map coordinates.");
    expect(html).not.toContain("1 of 1 exposed gap include map coordinates.");
  });

  it("matches active exposed-gap accessible labels to the selected map state", () => {
    const focusKey = `${scoredRecord.postal}:0:1.37123:103.84235:142`;
    const html = renderScoreCard({
      focusedExposureGapKey: focusKey,
    });

    expect(html).toContain(
      'aria-label="Selected on map for Longest open-air stretch at map coordinate 1.37123, 103.84235"'
    );
    expect(html).toContain("Selected on map");
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain(
      'aria-label="Focus on map for Longest open-air stretch at map coordinate 1.37123, 103.84235"'
    );
  });

  it("uses singular grammar when one exposed gap has no map coordinates", () => {
    const recordWithUnlocatedGap: ScoreRecord = {
      ...scoredRecord,
      exposure_gaps: [{ len_m: 64.2, label: "solo-gap" }],
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: recordWithUnlocatedGap,
      },
      rankingRecords: [recordWithUnlocatedGap],
    });

    expect(html).toContain("No map coordinates are recorded for this exposed gap.");
    expect(html).not.toContain("No map coordinates are recorded for these exposed gaps.");
  });

  it("names exposed gaps when the displayed gap list is truncated", () => {
    const recordWithFourGaps: ScoreRecord = {
      ...scoredRecord,
      exposure_gaps: [
        { len_m: 142.4, label: "gap-long", location: { lat: 1.37123, lon: 103.84235 } },
        { len_m: 64.2, label: "gap-medium" },
        { len_m: 38.2, label: "gap-short" },
        { len_m: 12.1, label: "gap-hidden" },
      ],
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: recordWithFourGaps,
      },
      rankingRecords: [recordWithFourGaps],
    });

    expect(html).toContain("Showing the 3 longest exposed gaps; 1 shorter exposed gap included in the total.");
    expect(html).toContain("Show 1 shorter exposed gap");
    expect(html).toContain("Gap 4 short exposed stretch");
    expect(html).not.toContain("Showing the longest 3; 1 shorter gap included in the total.");
  });

  it("names the shortest walk in exposure copy when that display is active", () => {
    const html = renderScoreCard({
      routeMode: "shortest",
    });

    expect(html).toContain("48% covered-walkway ratio on the shortest walk.");
    expect(html).toContain("181 m exposed across 2 gaps on the shortest walk.");
    expect(html).toContain("Shortest walk distance to transit.");
    expect(html).not.toContain("Sheltered walk distance to transit.");
    expect(html).toContain(
      "Shelter-map walk evidence 48% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
    );
    expect(html).not.toContain(
      "Shelter-map walk evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
    );
    expect(html).not.toContain("covered-walkway ratio on the selected walk.");
    expect(html).not.toContain("exposed across 2 gaps on the selected walk.");
  });

  it("names the displayed walk in the no-gap exposure fallback", () => {
    const recordWithoutGaps: ScoreRecord = {
      ...scoredRecord,
      exposure_gaps: [],
    };
    const html = renderScoreCard({
      routeMode: "shortest",
      selection: {
        ...selection,
        score: recordWithoutGaps,
      },
      rankingRecords: [recordWithoutGaps],
    });

    expect(html).toContain("No exposed gaps are recorded for this shortest walk.");
    expect(html).toContain('aria-label="Exposed gap evidence"');
    expect(html).toContain("All recorded segments for this shortest walk stay under covered-walkway or connector evidence.");
    expect(html).not.toContain("All recorded segments for this display stay under covered-walkway or connector evidence.");
    expect(html).toContain("Covered-walkway evidence");
    expect(html).toContain("Shelter-map walk evidence 48% covered-walkway ratio.");
    expect(html).not.toContain("0 m exposed across 0 gaps");
    expect(html).not.toContain("No exposed gaps are recorded for this selected walk.");
  });

  it("labels transit stop-or-exit availability before a user switches modes", () => {
    const recordWithRouteOptions: ScoreRecord = {
      ...scoredRecord,
      route_options: {
        mrt_lrt: {
          state: "NO_TRANSIT_IN_RANGE",
          total: null,
          subscores: null,
          best_node: null,
          paths: null,
          exposure_gaps: null,
        },
        bus: {
          state: "SCORED",
          total: 72,
          subscores: scoredRecord.subscores,
          best_node: scoredRecord.best_node,
          paths: scoredRecord.paths,
          exposure_gaps: scoredRecord.exposure_gaps,
        },
      },
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: recordWithRouteOptions,
      },
      rankingRecords: [recordWithRouteOptions],
    });

    expect(html).toContain('aria-label="Transit stop or exit type"');
    expect(html).toContain("<span>Auto-picked</span><small>displayed walk</small>");
    expect(html).toContain("<span>MRT/LRT exits</span><small>no published walk</small>");
    expect(html).toContain("<span>Bus stops</span><small>published walk</small>");
    expect(html).not.toContain('aria-label="Transit target type"');
    expect(html).not.toContain('aria-label="Transit target"');
    expect(html).not.toContain("<span>Best transit</span><small>selected walk</small>");
    expect(html).not.toContain("<span>Best transit</span><small>displayed walk</small>");
    expect(html).not.toContain("<span>Best transit</span><small>current walk</small>");
    expect(html).not.toContain("<span>Best transit</span><small>selected route</small>");
    expect(html).not.toContain("<span>MRT/LRT</span><small>no shelter-map walk</small>");
    expect(html).not.toContain("<span>MRT/LRT</span><small>no published walk</small>");
    expect(html).not.toContain("<span>Bus</span><small>shelter-map walk</small>");
    expect(html).not.toContain("<span>Bus</span><small>published walk</small>");
    expect(html).not.toContain("<span>MRT/LRT</span><small>no shelter map route</small>");
    expect(html).not.toContain("<span>Bus</span><small>shelter map route</small>");
    expect(html).not.toContain("<span>MRT/LRT</span><small>no route evidence</small>");
    expect(html).not.toContain("<span>Bus</span><small>route evidence</small>");

    const noDisplayedWalkHtml = renderScoreCard({
      selection: {
        ...selection,
        score: {
          ...recordWithRouteOptions,
          state: "NO_TRANSIT_IN_RANGE",
          total: null,
          subscores: null,
          best_node: null,
          paths: null,
          exposure_gaps: null,
        },
      },
      rankingRecords: [recordWithRouteOptions],
    });
    expect(noDisplayedWalkHtml).toContain("<span>Auto-picked</span><small>no published walk</small>");
    expect(noDisplayedWalkHtml).not.toContain("<span>Auto-picked</span><small>unavailable</small>");
  });

  it("explains no-transit records when a connected walk exists only beyond the locked range", () => {
    const noTransitRecord: ScoreRecord = {
      ...scoredRecord,
      state: "NO_TRANSIT_IN_RANGE",
      total: null,
      subscores: null,
      best_node: {
        ...scoredRecord.best_node!,
        type: "mrt_lrt_exit",
        name: "Ang Mo Kio Exit A",
        routed_m: 1500,
        station: "Ang Mo Kio",
      },
      paths: {
        ...scoredRecord.paths!,
        shortest_m: 1300,
        sheltered_m: 1500,
        covered_m: 720,
        covered_ratio: 0.48,
        shade_m: 120,
        shade_ratio: 0.08,
      },
      exposure_gaps: [{ len_m: 180.2, label: "far-gap", location: { lat: 1.369, lon: 103.845 } }],
      provenance: {
        routing_diagnostics: {
          nearest_routed_m: 1500,
        },
      },
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: noTransitRecord,
      },
      rankingRecords: [noTransitRecord],
    });

    expect(html).toContain("Connected walk beyond 1.2 km");
    expect(html).toContain("Closest connected shelter-map walk to transit is 1.5 km");
    expect(html).not.toContain("Closest connected transit shelter-map walk is 1.5 km");
    expect(html).toContain("Locked transit range is 1.2 km");
    expect(html).toContain(
      "Closest connected shelter-map walk found is about 1.5 km away; locked transit range is 1.2 km."
    );
    expect(html).toContain("Covered-walkway ratio");
    expect(html).toContain("48%");
    expect(html).toContain("1.5 km");
    expect(html).toContain("Exposed gaps on sheltered walk");
    expect(html).toContain("Shelter-map walk evidence is shown because a connected shelter-map walk exists, but the locked score is suppressed beyond the 1.2 km transit range.");
    expect(html).toContain("Beyond 1.2 km locked range");
    expect(html).not.toContain("Outside locked transit range");
    expect(html).not.toContain("Outside locked access range");
    expect(html).toContain("Bus service not scored");
    expect(html).toContain("Bus service support is not computed for records outside the locked 1.2 km transit range.");
    expect(html).not.toContain("Locked bus term unavailable");
    expect(html).not.toContain("Locked bus evidence is not computed for records outside the 1.2 km transit range.");
    expect(html).toContain("No full locked score is published for this postal, but the shelter-map walk evidence remains inspectable.");
    expect(html).not.toContain("No full locked score is published for this postal, but the route evidence remains inspectable.");
    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
    expect(html).not.toContain("<span>No full locked score</span><strong>Published data</strong>");
    expect(html).not.toContain("<span>No full score</span><strong>Published data</strong>");
    expect(html).not.toContain("Transit beyond locked range");
    expect(html).not.toContain("Shelter-map evidence unavailable");
  });

  it("explains no-transit records when candidates exist but are disconnected", () => {
    const disconnectedRecord: ScoreRecord = {
      ...scoredRecord,
      state: "NO_TRANSIT_IN_RANGE",
      total: null,
      subscores: null,
      best_node: null,
      paths: null,
      exposure_gaps: null,
      provenance: {
        reason: "transit_candidates_graph_disconnected",
      },
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: disconnectedRecord,
      },
      rankingRecords: [disconnectedRecord],
    });

    expect(html).toContain("Shelter-map walk not connected yet");
    expect(html).toContain("Transit stop or exit found");
    expect(html).toContain("Transit stops or exits exist, but the published shelter-map data has no connected shelter-map walk yet.");
    expect(html).not.toContain("Transit target found");
    expect(html).not.toContain("Transit targets exist, but the published shelter-map data has no connected shelter-map walk yet.");
    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
    expect(html).not.toContain("No qualifying MRT/LRT exit or bus stop was found");
  });

  it("explains no-transit records when no qualifying candidate was selected", () => {
    const noCandidateRecord: ScoreRecord = {
      ...scoredRecord,
      state: "NO_TRANSIT_IN_RANGE",
      total: null,
      subscores: null,
      best_node: null,
      paths: null,
      exposure_gaps: null,
      provenance: {
        reason: "no_transit_candidates_selected",
      },
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: noCandidateRecord,
      },
      rankingRecords: [noCandidateRecord],
    });

    expect(html).toContain("No qualifying transit stop or exit within 1.2 km");
    expect(html).not.toContain("No qualifying transit target within 1.2 km");
    expect(html).not.toContain("No qualifying transit stop within 1.2 km");
    expect(html).toContain("Beyond 1.2 km locked range");
    expect(html).not.toContain("Outside locked transit range");
    expect(html).toContain("No qualifying MRT/LRT exit or bus stop was found within the locked 1.2 km transit range for this postal.");
    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
    expect(html).not.toContain("Shelter-map walk not connected yet");
  });

  it("phrases mode-specific no-walk states as walks to transit stops or exits", () => {
    const noBusWalkRecord: ScoreRecord = {
      ...scoredRecord,
      state: "NO_TRANSIT_IN_RANGE",
      total: null,
      subscores: null,
      best_node: null,
      paths: null,
      exposure_gaps: null,
    };
    const html = renderScoreCard({
      transitMode: "bus",
      selection: {
        ...selection,
        score: noBusWalkRecord,
      },
      rankingRecords: [noBusWalkRecord],
    });

    expect(html).toContain("No connected shelter-map walk to bus stop within 1.2 km");
    expect(html).not.toContain("No connected shelter-map walk to bus stop within range");
    expect(html).toContain("No shelter-map walk to bus stop was found within the locked 1.2 km transit range.");
    expect(html).toContain("No shelter-map walk to bus stop within 1.2 km locked range");
    expect(html).not.toContain("No shelter-map walk to bus stop within locked transit range");
    expect(html).not.toContain("No connected bus stop shelter-map walk within range");
    expect(html).not.toContain("No bus stop walk was found within the locked 1.2 km transit range.");
    expect(html).not.toContain("No bus stop walk within locked transit range");
  });

  it("keeps null locked-term rows unavailable instead of inventing numbers", () => {
    const partialRecord: ScoreRecord = {
      ...scoredRecord,
      state: "SCORED_PARTIAL",
      total: null,
      best_node: null,
      paths: null,
      subscores: { access: null, rain: null, heat: null, bus: 42, crossing: null },
      exposure_gaps: null,
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: partialRecord,
      },
      rankingRecords: [partialRecord],
    });

    expect(html).toContain("Shelter exposure");
    expect(html).toContain(
      "Partial locked score: shelter-map evidence may still be present, but missing score factors count as zero in the locked scoring rule."
    );
    expect(html).not.toContain("unavailable score inputs count as zero");
    expect(html).not.toContain("the locked formula counts unavailable terms as zero");
    expect(html).not.toContain("missing score factors count as zero in the locked formula");
    expect(html).not.toContain(
      "Partial locked score: shelter-map evidence may still be present, but one or more locked terms are unavailable; locked weights count missing terms as zero."
    );
    expect(html).not.toContain(
      "Partial locked score: shelter-map evidence may still be present, but one or more component scores are unavailable; locked weights count missing terms as zero."
    );
    expect(html).not.toContain(
      "Partial locked score: one or more component scores are unavailable; locked weights count missing terms as zero."
    );
    expect(html).not.toContain("one or more sub-scores are unavailable");
    expect(html).toContain("Shelter-map evidence unavailable");
    expect(html).toContain("Shelter-map walk evidence unavailable.");
    expect(html).toContain("Locked score unavailable");
    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
    expect(html).toContain("<strong>Unavailable</strong><small>Shelter-map walk unavailable</small>");
    expect(html).toContain("<strong>Unavailable</strong><small>Walk-to-transit score unavailable</small>");
    expect(html).toContain("<strong>No full locked score</strong><small>Locked score unavailable</small>");
    expect(html).not.toContain("<strong>No full locked score</strong><small>Release sorting index unavailable</small>");
    expect(html).toContain("<strong>42</strong><small>20% locked bus support</small>");
    expect(html).not.toContain("<strong>42</strong><small>20% locked bus</small>");
    expect(html).not.toContain("<strong>0</strong><small>Shelter-map walk unavailable</small>");
    expect(html).not.toContain("Walk evidence unavailable");
    expect(html).not.toContain("<strong>0</strong><small>Walk-to-transit score unavailable</small>");
    expect(html).not.toContain("Access term unavailable");
    expect(html).not.toContain("<strong>Not scored</strong><small>No shelter score</small>");
    expect(html).not.toContain("<strong>Not scored</strong><small>No access score</small>");
    expect(html).not.toContain("<strong>Not scored</strong><small>No locked score</small>");
    expect(html).not.toContain("<strong>No full locked score</strong><small>No full locked score</small>");
    expect(html).not.toContain("<strong>No full locked score</strong><small>No locked score</small>");
    expect(html).not.toContain("Score not available");
    expect(html).not.toContain("Bundle score unavailable");
    expect(html).not.toContain("Route evidence unavailable");
    expect(html).not.toContain("Partial score:");
    expect(html).not.toContain("No composite score");
  });

  it("describes awaiting bundle scoring as a frozen v1 bundle state", () => {
    const awaitingRecord: ScoreRecord = {
      ...scoredRecord,
      state: "NOT_YET_SCORED",
      total: null,
      subscores: null,
      paths: null,
      best_node: null,
      exposure_gaps: null,
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: awaitingRecord,
      },
      rankingRecords: [],
    });

    expect(html).toContain("No full locked score in published shelter-map data");
    expect(html).toContain("Partial shelter-map evidence may be available");
    expect(html).toContain("<span>No full locked score</span><strong>Walk evidence</strong>");
    expect(html).not.toContain("Location Evidence Missing");
    expect(html).toContain("Locked score unavailable in the published shelter-map data.");
    expect(html).not.toContain("Locked score no full locked score in this bundle.");
    expect(html).not.toContain("No full locked score in this bundle");
    expect(html).not.toContain("Locked score unavailable in this bundle.");
    expect(html).not.toContain("No full score in this bundle");
    expect(html).not.toContain("Awaiting locked score");
    expect(html).toContain(
      "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet."
    );
    expect(html).not.toContain("this shelter-map bundle has no published full locked score");
    expect(html).not.toContain("the current published data has not scored it yet");
    expect(html).not.toContain("Locked score not scored.");
    expect(html).not.toContain("source universe");
    expect(html).not.toContain("current offline bundle");
    expect(html).not.toContain("Awaiting offline bundle scoring");
    expect(html).not.toContain("Needs pipeline scoring evidence");
    expect(html).not.toContain("pipeline scoring evidence");
  });

  it("renders direct bus fallback evidence instead of a false low-bus verdict", () => {
    const contradictionRecord: ScoreRecord = {
      ...scoredRecord,
      postal: "530227",
      total: 31.9,
      subscores: { access: 65, rain: 58, heat: 58, bus: 0, crossing: 70 },
      provenance: {
        direct_bus_fallback: {
          candidate_count: 3,
          nearest_direct_m: 99.1,
          best_expected_wait_min: 0.411,
        },
      },
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        result: { ...selection.result, POSTAL: "530227", SEARCHVAL: "S530227" },
        score: contradictionRecord,
      },
      rankingRecords: [contradictionRecord],
    });

    expect(html).toContain("Nearby direct bus service without verified shelter-map walk");
    expect(html).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(html).not.toContain("Nearby bus stop with service data");
    expect(html).not.toContain("Shelter-map walk not verified yet");
    expect(html).toContain("62% covered-walkway ratio on sheltered walk");
    expect(html).not.toContain("62% covered-walkway ratio on selected walk");
    expect(html).toContain("3 direct bus options found; nearest 99 m; 0.4 min best scheduled wait.");
    expect(html).not.toContain("direct bus candidates found");
    expect(html).not.toContain("Direct line to bus stop; walking route pending.");
    expect(html).toContain(
      "Direct bus service is shown as fallback evidence; no verified shelter-map walk to an official LTA bus stop is published, so the locked bus score remains 0."
    );
    expect(html).not.toContain("so this component score remains 0");
    expect(html).not.toContain("Nearby bus service not route-verified");
    expect(html).not.toContain("Nearby bus service not walk-verified");
    expect(html).not.toContain("62% sheltered on sheltered route");
    expect(html).not.toContain("Shelter-map route access was not verified");
    expect(html).not.toContain("Shelter-map walk access was not verified");
    expect(html).not.toContain("so this sub-score remains 0");
    expect(html).not.toContain("Walking-route access was not verified");
    expect(html).not.toContain("Walking network access was not verified");
    expect(html).toContain(
      "Locked score caveat: the locked bus score remains 0 because nearby direct bus service evidence could not be connected to a verified shelter-map walk."
    );
    expect(html).not.toContain("the bus term remains 0");
    expect(html).not.toContain("locked bus term remains 0");
    expect(html).not.toContain("nearby bus evidence could not be connected");
    expect(html).toContain("Bus service support");
    expect(html).toContain("20%");
    expect(html).not.toContain("Limited bus-service evidence");
    expect(html).not.toContain("Limited bus connectivity");
  });

  it("renders direct bus fallback score reasons without implying a verified walk", () => {
    const fallbackRecord: ScoreRecord = {
      ...scoredRecord,
      paths: {
        ...scoredRecord.paths!,
        endpoint_snap_connector_m: 9,
        routing_type: "direct_bus_fallback_unrouted",
      },
    };

    const html = renderScoreCard({
      selection: {
        ...selection,
        score: fallbackRecord,
      },
      rankingRecords: [fallbackRecord],
    });

    expect(html).toContain("Nearby direct bus service found");
    expect(html).toContain("No verified shelter-map walk yet");
    expect(html).not.toContain("Nearby bus service found");
    expect(html).toContain("Straight-line bus estimate; shelter-map walk pending.");
    expect(html).not.toContain("Direct line to bus stop; shelter-map walk pending.");
    expect(html).toContain("Straight-line bus estimate");
    expect(html).toContain("Published direct-bus fallback evidence selected.");
    expect(html).not.toContain("Published shelter-map walk selected.");
    expect(html).toContain('aria-label="Direct-bus fallback source evidence"');
    expect(html).toContain('aria-label="Direct-bus fallback evidence reasons"');
    expect(html).not.toContain('aria-label="Shelter source evidence"');
    expect(html).not.toContain('aria-label="Shelter-map evidence reasons"');
    expect(html).toContain("Evidence display straight-line bus estimate; Straight-line bus estimate active.");
    expect(html).toContain("Straight-line bus estimate evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
    expect(html).not.toContain("Shelter-map walk evidence 62% covered-walkway ratio");
    expect(html).toContain("Where the estimate is exposed");
    expect(html).not.toContain("Where the walk is exposed");
    expect(html).toContain('aria-label="Direct-bus fallback details"');
    expect(html).not.toContain('aria-label="Walk details"');
    expect(html).toContain("onto the straight-line bus estimate");
    expect(html).not.toContain("onto the shelter-map walk");
    expect(html).not.toContain("Walk display sheltered walk; Direct bus service estimate active.");
    expect(html).toContain("62% covered-walkway ratio for the straight-line bus estimate.");
    expect(html).toContain("Exposed gaps for straight-line bus estimate");
    expect(html).toContain("<span>Verified shelter-map walk</span><strong>Pending</strong>");
    expect(html).not.toContain("<span>Extra walk</span><strong>0 m</strong>");
    expect(html).not.toContain("62% covered-walkway ratio on the direct bus service estimate.");
    expect(html).not.toContain("Exposed gaps on direct bus service estimate");
    expect(html).not.toContain("Direct bus line estimate");
    expect(html).not.toContain("Nearby bus stop with service data");
    expect(html).not.toContain("Shelter-map walk not verified yet");
  });

  it("keeps the low-bus verdict for genuine zero-bus records without fallback evidence", () => {
    const noBusRecord: ScoreRecord = {
      ...scoredRecord,
      total: 40,
      subscores: { access: 65, rain: 58, heat: 58, bus: 0, crossing: 70 },
      provenance: {},
    };
    const html = renderScoreCard({
      selection: {
        ...selection,
        score: noBusRecord,
      },
      rankingRecords: [noBusRecord],
    });

    expect(html).toContain("Limited bus-service evidence");
    expect(html).not.toContain("Limited bus connectivity");
    expect(html).not.toContain("Nearby direct bus service without verified shelter-map walk");
    expect(html).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(html).not.toContain("Nearby bus service not walk-verified");
    expect(html).not.toContain("Nearby bus service not route-verified");
    expect(html).not.toContain("Nearby bus evidence not route-verified");
    expect(html).not.toContain("Walking network access was not verified");
    expect(html).toContain("Bus service support");
    expect(html).toContain("20%");
  });

  it("does not surface record-level untrusted_subscores as a selected-route warning", () => {
    const flaggedBusRecord: ScoreRecord = {
      ...scoredRecord,
      subscores: { access: 90, rain: 68.5, heat: 68.5, bus: 100, crossing: 100 },
      provenance: {
        direct_bus_fallback: {
          reason: "implausible_graph_route_to_datamall_bus_stop_within_direct_radius",
          best_expected_wait_min: 0.566,
          untrusted_subscores: ["rain", "heat", "crossing"],
        },
      },
    };
    const unflaggedBusRecord: ScoreRecord = {
      ...scoredRecord,
      subscores: { access: 90, rain: 68.5, heat: 68.5, bus: 100, crossing: 100 },
      provenance: {},
    };
    const flaggedNoBusRecord: ScoreRecord = {
      ...scoredRecord,
      subscores: { access: 65, rain: 58, heat: 58, bus: 0, crossing: 70 },
      provenance: {
        direct_bus_fallback: {
          candidate_count: 3,
          nearest_direct_m: 99.1,
          best_expected_wait_min: 0.411,
          untrusted_subscores: ["rain", "heat", "crossing"],
        },
      },
    };
    const unflaggedNoBusRecord: ScoreRecord = {
      ...scoredRecord,
      subscores: { access: 65, rain: 58, heat: 58, bus: 0, crossing: 70 },
      provenance: {},
    };

    const flaggedBusHtml = renderScoreCard({
      selection: { ...selection, score: flaggedBusRecord },
      rankingRecords: [flaggedBusRecord],
    });
    const unflaggedBusHtml = renderScoreCard({
      selection: { ...selection, score: unflaggedBusRecord },
      rankingRecords: [unflaggedBusRecord],
    });
    const flaggedNoBusHtml = renderScoreCard({
      selection: { ...selection, score: flaggedNoBusRecord },
      rankingRecords: [flaggedNoBusRecord],
    });
    const unflaggedNoBusHtml = renderScoreCard({
      selection: { ...selection, score: unflaggedNoBusRecord },
      rankingRecords: [unflaggedNoBusRecord],
    });

    expect(flaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
    expect(flaggedBusHtml).not.toContain("Nearby direct bus service without verified shelter-map walk");
    expect(flaggedBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(flaggedBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(flaggedBusHtml).not.toContain("Nearby bus service not route-verified");
    expect(flaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
    expect(unflaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
    expect(unflaggedBusHtml).not.toContain("Nearby direct bus service without verified shelter-map walk");
    expect(unflaggedBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(unflaggedBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(unflaggedBusHtml).not.toContain("Nearby bus service not route-verified");
    expect(unflaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");

    expect(flaggedNoBusHtml).toContain("Nearby direct bus service without verified shelter-map walk");
    expect(flaggedNoBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(flaggedNoBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(flaggedNoBusHtml).toContain("62% covered-walkway ratio on sheltered walk");
    expect(flaggedNoBusHtml).not.toContain("62% covered-walkway ratio on selected walk");
    expect(unflaggedNoBusHtml).toContain("Limited bus-service evidence");
    expect(unflaggedNoBusHtml).not.toContain("Limited bus connectivity");
    expect(unflaggedNoBusHtml).not.toContain("Nearby direct bus service without verified shelter-map walk");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not route-verified");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus evidence not route-verified");
  });
});
