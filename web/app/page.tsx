"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  fetchGeomForPostal,
  fetchManifest,
  fetchRankRecordsForPostalArea,
  fetchScoreForPostal,
  fetchTransitPois,
  fetchTransitPoisForGeom,
} from "../lib/data";
import type {
  Manifest,
  ExposureGap,
  PostalGeom,
  PostalRouteGeomOption,
  RouteSegment,
  ScoreRecord,
  Subscores,
  TransitAccessMode,
  TransitPoiCollection,
} from "../lib/types";
import {
  RouteEvidenceMap,
  type FocusedExposureGap,
  type FeedbackPoint,
  type RouteDisplayMode,
  type RouteMapItem,
} from "../components/route-evidence-map";
import {
  deriveNearestTransitCandidates,
  haversineMeters,
  resolveBestCandidateId,
  type TransitCandidate,
} from "../lib/nearest-transit";
import { decodePolyline, encodePolyline } from "../lib/polyline";
import { scoreLiveRoute } from "../lib/live-route-scoring";
import {
  OneMapSearchError,
  searchOneMapLocations,
  shouldQueryOneMap,
  type SearchResult,
} from "../lib/onemap-search";
import { routesAreSame } from "../lib/route-display";
import { formatLockedScoreAvailabilityLine } from "../lib/locked-score-availability";
import {
  RANK_METRIC_OPTIONS,
  rankScoreRecords,
  type RankableScoreRecord,
  type RankMetric,
} from "../lib/subscore-ranking";
import styles from "./page.module.css";

export interface LoadedSelection {
  result: SearchResult;
  score: ScoreRecord | null;
  geom: PostalGeom | null;
}

const REASON_SUBSCORE_KEYS: Array<keyof Subscores> = ["rain", "access", "bus", "heat", "crossing"];

interface EvidenceBreakdownRow {
  id: string;
  label: string;
  value: string;
  meta: string;
  notes: string[];
}

type LiveRoutePreviewStatus = "loading" | "unavailable";

const TRANSIT_MODE_OPTIONS: Array<{ id: TransitAccessMode; label: string }> = [
  { id: "best_transit", label: "Best transit" },
  { id: "mrt_lrt", label: "MRT/LRT" },
  { id: "bus", label: "Bus" },
];

const SOURCE_LABELS: Record<string, string> = {
  lta_covered_linkway: "LTA covered linkway",
  osm_covered: "OSM shelter tags",
  inferred_hdb_void_deck: "HDB void-deck inference",
  bridge_underpass: "Bridge/underpass",
  audited_shelter_correction: "Audited shelter",
  direct_unrouted_bus: "Direct bus estimate",
  bus_stop_access_connector: "Bus stop connector",
  origin_graph_snap_connector: "Postal connector",
  destination_graph_snap_connector: "Transit connector",
  covered_unknown: "Mapped shelter",
  exposed: "Exposed",
};

const REASON_COPY: Record<keyof Subscores, { low: string; high: string }> = {
  access: { low: "Longer walk to transit", high: "Short walk to transit" },
  rain: { low: "Mostly exposed to rain", high: "Good rain shelter coverage" },
  heat: { low: "Low heat-proxy evidence", high: "Better heat-proxy score" },
  bus: { low: "Limited bus connectivity", high: "Strong bus connectivity" },
  crossing: { low: "More crossing friction", high: "Easy crossing profile" },
};

interface DirectBusFallbackEvidence {
  bestExpectedWaitMin: number;
  candidateCount: number | null;
  nearestDirectM: number | null;
}

export type FeedbackSegmentLabel =
  | "sheltered"
  | "void_deck"
  | "covered_bridge"
  | "underpass"
  | "exposed"
  | "blocked"
  | "other";

const FEEDBACK_SEGMENT_OPTIONS: Array<{ id: FeedbackSegmentLabel; label: string }> = [
  { id: "sheltered", label: "Sheltered" },
  { id: "void_deck", label: "Void deck" },
  { id: "covered_bridge", label: "Covered bridge" },
  { id: "underpass", label: "Underpass" },
  { id: "exposed", label: "Exposed" },
  { id: "blocked", label: "Blocked" },
  { id: "other", label: "Other" },
];

export function searchResultsAnnouncement(
  results: SearchResult[],
  loading: boolean,
  error: string | null,
  searched = false
): string {
  if (loading || error) return "";
  if (searched && results.length === 0) {
    return "No OneMap address result found for this search. Try a 6-digit postal code.";
  }
  if (results.length === 0) return "";
  return `${results.length} search result${results.length === 1 ? "" : "s"} available.`;
}

export function routeDisplayAnnouncement(mode: RouteDisplayMode, sameRoute: boolean): string {
  if (mode === "both") return "both walks";
  if (mode === "shortest") return sameRoute ? "shortest same as sheltered walk" : "shortest";
  return "sheltered";
}

export function scoreCardAnnouncement({
  selection,
  stationName,
  selectedRouteLabel,
  displayScore,
  isCustomStopSelected,
  previewRoute,
  routeMode,
  routeDisplayLabel,
}: {
  selection: LoadedSelection | null;
  stationName?: string;
  selectedRouteLabel?: string;
  displayScore?: number | null;
  isCustomStopSelected?: boolean;
  previewRoute?: boolean;
  routeMode: RouteDisplayMode;
  routeDisplayLabel?: string;
}): string {
  if (!selection) return "No shelter map walk selected.";
  const postal = postalTitle(selection);
  if (!selection.score) return `${postal} is not in the current shelter-map bundle.`;
  const scoreText = displayScore === null || displayScore === undefined
    ? "no full locked score in this bundle"
    : `${Math.round(displayScore)} out of 100`;
  const stopText = isCustomStopSelected
    ? previewRoute
      ? "Preview shelter map evidence selected."
      : "Custom stop selected."
    : "Published walk selected.";
  return `${postal} shelter map panel loaded. ${stationName ?? "Transit target loaded"}. Locked score ${scoreText}. ${stopText} Walk display ${routeDisplayLabel ?? routeMode}; ${selectedRouteLabel ?? "walk"} active.`;
}

export function rankAnnouncement({
  loading,
  rankedCount,
  rankMetricLabel,
}: {
  loading: boolean;
  rankedCount: number;
  rankMetricLabel: string;
}): string {
  if (loading) return `Loading planning-area ${rankMetricLabel} ranks.`;
  if (rankedCount === 0) return `No planning-area ${rankMetricLabel} ranks available.`;
  return `${rankedCount} planning-area ${rankMetricLabel} rank${
    rankedCount === 1 ? "" : "s"
  } available.`;
}

export function shouldFetchRankRecords({
  rankPanelOpen,
  postal,
  hasSubscores,
}: {
  rankPanelOpen: boolean;
  postal: string | null;
  hasSubscores: boolean;
}): boolean {
  return rankPanelOpen && Boolean(postal) && hasSubscores;
}

export function SearchFeedback({
  results,
  loading,
  error,
  searched = false,
}: {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  searched?: boolean;
}) {
  const status = searchResultsAnnouncement(results, loading, error, searched);
  const showNoResults = searched && !loading && !error && results.length === 0;
  return (
    <>
      <p className={styles.srOnly} role="status" aria-live="polite">
        {status}
      </p>
      {showNoResults && (
        <div className={styles.emptyBox} role="status">
          No OneMap address result found for this search. Try a 6-digit postal code. Separately, the frozen shelter-map bundle's recent public-source check found 8 missing rows out of 976.
        </div>
      )}
      {error && (
        <div className={styles.errorBox} role="alert" aria-live="assertive">
          {error}
        </div>
      )}
    </>
  );
}

function normalizePostal(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{1,6}$/.test(trimmed)) return null;
  return trimmed.padStart(6, "0");
}

function formatDataDate(manifest: Manifest | null): string {
  if (!manifest?.data_as_of) return "Unavailable";
  return new Date(manifest.data_as_of).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatGeneratedDate(manifest: Manifest | null): string {
  if (!manifest?.generated_at) return "Unavailable";
  return new Date(manifest.generated_at).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resultTitle(result: SearchResult): string {
  if (result.BUILDING && result.BUILDING !== "N/A") return toProperCase(result.BUILDING);
  return result.SEARCHVAL || `S${result.POSTAL}`;
}

function resultSubtitle(result: SearchResult): string {
  const road = result.ROAD_NAME && result.ROAD_NAME !== "N/A" ? toProperCase(result.ROAD_NAME) : "";
  return [road, result.POSTAL && result.POSTAL !== "N/A" ? `S${result.POSTAL}` : ""]
    .filter(Boolean)
    .join(" ");
}

function toProperCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bMrt\b/g, "MRT")
    .replace(/\bLrt\b/g, "LRT")
    .replace(/\bHdb\b/g, "HDB");
}

function scoreClass(total: number | null): string {
  if (total === null) return styles.scoreMuted;
  if (total >= 80) return styles.scoreGood;
  if (total >= 55) return styles.scoreMid;
  return styles.scoreLow;
}

function formatScore(value: number | null | undefined): string {
  return typeof value === "number" ? `${Math.round(value)}` : "Not scored";
}

function formatScoreWithMax(value: number | null | undefined, fallback = "No score"): string {
  return typeof value === "number" ? `${Math.round(value)}/100` : fallback;
}

function formatDistance(value: number | undefined): string {
  if (typeof value !== "number") return "Unavailable";
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
}

function formatPercent(value: number | null): string {
  return typeof value === "number" ? `${value}%` : "Unavailable";
}

function formatLockedScore(value: number | null | undefined): string {
  return typeof value === "number" ? `${Math.round(value)}/100` : "No full locked score";
}

function scoredMeta(value: number | null | undefined, scoredText: string, missingText: string): string {
  return typeof value === "number" ? scoredText : missingText;
}

function formatGapLocation(gap: ExposureGap): string | null {
  if (!gap.location) return null;
  return `${gap.location.lat.toFixed(5)}, ${gap.location.lon.toFixed(5)}`;
}

/**
 * Inline comparison between the currently-viewed route and its alternate,
 * spoken in percentage-points of covered-walkway ratio.
 *
 * Returns null when:
 *   - the sheltered walk and shortest walk are the same (nothing to compare)
 *   - the score is a direct-bus fallback (routes are not comparable)
 *   - either coverage % is unknown
 *   - the delta is under 5pp (avoids clutter for tiny differences)
 */
function buildRouteCompareNote(params: {
  routeMode: RouteDisplayMode;
  sameRoute: boolean;
  directBusFallback: boolean;
  coveredRoutePct: number | null;
  shortestPct: number | null;
}): string | null {
  const { routeMode, sameRoute, directBusFallback, coveredRoutePct, shortestPct } = params;
  if (sameRoute || directBusFallback) return null;
  if (coveredRoutePct === null || shortestPct === null) return null;
  const viewedIsShortest = routeMode === "shortest";
  const viewedPct = viewedIsShortest ? shortestPct : coveredRoutePct;
  const otherPct = viewedIsShortest ? coveredRoutePct : shortestPct;
  const otherLabel = viewedIsShortest ? "Sheltered walk" : "Shortest walk";
  const delta = otherPct - viewedPct;
  const magnitude = Math.abs(delta);
  if (magnitude < 5) return null;
  const direction = delta > 0 ? "higher" : "lower";
  return `${otherLabel} has ${otherPct}% covered-walkway ratio (${magnitude}pp ${direction})`;
}

function transitModeLabel(mode: TransitAccessMode): string {
  if (mode === "mrt_lrt") return "MRT/LRT";
  if (mode === "bus") return "bus";
  return "transit";
}

function exposureGapCopy(lenM: number, index: number): string {
  const rank = index === 0 ? "Longest" : `Gap ${index + 1}`;
  if (lenM >= 300) return `${rank} exposed stretch`;
  if (lenM >= 100) return `${rank} open-air stretch`;
  return `${rank} short exposed stretch`;
}

function exposureGapFocusTarget(score: ScoreRecord, gap: ExposureGap, index: number): FocusedExposureGap | null {
  if (!gap.location) return null;
  const { lat, lon } = gap.location;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    key: `${score.postal}:${index}:${lat.toFixed(5)}:${lon.toFixed(5)}:${Math.round(gap.len_m)}`,
    lat,
    lon,
  };
}

function nestedNumber(value: unknown, path: string[]): number | null {
  let cursor = value;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return typeof cursor === "number" && Number.isFinite(cursor) ? cursor : null;
}

function directBusFallbackEvidence(score: ScoreRecord): DirectBusFallbackEvidence | null {
  if (score.subscores?.bus !== 0) return null;
  const bestExpectedWaitMin = nestedNumber(score.provenance, [
    "direct_bus_fallback",
    "best_expected_wait_min",
  ]);
  if (bestExpectedWaitMin === null) return null;
  return {
    bestExpectedWaitMin,
    candidateCount: nestedNumber(score.provenance, ["direct_bus_fallback", "candidate_count"]),
    nearestDirectM: nestedNumber(score.provenance, ["direct_bus_fallback", "nearest_direct_m"]),
  };
}

function busFallbackSummary(evidence: DirectBusFallbackEvidence): string {
  const countText =
    evidence.candidateCount !== null
      ? `${evidence.candidateCount} direct bus option${evidence.candidateCount === 1 ? "" : "s"}`
      : "Direct bus options";
  const distanceText =
    evidence.nearestDirectM !== null ? `; nearest ${formatDistance(evidence.nearestDirectM)}` : "";
  const waitText = `${evidence.bestExpectedWaitMin.toFixed(1)} min best scheduled wait`;
  return `${countText} found${distanceText}; ${waitText}.`;
}

function provenanceReason(score: ScoreRecord, transitMode: TransitAccessMode): string | null {
  if (transitMode !== "best_transit") return null;
  const provenance = score.provenance;
  if (!provenance || typeof provenance !== "object") return null;
  const reason = provenance.reason;
  return typeof reason === "string" ? reason : null;
}

function nearestRoutedTransitM(score: ScoreRecord, transitMode: TransitAccessMode): number | null {
  return transitMode === "best_transit"
    ? nestedNumber(score.provenance, ["routing_diagnostics", "nearest_routed_m"])
    : null;
}

function noTransitTitle(score: ScoreRecord, transitMode: TransitAccessMode): string {
  const reason = provenanceReason(score, transitMode);
  if (reason === "transit_candidates_graph_disconnected") return "Shelter-map walk not connected yet";
  if (reason === "no_transit_candidates_selected") return "No transit stop within scoring range";
  return nearestRoutedTransitM(score, transitMode) !== null
    ? "Transit beyond scoring range"
    : `No connected ${transitModeLabel(transitMode)} shelter-map walk within range`;
}

function scoreStateNote(score: ScoreRecord, transitMode: TransitAccessMode): string | null {
  if (score.paths?.routing_type === "live_onemap_preview") {
    return "Preview only: this clicked stop has shelter map evidence, but it is not part of the published shelter-map bundle yet.";
  }
  if (score.state === "SCORED_PARTIAL") {
    return "Partial locked score: one or more component scores are unavailable; locked weights count missing terms as zero.";
  }
  if (score.state === "NO_TRANSIT_IN_RANGE") {
    const reason = provenanceReason(score, transitMode);
    if (reason === "transit_candidates_graph_disconnected") {
      return "Transit stops or exits exist, but this shelter-map bundle has no connected shelter-map walk yet.";
    }
    if (reason === "no_transit_candidates_selected") {
      return "No qualifying MRT/LRT exit or bus stop was found within the 1.2 km scoring range for this postal.";
    }
    const nearestM = nearestRoutedTransitM(score, transitMode);
    if (nearestM !== null) {
      return `Closest connected shelter-map walk found is about ${formatDistance(nearestM)} away; current scoring range is 1.2 km.`;
    }
    return `No ${transitModeLabel(transitMode)} walk was found within the current scoring range.`;
  }
  if (score.state === "NOT_YET_SCORED") {
    return "This postal is in the frozen v1 address universe, but the current published bundle has not scored it yet.";
  }
  const busFallback = directBusFallbackEvidence(score);
  if (busFallback) {
    return "Locked score caveat: the bus term remains 0 because nearby bus evidence could not be connected to a verified shelter-map walk.";
  }
  return null;
}

function routeOptionScore(score: ScoreRecord, mode: TransitAccessMode): ScoreRecord {
  if (mode === "best_transit") return score;
  const option = score.route_options?.[mode];
  if (!option) {
    return {
      ...score,
      state: "NO_TRANSIT_IN_RANGE",
      total: null,
      subscores: null,
      best_node: null,
      paths: null,
      exposure_gaps: null,
    };
  }
  return {
    ...score,
    state: option.state,
    total: option.total,
    subscores: option.subscores,
    best_node: option.best_node,
    paths: option.paths,
    exposure_gaps: option.exposure_gaps,
  };
}

function optionGeomToPostalGeom(postal: string, option: PostalRouteGeomOption): PostalGeom {
  return {
    postal,
    shortest: option.shortest,
    sheltered: option.sheltered,
    shortest_parts: option.shortest_parts,
    sheltered_parts: option.sheltered_parts,
    exposure_gaps: option.exposure_gaps,
    route_segments: option.route_segments,
  };
}

function routeOptionGeom(geom: PostalGeom | null, mode: TransitAccessMode): PostalGeom | null {
  if (!geom) return null;
  if (mode === "best_transit") return geom;
  const option = geom.route_options?.[mode];
  return option ? optionGeomToPostalGeom(geom.postal, option) : null;
}

function selectionForTransitMode(
  selection: LoadedSelection | null,
  mode: TransitAccessMode
): LoadedSelection | null {
  if (!selection) return null;
  return {
    result: selection.result,
    score: selection.score ? routeOptionScore(selection.score, mode) : null,
    geom: routeOptionGeom(selection.geom, mode),
  };
}

function selectionForChosenStop(
  baseSelection: LoadedSelection | null,
  chosenStopId: string | null,
  candidates: TransitCandidate[],
  mapTransitPois: TransitPoiCollection,
  originLatLng: { lat: number; lng: number } | null,
  liveRouteCache?: Record<string, LoadedSelection>
): LoadedSelection | null {
  if (!baseSelection || !chosenStopId) return baseSelection;

  // 1. If we already have a live OneMap-snapped preview route for this stop, return it.
  if (liveRouteCache && liveRouteCache[chosenStopId]) {
    return liveRouteCache[chosenStopId];
  }

  // 2. If pre-computed candidate geometry exists in the shard, use it!
  const candGeomOption = baseSelection.geom?.candidates?.[chosenStopId];
  const candScore = baseSelection.score?.candidates?.find(
    (c) => c.node_id === chosenStopId
  );
  if (candGeomOption && baseSelection.geom) {
    const adaptedGeom = optionGeomToPostalGeom(baseSelection.geom.postal, candGeomOption);
    const matchedCandidate = candidates.find((c) => c.id === chosenStopId);
    const poiFeature = mapTransitPois.features.find(
      (f) => f.properties?.id === chosenStopId
    );
    const stopName =
      poiFeature?.properties?.name ?? matchedCandidate?.name ?? chosenStopId;
    const stopKind =
      poiFeature?.properties?.kind ?? matchedCandidate?.kind ?? "transit";
    const stopCode = poiFeature?.properties?.code ?? matchedCandidate?.code;
    const stopStation =
      poiFeature?.properties?.station ?? matchedCandidate?.station;
    const stopExit = poiFeature?.properties?.exit ?? matchedCandidate?.exit;
    const shortestM = candScore?.paths?.shortest_m ?? matchedCandidate?.straight_line_m ?? 0;
    const shelteredM = candScore?.paths?.sheltered_m ?? shortestM;
    const coveredRatio =
      candScore?.paths?.covered_ratio ??
      (candScore?.paths?.sheltered_m && candScore?.paths?.shortest_m
        ? candScore.paths.sheltered_m / candScore.paths.shortest_m
        : 0);

    const adaptedScore: ScoreRecord | null = baseSelection.score
      ? {
          ...baseSelection.score,
          best_node: {
            type: stopKind === "mrt_exit" ? "mrt_lrt_exit" : "bus_stop",
            name: stopName,
            routed_m: shortestM,
            exit: stopCode || stopExit,
            station: stopStation,
            straight_line_m: matchedCandidate?.straight_line_m ?? shortestM,
          },
          paths: {
            ...baseSelection.score.paths,
            shortest_m: shortestM,
            sheltered_m: shelteredM,
            detour_pct: candScore?.paths?.detour_pct ?? 0,
            routing_type: candScore?.routing_type ?? "precomputed_candidate",
            covered_ratio: coveredRatio !== null ? coveredRatio : 0,
            covered_m: Math.round(shelteredM * (coveredRatio !== null ? coveredRatio : 0)),
          },
        }
      : null;

    return {
      result: baseSelection.result,
      score: adaptedScore,
      geom: adaptedGeom,
    };
  }

  // 3. Fallback: show shelter map evidence only while OneMap loads in background.
  const matchedCandidate = candidates.find((c) => c.id === chosenStopId);
  const poiFeature = mapTransitPois.features.find(
    (f) => f.properties?.id === chosenStopId
  );

  const coords = poiFeature?.geometry?.coordinates;
  const stopLng =
    Array.isArray(coords) && typeof coords[0] === "number"
      ? coords[0]
      : matchedCandidate?.coordinates[0];
  const stopLat =
    Array.isArray(coords) && typeof coords[1] === "number"
      ? coords[1]
      : matchedCandidate?.coordinates[1];

  if (
    originLatLng &&
    stopLat !== undefined &&
    stopLng !== undefined
  ) {
    const targetStop = {
      id: chosenStopId,
      name: poiFeature?.properties?.name ?? matchedCandidate?.name ?? chosenStopId,
      kind: (poiFeature?.properties?.kind ?? matchedCandidate?.kind ?? "bus_stop") as "bus_stop" | "mrt_exit",
      coordinates: [stopLng, stopLat] as [number, number],
      code: poiFeature?.properties?.code ?? matchedCandidate?.code,
      station: poiFeature?.properties?.station ?? matchedCandidate?.station,
      exit: poiFeature?.properties?.exit ?? matchedCandidate?.exit,
      straight_line_m: haversineMeters(originLatLng.lat, originLatLng.lng, stopLat, stopLng),
    };

    const directScored = scoreLiveRoute({
      postal: baseSelection.result.POSTAL,
      originCoords: originLatLng,
      targetStop,
      routeCoordinates: [
        [originLatLng.lat, originLatLng.lng],
        [stopLat, stopLng],
      ],
      baseScore: baseSelection.score,
      baseGeom: baseSelection.geom,
    });

    return {
      result: baseSelection.result,
      score: directScored.score,
      geom: directScored.geom,
    };
  }

  return baseSelection;
}


function postalTitle(selection: LoadedSelection): string {
  return `Postal ${selection.result.POSTAL}`;
}

function buildRouteItems(primary: LoadedSelection | null): RouteMapItem[] {
  const items: RouteMapItem[] = [];
  if (primary?.geom) {
    items.push({
      id: "primary",
      label: resultTitle(primary.result),
      geom: primary.geom,
      color: "#008f86",
    });
  }
  return items;
}

/**
 * Resolve the postal's origin lat/lng. Prefers the OneMap search result, then
 * falls back to the first coordinate of the loaded geom's shortest polyline.
 * Returns null when neither source yields finite coordinates.
 */
function resolveOriginLatLng(selection: LoadedSelection | null): { lat: number; lng: number } | null {
  if (!selection) return null;
  const searchLat = Number.parseFloat(selection.result.LATITUDE ?? "");
  const searchLng = Number.parseFloat(selection.result.LONGITUDE ?? "");
  if (Number.isFinite(searchLat) && Number.isFinite(searchLng)) {
    return { lat: searchLat, lng: searchLng };
  }
  const encoded = selection.geom?.shortest_parts?.[0] ?? selection.geom?.shortest;
  if (encoded) {
    const decoded = decodePolyline(encoded);
    const first = decoded[0];
    if (first && Number.isFinite(first[0]) && Number.isFinite(first[1])) {
      return { lat: first[0], lng: first[1] };
    }
  }
  return null;
}

function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): string[] {
  if (score.paths?.routing_type === "live_onemap_preview") {
    return ["Shelter map evidence preview", "Not scored in the current bundle"];
  }
  if (score.state === "NO_TRANSIT_IN_RANGE") {
    const label = transitModeLabel(transitMode);
    const reason = provenanceReason(score, transitMode);
    if (reason === "transit_candidates_graph_disconnected") {
      return ["Transit stop or exit found", "Shelter-map walk not connected yet"];
    }
    if (reason === "no_transit_candidates_selected") {
      return ["No transit stop within scoring range", "Outside current 1.2 km scoring range"];
    }
    const nearestM = nearestRoutedTransitM(score, transitMode);
    return nearestM !== null
      ? [`Closest connected ${label} shelter-map walk is ${formatDistance(nearestM)}`, "Current scoring range is 1.2 km"]
      : [`No ${label} walk within scoring range`, "Nearby transit may still exist beyond the 1.2 km scoring range"];
  }
  if (score.state === "NOT_YET_SCORED") return ["No full locked score in this bundle", "Awaiting locked score"];
  if (score.paths?.routing_type === "direct_bus_fallback_unrouted") {
    return ["Nearby bus stop with service data", "Shelter-map walk not verified yet"];
  }
  if (!score.paths || !score.best_node) return ["Shelter map evidence unavailable", "Locked score unavailable"];
  if (!score.subscores) return ["Locked score incomplete", "Shelter map evidence available"];

  const measuredReasons: string[] = [];
  const busFallback = directBusFallbackEvidence(score);
  if (typeof score.paths.sheltered_m === "number") {
    measuredReasons.push(`${formatDistance(score.paths.sheltered_m)} to ${transitModeLabel(transitMode)}`);
  }
  if (typeof score.paths.covered_ratio === "number") {
    measuredReasons.push(`${Math.round(score.paths.covered_ratio * 100)}% covered-walkway ratio on selected walk`);
  }
  if (busFallback) {
    measuredReasons.push("Nearby bus service not walk-verified");
    measuredReasons.push(busFallbackSummary(busFallback));
  }

  const values = REASON_SUBSCORE_KEYS.map((key) => ({
    key,
    value: score.subscores?.[key] ?? 0,
  })).sort((a, b) => a.value - b.value);

  if (busFallback && values[0]?.key === "bus") {
    const shelterReason = measuredReasons.find((reason) => reason.includes("covered-walkway ratio"));
    return [
      "Nearby bus service not walk-verified",
      shelterReason ?? measuredReasons[0] ?? busFallbackSummary(busFallback),
    ];
  }

  const lowReasons = values
    .filter((item) => item.value < 55)
    .map((item) => (item.key === "bus" && busFallback ? null : REASON_COPY[item.key].low))
    .filter((reason): reason is string => Boolean(reason));
  if (lowReasons.length >= 2) return lowReasons.slice(0, 2);
  if (lowReasons.length === 1) {
    return [lowReasons[0], measuredReasons[0] ?? REASON_COPY[[...values].reverse()[0].key].high];
  }

  return (measuredReasons.length >= 2 ? measuredReasons : [...values]
    .reverse()
    .slice(0, 2)
    .map((item) => REASON_COPY[item.key].high));
}

function routeSourceBreakdown(
  selection: LoadedSelection | null,
  routeMode: RouteDisplayMode,
  sameRoute: boolean
): Array<{ source: string; label: string; lenM: number }> {
  const segments =
    routeMode === "shortest" && !sameRoute
      ? selection?.geom?.route_segments?.shortest
      : selection?.geom?.route_segments?.sheltered;
  if (!segments?.length) return [];

  const totals = new Map<string, number>();
  for (const segment of segments as RouteSegment[]) {
    const source =
      segment.source_layer === "bus_stop_access_connector" ||
      segment.source_layer === "origin_graph_snap_connector" ||
      segment.source_layer === "destination_graph_snap_connector"
        ? segment.source_layer
        : segment.source_class ?? (segment.is_covered ? "covered_unknown" : "exposed");
    totals.set(source, (totals.get(source) ?? 0) + segment.len_m);
  }
  return Array.from(totals.entries())
    .map(([source, lenM]) => ({
      source,
      label: SOURCE_LABELS[source] ?? source.replaceAll("_", " "),
      lenM,
    }))
    .filter((item) => item.lenM > 0)
    .sort((a, b) => b.lenM - a.lenM)
    .slice(0, 4);
}

function isPreviewRoute(score: ScoreRecord): boolean {
  return score.paths?.routing_type === "live_onemap_preview";
}

function liveRoutePreviewStatusNote(status: LiveRoutePreviewStatus | null | undefined): string | null {
  if (status === "loading") {
    return "Fetching OneMap walking preview; the selected stop is shown as a straight-line preview until that walk preview returns.";
  }
  if (status === "unavailable") {
    return "OneMap walking preview is unavailable for this selected stop; showing straight-line preview only.";
  }
  return null;
}

function buildFeedbackPayload({
  selection,
  transitMode,
  routeMode,
  points,
  segmentLabels,
  note,
}: {
  selection: LoadedSelection | null;
  transitMode: TransitAccessMode;
  routeMode: RouteDisplayMode;
  points: FeedbackPoint[];
  segmentLabels: FeedbackSegmentLabel[];
  note: string;
}) {
  return {
    postal: selection?.result.POSTAL ?? null,
    destination: selection?.score?.best_node?.name ?? null,
    transit_mode: transitMode,
    walk_mode: routeMode,
    route_mode: routeMode,
    issue: "user_reported_better_walk_route",
    source: "user_drawn_qa_evidence_not_score_override",
    waypoints: points.map((point) => [point.lat, point.lng]),
    segment_labels: segmentLabels.slice(0, Math.max(0, points.length - 1)),
    user_note: note.trim() || null,
    current_score_state: selection?.score?.state ?? null,
    current_total: selection?.score?.total ?? null,
    current_best_node: selection?.score?.best_node ?? null,
    current_paths: selection?.score?.paths ?? null,
    created_at: new Date().toISOString(),
  };
}

function RouteModeControl({
  mode,
  setMode,
  disabled,
  sameRoute,
  directBusFallback,
}: {
  mode: RouteDisplayMode;
  setMode: (mode: RouteDisplayMode) => void;
  disabled: boolean;
  sameRoute: boolean;
  directBusFallback: boolean;
}) {
  if (directBusFallback) {
    return <div className={styles.sameRouteNote}>Direct line to bus stop; shelter-map walk pending.</div>;
  }

  if (sameRoute) {
    return (
      <div className={styles.sameRouteNote}>
        Shortest same as sheltered walk.
      </div>
    );
  }

  return (
    <div className={`${styles.segmented} ${styles.routeSegmented}`} aria-label="Walk display">
      <button
        type="button"
        className={mode === "shiokest" ? styles.segmentedActive : undefined}
        aria-pressed={mode === "shiokest"}
        disabled={disabled}
        onClick={() => setMode("shiokest")}
      >
        Sheltered
      </button>
      <button
        type="button"
        className={mode === "both" ? styles.segmentedActive : undefined}
        aria-pressed={mode === "both"}
        disabled={disabled}
        onClick={() => setMode("both")}
      >
        Both
      </button>
      <button
        type="button"
        className={mode === "shortest" ? styles.segmentedActive : undefined}
        aria-pressed={mode === "shortest"}
        disabled={disabled}
        onClick={() => setMode("shortest")}
      >
        Shortest
      </button>
    </div>
  );
}

function TransitModeControl({
  score,
  mode,
  setMode,
}: {
  score: ScoreRecord;
  mode: TransitAccessMode;
  setMode: (mode: TransitAccessMode) => void;
}) {
  if (!score.route_options) return null;
  const availabilityLabel = (option: (typeof TRANSIT_MODE_OPTIONS)[number], available: boolean) => {
    if (option.id === "best_transit") return available ? "selected walk" : "unavailable";
    if (available) return "shelter-map walk";
    return "no shelter-map walk";
  };
  return (
    <div className={`${styles.segmented} ${styles.transitSegmented}`} aria-label="Transit target">
      {TRANSIT_MODE_OPTIONS.map((option) => {
        const routeOption = option.id === "best_transit" ? score : score.route_options?.[option.id];
        const available = Boolean(routeOption?.paths);
        return (
          <button
            key={option.id}
            type="button"
            className={mode === option.id ? styles.segmentedActive : undefined}
            aria-pressed={mode === option.id}
            data-empty={!available}
            onClick={() => setMode(option.id)}
          >
            <span>{option.label}</span>
            <small>{availabilityLabel(option, available)}</small>
          </button>
        );
      })}
    </div>
  );
}

function InlineRouteLegend({
  sameRoute,
  directBusFallback,
  previewRoute = false,
}: {
  sameRoute: boolean;
  directBusFallback: boolean;
  previewRoute?: boolean;
}) {
  return (
    <div className={styles.inlineLegend} aria-label="Map legend">
      <span>
        <i className={directBusFallback || previewRoute ? styles.directBusLine : styles.shiokestLine} />
        {directBusFallback ? "Direct bus estimate" : previewRoute ? "Shelter map preview" : "Sheltered walk"}
      </span>
      {!directBusFallback && !previewRoute && (
        <>
          <span>
            <i className={styles.shortestLine} />
            {sameRoute ? "Shortest (same)" : "Shortest"}
          </span>
          <span>
            <i className={styles.gapLine} />
            Exposed
          </span>
          <span>
            <i className={styles.hdbLine} />
            HDB inferred
          </span>
          <span>
            <i className={styles.bridgeLine} />
            Bridge/underpass
          </span>
        </>
      )}
      <span>
        <i className={styles.mrtDot} />
        MRT/LRT
      </span>
      <span>
        <i className={styles.busDot} />
        Bus stop
      </span>
    </div>
  );
}

export function ScoreCard({
  selection,
  routeMode,
  setRouteMode,
  transitMode,
  setTransitMode,
  feedbackEnabled,
  setFeedbackEnabled,
  feedbackPoints,
  feedbackSegmentLabels,
  setFeedbackSegmentLabel,
  clearFeedback,
  feedbackNote,
  setFeedbackNote,
  copyFeedback,
  copyStatus,
  isCustomStopSelected = false,
  liveRoutePreviewStatus = null,
  onResetChosenStop,
  rankMetric,
  setRankMetric,
  rankingRecords,
  rankingLoading,
  rankPanelOpen,
  setRankPanelOpen,
  focusedExposureGapKey = null,
  onFocusExposureGap,
  lampOverlayEnabled = false,
}: {
  selection: LoadedSelection | null;
  routeMode: RouteDisplayMode;
  setRouteMode: (mode: RouteDisplayMode) => void;
  transitMode: TransitAccessMode;
  setTransitMode: (mode: TransitAccessMode) => void;
  feedbackEnabled: boolean;
  setFeedbackEnabled: (enabled: boolean) => void;
  feedbackPoints: FeedbackPoint[];
  feedbackSegmentLabels: FeedbackSegmentLabel[];
  setFeedbackSegmentLabel: (index: number, label: FeedbackSegmentLabel) => void;
  clearFeedback: () => void;
  feedbackNote: string;
  setFeedbackNote: (note: string) => void;
  copyFeedback: () => void;
  copyStatus: string;
  isCustomStopSelected?: boolean;
  liveRoutePreviewStatus?: LiveRoutePreviewStatus | null;
  onResetChosenStop?: () => void;
  rankMetric: RankMetric;
  setRankMetric: (metric: RankMetric) => void;
  rankingRecords: RankableScoreRecord[];
  rankingLoading: boolean;
  rankPanelOpen: boolean;
  setRankPanelOpen: (open: boolean) => void;
  focusedExposureGapKey?: string | null;
  onFocusExposureGap?: (gap: FocusedExposureGap) => void;
  lampOverlayEnabled?: boolean;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);

  if (!selection) {
    return (
      <section className={styles.scoreCard} aria-label="Shelter map panel">
        <p className={styles.srOnly} role="status" aria-live="polite">
          {scoreCardAnnouncement({ selection, routeMode })}
        </p>
        <div className={styles.emptyState}>
          <strong>Find a postal code</strong>
          <span>Search a Singapore postal code to inspect the covered-walkway ratio, exposed gaps, and night lighting near transit.</span>
        </div>
      </section>
    );
  }

  const { score } = selection;
  if (!score) {
    return (
      <section className={styles.scoreCard} aria-label="Shelter map panel">
        <p className={styles.srOnly} role="status" aria-live="polite">
          {scoreCardAnnouncement({ selection, routeMode })}
        </p>
        <h2>{postalTitle(selection)}</h2>
        <div className={styles.emptyState}>
          <strong>Outside shelter-map bundle</strong>
          <span>No shelter-map walk is published for this postal; the current bundle is tied to the frozen June 2020 address universe.</span>
        </div>
      </section>
    );
  }

  const sameRoute = routesAreSame(selection);
  const directBusFallback = score.paths?.routing_type === "direct_bus_fallback_unrouted";
  const previewRoute = isPreviewRoute(score);
  const extraWalkM =
    score.paths && typeof score.paths.shortest_m === "number" && typeof score.paths.sheltered_m === "number"
      ? Math.max(0, score.paths.sheltered_m - score.paths.shortest_m)
      : null;
  const coveredRatio = score.paths?.covered_ratio !== undefined ? Math.round(score.paths.covered_ratio * 100) : null;
  const shortestCoveredRatio =
    score.paths?.shortest_covered_ratio !== undefined ? Math.round(score.paths.shortest_covered_ratio * 100) : null;
  const selectedDistance =
    routeMode === "shortest" && !sameRoute ? score.paths?.shortest_m : score.paths?.sheltered_m;
  const selectedCoverage = routeMode === "shortest" && !sameRoute ? shortestCoveredRatio : coveredRatio;
  const selectedRouteLabel = directBusFallback
    ? "Direct bus estimate"
    : previewRoute
      ? "Preview walk"
    : routeMode === "shortest" && !sameRoute
      ? "Shortest walk"
      : "Sheltered walk";
  const stationName =
    previewRoute
      ? toProperCase(score.best_node?.name ?? "Selected transit stop")
      : score.state === "NO_TRANSIT_IN_RANGE"
      ? noTransitTitle(score, transitMode)
      : score.state === "NOT_YET_SCORED"
        ? "No full locked score in this bundle"
      : toProperCase(score.best_node?.name ?? "No transit found nearby");
  const reasons = scoreReasons(score, transitMode);
  const stateNote = scoreStateNote(score, transitMode);
  const previewStatusNote = previewRoute
    ? liveRoutePreviewStatusNote(liveRoutePreviewStatus)
    : null;
  const busFallback = directBusFallbackEvidence(score);
  const displayScore = score.total;
  const rankedRecords = useMemo(
    () => rankScoreRecords(rankingRecords, rankMetric, 5),
    [rankingRecords, rankMetric]
  );
  const rankMetricLabel =
    RANK_METRIC_OPTIONS.find((option) => option.id === rankMetric)?.label ?? "Locked SHIOK score";
  const scoreStatus = scoreCardAnnouncement({
    selection,
    stationName,
    selectedRouteLabel,
    displayScore,
    isCustomStopSelected,
    previewRoute,
    routeMode,
    routeDisplayLabel: routeDisplayAnnouncement(routeMode, sameRoute),
  });
  const rankStatus = rankAnnouncement({
    loading: rankingLoading,
    rankedCount: rankedRecords.length,
    rankMetricLabel,
  });
  const sourceBreakdown = routeSourceBreakdown(selection, routeMode, sameRoute);
  const exposureGaps = score.exposure_gaps ? [...score.exposure_gaps].sort((a, b) => b.len_m - a.len_m) : [];
  const endpointSnapM = score.paths?.endpoint_snap_connector_m ?? 0;
  const extraWalkLabel =
    extraWalkM === null ? "Unavailable" : sameRoute || extraWalkM === 0 ? "0 m" : `+${Math.round(extraWalkM)} m`;
  const compareNote = buildRouteCompareNote({
    routeMode,
    sameRoute,
    directBusFallback,
    coveredRoutePct: coveredRatio,
    shortestPct: shortestCoveredRatio,
  });
  const shadeProxyPct =
    score.paths && typeof score.paths.shade_ratio === "number"
      ? Math.round(score.paths.shade_ratio * 100)
      : null;
  const heatEvidenceDetail =
    score.paths &&
    typeof score.paths.covered_m === "number" &&
    typeof score.paths.shade_m === "number"
      ? `Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}; greenery proxy ${formatDistance(score.paths.shade_m)}.`
      : null;
  const heatMatchesRain =
    score.subscores &&
    formatScore(score.subscores.heat) === formatScore(score.subscores.rain)
      ? "Same displayed value as rain shelter for this postal."
      : null;
  const routeDetailItems: Array<{ label: string; value: string }> = [];
  const routeDetailNotes: string[] = [];
  if (shadeProxyPct !== null) {
    routeDetailItems.push({ label: "Greenery proxy", value: `${shadeProxyPct}%` });
  }
  if (score.paths) {
    routeDetailItems.push({ label: "Night lighting", value: lampOverlayEnabled ? "Layer on" : "Layer off" });
    routeDetailNotes.push("Night lighting uses LTA lamp-post points as map evidence outside the locked score.");
  }
  if (endpointSnapM > 0) {
    routeDetailItems.push({ label: "Snap connector", value: formatDistance(endpointSnapM) });
  }
  if (endpointSnapM > 0) {
    routeDetailNotes.push("Snap connector is the short link from the postal or transit point onto the shelter-map walk.");
  }
  const longestGap = exposureGaps[0] ?? null;
  const visibleExposureGaps = exposureGaps.slice(0, 3);
  const totalExposureM = exposureGaps.reduce((total, gap) => total + gap.len_m, 0);
  const gapsWithCoordinates = exposureGaps.filter((gap) => formatGapLocation(gap)).length;
  const hiddenGapCount = Math.max(0, exposureGaps.length - visibleExposureGaps.length);
  const longestGapText = longestGap
    ? `${formatDistance(longestGap.len_m)} is the longest exposed gap.`
    : "No exposed gaps are recorded for this selected walk.";
  const exposureHeroText =
    exposureGaps.length === 0
      ? longestGapText
      : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
          exposureGaps.length === 1 ? "" : "s"
        }; ${longestGapText}`;
  const gapSummaryText =
    exposureGaps.length === 0
      ? null
      : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
          exposureGaps.length === 1 ? "" : "s"
        } on the selected walk.`;
  const gapListScopeText =
    hiddenGapCount > 0
      ? `Showing the longest ${visibleExposureGaps.length}; ${hiddenGapCount} shorter gap${
          hiddenGapCount === 1 ? "" : "s"
        } included in the total.`
      : "All recorded exposed gaps are shown.";
  const gapCoordinateSummaryText =
    gapsWithCoordinates > 0
      ? `${gapsWithCoordinates} of ${exposureGaps.length} exposed gap${
          exposureGaps.length === 1 ? "" : "s"
        } include map coordinates.`
      : "No map coordinates are recorded for these exposed gaps.";
  const selectedWalkLabel = previewRoute ? "preview walk" : "selected walk";
  const evidenceRows: EvidenceBreakdownRow[] = score.subscores
    ? [
        {
          id: "shelter",
          label: "Shelter exposure",
          value: score.paths ? formatPercent(selectedCoverage) : formatScore(null),
          meta: score.paths
            ? "Covered-walkway ratio"
            : scoredMeta(score.subscores.rain ?? score.subscores.heat, "40% locked rain+heat", "No shelter score"),
          notes: [
            "Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.",
            "Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first.",
            heatMatchesRain,
            heatEvidenceDetail,
          ].filter((note): note is string => Boolean(note)),
        },
        {
          id: "access",
          label: "Walk to transit",
          value: score.paths ? formatDistance(selectedDistance) : formatScore(score.subscores.access),
          meta: scoredMeta(score.subscores.access, "35% locked access", "No access score"),
          notes: [`Selected walk distance to ${transitModeLabel(transitMode)}.`],
        },
        {
          id: "bus",
          label: "Bus service support",
          value: formatScore(score.subscores.bus),
          meta: scoredMeta(score.subscores.bus, "20% locked bus", "No bus score"),
          notes: [
            "A low value can mean weak service evidence, or that routing could not prove a trusted walk to a DataMall bus stop.",
            busFallback
              ? `${busFallbackSummary(busFallback)} Shelter-map walk access was not verified, so this component score remains 0.`
              : null,
          ].filter((note): note is string => Boolean(note)),
        },
        {
          id: "locked-score",
          label: "Locked SHIOK score",
          value: formatLockedScore(displayScore),
          meta: scoredMeta(displayScore, "Release sorting index", "No locked score"),
          notes: [
            "Start with the shelter trace and exposed gaps; use the locked score only to sort the current bundle.",
            "Crossing friction remains a 5% locked term, but has low separation in this release.",
          ],
        },
      ]
    : [];

  return (
    <section className={styles.scoreCard} aria-label="Shelter map panel">
      <p className={styles.srOnly} role="status" aria-live="polite">
        {scoreStatus}
      </p>
      <div className={styles.scoreHeader}>
        <div>
          <h2>{postalTitle(selection)}</h2>
          <p>{stationName}</p>
          {isCustomStopSelected && (
            <div className={styles.customStopBar}>
              <span>{previewRoute ? "Preview shelter map evidence only" : "Viewing selected stop"}</span>
              {onResetChosenStop && (
                <button
                  type="button"
                  className={styles.resetCustomStopBtn}
                  onClick={onResetChosenStop}
                >
                  ↺ Published walk
                </button>
              )}
            </div>
          )}
        </div>
        <div className={styles.scoreHeaderRight}>
          <div className={`${styles.scoreBadge} ${scoreClass(displayScore)}`}>
            <span>Locked score</span>
            <strong>{formatScoreWithMax(displayScore)}</strong>
          </div>
          <details
            className={styles.overflowMenu}
            open={overflowOpen}
            onToggle={(event) => setOverflowOpen((event.target as HTMLDetailsElement).open)}
          >
            <summary
              className={styles.overflowSummary}
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
              aria-label="More actions"
            >
              <span aria-hidden="true">⋯</span>
            </summary>
            <div className={styles.overflowMenuBody} role="menu">
              <button
                type="button"
                role="menuitem"
                aria-pressed={feedbackEnabled}
                onClick={() => setFeedbackEnabled(!feedbackEnabled)}
              >
                {feedbackEnabled ? "Done tracing" : "Suggest better walk"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={copyFeedback}
                disabled={feedbackPoints.length < 2}
              >
                Copy walk QA JSON
              </button>
            </div>
          </details>
        </div>
      </div>

      <TransitModeControl score={score} mode={transitMode} setMode={setTransitMode} />

      {score.paths && (
        <div className={styles.exposureHero} aria-label="Walk shelter evidence">
          <span>Where the walk is exposed</span>
          <strong>{formatPercent(selectedCoverage)} of the {selectedWalkLabel} is covered.</strong>
          <p>{exposureHeroText}</p>
        </div>
      )}

      {score.paths && (
        <InlineRouteLegend
          sameRoute={sameRoute}
          directBusFallback={directBusFallback}
          previewRoute={previewRoute}
        />
      )}
      {sourceBreakdown.length > 0 && (
        <div className={styles.sourceStrip} aria-label="Shelter source evidence">
          {sourceBreakdown.map((item) => (
            <span key={item.source} data-source={item.source}>
              {item.label} <strong>{formatDistance(item.lenM)}</strong>
            </span>
          ))}
        </div>
      )}
      {score.paths && !previewRoute && (
        <>
          <div className={styles.summaryGrid}>
            <Metric label={selectedRouteLabel} value={formatDistance(selectedDistance)} />
            <Metric label="Covered-walkway ratio" value={formatPercent(selectedCoverage)} />
            <Metric label="Extra walk" value={extraWalkLabel} />
          </div>
          {compareNote && (
            <p className={styles.compareNote} aria-label="Walk comparison">
              {compareNote}
            </p>
          )}
        </>
      )}

      {score.paths && previewRoute && (
        <div className={styles.summaryGrid}>
          <Metric label="Preview walk" value={formatDistance(selectedDistance)} />
          <Metric label="Covered-walkway ratio" value={formatPercent(selectedCoverage)} />
          <Metric label="Locked score" value="Preview only" />
        </div>
      )}

      <div className={styles.reasonList} aria-label="Shelter map evidence reasons">
        {reasons.map((reason) => (
          <span key={reason}>{reason}</span>
        ))}
      </div>
      {previewStatusNote && <p className={styles.stateNote}>{previewStatusNote}</p>}
      {stateNote && <p className={styles.stateNote}>{stateNote}</p>}

      {score.subscores && (
        <div className={styles.scoreBreakdown} aria-label="Shelter map evidence and locked score breakdown">
          <div className={styles.scoreBreakdownHeader}>
            <strong>Shelter map evidence and locked score</strong>
            <span>Four display rows; weights unchanged</span>
          </div>
          <div className={styles.subscoreList}>
          {evidenceRows.map((row) => (
              <div key={row.id} className={styles.subscoreRow}>
                <div>
                  <span>{row.label}</span>
                  {row.notes.map((note) => (
                    <em key={note}>{note}</em>
                  ))}
                </div>
                <div className={styles.subscoreMeta}>
                  <strong>{row.value}</strong>
                  <small>{row.meta}</small>
                </div>
              </div>
          ))}
          </div>
        </div>
      )}

      {score.subscores && (
        <div className={styles.rankPanel} aria-label="Planning-area comparison" aria-busy={rankingLoading}>
          <div className={styles.rankHeader}>
            <div>
              <strong>Compare nearby records</strong>
              <span>
                {!rankPanelOpen
                  ? "Loads planning-area ranks only when opened."
                  : rankMetric === "overall"
                  ? "Planning-area list sorted by locked score; shelter evidence remains the primary view."
                  : "Planning-area component-score view; locked SHIOK score is unchanged."}
              </span>
            </div>
            {rankPanelOpen ? (
              <label>
                <span className={styles.srOnly}>Rank records by</span>
                <select
                  value={rankMetric}
                  onChange={(event) => setRankMetric(event.target.value as RankMetric)}
                >
                  {RANK_METRIC_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <button
                type="button"
                className={styles.rankToggle}
                onClick={() => setRankPanelOpen(true)}
              >
                Show
              </button>
            )}
          </div>
          {rankPanelOpen && (
            <div className={styles.rankList} role="status" aria-live="polite">
              <span className={styles.srOnly}>{rankStatus}</span>
              {rankingLoading && (
                <span className={styles.rankEmpty}>Loading planning-area ranks...</span>
              )}
              {!rankingLoading && rankedRecords.length === 0 && (
                <span className={styles.rankEmpty}>
                  No comparable scored records in this planning area.
                </span>
              )}
              {!rankingLoading &&
                rankedRecords.map((item) => (
                  <div
                    key={`${rankMetric}-${item.postal}`}
                    className={`${styles.rankRow} ${
                      item.postal === score.postal ? styles.rankRowActive : ""
                    }`}
                  >
                    <span>{item.rank}</span>
                    <strong>{item.postal}</strong>
                    <small>{rankMetricLabel}</small>
                    <b>{formatScore(item.value)}</b>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {score.paths && !directBusFallback && !previewRoute && (
        <RouteModeControl
          mode={routeMode}
          setMode={setRouteMode}
          disabled={false}
          sameRoute={sameRoute}
          directBusFallback={directBusFallback}
        />
      )}

      {(feedbackEnabled || feedbackPoints.length > 0) && (
        <div className={styles.feedbackBlock}>
          <div className={styles.feedbackActions}>
            <button
              type="button"
              onClick={clearFeedback}
              disabled={feedbackPoints.length === 0}
            >
              Clear
            </button>
          </div>
          {feedbackPoints.length > 0 && (
            <div className={styles.feedbackEditor}>
              <div className={styles.feedbackMeta}>
                {feedbackPoints.length} points / {Math.max(0, feedbackPoints.length - 1)} segments
                {copyStatus ? <span>{copyStatus}</span> : null}
              </div>
              {feedbackSegmentLabels.map((label, index) => (
                <label key={`segment-${index}`} className={styles.segmentLabel}>
                  <span>Segment {index + 1}</span>
                  <select
                    value={label}
                    onChange={(event) =>
                      setFeedbackSegmentLabel(index, event.target.value as FeedbackSegmentLabel)
                    }
                  >
                    {FEEDBACK_SEGMENT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <textarea
                value={feedbackNote}
                onChange={(event) => setFeedbackNote(event.target.value)}
                placeholder="Optional walk note"
                rows={2}
              />
            </div>
          )}
        </div>
      )}

      {score.paths && routeDetailItems.length > 0 && (
        <div className={styles.routeDetails} aria-label="Walk details">
          {routeDetailItems.map((item) => (
            <span key={item.label}>
              {item.label} <strong>{item.value}</strong>
            </span>
          ))}
          {routeDetailNotes.map((note) => (
            <small key={note}>{note}</small>
          ))}
        </div>
      )}

      {exposureGaps.length > 0 && (
        <div className={styles.gapList}>
          <h3>Exposed gaps on this walk</h3>
          <p className={styles.gapSummary}>
            <span>{gapSummaryText}</span>
            <span>{gapListScopeText}</span>
            <span>{gapCoordinateSummaryText}</span>
          </p>
          {visibleExposureGaps.map((gap, index) => {
            const location = formatGapLocation(gap);
            const focusTarget = exposureGapFocusTarget(score, gap, index);
            const activeGap = Boolean(focusTarget && focusTarget.key === focusedExposureGapKey);
            const gapContent = (
              <>
                <strong>{formatDistance(gap.len_m)}</strong>
                <span>{exposureGapCopy(gap.len_m, index)}</span>
                {location && <small className={styles.gapCoordinate}>Near {location}</small>}
              </>
            );
            if (focusTarget && onFocusExposureGap) {
              return (
                <button
                  key={focusTarget.key}
                  type="button"
                  className={`${styles.gapItem} ${activeGap ? styles.gapItemActive : ""}`}
                  aria-pressed={activeGap}
                  aria-label={`Focus map on ${exposureGapCopy(gap.len_m, index)} near ${location}`}
                  onClick={() => onFocusExposureGap(focusTarget)}
                >
                  {gapContent}
                </button>
              );
            }
            return (
              <div key={`${gap.label}-${index}`} className={styles.gapItem}>
                {gapContent}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [primary, setPrimary] = useState<LoadedSelection | null>(null);
  const [baseTransitPois, setBaseTransitPois] = useState<TransitPoiCollection>({ type: "FeatureCollection", features: [] });
  const [routeTransitPois, setRouteTransitPois] = useState<TransitPoiCollection>({ type: "FeatureCollection", features: [] });
  const [transitMode, setTransitMode] = useState<TransitAccessMode>("best_transit");
  const [routeMode, setRouteMode] = useState<RouteDisplayMode>("shiokest");
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [lampOverlayEnabled, setLampOverlayEnabled] = useState(false);
  const [feedbackPoints, setFeedbackPoints] = useState<FeedbackPoint[]>([]);
  const [feedbackSegmentLabels, setFeedbackSegmentLabels] = useState<FeedbackSegmentLabel[]>([]);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [chosenStopId, setChosenStopId] = useState<string | null>(null);
  const [focusedExposureGap, setFocusedExposureGap] = useState<FocusedExposureGap | null>(null);
  const [liveRouteCache, setLiveRouteCache] = useState<Record<string, LoadedSelection>>({});
  const [liveRoutePreviewStatuses, setLiveRoutePreviewStatuses] = useState<Record<string, LiveRoutePreviewStatus>>({});
  const [rankMetric, setRankMetric] = useState<RankMetric>("overall");
  const [rankingRecords, setRankingRecords] = useState<RankableScoreRecord[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankPanelOpen, setRankPanelOpen] = useState(false);
  // Pending stop id from ?stop= URL param — applied once the postal's candidates load.
  const pendingUrlStopIdRef = useRef<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Reset live route cache on postal change
  useEffect(() => {
    setLiveRouteCache({});
    setLiveRoutePreviewStatuses({});
    setFocusedExposureGap(null);
    setRankPanelOpen(false);
    setRankingRecords([]);
    setRankingLoading(false);
  }, [primary?.result?.POSTAL]);

  useEffect(() => {
    const postal = primary?.result?.POSTAL ?? null;
    if (
      !shouldFetchRankRecords({
        rankPanelOpen,
        postal,
        hasSubscores: Boolean(primary?.score?.subscores),
      })
    ) {
      setRankingRecords([]);
      setRankingLoading(false);
      return;
    }

    let active = true;
    const rankingPostal = postal as string;
    setRankingLoading(true);
    void fetchRankRecordsForPostalArea(rankingPostal)
      .then((records) => {
        if (active) setRankingRecords(records);
      })
      .catch(() => {
        if (active) setRankingRecords([]);
      })
      .finally(() => {
        if (active) setRankingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [rankPanelOpen, primary?.result?.POSTAL, primary?.score?.subscores]);

  // Capture the initial ?stop= from the URL. We consume it after the postal's
  // candidates are known so we can validate the id against real POIs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialStop = new URLSearchParams(window.location.search).get("stop");
    if (initialStop) pendingUrlStopIdRef.current = initialStop;
    // Intentionally run only on mount; further URL changes come from our own writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const originLatLng = useMemo(() => resolveOriginLatLng(primary), [primary]);
  const mapTransitPois = routeTransitPois.features.length > 0 ? routeTransitPois : baseTransitPois;

  const candidates = useMemo<TransitCandidate[]>(() => {
    if (!originLatLng) return [];
    return deriveNearestTransitCandidates({
      originLat: originLatLng.lat,
      originLng: originLatLng.lng,
      transitPois: mapTransitPois,
      mode: transitMode,
      limit: 5,
    });
  }, [originLatLng, mapTransitPois, transitMode]);

  const transitSelection = useMemo(
    () => selectionForTransitMode(primary, transitMode),
    [primary, transitMode]
  );

  const bestCandidateId = useMemo(
    () => resolveBestCandidateId(candidates, transitSelection?.score ?? null),
    [candidates, transitSelection]
  );

  // Background fetch to snap arbitrary clicked stops onto real OneMap sidewalks for preview evidence.
  useEffect(() => {
    if (!chosenStopId || !transitSelection || !originLatLng) return;
    const hasPrecomputed = Boolean(transitSelection.geom?.candidates?.[chosenStopId]);
    if (hasPrecomputed || liveRouteCache[chosenStopId]) {
      setLiveRoutePreviewStatuses((current) => {
        if (!current[chosenStopId]) return current;
        const next = { ...current };
        delete next[chosenStopId];
        return next;
      });
      return;
    }

    const cand = candidates.find((c) => c.id === chosenStopId);
    const poi = mapTransitPois.features.find((f) => f.properties?.id === chosenStopId);
    const coords = poi?.geometry?.coordinates;
    const stopLng = Array.isArray(coords) && typeof coords[0] === "number" ? coords[0] : cand?.coordinates[0];
    const stopLat = Array.isArray(coords) && typeof coords[1] === "number" ? coords[1] : cand?.coordinates[1];

    if (stopLat === undefined || stopLng === undefined) {
      setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
      return;
    }

    let active = true;
    const url = `/api/onemap-route?startLat=${originLatLng.lat}&startLng=${originLatLng.lng}&endLat=${stopLat}&endLng=${stopLng}`;
    setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "loading" }));

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (!data.ok || !data.route_geometry) {
          setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
          return;
        }
        const decoded = decodePolyline(data.route_geometry);
        if (decoded.length < 2) {
          setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
          return;
        }

        const targetStop = {
          id: chosenStopId,
          name: poi?.properties?.name ?? cand?.name ?? chosenStopId,
          kind: (poi?.properties?.kind ?? cand?.kind ?? "bus_stop") as "bus_stop" | "mrt_exit",
          coordinates: [stopLng, stopLat] as [number, number],
          code: poi?.properties?.code ?? cand?.code,
          station: poi?.properties?.station ?? cand?.station,
          exit: poi?.properties?.exit ?? cand?.exit,
          straight_line_m: haversineMeters(originLatLng.lat, originLatLng.lng, stopLat, stopLng),
        };

        const liveScored = scoreLiveRoute({
          postal: transitSelection.result.POSTAL,
          originCoords: originLatLng,
          targetStop,
          routeCoordinates: decoded,
          baseScore: transitSelection.score,
          baseGeom: transitSelection.geom,
        });

        const liveSelection: LoadedSelection = {
          result: transitSelection.result,
          score: liveScored.score,
          geom: liveScored.geom,
        };

        setLiveRouteCache((prev) => ({
          ...prev,
          [chosenStopId]: liveSelection,
        }));
        setLiveRoutePreviewStatuses((current) => {
          if (!current[chosenStopId]) return current;
          const next = { ...current };
          delete next[chosenStopId];
          return next;
        });
      })
      .catch((err) => {
        console.warn("OneMap live route fetch failed; keeping direct fallback:", err);
        if (active) {
          setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
        }
      });

    return () => {
      active = false;
    };
  }, [chosenStopId, transitSelection, originLatLng, candidates, mapTransitPois, liveRouteCache]);

  const activeSelection = useMemo(
    () =>
      selectionForChosenStop(
        transitSelection,
        chosenStopId,
        candidates,
        mapTransitPois,
        originLatLng,
        liveRouteCache
      ),
    [transitSelection, chosenStopId, candidates, mapTransitPois, originLatLng, liveRouteCache]
  );

  const mapRoutes = useMemo(() => buildRouteItems(activeSelection), [activeSelection]);
  const mapRouteMode = routesAreSame(activeSelection) ? "shiokest" : routeMode;
  const showDetailOverlay = Boolean(primary);

  // Apply pending URL stop once candidates for this postal are known.
  useEffect(() => {
    if (candidates.length === 0) return;
    const pending = pendingUrlStopIdRef.current;
    if (!pending) return;
    if (candidates.some((candidate) => candidate.id === pending)) {
      setChosenStopId(pending);
    }
    pendingUrlStopIdRef.current = null;
  }, [candidates]);

  // Pre-fetch transit POIs and manifest on initial mount so metadata/date is immediately visible.
  useEffect(() => {
    let active = true;
    void fetchTransitPois().then((pois) => {
      if (active) setBaseTransitPois(pois);
    });
    void fetchManifest().then((loaded) => {
      if (active) setManifest(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const loadSelection = async (result: SearchResult) => {
    const postal = normalizePostal(result.POSTAL);
    if (!postal) {
      setError("Selected result has no usable postal code.");
      return;
    }
    setLoading(true);
    setError(null);
    setRouteTransitPois({ type: "FeatureCollection", features: [] });
    try {
      const lat = Number.parseFloat(result.LATITUDE);
      const lng = Number.parseFloat(result.LONGITUDE);
      const [loadedManifest, score, geom] = await Promise.all([
        manifest ? Promise.resolve(manifest) : fetchManifest(),
        fetchScoreForPostal(postal),
        fetchGeomForPostal(postal, Number.isFinite(lat) ? lat : undefined, Number.isFinite(lng) ? lng : undefined),
      ]);
      const nearbyTransitPois = await fetchTransitPoisForGeom(geom);
      setManifest(loadedManifest);
      setPrimary({ result: { ...result, POSTAL: postal }, score, geom });
      setRouteTransitPois(nearbyTransitPois);
      setTransitMode("best_transit");
      setRouteMode("shiokest");
      setFeedbackEnabled(false);
      setFeedbackPoints([]);
      setFeedbackSegmentLabels([]);
      setFeedbackNote("");
      setCopyStatus("");
      setChosenStopId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load score data.");
    } finally {
      setLoading(false);
    }
  };

  /** Update the URL to reflect the current postal / stop selection without a reload. */
  const syncStopUrl = useCallback(
    (nextStopId: string | null) => {
      if (!pathname) return;
      if (typeof window === "undefined") return;
      const currentPostal = primary?.result?.POSTAL ?? null;
      const params = new URLSearchParams(window.location.search);
      if (currentPostal) {
        params.set("postal", currentPostal);
      } else {
        params.delete("postal");
      }
      if (nextStopId) {
        params.set("stop", nextStopId);
      } else {
        params.delete("stop");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, primary?.result?.POSTAL, router]
  );

  const handleRouteModeChange = useCallback((mode: RouteDisplayMode) => {
    setRouteMode(mode);
    setFocusedExposureGap(null);
  }, []);

  const handleTransitModeChange = useCallback((mode: TransitAccessMode) => {
    setTransitMode(mode);
    setChosenStopId(null);
    setLiveRoutePreviewStatuses({});
    setFocusedExposureGap(null);
  }, []);

  const handleStopSelect = useCallback(
    (nextStopId: string | null) => {
      const resolved = nextStopId && nextStopId !== bestCandidateId ? nextStopId : null;
      setChosenStopId(resolved);
      if (!resolved) {
        setLiveRoutePreviewStatuses({});
      }
      setFocusedExposureGap(null);
      syncStopUrl(resolved);
    },
    [bestCandidateId, syncStopUrl]
  );

  // Mirror the loaded postal into ?postal= so shared links resolve. This runs
  // whenever the selected postal changes; the ?stop= param is only written by
  // `handleStopSelect`.
  const lastSyncedPostalRef = useRef<string | null>(null);
  useEffect(() => {
    const postal = primary?.result?.POSTAL ?? null;
    if (postal === lastSyncedPostalRef.current) return;
    lastSyncedPostalRef.current = postal;
    if (!pathname || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (postal) {
      params.set("postal", postal);
    } else {
      params.delete("postal");
      params.delete("stop");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // We intentionally depend only on the postal here; other URL state comes
    // from explicit handlers to avoid overwriting the ?stop= param mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary?.result?.POSTAL]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    const directPostal = normalizePostal(query);
    if (directPostal) {
      setSearchAttempted(false);
      await loadSelection({
        BUILDING: `Postal ${directPostal}`,
        ROAD_NAME: "",
        POSTAL: directPostal,
        LATITUDE: "",
        LONGITUDE: "",
        SEARCHVAL: `S${directPostal}`,
      });
      return;
    }

    if (!shouldQueryOneMap(query)) {
      setResults([]);
      setSearchAttempted(false);
      setError("Enter at least 3 characters for OneMap search, or use a 6-digit postal code.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSearchAttempted(true);

    try {
      const data = await searchOneMapLocations(query);
      setResults(data.results);
    } catch (err) {
      if (err instanceof OneMapSearchError && err.status === 429) {
        setError("Search is busy. Please try again in a moment.");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to search postal location.");
    } finally {
      setLoading(false);
    }
  };

  const addFeedbackPoint = (point: FeedbackPoint) => {
    setCopyStatus("");
    setFeedbackPoints((current) => {
      if (current.length >= 24) return current;
      if (current.length >= 1) {
        setFeedbackSegmentLabels((labels) => [...labels, "sheltered"]);
      }
      return [...current, point];
    });
  };

  const setFeedbackSegmentLabel = (index: number, label: FeedbackSegmentLabel) => {
    setFeedbackSegmentLabels((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? label : item))
    );
  };

  const clearFeedback = () => {
    setFeedbackPoints([]);
    setFeedbackSegmentLabels([]);
    setFeedbackNote("");
    setCopyStatus("");
  };

  const lockedScoreAvailabilityLine = formatLockedScoreAvailabilityLine(manifest);

  const copyFeedback = async () => {
    const payload = buildFeedbackPayload({
      selection: activeSelection,
      transitMode,
      routeMode: mapRouteMode,
      points: feedbackPoints,
      segmentLabels: feedbackSegmentLabels,
      note: feedbackNote,
    });
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  return (
    <main className={styles.appShell}>
      <RouteEvidenceMap
        routes={mapRoutes}
        mode={mapRouteMode}
        transitPois={mapTransitPois}
        feedbackEnabled={feedbackEnabled}
        feedbackPoints={feedbackPoints}
        onFeedbackPoint={addFeedbackPoint}
        onSelectTransitStop={handleStopSelect}
        chosenStopId={chosenStopId ?? bestCandidateId}
        showLampOverlay={lampOverlayEnabled}
        focusedExposureGap={focusedExposureGap}
      />

      <section className={styles.searchOverlay} aria-label="Address search" aria-busy={loading}>
        <div className={styles.brandRow}>
          <div>
            <h1>S.H.I.O.K. Shelter Map</h1>
            <p>See covered-walkway ratio and exposed gaps to transit</p>
            <p className={styles.dataLine}>
              Shelter map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}
            </p>
            <p className={styles.freshnessLine}>
              Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape.
            </p>
            <p className={styles.freshnessLine}>
              Recent public-source check: 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026 with postals.
            </p>
            <p className={styles.freshnessLine}>
              Data freshness at the 21 Aug 2026 manifest-only check: 12 sources current, oldest current source was NParks Leaf Area Index at 112.6 days old; 6 stale, 2 manual, and 1 candidate address source with unknown age. No upstream URLs were probed. Stale sources are traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers.
            </p>
            {lockedScoreAvailabilityLine && <p className={styles.coverageLine}>{lockedScoreAvailabilityLine}</p>}
            <p className={styles.sourceLine}>
              Sources: LTA/data.gov.sg, OneMap/SLA, © OpenStreetMap contributors (
              <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">
                ODbL
              </a>
              ).{" "}
              <a
                href="https://github.com/hongyime/sgSHIOK2026/blob/main/ATTRIBUTION.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                ATTRIBUTION.md
              </a>
            </p>
            <p className={styles.heatLine}>Heat proxy: shelter plus sparse NParks greenery, not measured temperature</p>
            <div className={styles.mapLayerControls} aria-label="Map layers">
              <button
                type="button"
                className={`${styles.layerToggle} ${lampOverlayEnabled ? styles.layerToggleActive : ""}`}
                aria-pressed={lampOverlayEnabled}
                aria-describedby="night-lighting-layer-note"
                title="Night lighting: LTA lamp-post locations; map evidence only, not part of the locked score"
                onClick={() => setLampOverlayEnabled((enabled) => !enabled)}
              >
                <span className={styles.lampSwatch} aria-hidden="true" />
                Night lighting
              </button>
            </div>
            <p id="night-lighting-layer-note" className={styles.layerNote}>
              LTA lamp-post layer: 126,144 points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load points. Map evidence only; not part of the locked score.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className={styles.searchForm} aria-busy={loading}>
          <input
            id="postal-search-input"
            type="text"
            placeholder="Search address or 6-digit postal"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchAttempted(false);
            }}
            aria-label="Search address or 6-digit postal"
          />
          <button id="postal-search-button" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Loading" : "Search"}
          </button>
        </form>

        <SearchFeedback results={results} loading={loading} error={error} searched={searchAttempted} />

        {results.length > 0 && (
          <div className={styles.resultList} aria-label="Search results">
            {results.map((item, idx) => (
              <button key={`${item.POSTAL}-${idx}`} type="button" onClick={() => loadSelection(item)}>
                <span>
                  <strong>{resultTitle(item)}</strong>
                  <small>{resultSubtitle(item)}</small>
                </span>
                <em>S{normalizePostal(item.POSTAL) ?? item.POSTAL}</em>
              </button>
            ))}
          </div>
        )}

        {showDetailOverlay && (
          <aside className={styles.detailOverlay}>
            <ScoreCard
              selection={activeSelection}
              routeMode={mapRouteMode}
              setRouteMode={handleRouteModeChange}
              transitMode={transitMode}
              setTransitMode={handleTransitModeChange}
              feedbackEnabled={feedbackEnabled}
              setFeedbackEnabled={setFeedbackEnabled}
              feedbackPoints={feedbackPoints}
              feedbackSegmentLabels={feedbackSegmentLabels}
              setFeedbackSegmentLabel={setFeedbackSegmentLabel}
              clearFeedback={clearFeedback}
              feedbackNote={feedbackNote}
              setFeedbackNote={setFeedbackNote}
              copyFeedback={copyFeedback}
              copyStatus={copyStatus}
              isCustomStopSelected={Boolean(chosenStopId && chosenStopId !== bestCandidateId)}
              liveRoutePreviewStatus={chosenStopId ? liveRoutePreviewStatuses[chosenStopId] ?? null : null}
              onResetChosenStop={() => handleStopSelect(null)}
              rankMetric={rankMetric}
              setRankMetric={setRankMetric}
              rankingRecords={rankingRecords}
              rankingLoading={rankingLoading}
              rankPanelOpen={rankPanelOpen}
              setRankPanelOpen={setRankPanelOpen}
              focusedExposureGapKey={focusedExposureGap?.key ?? null}
              onFocusExposureGap={setFocusedExposureGap}
              lampOverlayEnabled={lampOverlayEnabled}
            />
          </aside>
        )}

        <footer className={styles.pageFooter}>Source-derived covered-walkway and exposure-gap evidence.</footer>
      </section>
    </main>
  );
}
