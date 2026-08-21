import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

import {
  ScoreCard,
  SearchFeedback,
  formatFeedbackTraceCount,
  formatDataDate,
  formatGeneratedDate,
  routeDisplayAnnouncement,
  rankEmptyMessage,
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
      "No OneMap address result found for this search. Try a 6-digit postal code. Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
    );
    expect(noResultsHtml).toContain("No OneMap address result found for this search.");
    expect(noResultsHtml).toContain("Try a 6-digit postal code");
    expect(noResultsHtml).toContain(
      "Separately, the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
    );
    expect(noResultsHtml).not.toContain("the frozen shelter-map bundle&#x27;s recent public-source check found");
    expect(noResultsHtml).not.toContain("the frozen shelter-map bundle has measured recent-source misses");
    expect(noResultsHtml).not.toContain("the frozen score bundle has measured recent-source misses");
    expect(noResultsHtml).not.toContain("Try a 6-digit postal code; the frozen shelter-map bundle");
    expect(noResultsHtml).not.toContain("newer completions may still be outside");
  });

  it("introduces the shelter map panel before search", () => {
    const html = renderScoreCard({
      selection: null,
      rankingRecords: [],
    });

    expect(html).toContain("Find an address or postal code");
    expect(html).not.toContain("Find a postal code");
    expect(html).toContain('aria-label="Shelter map panel"');
    expect(html).toContain("No shelter map walk selected.");
    expect(html).toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting near transit.");
    expect(html).not.toContain("Search a Singapore postal code to inspect the covered-walkway ratio, exposed gaps, and night lighting near transit.");
    expect(html).not.toContain("No shelter map route selected.");
    expect(html).not.toContain('aria-label="Route evidence panel"');
    expect(html).not.toContain('aria-label="Score panel"');
    expect(html).not.toContain("No score selected.");
    expect(html).not.toContain("No route evidence selected.");
    expect(html).not.toContain("Search any Singapore address to see its walk-to-transit comfort score.");
  });

  it("renders live status for shelter-map panel load, walk mode, stop selection, and ranks", () => {
    const html = renderScoreCard({
      routeMode: "shortest",
      isCustomStopSelected: true,
      rankingLoading: true,
      rankPanelOpen: true,
    });

    expect(html).toContain('role="status"');
    expect(html).toContain("Postal 560231 shelter map panel loaded.");
    expect(html).toContain("Shelter evidence 48% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
    expect(html).not.toContain("Shelter evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
    expect(html).toContain("Locked score 72 out of 100.");
    expect(html.indexOf("Shelter evidence 48% covered-walkway ratio")).toBeLessThan(
      html.indexOf("Locked score 72 out of 100.")
    );
    expect(html).toContain("<span>Locked score</span><strong>72/100</strong>");
    expect(html).toContain("Custom transit stop selected.");
    expect(html).not.toContain("Custom stop selected.");
    expect(html).toContain("Walk display shortest walk");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading planning-area Locked SHIOK score ranks.");
    expect(html).toContain('aria-label="Shelter map panel"');
    expect(html).not.toContain("Postal 560231 route evidence panel loaded.");
    expect(html).not.toContain("Postal 560231 score panel loaded.");
    expect(html).not.toContain("Score 72 out of 100.");
    expect(html).not.toContain("Published route selected.");
    expect(html).not.toContain("Published walk selected.");
    expect(html).not.toContain("Route display shortest");
    expect(html).not.toContain('aria-label="Route evidence panel"');
    expect(html).not.toContain('aria-label="Score panel"');
  });

  it("announces the default walk display as sheltered walk instead of the internal mode name", () => {
    const html = renderScoreCard();

    expect(html).toContain("Walk display sheltered walk");
    expect(html).toContain("Published walk selected.");
    expect(html).not.toContain("Walk display shiokest");
    expect(html).not.toContain("Walk display sheltered;");
    expect(html).not.toContain("Published route selected.");
    expect(html).not.toContain("Route display sheltered");
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
      "Shelter evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
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

    expect(html).toContain("Preview shelter map evidence only");
    expect(html).toContain("↺ Published walk");
    expect(html).toContain("Shelter map evidence preview");
    expect(html).toContain("Map evidence only");
    expect(html).not.toContain("Not scored in the current bundle");
    expect(html).toContain("Preview shelter map evidence selected.");
    expect(html).toContain("Shelter map preview");
    expect(html).toContain("OneMap preview walk");
    expect(html).not.toContain("Preview walk");
    expect(html).toContain("<span>Locked score</span><strong>Preview only</strong>");
    expect(html).toContain(
      "OneMap walking preview is unavailable for this selected transit stop; showing straight-line preview only."
    );
    expect(html).toContain(
      "Preview only: this clicked transit stop has shelter map evidence, but it is not part of the published shelter-map bundle yet."
    );
    expect(html).not.toContain("this selected stop");
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
      "Postal 560231 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
    );
    expect(html).toContain("Outside published shelter-map bundle");
    expect(html).not.toContain("Outside shelter-map bundle");
    expect(html).not.toContain("outside the shelter-map bundle tied to the frozen June 2020 address universe");
    expect(html).not.toContain("Postal 560231 is not in the current shelter-map bundle.");
    expect(html).not.toContain("Postal 560231 is not in the current score bundle.");
    expect(html).not.toContain("Outside current bundle");
    expect(html).toContain(
      "No shelter-map walk is published for this postal; the published shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
    );
    expect(html).not.toContain("No shelter-map walk is published for this postal; this shelter-map bundle is tied");
    expect(html).not.toContain(
      "No shelter-map walk is published for this postal; the current bundle is tied to the frozen June 2020 address universe.</span>"
    );
    expect(html).not.toContain(
      "No shelter-map walk is published for this postal; the current bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 8 missing rows out of 976."
    );
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
      "Postal 521400 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; this postal is one of the 6 coordinate-backed HDB missing rows from frozen v1 (HDB 2021-2026 geocoded rows)."
    );
    expect(hdbHtml).toContain(
      "No shelter-map walk is published for this postal; the published shelter-map bundle is tied to the frozen June 2020 address universe, and this postal is one of the 6 coordinate-backed HDB missing rows from frozen v1 (HDB 2021-2026 geocoded rows)."
    );
    expect(hdbHtml).not.toContain(
      "this postal is one of the 8 recent public-source postals missing from frozen v1 (HDB 2021-2026 geocoded rows)"
    );
    expect(hdbHtml).not.toContain(
      "Postal 521400 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; recent public-source check found 8 missing rows out of 976"
    );
    expect(hdbHtml).not.toContain("cached recent public-source misses");
    expect(mcstHtml).toContain(
      "Postal 935456 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; this postal appears only in an unvalidated MCST proxy row; OneMap Search did not locate MYRA at the recorded postal, so it is source-quality evidence rather than a confirmed missing address."
    );
    expect(mcstHtml).toContain(
      "No shelter-map walk is published for this postal; the published shelter-map bundle is tied to the frozen June 2020 address universe, and this postal appears only in an unvalidated MCST proxy row; OneMap Search did not locate MYRA at the recorded postal, so it is source-quality evidence rather than a confirmed missing address."
    );
    expect(mcstHtml).not.toContain(
      "this postal is one of the 8 recent public-source postals missing from frozen v1 (MCST 2021-2026 proxy rows)"
    );
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
    const breakdownHtml = html.slice(
      html.indexOf('aria-label="Shelter map evidence and locked score breakdown"'),
      html.indexOf('aria-label="Planning-area comparison"')
    );

    expect(html).toContain("Where the walk is exposed");
    expect(html).toContain('aria-label="Walk shelter evidence"');
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
    expect(html).toContain("Shelter map evidence and locked score");
    expect(html).toContain('aria-label="Shelter map evidence and locked score breakdown"');
    expect(html).toContain("Four display rows; weights unchanged");
    expect(html).toContain('aria-label="Shelter map evidence reasons"');
    expect(html).not.toContain("Route evidence and locked score");
    expect(html).not.toContain('aria-label="Route shelter evidence"');
    expect(html).not.toContain('aria-label="Route evidence and locked score breakdown"');
    expect(html).not.toContain('aria-label="Route evidence reasons"');
    expect(html).not.toContain('aria-label="Score breakdown"');
    expect(html).not.toContain('aria-label="Score reasons"');
    expect(html).toContain("Shelter exposure");
    expect(html).toContain("Walk to transit");
    expect(html).toContain("Sheltered walk distance to transit.");
    expect(html).toContain("240 m sheltered walk to transit");
    expect(html).not.toContain("Selected walk distance to transit.");
    expect(html).not.toContain("240 m to transit");
    expect(html).not.toContain("Selected route distance to transit.");
    expect(html).toContain("Bus service support");
    expect(html).toContain(
      "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop."
    );
    expect(html).not.toContain("trusted walk to a DataMall bus stop");
    expect(html).toContain("Locked SHIOK score");
    expect(html).toContain('aria-label="Planning-area comparison"');
    expect(html).toContain("Compare planning-area records");
    expect(html).not.toContain("Compare nearby records");
    expect(html).toContain("Choose planning-area evidence view");
    expect(html).not.toContain("Rank records by");
    expect(html).toContain(
      "Planning-area list uses locked score only as a sorting index; shelter evidence remains the primary view."
    );
    expect(html).not.toContain("Planning-area list sorted by locked score; shelter evidence remains the primary view.");
    expect(html).not.toContain("Planning-area order by locked score.");
    expect(html).not.toContain('aria-label="Rank by view"');
    expect(html).not.toContain("<strong>Rank by</strong>");
    expect(html).not.toContain("Authoritative composite order.");
    expect(html).toContain('aria-label="Walk comparison"');
    expect(html).toContain("Shortest walk has 48% covered-walkway ratio (14pp lower)");
    expect(html).not.toContain('aria-label="Route comparison"');
    expect(html).not.toContain("Shortest is 48% sheltered (14pp less shelter)");
    expect(breakdownHtml).not.toContain(">Heat proxy<");
    expect(breakdownHtml).not.toContain(">Rain shelter<");
    expect(breakdownHtml).not.toContain(">Crossing friction<");
    expect(html).toContain(
      "In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence."
    );
    expect(html).not.toContain("Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.");
    expect(html).toContain(
      "Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first."
    );
    expect(html).toContain("Same displayed value as rain shelter for this postal.");
    expect(html).toContain("Heat proxy evidence: covered 149 m; greenery proxy 23 m.");
    expect(html).not.toContain("Better heat-proxy score");
    expect(html).toContain(
      "Greenery proxy uses sparse NParks walk-adjacent greenery geometry for heat only; it is not measured temperature or Leaf Area Index."
    );
    expect(html).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
    expect(html).toContain("Night lighting");
    expect(html).toContain("Map layer off");
    expect(html).not.toContain("Map layer on; zoom in for points");
    expect(html).not.toContain("Layer off");
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

  it("matches planning-area empty copy to the selected comparison view", () => {
    expect(rankEmptyMessage("overall", "Locked SHIOK score")).toBe(
      "No comparable full locked scores in this planning area."
    );
    expect(rankEmptyMessage("rain", "Rain-shelter evidence")).toBe(
      "No comparable planning-area records for Rain-shelter evidence."
    );

    const evidenceHtml = renderScoreCard({
      rankMetric: "rain",
      rankingRecords: [],
    });
    expect(evidenceHtml).toContain("No comparable planning-area records for Rain-shelter evidence.");
    expect(evidenceHtml).not.toContain("No comparable full locked scores in this planning area.");
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
    const html = renderScoreCard({ lampOverlayEnabled: true });

    expect(html).toContain("Night lighting");
    expect(html).toContain("Map layer on; zoom in for lamp-post points");
    expect(html).toContain("LTA lamp-post points");
    expect(html).not.toContain("LTA lamp points");
    expect(html).not.toContain("Map layer on; zoom in for points");
    expect(html).not.toContain("Layer on");
    expect(html).toContain(
      "Night lighting uses LTA lamp-post points as map evidence outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
    );
  });

  it("frames traced correction notes as walk feedback", () => {
    const html = renderScoreCard({
      feedbackEnabled: true,
      feedbackPoints: [
        { lat: 1.3701, lng: 103.8401 },
        { lat: 1.3702, lng: 103.8402 },
      ],
      feedbackSegmentLabels: ["exposed"],
    });

    expect(html).toContain('placeholder="Optional walk note"');
    expect(html).toContain("Copy walk QA JSON");
    expect(html).toContain("Done tracing");
    expect(html).toContain("2 points / 1 walk segment");
    expect(html).toContain("Walk segment 1");
    expect(formatFeedbackTraceCount(1)).toBe("1 point / 0 walk segments");
    expect(formatFeedbackTraceCount(2)).toBe("2 points / 1 walk segment");
    expect(formatFeedbackTraceCount(3)).toBe("3 points / 2 walk segments");
    expect(html).not.toContain("2 points / 1 walk segments");
    expect(html).not.toContain("2 points / 1 segments");
    expect(html).not.toContain(">Segment 1</span>");
    expect(html).not.toContain('placeholder="Optional route note"');
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
    expect(html).toContain("All recorded exposed gaps are shown.");
    expect(html).toContain("2 of 2 exposed gaps include map coordinates.");
    expect(html).toContain("Longest open-air stretch");
    expect(html).toContain("Near 1.37123, 103.84235");
    expect(html).toContain("Near 1.37091, 103.84101");
    expect(html).toContain('aria-label="Focus map on Longest open-air stretch near 1.37123, 103.84235"');
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
      "Shelter evidence 48% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
    );
    expect(html).not.toContain(
      "Shelter evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
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
    expect(html).toContain("Shelter evidence 48% covered-walkway ratio.");
    expect(html).not.toContain("0 m exposed across 0 gaps");
    expect(html).not.toContain("No exposed gaps are recorded for this selected walk.");
    expect(html).not.toContain("Exposed gaps on this walk");
  });

  it("labels transit target availability before a user switches modes", () => {
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

    expect(html).toContain('aria-label="Transit target"');
    expect(html).toContain("<span>Best transit</span><small>displayed walk</small>");
    expect(html).toContain("<span>MRT/LRT</span><small>no published walk</small>");
    expect(html).toContain("<span>Bus</span><small>published walk</small>");
    expect(html).not.toContain("<span>Best transit</span><small>selected walk</small>");
    expect(html).not.toContain("<span>Best transit</span><small>current walk</small>");
    expect(html).not.toContain("<span>Best transit</span><small>selected route</small>");
    expect(html).not.toContain("<span>MRT/LRT</span><small>no shelter-map walk</small>");
    expect(html).not.toContain("<span>Bus</span><small>shelter-map walk</small>");
    expect(html).not.toContain("<span>MRT/LRT</span><small>no shelter map route</small>");
    expect(html).not.toContain("<span>Bus</span><small>shelter map route</small>");
    expect(html).not.toContain("<span>MRT/LRT</span><small>no route evidence</small>");
    expect(html).not.toContain("<span>Bus</span><small>route evidence</small>");
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
      "Partial locked score: shelter-map evidence may still be present, but one or more locked terms are unavailable; locked weights count missing terms as zero."
    );
    expect(html).not.toContain(
      "Partial locked score: shelter-map evidence may still be present, but one or more component scores are unavailable; locked weights count missing terms as zero."
    );
    expect(html).not.toContain(
      "Partial locked score: one or more component scores are unavailable; locked weights count missing terms as zero."
    );
    expect(html).not.toContain("one or more sub-scores are unavailable");
    expect(html).toContain("Shelter map evidence unavailable");
    expect(html).toContain("Locked score unavailable");
    expect(html).toContain("<strong>Unavailable</strong><small>Shelter evidence unavailable</small>");
    expect(html).toContain("<strong>Unavailable</strong><small>Access term unavailable</small>");
    expect(html).toContain("<strong>No full locked score</strong><small>Release sorting index unavailable</small>");
    expect(html).toContain("<strong>42</strong><small>20% locked bus</small>");
    expect(html).not.toContain("<strong>0</strong><small>Shelter evidence unavailable</small>");
    expect(html).not.toContain("<strong>0</strong><small>Access term unavailable</small>");
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

    expect(html).toContain("No full locked score in published shelter-map bundle");
    expect(html).toContain("Awaiting locked score");
    expect(html).not.toContain("Location Evidence Missing");
    expect(html).toContain("Locked score unavailable in the published shelter-map bundle.");
    expect(html).not.toContain("Locked score no full locked score in this bundle.");
    expect(html).not.toContain("No full locked score in this bundle");
    expect(html).not.toContain("Locked score unavailable in this bundle.");
    expect(html).not.toContain("No full score in this bundle");
    expect(html).toContain(
      "This postal is in the frozen v1 address universe, but the published shelter-map bundle has no full locked score for it yet."
    );
    expect(html).not.toContain("this shelter-map bundle has no published full locked score");
    expect(html).not.toContain("the current published bundle has not scored it yet");
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

    expect(html).toContain("Nearby bus service without verified shelter-map walk");
    expect(html).not.toContain("Nearby bus stop with service data");
    expect(html).not.toContain("Shelter-map walk not verified yet");
    expect(html).toContain("62% covered-walkway ratio on sheltered walk");
    expect(html).not.toContain("62% covered-walkway ratio on selected walk");
    expect(html).toContain("3 direct bus options found; nearest 99 m; 0.4 min best scheduled wait.");
    expect(html).not.toContain("direct bus candidates found");
    expect(html).not.toContain("Direct line to bus stop; walking route pending.");
    expect(html).toContain("Shelter-map walk access was not verified, so the locked bus term remains 0.");
    expect(html).not.toContain("so this component score remains 0");
    expect(html).not.toContain("Nearby bus service not route-verified");
    expect(html).not.toContain("Nearby bus service not walk-verified");
    expect(html).not.toContain("62% sheltered on sheltered route");
    expect(html).not.toContain("Shelter-map route access was not verified");
    expect(html).not.toContain("so this sub-score remains 0");
    expect(html).not.toContain("Walking-route access was not verified");
    expect(html).not.toContain("Walking network access was not verified");
    expect(html).toContain("Locked score caveat: the bus term remains 0");
    expect(html).toContain("Bus service support");
    expect(html).toContain("20%");
    expect(html).not.toContain("Limited bus-service evidence");
    expect(html).not.toContain("Limited bus connectivity");
  });

  it("renders direct bus fallback score reasons without implying a verified walk", () => {
    const fallbackRecord: ScoreRecord = {
      ...scoredRecord,
      paths: { ...scoredRecord.paths!, routing_type: "direct_bus_fallback_unrouted" },
    };

    const html = renderScoreCard({
      selection: {
        ...selection,
        score: fallbackRecord,
      },
      rankingRecords: [fallbackRecord],
    });

    expect(html).toContain("Nearby bus service found");
    expect(html).toContain("No verified shelter-map walk yet");
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
    expect(flaggedBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(flaggedBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(flaggedBusHtml).not.toContain("Nearby bus service not route-verified");
    expect(flaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
    expect(unflaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
    expect(unflaggedBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(unflaggedBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(unflaggedBusHtml).not.toContain("Nearby bus service not route-verified");
    expect(unflaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");

    expect(flaggedNoBusHtml).toContain("Nearby bus service without verified shelter-map walk");
    expect(flaggedNoBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(flaggedNoBusHtml).toContain("62% covered-walkway ratio on sheltered walk");
    expect(flaggedNoBusHtml).not.toContain("62% covered-walkway ratio on selected walk");
    expect(unflaggedNoBusHtml).toContain("Limited bus-service evidence");
    expect(unflaggedNoBusHtml).not.toContain("Limited bus connectivity");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not walk-verified");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not route-verified");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus evidence not route-verified");
  });
});
