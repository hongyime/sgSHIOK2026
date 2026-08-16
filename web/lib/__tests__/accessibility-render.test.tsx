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
  geom: null,
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
    ...overrides,
  };
  return renderToStaticMarkup(<ScoreCard {...props} />);
}

describe("rendered accessibility output", () => {
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
  });

  it("renders live status for score card load, route mode, stop selection, and ranks", () => {
    const html = renderScoreCard({
      routeMode: "shortest",
      isCustomStopSelected: true,
      rankingLoading: true,
      rankPanelOpen: true,
    });

    expect(html).toContain('role="status"');
    expect(html).toContain("Postal 560231 score panel loaded.");
    expect(html).toContain("Custom stop selected.");
    expect(html).toContain("Route display shortest");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading Overall SHIOK ranks.");
  });

  it("renders the route exposure lead and four-row score presentation", () => {
    const recordWithEqualRainHeat: ScoreRecord = {
      ...scoredRecord,
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
      html.indexOf('aria-label="Score breakdown"'),
      html.indexOf('aria-label="Rank by view"')
    );

    expect(html).toContain("Where the walk is exposed");
    expect(html).toContain("62% of the selected walk is covered.");
    expect(html).toContain("142 m is the longest exposed gap.");
    expect(html).toContain("Route evidence and locked score");
    expect(html).toContain("Four display rows; weights unchanged");
    expect(html).toContain("Shelter exposure");
    expect(html).toContain("Walk to transit");
    expect(html).toContain("Bus service support");
    expect(html).toContain("Locked SHIOK score");
    expect(breakdownHtml).not.toContain(">Heat proxy<");
    expect(breakdownHtml).not.toContain(">Rain shelter<");
    expect(breakdownHtml).not.toContain(">Crossing friction<");
    expect(html).toContain("Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.");
    expect(html).toContain(
      "Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first."
    );
    expect(html).toContain("Same displayed value as rain shelter for this postal.");
    expect(html).toContain("Score evidence: covered 149 m; greenery proxy 23 m.");
  });

  it("renders exposed gap lengths with coordinates", () => {
    const html = renderScoreCard();

    expect(html).toContain("Exposed gaps");
    expect(html).toContain("142 m");
    expect(html).toContain("Longest open-air stretch");
    expect(html).toContain("Near 1.37123, 103.84235");
    expect(html).toContain("Near 1.37091, 103.84101");
  });

  it("keeps null score rows as Not scored instead of inventing numbers", () => {
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
    expect(html).toContain("<strong>Not scored</strong><small>No shelter score</small>");
    expect(html).toContain("<strong>Not scored</strong><small>No access score</small>");
    expect(html).toContain("<strong>Not scored</strong><small>No composite score</small>");
    expect(html).toContain("<strong>42</strong><small>20% locked bus</small>");
    expect(html).not.toContain("<strong>0</strong><small>No shelter score</small>");
    expect(html).not.toContain("<strong>0</strong><small>No access score</small>");
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

    expect(html).toContain("Nearby bus evidence not route-verified");
    expect(html).toContain("62% sheltered on covered route");
    expect(html).toContain("3 direct bus candidates found; nearest 99 m; 0.4 min best scheduled wait.");
    expect(html).toContain("Walking network access was not verified, so this sub-score remains 0.");
    expect(html).toContain("Composite caveat: the bus term remains 0");
    expect(html).toContain("Bus service support");
    expect(html).toContain("20%");
    expect(html).not.toContain("Limited bus connectivity");
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

    expect(html).toContain("Limited bus connectivity");
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
    expect(flaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
    expect(unflaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
    expect(unflaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");

    expect(flaggedNoBusHtml).toContain("Nearby bus evidence not route-verified");
    expect(flaggedNoBusHtml).toContain("62% sheltered on covered route");
    expect(unflaggedNoBusHtml).toContain("Limited bus connectivity");
    expect(unflaggedNoBusHtml).not.toContain("Nearby bus evidence not route-verified");
  });
});
