"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  fetchGeomForPostal,
  fetchManifest,
  fetchRankRecordsForPostalArea,
  fetchScoreForPostal,
  fetchTransitPois,
  fetchTransitPoisForGeom,
  PINNED_DATA_MANIFEST,
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

interface LiveRoutePreviewPayload {
  ok?: boolean;
  route_geometry?: string;
  total_distance_m?: number;
  total_time_s?: number;
}

const LIVE_ROUTE_PREVIEW_CACHE_PREFIX = "shiok:onemap-route-preview:v2:";
const LIVE_ROUTE_PREVIEW_CACHE_TTL_MS = 86_400_000;
const LIVE_ROUTE_PREVIEW_CACHE_MAX_ENTRIES = 30;

function liveRouteCoordinateKey(value: number): string {
  return value.toFixed(6);
}

function liveRouteCoordinateParam(value: number): string {
  return liveRouteCoordinateKey(value);
}

function liveRoutePreviewCacheKey(
  postal: string,
  originLatLng: { lat: number; lng: number },
  stopId: string,
  stopLat: number,
  stopLng: number
): string {
  return [
    LIVE_ROUTE_PREVIEW_CACHE_PREFIX,
    postal,
    stopId,
    liveRouteCoordinateKey(originLatLng.lat),
    liveRouteCoordinateKey(originLatLng.lng),
    liveRouteCoordinateKey(stopLat),
    liveRouteCoordinateKey(stopLng),
  ].join(":");
}

function replaceUrlQuery(pathname: string, params: URLSearchParams): void {
  const query = params.toString();
  window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
}

function liveRoutePreviewStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage) return window.localStorage;
  } catch {
    // Some privacy modes expose Storage but reject access.
  }
  try {
    if (window.sessionStorage) return window.sessionStorage;
  } catch {
    // The in-memory in-flight cache still applies.
  }
  return null;
}

function parseLiveRoutePreviewPayload(value: unknown): LiveRoutePreviewPayload | null {
  const parsed = value as LiveRoutePreviewPayload;
  return typeof parsed.route_geometry === "string" ? parsed : null;
}

function pruneLiveRoutePreviewCache(
  storage: Storage,
  nowMs: number = Date.now(),
  maxEntries: number = LIVE_ROUTE_PREVIEW_CACHE_MAX_ENTRIES,
): void {
  const entries: Array<{ key: string; cachedAt: number }> = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(LIVE_ROUTE_PREVIEW_CACHE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(storage.getItem(key) || "{}") as { cached_at?: unknown };
      const cachedAt = Number(parsed.cached_at);
      if (!Number.isFinite(cachedAt) || nowMs - cachedAt > LIVE_ROUTE_PREVIEW_CACHE_TTL_MS) {
        storage.removeItem(key);
        index -= 1;
        continue;
      }
      entries.push({ key, cachedAt });
    } catch {
      storage.removeItem(key);
      index -= 1;
    }
  }

  entries
    .sort((a, b) => b.cachedAt - a.cachedAt)
    .slice(maxEntries)
    .forEach((entry) => storage.removeItem(entry.key));
}

function readLiveRoutePreviewCache(key: string, nowMs: number = Date.now()): LiveRoutePreviewPayload | null {
  const storage = liveRoutePreviewStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { cached_at?: unknown; payload?: unknown };
    const cachedAt = Number(parsed.cached_at);
    if (!Number.isFinite(cachedAt) || nowMs - cachedAt > LIVE_ROUTE_PREVIEW_CACHE_TTL_MS) return null;
    return parseLiveRoutePreviewPayload(parsed.payload);
  } catch {
    return null;
  }
}

function writeLiveRoutePreviewCache(key: string, payload: LiveRoutePreviewPayload, nowMs: number = Date.now()): void {
  const storage = liveRoutePreviewStorage();
  if (!storage) return;
  if (!payload.ok || typeof payload.route_geometry !== "string") return;
  try {
    pruneLiveRoutePreviewCache(storage, nowMs, LIVE_ROUTE_PREVIEW_CACHE_MAX_ENTRIES - 1);
    storage.setItem(key, JSON.stringify({ cached_at: nowMs, payload }));
  } catch {
    try {
      pruneLiveRoutePreviewCache(storage, nowMs, LIVE_ROUTE_PREVIEW_CACHE_MAX_ENTRIES - 1);
      storage.setItem(key, JSON.stringify({ cached_at: nowMs, payload }));
    } catch {
      // Browser storage can be unavailable or full; the in-memory cache still applies.
    }
  }
}

const TRANSIT_MODE_OPTIONS: Array<{ id: TransitAccessMode; label: string }> = [
  { id: "best_transit", label: "Published walk" },
  { id: "mrt_lrt", label: "MRT/LRT exits" },
  { id: "bus", label: "Bus stops" },
];

const SOURCE_LABELS: Record<string, string> = {
  lta_covered_linkway: "LTA covered linkway",
  osm_covered: "OSM shelter tags",
  inferred_hdb_void_deck: "HDB void-deck inference",
  bridge_underpass: "Bridge/underpass shelter",
  audited_shelter_correction: "Audited shelter",
  direct_unrouted_bus: "Straight-line bus estimate",
  bus_stop_access_connector: "Bus-stop access walk",
  origin_graph_snap_connector: "Postal access walk",
  destination_graph_snap_connector: "Stop/exit access walk",
  covered_unknown: "Mapped shelter",
  exposed: "Exposed",
};

const REASON_COPY: Record<keyof Subscores, { low: string; high: string }> = {
  access: { low: "Longer walk to stop or exit", high: "Short walk to stop or exit" },
  rain: { low: "Mostly exposed walk", high: "Good covered-walkway coverage" },
  heat: { low: "Low heat-estimate evidence", high: "Stronger heat-estimate evidence" },
  bus: { low: "Limited bus-service evidence", high: "Stronger bus-service evidence" },
  crossing: { low: "More crossing friction", high: "Easy crossing profile" },
};

const RECENT_PUBLIC_SOURCE_GAP_COPY =
  "6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list";
const RECENT_PUBLIC_SOURCE_SAMPLE_LABEL = "P19 v2 28 Aug 2026 public-source sample";

const OSM_ADDR_POSTCODE_COVERAGE_COPY =
  "28 Aug 2026 OSM addr:postcode coverage cross-check: 25,919 valid distinct postcodes measured; 25,899 overlap the 124,443 June 2020 address-list postcodes, with 20 valid OSM-only postcodes. OSM remains geometry evidence, not the address registry.";

const DATA_FRESHNESS_SUMMARY_COPY =
  "Source-age snapshot: 29 Aug 2026 09:38 UTC source-age check; 11 sources were current, 9 stale, 3 manual, and 1 unknown-age candidate. This was not a live source refresh.";

const DATA_FRESHNESS_DETAIL_COPY =
  "At the 29 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold, and HDB Existing Building was the oldest current item. Freshness may have changed since that snapshot; source refreshes use new dated input versions instead of changing published data in place. The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed. Stale sources are ordered by days past their freshness threshold: Planning Area Boundaries (MP2019 No Sea), NParks Tracks, NParks Heritage Road Green Buffers, Traffic Signals, Pedestrian Overhead Bridge / Underpass, Covered Linkway, NParks Heritage Trees, NParks Nature Ways, and NParks Leaf Area Index.";

const COVERED_LINKWAY_FRESHNESS_COPY =
  "Covered Linkway follows a quarterly 120-day freshness threshold; published data uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched the published data; stale source data still requires a new dated input version before any refresh.";

const LEAF_AREA_INDEX_REFERENCE_COPY =
  "NParks Leaf Area Index is a freshness-only reference table here; walk heat evidence uses shelter plus sparse walk-adjacent greenery geometry, not LAI or measured temperature.";

const SAMPLE_POSTAL_RESULT: SearchResult = {
  BUILDING: "Sample postal",
  ROAD_NAME: "Mayflower area",
  POSTAL: "560234",
  LATITUDE: "",
  LONGITUDE: "",
  SEARCHVAL: "Try Mayflower S560234",
};

export function nightLightingLayerNote(lampOverlayEnabled: boolean): string {
  const action = lampOverlayEnabled
    ? "Zoom into a neighbourhood to load lamp-post points."
    : "Show the layer and zoom into a neighbourhood to load lamp-post points.";
  const state = lampOverlayEnabled
    ? "LTA lamp-post locations are shown on the map."
    : "LTA lamp-post locations can be shown on the map.";
  return `Night lighting layer: ${state} ${action} Map layer only; not part of the locked score.`;
}

export function nightLightingRouteDetailValue(lampOverlayEnabled: boolean): string {
  return lampOverlayEnabled
    ? "Night-lighting layer on; zoom in for lamp-post points"
    : "Night-lighting layer hidden; show the layer, then zoom in";
}

const RECENT_PUBLIC_SOURCE_MISSING_POSTAL_SOURCE: Record<string, string> = {
  "521400": "2021-2026 HDB public-source sample",
  "522400": "2021-2026 HDB public-source sample",
  "523400": "2021-2026 HDB public-source sample",
  "762936": "2021-2026 HDB public-source sample",
  "763936": "2021-2026 HDB public-source sample",
  "764936": "2021-2026 HDB public-source sample",
  "378720": "2021-2026 MCST address-candidate sample",
  "935456": "2021-2026 MCST address-candidate sample",
};

const RECENT_PUBLIC_SOURCE_UNVALIDATED_PROXY_COPY: Record<string, string> = {
  "378720":
    "this postal appears only in an unverified MCST address candidate; OneMap Search for CANAAN returned candidate postal 387720, so listed 378720 is an address-quality warning rather than a confirmed missing address",
  "935456":
    "this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the listed postal, so it is an address-quality warning rather than a confirmed missing address",
};

function recentPublicSourceGapCopyForPostal(postal?: string): string {
  const proxyCopy = postal ? RECENT_PUBLIC_SOURCE_UNVALIDATED_PROXY_COPY[postal] : undefined;
  if (proxyCopy) {
    return proxyCopy;
  }
  const source = postal ? RECENT_PUBLIC_SOURCE_MISSING_POSTAL_SOURCE[postal] : undefined;
  if (source) {
    return `this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} (${source})`;
  }
  return `the ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL} found ${RECENT_PUBLIC_SOURCE_GAP_COPY}`;
}

function noSearchResultBundleCaveat(): string {
  return `The published shelter-map data is tied to the June 2020 address list. ${RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: ${RECENT_PUBLIC_SOURCE_GAP_COPY}.`;
}

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
    return `No OneMap match for this search. Try another address spelling or a 6-digit postal code. ${noSearchResultBundleCaveat()}`;
  }
  if (results.length === 0) return "";
  return `${results.length} search result${results.length === 1 ? "" : "s"} available.`;
}

export function routeDisplayAnnouncement(mode: RouteDisplayMode, sameRoute: boolean): string {
  if (mode === "both") return "both walks";
  if (mode === "shortest") return sameRoute ? "shortest walk same as sheltered walk" : "shortest walk";
  return "sheltered walk";
}

function shelterEvidenceAnnouncementFromValues(
  coveredRatio: number | null | undefined,
  gaps: ExposureGap[] | null | undefined,
  evidenceLabel = "Shelter-map walk evidence"
): string {
  const parts: string[] = [];
  if (typeof coveredRatio === "number") {
    parts.push(`${formatPercent(coveredRatio)} covered-walkway ratio`);
  }
  if (gaps && gaps.length > 0) {
    const sortedGaps = [...gaps].sort((a, b) => b.len_m - a.len_m);
    const totalExposureM = sortedGaps.reduce((total, gap) => total + gap.len_m, 0);
    const longestGap = sortedGaps[0];
    parts.push(
      `${formatDistance(totalExposureM)} exposed across ${gaps.length} gap${
        gaps.length === 1 ? "" : "s"
      }${longestGap ? `; longest gap ${formatDistance(longestGap.len_m)}` : ""}`
    );
  }
  return parts.length > 0
    ? `${evidenceLabel} ${parts.join("; ")}.`
    : evidenceLabel === "Shelter-map walk evidence"
      ? "No published shelter-map walk evidence."
      : `${evidenceLabel} unavailable.`;
}

function shelterEvidenceAnnouncement(score: ScoreRecord): string {
  const coveredRatio =
    typeof score.paths?.covered_ratio === "number" ? Math.round(score.paths.covered_ratio * 100) : null;
  return shelterEvidenceAnnouncementFromValues(coveredRatio, score.exposure_gaps);
}

export function scoreCardAnnouncement({
  selection,
  stationName,
  selectedRouteLabel,
  displayScore,
  isCustomStopSelected,
  previewRoute,
  routeMode,
  displayContextLabel = "Walk display",
  routeDisplayLabel,
  shelterEvidenceText,
  selectedStateText,
}: {
  selection: LoadedSelection | null;
  stationName?: string;
  selectedRouteLabel?: string;
  displayScore?: number | null;
  isCustomStopSelected?: boolean;
  previewRoute?: boolean;
  routeMode: RouteDisplayMode;
  displayContextLabel?: string;
  routeDisplayLabel?: string;
  shelterEvidenceText?: string;
  selectedStateText?: string;
}): string {
  if (!selection) return "No shelter-map walk selected.";
  const postal = postalTitle(selection);
  if (!selection.score) {
    return `${postal} is outside the published shelter-map data tied to the June 2020 address list; ${recentPublicSourceGapCopyForPostal(selection.result.POSTAL)}.`;
  }
  const scoreText = previewRoute
    ? "preview only; published locked score unchanged"
    : displayScore === null || displayScore === undefined
      ? "unavailable in the published shelter-map data"
      : `${Math.round(displayScore)} out of 100`;
  const stopText =
    selectedStateText ??
    (isCustomStopSelected
      ? previewRoute
        ? "Preview shelter-map evidence selected."
        : "Custom MRT/LRT exit or bus stop selected."
      : "Published shelter-map walk selected.");
  const shelterText = shelterEvidenceText ?? shelterEvidenceAnnouncement(selection.score);
  const scoreLabel = previewRoute || displayScore === null || displayScore === undefined
    ? "Locked score"
    : "Locked score for sorting";
  return `${postal} shelter-map panel ready. ${stationName ?? "MRT/LRT exit or bus stop not named"}. ${shelterText} ${scoreLabel} ${scoreText}. ${stopText} ${displayContextLabel} ${routeDisplayLabel ?? routeMode}; ${selectedRouteLabel ?? "walk"} active.`;
}

export function rankAnnouncement({
  loading,
  rankedCount,
  rankMetric,
  rankMetricLabel,
}: {
  loading: boolean;
  rankedCount: number;
  rankMetric: RankMetric;
  rankMetricLabel: string;
}): string {
  const sentenceLabel = rankSentenceMetricLabel(rankMetricLabel);
  if (rankMetric === "overall") {
    if (loading) return "Loading nearby addresses ordered by locked score.";
    if (rankedCount === 0) return "No nearby addresses with full locked scores.";
    return `${rankedCount} nearby address${rankedCount === 1 ? "" : "es"} ordered by locked score.`;
  }
  if (loading) return `Loading nearby addresses for ${sentenceLabel}.`;
  if (rankedCount === 0) return `No comparable nearby addresses for ${sentenceLabel}.`;
  return `${rankedCount} nearby address${
    rankedCount === 1 ? "" : "es"
  } available for ${sentenceLabel}.`;
}

function rankSentenceMetricLabel(rankMetricLabel: string): string {
  return rankMetricLabel.length === 0
    ? rankMetricLabel
    : `${rankMetricLabel[0].toLowerCase()}${rankMetricLabel.slice(1)}`;
}

export function rankEmptyMessage(rankMetric: RankMetric, rankMetricLabel: string): string {
  if (rankMetric === "overall") return "No nearby addresses with full locked scores in this planning area.";
  return `No comparable nearby addresses for ${rankSentenceMetricLabel(rankMetricLabel)}.`;
}

export function rankPanelDescription(rankMetric: RankMetric, rankPanelOpen: boolean): string {
  if (!rankPanelOpen) return "Nearby address comparison loads only when opened.";
  if (rankMetric === "overall") {
    return "Nearby addresses are ordered by locked score; shelter-map walk evidence remains the primary view.";
  }
  if (rankMetric === "bus" || rankMetric === "heat" || rankMetric === "crossing") {
    return "Compares nearby addresses for this supporting score row; locked SHIOK score is unchanged.";
  }
  return "Compares nearby addresses for this evidence row; locked SHIOK score is unchanged.";
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
          <p>No OneMap match found. Try another address spelling or a 6-digit postal code.</p>
          <p className={styles.emptyBoxNote}>{noSearchResultBundleCaveat()}</p>
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

export function formatDataDate(manifest: Manifest | null): string {
  if (!manifest?.data_as_of) return "Date unavailable";
  return new Date(manifest.data_as_of).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatGeneratedDate(manifest: Manifest | null): string {
  if (!manifest?.generated_at) return "Date unavailable";
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
  return typeof value === "number" ? `${Math.round(value)}` : "Unavailable";
}

function formatScoreWithMax(value: number | null | undefined, fallback = "No full locked score"): string {
  return typeof value === "number" ? `${Math.round(value)}/100` : fallback;
}

function lockedScoreBadgeCopy(value: number | null | undefined): { label: string; value: string } {
  return typeof value === "number"
    ? { label: "Locked score for sorting", value: formatScoreWithMax(value) }
    : { label: "No full locked score", value: "Walk evidence" };
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

export function formatFeedbackTraceCount(pointCount: number): string {
  const segmentCount = Math.max(0, pointCount - 1);
  return `${pointCount} point${pointCount === 1 ? "" : "s"} / ${segmentCount} walk segment${
    segmentCount === 1 ? "" : "s"
  }`;
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
  const viewedLabel = viewedIsShortest ? "shortest walk" : "sheltered walk";
  const otherLabel = viewedIsShortest ? "Sheltered walk" : "Shortest walk";
  const delta = otherPct - viewedPct;
  const magnitude = Math.abs(delta);
  if (magnitude < 5) return null;
  const direction = delta > 0 ? "higher" : "lower";
  return `${otherLabel} has ${otherPct}% covered-walkway ratio (${magnitude}pp ${direction} than ${viewedLabel})`;
}

function transitModeLabel(mode: TransitAccessMode): string {
  if (mode === "mrt_lrt") return "MRT/LRT exit";
  if (mode === "bus") return "bus stop";
  return "transit stop or exit";
}

function exposureGapCopy(lenM: number, index: number): string {
  const rank = index === 0 ? "Longest" : `Gap ${index + 1}`;
  if (lenM >= 300) return `${rank} exposed stretch`;
  if (lenM >= 100) return `${rank} open-air stretch`;
  return `${rank} short exposed stretch`;
}

function exposureGapMapActionLabel(gap: ExposureGap, index: number, location: string, active: boolean): string {
  const action = active ? "Selected on map for" : "Focus on map for";
  return `${action} ${exposureGapCopy(gap.len_m, index)} at map coordinate ${location}`;
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
  if (reason === "transit_candidates_graph_disconnected") return "No connected shelter-map walk";
  if (reason === "no_transit_candidates_selected") return "No qualifying transit stop or exit within 1.2 km";
  return nearestRoutedTransitM(score, transitMode) !== null
    ? "Connected walk beyond 1.2 km"
    : `No connected shelter-map walk to ${transitModeLabel(transitMode)} within 1.2 km`;
}

function scoreStateNote(score: ScoreRecord, transitMode: TransitAccessMode): string | null {
  if (score.paths?.routing_type === "live_onemap_preview") {
    return "Preview only: this clicked MRT/LRT exit or bus stop has shelter-map evidence, but it is outside the published shelter-map data.";
  }
  if (score.state === "SCORED_PARTIAL") {
    return "Partial locked score: some shelter-map evidence may still be inspectable, but incomplete locked-score inputs are treated as zero in this release.";
  }
  if (score.state === "NO_TRANSIT_IN_RANGE") {
    const reason = provenanceReason(score, transitMode);
    if (reason === "transit_candidates_graph_disconnected") {
      return "Transit stops or exits exist, but no connected shelter-map walk is published for this postal.";
    }
    if (reason === "no_transit_candidates_selected") {
      return "No MRT/LRT exit or bus stop qualifies within the locked 1.2 km transit range for this postal.";
    }
    const nearestM = nearestRoutedTransitM(score, transitMode);
    if (nearestM !== null) {
      return `Closest published connected shelter-map walk is about ${formatDistance(nearestM)} away; locked transit range is 1.2 km.`;
    }
    return `No published shelter-map walk to ${transitModeLabel(transitMode)} qualifies within the locked 1.2 km transit range.`;
  }
  if (score.state === "NOT_YET_SCORED") {
    return "This postal is in the June 2020 address list, but the published shelter-map data does not include a full locked score for it.";
  }
  const busFallback = directBusFallbackEvidence(score);
  if (busFallback) {
    return "Locked score note: the locked bus score remains 0 because the straight-line bus estimate is not a verified shelter-map walk.";
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

  // 3. Fallback: show shelter-map evidence only while OneMap loads in background.
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
    return ["Shelter-map evidence preview", "Not in published shelter-map data"];
  }
  if (score.state === "NO_TRANSIT_IN_RANGE") {
    const label = transitModeLabel(transitMode);
    const reason = provenanceReason(score, transitMode);
    if (reason === "transit_candidates_graph_disconnected") {
      return ["Transit stop or exit found", "No connected shelter-map walk"];
    }
    if (reason === "no_transit_candidates_selected") {
      return ["No qualifying transit stop or exit within 1.2 km", "Beyond 1.2 km locked range"];
    }
    const nearestM = nearestRoutedTransitM(score, transitMode);
    return nearestM !== null
      ? [`Closest connected shelter-map walk to ${label} is ${formatDistance(nearestM)}`, "Locked transit range is 1.2 km"]
      : [`No shelter-map walk to ${label} within 1.2 km locked range`, "Nearby transit may still exist beyond the locked 1.2 km transit range"];
  }
  if (score.state === "NOT_YET_SCORED") {
    return ["No full locked score in published shelter-map data", "Some shelter-map evidence may still be available"];
  }
  if (score.paths?.routing_type === "direct_bus_fallback_unrouted") {
    return ["Nearby direct bus service found", "Straight-line bus estimate; no published shelter-map walk.", "No verified shelter-map walk"];
  }
  if (!score.paths || !score.best_node) return ["No published shelter-map walk", "Locked score unavailable"];
  if (!score.subscores) return ["Incomplete locked-score inputs", "Shelter-map evidence inspectable"];

  const measuredReasons: string[] = [];
  const busFallback = directBusFallbackEvidence(score);
  if (typeof score.paths.sheltered_m === "number") {
    measuredReasons.push(`${formatDistance(score.paths.sheltered_m)} sheltered walk to ${transitModeLabel(transitMode)}`);
  }
  if (typeof score.paths.covered_ratio === "number") {
    measuredReasons.push(`${Math.round(score.paths.covered_ratio * 100)}% covered-walkway ratio on sheltered walk`);
  }
  if (busFallback) {
    measuredReasons.push("Nearby direct bus service without verified shelter-map walk");
    measuredReasons.push(busFallbackSummary(busFallback));
  }

  const values = REASON_SUBSCORE_KEYS.map((key) => ({
    key,
    value: score.subscores?.[key] ?? 0,
  })).sort((a, b) => a.value - b.value);

  if (busFallback && values[0]?.key === "bus") {
    const shelterReason = measuredReasons.find((reason) => reason.includes("covered-walkway ratio"));
    return [
      "Nearby direct bus service without verified shelter-map walk",
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
    return "Fetching OneMap walking preview; the selected MRT/LRT exit or bus stop is shown by straight-line distance until that walk preview returns.";
  }
  if (status === "unavailable") {
    return "OneMap walking preview could not load for this selected MRT/LRT exit or bus stop; showing straight-line distance only.";
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
    issue: "user_reported_shelter_correction",
    legacy_issue: "user_reported_better_walk",
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
    return <div className={styles.sameRouteNote}>Straight-line bus estimate; no published shelter-map walk.</div>;
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
        Sheltered walk
      </button>
      <button
        type="button"
        className={mode === "both" ? styles.segmentedActive : undefined}
        aria-pressed={mode === "both"}
        disabled={disabled}
        onClick={() => setMode("both")}
      >
        Both walks
      </button>
      <button
        type="button"
        className={mode === "shortest" ? styles.segmentedActive : undefined}
        aria-pressed={mode === "shortest"}
        disabled={disabled}
        onClick={() => setMode("shortest")}
      >
        Shortest walk
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
    if (option.id === "best_transit") return available ? "displayed walk" : "no published walk";
    if (available) return "published walk";
    return "no published walk";
  };
  return (
    <div className={`${styles.segmented} ${styles.transitSegmented}`} aria-label="Transit stop or exit type">
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
  showLampOverlay = false,
}: {
  sameRoute: boolean;
  directBusFallback: boolean;
  previewRoute?: boolean;
  showLampOverlay?: boolean;
}) {
  return (
    <div className={styles.inlineLegend} aria-label="Map legend">
      <span>
        <i className={directBusFallback || previewRoute ? styles.directBusLine : styles.shiokestLine} />
        {directBusFallback ? "Straight-line bus estimate" : previewRoute ? "Shelter-map preview" : "Sheltered walk"}
      </span>
      {!directBusFallback && !previewRoute && (
        <>
          <span>
            <i className={styles.shortestLine} />
            {sameRoute ? "Shortest walk (same)" : "Shortest walk"}
          </span>
          <span>
            <i className={styles.gapLine} />
            Exposed gaps
          </span>
          <span>
            <i className={styles.hdbLine} />
            HDB void-deck shelter
          </span>
          <span>
            <i className={styles.bridgeLine} />
            Bridge/underpass shelter
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
      {showLampOverlay && (
        <span>
          <i className={styles.lampDot} />
          LTA lamp-post points
        </span>
      )}
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
  setLampOverlayEnabled,
  lockedScoreAvailabilityLine = null,
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
  setLampOverlayEnabled?: (enabled: boolean) => void;
  lockedScoreAvailabilityLine?: string | null;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);

  if (!selection) {
    return (
      <section className={styles.scoreCard} aria-label="Shelter-map panel">
        <p className={styles.srOnly} role="status" aria-live="polite">
          {scoreCardAnnouncement({ selection, routeMode })}
        </p>
        <div className={styles.emptyState}>
          <strong>Find an address or postal code</strong>
          <span>Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio and exposed gaps on the walk to a transit stop or exit, plus the night-lighting map layer.</span>
          <span>The published shelter-map data is tied to the June 2020 address list.</span>
          {lockedScoreAvailabilityLine && <span>{lockedScoreAvailabilityLine}</span>}
        </div>
      </section>
    );
  }

  const { score } = selection;
  if (!score) {
    return (
      <section className={styles.scoreCard} aria-label="Shelter-map panel">
        <p className={styles.srOnly} role="status" aria-live="polite">
          {scoreCardAnnouncement({ selection, routeMode })}
        </p>
        <h2>{postalTitle(selection)}</h2>
        <div className={styles.emptyState}>
          <strong>Outside published shelter-map data</strong>
          <span>No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and {recentPublicSourceGapCopyForPostal(selection.result.POSTAL)}.</span>
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
    ? "Straight-line bus estimate"
    : previewRoute
      ? "OneMap preview walk"
    : routeMode === "shortest" && !sameRoute
      ? "Shortest walk"
      : "Sheltered walk";
  const stationName =
    previewRoute
      ? toProperCase(score.best_node?.name ?? "Selected MRT/LRT exit or bus stop")
      : score.state === "NO_TRANSIT_IN_RANGE"
      ? noTransitTitle(score, transitMode)
      : score.state === "NOT_YET_SCORED"
        ? "No full locked score in published shelter-map data"
      : score.best_node?.name
        ? toProperCase(score.best_node.name)
        : "Transit stop or exit not named";
  const reasons = scoreReasons(score, transitMode);
  const stateNote = scoreStateNote(score, transitMode);
  const previewStatusNote = previewRoute
    ? liveRoutePreviewStatusNote(liveRoutePreviewStatus)
    : null;
  const busFallback = directBusFallbackEvidence(score);
  const displayScore = score.total;
  const scoreBadgeCopy = lockedScoreBadgeCopy(displayScore);
  const rankedRecords = useMemo(
    () => rankScoreRecords(rankingRecords, rankMetric, 5),
    [rankingRecords, rankMetric]
  );
  const rankMetricLabel =
    RANK_METRIC_OPTIONS.find((option) => option.id === rankMetric)?.label ?? "Overall locked score";
  const rankSentenceLabel = rankSentenceMetricLabel(rankMetricLabel);
  const rankLoadingText = rankMetric === "overall"
    ? "Loading nearby addresses ordered by locked score."
    : `Loading nearby addresses for ${rankSentenceLabel}.`;
  const rankStatus = rankAnnouncement({
    loading: rankingLoading,
    rankedCount: rankedRecords.length,
    rankMetric,
    rankMetricLabel,
  });
  const sourceBreakdown = routeSourceBreakdown(selection, routeMode, sameRoute);
  const sourceEvidenceLabel = directBusFallback ? "Straight-line bus estimate source evidence" : "Shelter source evidence";
  const reasonListLabel = directBusFallback ? "Straight-line bus estimate evidence reasons" : "Shelter-map evidence reasons";
  const exposureGaps = score.exposure_gaps ? [...score.exposure_gaps].sort((a, b) => b.len_m - a.len_m) : [];
  const endpointSnapM = score.paths?.endpoint_snap_connector_m ?? 0;
  const extraWalkLabel =
    extraWalkM === null ? "Unavailable" : sameRoute || extraWalkM === 0 ? "0 m" : `+${Math.round(extraWalkM)} m`;
  const comparisonMetricLabel = directBusFallback ? "Verified shelter-map walk" : "Extra walk";
  const comparisonMetricValue = directBusFallback ? "No published walk" : extraWalkLabel;
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
      ? `Heat estimate evidence: covered ${formatDistance(score.paths.covered_m)}; nearby greenery ${formatDistance(score.paths.shade_m)}.`
      : null;
  const heatMatchesRain =
    score.subscores &&
    formatScore(score.subscores.heat) === formatScore(score.subscores.rain)
      ? "Same displayed value as shelter exposure for this postal."
      : null;
  const routeDetailItems: Array<{ label: string; value: string }> = [];
  const routeDetailNotes: string[] = [];
  if (score.paths) {
    routeDetailItems.push({
      label: "Night lighting",
      value: nightLightingRouteDetailValue(lampOverlayEnabled),
    });
    routeDetailNotes.push(
      "Night lighting uses LTA lamp-post points as a night-lighting map layer outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
    );
  }
  if (shadeProxyPct !== null) {
    routeDetailItems.push({ label: "Nearby greenery", value: `${shadeProxyPct}%` });
    routeDetailNotes.push(
      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
    );
  }
  if (endpointSnapM > 0) {
    routeDetailItems.push({ label: "Access link", value: formatDistance(endpointSnapM) });
  }
  if (endpointSnapM > 0) {
    routeDetailNotes.push(
      directBusFallback
        ? "Access link is the short connector from the postal or transit point onto the straight-line bus estimate."
        : "Access link is the short walk from the postal or transit point onto the shelter-map walk."
    );
  }
  const longestGap = exposureGaps[0] ?? null;
  const visibleExposureGaps = exposureGaps.slice(0, 3);
  const hiddenExposureGaps = exposureGaps.slice(visibleExposureGaps.length);
  const totalExposureM = exposureGaps.reduce((total, gap) => total + gap.len_m, 0);
  const gapsWithCoordinates = exposureGaps.filter((gap) => formatGapLocation(gap)).length;
  const hiddenGapsWithCoordinates = hiddenExposureGaps.filter((gap) => formatGapLocation(gap)).length;
  const hiddenGapCount = Math.max(0, exposureGaps.length - visibleExposureGaps.length);
  const selectedWalkLabel = previewRoute
    ? "OneMap preview walk"
    : directBusFallback
      ? "straight-line bus estimate"
      : routeMode === "shortest" && !sameRoute
        ? "shortest walk"
        : "sheltered walk";
  const selectedWalkSentenceLabel = previewRoute
    ? "OneMap preview walk"
    : directBusFallback
      ? "Straight-line bus estimate"
      : routeMode === "shortest" && !sameRoute
        ? "Shortest walk"
        : "Sheltered walk";
  const selectedWalkPrepPhrase = directBusFallback
    ? `for the ${selectedWalkLabel}`
    : `on the ${selectedWalkLabel}`;
  const selectedWalkHeadingPhrase = directBusFallback
    ? `for ${selectedWalkLabel}`
    : `on ${selectedWalkLabel}`;
  const longestGapText = longestGap
    ? `${formatDistance(longestGap.len_m)} is the longest exposed gap.`
    : `No exposed gaps are listed for this ${selectedWalkLabel}.`;
  const exposureHeroText =
    exposureGaps.length === 0
      ? longestGapText
      : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
          exposureGaps.length === 1 ? "" : "s"
        }; ${longestGapText}`;
  const exposureHeroLabel =
    exposureGaps.length === 0
      ? "Covered-walkway evidence"
      : directBusFallback
        ? "Where the estimate is exposed"
        : "Where the walk is exposed";
  const scoreStatus = scoreCardAnnouncement({
    selection,
    stationName,
    selectedRouteLabel,
    displayScore,
    isCustomStopSelected,
    previewRoute,
    routeMode,
    displayContextLabel: directBusFallback ? "Estimate display" : "Walk display",
    routeDisplayLabel: directBusFallback ? "straight-line bus estimate" : routeDisplayAnnouncement(routeMode, sameRoute),
    shelterEvidenceText: shelterEvidenceAnnouncementFromValues(
      selectedCoverage,
      exposureGaps,
      directBusFallback ? "Straight-line bus estimate evidence" : undefined
    ),
    selectedStateText: directBusFallback ? "Straight-line bus estimate selected." : undefined,
  });
  const gapSummaryText =
    exposureGaps.length === 0
      ? null
      : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
          exposureGaps.length === 1 ? "" : "s"
        } ${selectedWalkPrepPhrase}.`;
  const gapListScopeText =
    hiddenGapCount > 0
      ? `Showing the ${visibleExposureGaps.length} longest exposed gaps; ${hiddenGapCount} shorter exposed gap${
          hiddenGapCount === 1 ? "" : "s"
        } included in the total.`
      : "All listed exposed gaps are shown.";
  const gapCoordinateSummaryText =
    gapsWithCoordinates > 0
      ? `${gapsWithCoordinates} of ${exposureGaps.length} exposed gap${
          exposureGaps.length === 1 ? "" : "s"
        } ${gapsWithCoordinates === 1 ? "includes" : "include"} map coordinates.`
      : `No map location is available for ${
          exposureGaps.length === 1 ? "this exposed gap" : "these exposed gaps"
        }.`;
  const zeroGapEvidenceText = `No exposed gaps are listed for this ${selectedWalkLabel}.`;
  const zeroGapCoverageText = `All mapped segments for this ${selectedWalkLabel} stay under covered-walkway or connector evidence.`;
  const evidenceRows: EvidenceBreakdownRow[] = score.subscores
    ? [
        {
          id: "shelter",
          label: "Shelter exposure",
          value: score.paths ? formatPercent(selectedCoverage) : formatScore(null),
          meta: score.paths
            ? "Covered-walkway ratio"
            : scoredMeta(score.subscores.rain ?? score.subscores.heat, "40% locked shelter exposure", "Shelter-map walk unavailable"),
          notes: [
            "In this locked release, shelter exposure and the heat estimate share mostly the same covered-walkway evidence.",
            "Heat also includes sparse nearby greenery, so SHIOK shows covered-walkway ratio first.",
            heatMatchesRain,
            heatEvidenceDetail,
          ].filter((note): note is string => Boolean(note)),
        },
        {
          id: "access",
          label: "Walk to stop or exit",
          value: score.paths ? formatDistance(selectedDistance) : formatScore(score.subscores.access),
          meta: scoredMeta(score.subscores.access, "35% locked stop/exit walk", "Stop/exit walk score unavailable"),
          notes: [`${selectedWalkSentenceLabel} distance to ${transitModeLabel(transitMode)}.`],
        },
        {
          id: "bus",
          label: "Bus service support",
          value: formatScore(score.subscores.bus),
          meta: scoredMeta(score.subscores.bus, "20% locked bus support", "Bus support unavailable"),
          notes: [
            "A low value can mean weak service evidence, or that the published shelter-map walk does not show access to an official LTA bus stop.",
            busFallback
              ? `${busFallbackSummary(busFallback)} Straight-line bus estimate is shown separately; no verified shelter-map walk to an official LTA bus stop is published, so the locked bus score remains 0.`
              : null,
          ].filter((note): note is string => Boolean(note)),
        },
        {
          id: "locked-score",
          label: "Locked SHIOK score",
          value: formatLockedScore(displayScore),
          meta: scoredMeta(displayScore, "Locked score for sorting", "Locked score unavailable"),
          notes: [
            "Start with covered-walkway ratio and exposed gaps; use the locked score only to sort the published shelter-map data.",
            "Crossing friction still contributes 5% to the locked score, but has low separation in this release.",
          ],
        },
      ]
    : score.paths
      ? [
          {
            id: "shelter",
            label: "Shelter exposure",
            value: formatPercent(selectedCoverage),
            meta: "Covered-walkway ratio",
            notes: [
              "Shelter-map walk evidence is shown because a connected shelter-map walk exists, but the locked score is not published beyond the 1.2 km transit range.",
              heatEvidenceDetail,
            ].filter((note): note is string => Boolean(note)),
          },
          {
            id: "access",
            label: "Walk to stop or exit",
            value: formatDistance(selectedDistance),
            meta: "Beyond 1.2 km locked range",
            notes: [`${selectedWalkSentenceLabel} distance to ${transitModeLabel(transitMode)}.`],
          },
          {
            id: "bus",
            label: "Bus service support",
            value: formatScore(null),
            meta: "Bus support not computed",
            notes: ["Bus service support is not computed for addresses outside the locked 1.2 km transit range."],
          },
          {
            id: "locked-score",
            label: "Locked SHIOK score",
            value: formatLockedScore(displayScore),
            meta: "Locked score unavailable",
            notes: ["No full locked score is published for this postal, but the shelter-map walk evidence remains inspectable."],
          },
        ]
    : [];

  return (
    <section className={styles.scoreCard} aria-label="Shelter-map panel">
      <p className={styles.srOnly} role="status" aria-live="polite">
        {scoreStatus}
      </p>
      <div className={styles.scoreHeader}>
        <div>
          <h2>{postalTitle(selection)}</h2>
          <p>{stationName}</p>
          {isCustomStopSelected && (
            <div className={styles.customStopBar}>
              <span>{previewRoute ? "Preview shelter-map evidence" : "Viewing selected MRT/LRT exit or bus stop"}</span>
              {onResetChosenStop && (
                <button
                  type="button"
                  className={styles.resetCustomStopBtn}
                  onClick={onResetChosenStop}
                >
                  ↺ Published shelter-map walk
                </button>
              )}
            </div>
          )}
        </div>
        <div className={styles.scoreHeaderRight}>
          <div className={`${styles.scoreBadge} ${scoreClass(displayScore)}`}>
            <span>{scoreBadgeCopy.label}</span>
            <strong>{scoreBadgeCopy.value}</strong>
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
                {feedbackEnabled ? "Done tracing shelter" : "Report missing shelter"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={copyFeedback}
                disabled={feedbackPoints.length < 2}
              >
                Copy correction report
              </button>
            </div>
          </details>
        </div>
      </div>

      <TransitModeControl score={score} mode={transitMode} setMode={setTransitMode} />

      {score.paths && (
        <div className={styles.exposureHero} aria-label="Walk exposure evidence">
          <span>{exposureHeroLabel}</span>
          <strong>{formatPercent(selectedCoverage)} covered-walkway ratio {selectedWalkPrepPhrase}.</strong>
          <p>{exposureHeroText}</p>
        </div>
      )}

      {score.paths && (
        <InlineRouteLegend
          sameRoute={sameRoute}
          directBusFallback={directBusFallback}
          previewRoute={previewRoute}
          showLampOverlay={lampOverlayEnabled}
        />
      )}
      {sourceBreakdown.length > 0 && (
        <div className={styles.sourceStrip} aria-label={sourceEvidenceLabel}>
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
            <Metric label={comparisonMetricLabel} value={comparisonMetricValue} />
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
          <Metric label="OneMap preview walk" value={formatDistance(selectedDistance)} />
          <Metric label="Covered-walkway ratio" value={formatPercent(selectedCoverage)} />
          <Metric label="Locked score" value="Preview only" />
        </div>
      )}

      <div className={styles.reasonList} aria-label={reasonListLabel}>
        {reasons.map((reason) => (
          <span key={reason}>{reason}</span>
        ))}
      </div>
      {previewStatusNote && <p className={styles.stateNote}>{previewStatusNote}</p>}
      {stateNote && <p className={styles.stateNote}>{stateNote}</p>}

      {evidenceRows.length > 0 && (
        <div className={styles.scoreBreakdown} aria-label="Shelter-map evidence and locked score breakdown">
          <div className={styles.scoreBreakdownHeader}>
            <strong>Shelter-map evidence and locked score</strong>
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
        <div className={styles.rankPanel} aria-label="Nearby address comparison" aria-busy={rankingLoading}>
          <div className={styles.rankHeader}>
            <div>
              <strong>Compare nearby addresses</strong>
              <span>{rankPanelDescription(rankMetric, rankPanelOpen)}</span>
            </div>
            {rankPanelOpen ? (
              <label>
                <span className={styles.srOnly}>Choose nearby address comparison view</span>
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
                Show comparison
              </button>
            )}
          </div>
          {rankPanelOpen && (
            <div className={styles.rankList} role="status" aria-live="polite">
              <span className={styles.srOnly}>{rankStatus}</span>
              {rankingLoading && (
                <span className={styles.rankEmpty}>{rankLoadingText}</span>
              )}
              {!rankingLoading && rankedRecords.length === 0 && (
                <span className={styles.rankEmpty}>{rankEmptyMessage(rankMetric, rankMetricLabel)}</span>
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
                {formatFeedbackTraceCount(feedbackPoints.length)}
                {copyStatus ? <span>{copyStatus}</span> : null}
              </div>
              {feedbackSegmentLabels.map((label, index) => (
                <label key={`segment-${index}`} className={styles.segmentLabel}>
                  <span>Walk segment {index + 1}</span>
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
                placeholder="Optional shelter note"
                rows={2}
              />
            </div>
          )}
        </div>
      )}

      {score.paths && routeDetailItems.length > 0 && (
        <div
          className={styles.routeDetails}
          aria-label={directBusFallback ? "Straight-line bus estimate details" : "Walk details"}
        >
          {routeDetailItems.map((item) => (
            <span key={item.label}>
              {item.label} <strong>{item.value}</strong>
            </span>
          ))}
          {!lampOverlayEnabled && setLampOverlayEnabled && (
            <button
              type="button"
              className={styles.routeDetailAction}
              onClick={() => setLampOverlayEnabled(true)}
            >
              Show night-lighting layer
            </button>
          )}
          {routeDetailNotes.map((note) => (
            <small key={note}>{note}</small>
          ))}
        </div>
      )}

      {score.paths && !directBusFallback && !previewRoute && exposureGaps.length === 0 && (
        <div className={styles.gapList} aria-label="Exposed gap evidence">
          <h3>Exposed gaps {selectedWalkHeadingPhrase}</h3>
          <p className={styles.gapSummary}>
            <span>{zeroGapEvidenceText}</span>
            <span>{zeroGapCoverageText}</span>
          </p>
        </div>
      )}

      {exposureGaps.length > 0 && (
        <div className={styles.gapList} aria-label="Exposed gap evidence">
          <h3>Exposed gaps {selectedWalkHeadingPhrase}</h3>
          <p className={styles.gapSummary}>
            <span>{gapSummaryText}</span>
            <span>{gapListScopeText}</span>
            <span>{gapCoordinateSummaryText}</span>
          </p>
          {!feedbackEnabled && (
            <button
              type="button"
              className={styles.gapReportButton}
              onClick={() => setFeedbackEnabled(true)}
            >
              Report missing shelter
            </button>
          )}
          {visibleExposureGaps.map((gap, index) => {
            const location = formatGapLocation(gap);
            const focusTarget = exposureGapFocusTarget(score, gap, index);
            const activeGap = Boolean(focusTarget && focusTarget.key === focusedExposureGapKey);
            const gapContent = (
              <>
                <strong>{formatDistance(gap.len_m)}</strong>
                <span>{exposureGapCopy(gap.len_m, index)}</span>
                {location && <small className={styles.gapCoordinate}>Map coordinate {location}</small>}
                {focusTarget && onFocusExposureGap && (
                  <small className={styles.gapAction}>{activeGap ? "Selected on map" : "Focus on map"}</small>
                )}
              </>
            );
            if (focusTarget && onFocusExposureGap) {
              const actionLocation = location ?? `${focusTarget.lat.toFixed(5)}, ${focusTarget.lon.toFixed(5)}`;
              return (
                <button
                  key={focusTarget.key}
                  type="button"
                  className={`${styles.gapItem} ${activeGap ? styles.gapItemActive : ""}`}
                  aria-pressed={activeGap}
                  aria-label={exposureGapMapActionLabel(gap, index, actionLocation, activeGap)}
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
          {hiddenExposureGaps.length > 0 && (
            <details className={styles.hiddenGapList}>
              <summary>
                Show {hiddenExposureGaps.length} shorter exposed gap{hiddenExposureGaps.length === 1 ? "" : "s"}
                {hiddenGapsWithCoordinates > 0
                  ? `; ${hiddenGapsWithCoordinates} with map coordinate${
                      hiddenGapsWithCoordinates === 1 ? "" : "s"
                    }`
                  : ""}
              </summary>
              {hiddenExposureGaps.map((gap, hiddenIndex) => {
                const index = visibleExposureGaps.length + hiddenIndex;
                const location = formatGapLocation(gap);
                const focusTarget = exposureGapFocusTarget(score, gap, index);
                const activeGap = Boolean(focusTarget && focusTarget.key === focusedExposureGapKey);
                const gapContent = (
                  <>
                    <strong>{formatDistance(gap.len_m)}</strong>
                    <span>{exposureGapCopy(gap.len_m, index)}</span>
                    {location && <small className={styles.gapCoordinate}>Map coordinate {location}</small>}
                    {focusTarget && onFocusExposureGap && (
                      <small className={styles.gapAction}>{activeGap ? "Selected on map" : "Focus on map"}</small>
                    )}
                  </>
                );
                if (focusTarget && onFocusExposureGap) {
                  const actionLocation = location ?? `${focusTarget.lat.toFixed(5)}, ${focusTarget.lon.toFixed(5)}`;
                  return (
                    <button
                      key={focusTarget.key}
                      type="button"
                      className={`${styles.gapItem} ${activeGap ? styles.gapItemActive : ""}`}
                      aria-pressed={activeGap}
                      aria-label={exposureGapMapActionLabel(gap, index, actionLocation, activeGap)}
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
            </details>
          )}
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
  const [manifest, setManifest] = useState<Manifest | null>(PINNED_DATA_MANIFEST);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [chosenStopId, setChosenStopId] = useState<string | null>(null);
  const [focusedExposureGap, setFocusedExposureGap] = useState<FocusedExposureGap | null>(null);
  const [liveRouteCache, setLiveRouteCache] = useState<Record<string, LoadedSelection>>({});
  const liveRoutePreviewInFlightRef = useRef<Map<string, Promise<LiveRoutePreviewPayload>>>(new Map());
  const [liveRoutePreviewStatuses, setLiveRoutePreviewStatuses] = useState<Record<string, LiveRoutePreviewStatus>>({});
  const [rankMetric, setRankMetric] = useState<RankMetric>("overall");
  const [rankingRecords, setRankingRecords] = useState<RankableScoreRecord[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankPanelOpen, setRankPanelOpen] = useState(false);
  // Pending stop id from ?stop= URL param — applied once the postal's candidates load.
  const pendingUrlStopIdRef = useRef<string | null>(null);

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

    const url = `/api/onemap-route?startLat=${liveRouteCoordinateParam(originLatLng.lat)}&startLng=${liveRouteCoordinateParam(originLatLng.lng)}&endLat=${liveRouteCoordinateParam(stopLat)}&endLng=${liveRouteCoordinateParam(stopLng)}`;
    const cacheKey = liveRoutePreviewCacheKey(
      transitSelection.result.POSTAL,
      originLatLng,
      chosenStopId,
      stopLat,
      stopLng
    );
    const applyLiveRoutePreview = (data: LiveRoutePreviewPayload): boolean => {
      if (!data.ok || !data.route_geometry) {
        setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
        return false;
      }
      const decoded = decodePolyline(data.route_geometry);
      if (decoded.length < 2) {
        setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
        return false;
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
      return true;
    };

    const cachedPreview = readLiveRoutePreviewCache(cacheKey);
    if (cachedPreview && applyLiveRoutePreview(cachedPreview)) return;

    let active = true;
    setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "loading" }));

    let request = liveRoutePreviewInFlightRef.current.get(cacheKey);
    if (!request) {
      request = fetch(url)
        .then((res) => res.json())
        .finally(() => {
          liveRoutePreviewInFlightRef.current.delete(cacheKey);
        });
      liveRoutePreviewInFlightRef.current.set(cacheKey, request);
    }

    request
      .then((data: LiveRoutePreviewPayload) => {
        if (!active) return;
        if (applyLiveRoutePreview(data)) {
          writeLiveRoutePreviewCache(cacheKey, data);
        }
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

  const loadSelection = async (result: SearchResult) => {
    const postal = normalizePostal(result.POSTAL);
    if (!postal) {
      setError("This OneMap match has no 6-digit postal code. Choose another match or enter the postal code directly.");
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
      let nearbyTransitPois = await fetchTransitPoisForGeom(geom);
      if (nearbyTransitPois.features.length === 0) {
        nearbyTransitPois = await fetchTransitPois();
        setBaseTransitPois(nearbyTransitPois);
      }
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
      setError(err instanceof Error ? err.message : "Failed to load shelter-map data.");
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
      replaceUrlQuery(pathname, params);
    },
    [pathname, primary?.result?.POSTAL]
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
    replaceUrlQuery(pathname, params);
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
        setError("OneMap search is busy. Try again in a moment, or enter a 6-digit postal code.");
        return;
      }
      setError(err instanceof Error ? err.message : "OneMap address search failed. Try a 6-digit postal code or search again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePostal = async () => {
    setQuery(SAMPLE_POSTAL_RESULT.POSTAL);
    setSearchAttempted(false);
    await loadSelection(SAMPLE_POSTAL_RESULT);
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
            <p>See covered-walkway ratio and exposed gaps on the walk to a transit stop or exit, plus the night-lighting map layer</p>
            <p className={styles.dataLine}>
              Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}
            </p>
            {lockedScoreAvailabilityLine && <p className={styles.coverageLine}>{lockedScoreAvailabilityLine}</p>}
            <div className={styles.mapLayerControls} aria-label="Map layers">
              <button
                type="button"
                className={`${styles.layerToggle} ${lampOverlayEnabled ? styles.layerToggleActive : ""}`}
                aria-pressed={lampOverlayEnabled}
                aria-describedby="night-lighting-layer-note"
                title="Night-lighting layer: LTA lamp-post locations; map layer only, not part of the locked score"
                onClick={() => setLampOverlayEnabled((enabled) => !enabled)}
              >
                <span className={styles.lampSwatch} aria-hidden="true" />
                {lampOverlayEnabled ? "Night-lighting layer shown" : "Show night-lighting layer"}
              </button>
            </div>
            <p id="night-lighting-layer-note" className={styles.layerNote}>
              {nightLightingLayerNote(lampOverlayEnabled)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className={styles.searchForm} aria-busy={loading}>
          <input
            id="postal-search-input"
            type="text"
            placeholder="Search OneMap address or 6-digit postal"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchAttempted(false);
            }}
            aria-label="Search OneMap address or 6-digit postal"
          />
          <button id="postal-search-button" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Searching" : "Search"}
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

        <div className={styles.sampleSearches} aria-label="Sample search">
          <span>Try a known address?</span>
          <button type="button" onClick={loadSamplePostal} disabled={loading}>
            Try Mayflower S560234
          </button>
        </div>

        <details className={styles.dataLimits}>
          <summary>Data limits: June 2020 addresses; roughly 1 in 4 lack full locked scores</summary>
          <p>
            Address list: June 2020 OneMap-derived postal scrape; newer developments may be missing.
          </p>
          <p>
            {RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}.
          </p>
          <p>
            {OSM_ADDR_POSTCODE_COVERAGE_COPY}
          </p>
          <p>
            {DATA_FRESHNESS_SUMMARY_COPY}
          </p>
          <details className={styles.freshnessDetails}>
            <summary>Source freshness detail</summary>
            <p>{DATA_FRESHNESS_DETAIL_COPY}</p>
          </details>
          <p>
            {COVERED_LINKWAY_FRESHNESS_COPY}
          </p>
          <p>
            {LEAF_AREA_INDEX_REFERENCE_COPY}
          </p>
          <p>
            Sources: LTA/data.gov.sg and OneMap/SLA for official data; OpenStreetMap contributes geometry evidence, not the address registry (© OpenStreetMap contributors,{" "}
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
          <p>Heat estimate: shelter plus sparse nearby greenery, not measured temperature</p>
        </details>

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
              setLampOverlayEnabled={setLampOverlayEnabled}
              lockedScoreAvailabilityLine={lockedScoreAvailabilityLine}
            />
          </aside>
        )}

        <footer className={styles.pageFooter}>Walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.</footer>
      </section>
    </main>
  );
}
