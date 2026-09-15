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
  DATA_BASE,
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
import type {
  FocusedExposureGap,
  FeedbackPoint,
  RouteDisplayMode,
  RouteMapItem,
  RouteMapRecovery,
  RouteMapIssue,
} from "../components/route-evidence-map";
import { RouteMapLoader as RouteEvidenceMap, preloadRouteMap } from "../components/route-map-loader";
import { FailureDiagnosticsControl } from "../components/failure-diagnostics-control";
import { ReportComposer, type ReportComposerPhase } from "../components/report-composer";
import { validateReport, MAX_REPORT_VERTICES, type ReportContext, type ReportGeometry } from "../lib/reports";
import { serializeFailureDiagnostics } from "../lib/failure-diagnostics";
import { getArtifactFailure, type ArtifactFailure } from "../lib/artifact-failure";
import {
  deriveNearestTransitCandidates,
  haversineMeters,
  resolveBestCandidateId,
  type TransitCandidate,
} from "../lib/nearest-transit";
import { decodePolyline, encodePolyline } from "../lib/polyline";
import { scoreLiveRoute } from "../lib/live-route-scoring";
import type { SearchResult } from "../lib/onemap-search";
import { routesAreSame } from "../lib/route-display";
import {
  RANK_METRIC_OPTIONS,
  rankScoreRecords,
  type RankableScoreRecord,
  type RankMetric,
} from "../lib/subscore-ranking";
import { requestServiceWorkerCache } from "../lib/service-worker-cache";
import styles from "./page.module.css";
import { WalkSummary, walkMetrics } from "../components/walk-summary";
import { ExposureSectionExplorer } from "../components/exposure-section-explorer";
import { publishedExposureSections, resolveMappedExposureFocus } from "../lib/published-exposure-sections";
import { TransitStopPicker } from "../components/transit-stop-picker";
import { selectPublishedTransitChoices } from "../lib/published-transit-choices";
import {
  normalizePublishedSelection,
  publishedDefault,
  publishedOptionForStop,
  publishedSelectionView,
  publishedChoiceTarget,
  type PublishedWalkSelection,
} from "../lib/published-walk-selection";
import type { PublishedTransitCategory } from "../lib/published-transit-options";
import { shortestSavedWalk } from "../lib/walk-default";
import { requestWalkPreview } from "../lib/walk-preview-request";
import { parseFreshnessDate, sourceFreshnessAtCheck, RECORDED_SOURCE_FRESHNESS } from "../lib/source-freshness";

const EMPTY_TRANSIT_POIS: TransitPoiCollection = { type: "FeatureCollection", features: [] };

interface ResidentReportSession {
  id: number;
  stage: "selecting" | "composing";
  mode: "point" | "section";
  points: FeedbackPoint[];
  context: ReportContext;
  bundleVersion: string;
  sourceKey: string;
  postalPoint: FeedbackPoint | null;
  error: string | null;
}

const REPORT_LEAVE_WARNING = "Leave this report? Its selected location, unsent draft and retry details will be lost. A report already sent may have been saved even without a receipt. Leaving does not cancel or delete it. Do not create another copy to check.";
const REPORT_VALIDATION_ID = "00000000-0000-7000-8000-000000000000";

function residentReportGeometry(points: FeedbackPoint[], mode: ResidentReportSession["mode"]): ReportGeometry | null {
  if (points.length === 0 || points.length > MAX_REPORT_VERTICES || (mode === "section" && points.length < 2)) return null;
  const coordinates = points.map(point => [point.lng, point.lat] as const);
  return mode === "point" ? { type: "Point", coordinates: coordinates[0] } : { type: "LineString", coordinates };
}

function validResidentReportLocation(session: ResidentReportSession): boolean {
  return validateReport({ schema_version: 1, client_request_id: REPORT_VALIDATION_ID,
    report_type: "mapping_error", geometry: residentReportGeometry(session.points, session.mode),
    referenced_bundle_version: session.bundleVersion, context: session.context,
  }).ok;
}

export type LoadedSelection = PublishedWalkSelection;

const REASON_SUBSCORE_KEYS: Array<keyof Subscores> = ["rain", "access", "bus", "heat", "crossing"];

interface EvidenceBreakdownRow {
  id: string;
  label: string;
  value: string;
  meta: string;
  notes: string[];
}

type LiveRoutePreviewStatus = "loading" | "unavailable";
type MapLoadStatus = "idle" | "hidden" | "mounting" | "initializing" | "ready" | "partial" | "error";

interface LiveRoutePreviewPayload {
  ok?: boolean;
  route_geometry?: string;
  total_distance_m?: number;
  total_time_s?: number;
}

const LIVE_ROUTE_PREVIEW_CACHE_PREFIX = "shiok:onemap-route-preview:v2:";
const LIVE_ROUTE_PREVIEW_CACHE_TTL_MS = 604_800_000;
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

function writeWalkUrl(pathname: string, postal: string, mode: TransitAccessMode, stop: string | null, route: RouteDisplayMode): void {
  const params = new URLSearchParams(window.location.search);
  params.set("postal", postal);
  if (mode === "best_transit") params.delete("transit"); else params.set("transit", mode);
  if (stop) params.set("stop", stop); else params.delete("stop");
  if (route === "shiokest") params.delete("route"); else params.set("route", route);
  replaceUrlQuery(pathname, params);
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
  "Source-age snapshot: 29 Aug 2026 17:23 UTC source-age check; 11 sources were current, 9 stale, 3 manual, and 1 unknown-age candidate. This was not a live source refresh.";

const DATA_FRESHNESS_DETAIL_COPY =
  "At the 29 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold, and HDB Existing Building was the oldest current item. Freshness may have changed since that snapshot; source refreshes use new dated input versions instead of changing published data in place. The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed. Stale sources are ordered by days past their freshness threshold: Planning Area Boundaries (MP2019 No Sea), NParks Tracks, NParks Heritage Road Green Buffers, Traffic Signals, Pedestrian Overhead Bridge / Underpass, Covered Linkway, NParks Heritage Trees, NParks Nature Ways, and NParks Leaf Area Index.";

const COVERED_LINKWAY_FRESHNESS_COPY =
  "Covered Linkway follows a quarterly 120-day freshness threshold; published data uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched the published data; stale source data still requires a new dated input version before any refresh.";

const LEAF_AREA_INDEX_REFERENCE_COPY =
  "NParks Leaf Area Index is a freshness-only reference table here; walk heat evidence uses shelter plus sparse walk-adjacent greenery geometry, not LAI or measured temperature.";

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
    return `No published shelter-map record found for this postal code. ${noSearchResultBundleCaveat()}`;
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
  children,
}: {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  searched?: boolean;
  children?: React.ReactNode;
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
          <p>No published shelter-map record found for this postal code.</p>
          <p className={styles.emptyBoxNote}>{noSearchResultBundleCaveat()}</p>
        </div>
      )}
      {error && (
        <div className={styles.errorBox}>
          <span role="alert" aria-live="assertive">{error}</span>
          {children}
        </div>
      )}
    </>
  );
}

function normalizePostal(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{6}$/.test(trimmed)) return null;
  return trimmed;
}

function postalInputValue(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function mapStatusLabel(status: MapLoadStatus, error: string | null): string {
  if (status === "ready") return "Map ready";
  if (status === "initializing") return "Map loading";
  if (status === "mounting") return "Map starting";
  if (status === "partial") return error || "Some basemap tiles are unavailable.";
  if (status === "error") return `Map failed${error ? `: ${error}` : ""}`;
  if (status === "hidden") return "Map hidden";
  return "Map waiting";
}

export function formatDataDate(manifest: Manifest | null): string {
  if (!manifest?.data_as_of) return "Date unavailable";
  return new Date(manifest.data_as_of).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Singapore",
  });
}

export function formatGeneratedDate(manifest: Manifest | null): string {
  if (!manifest?.generated_at) return "Date unavailable";
  return new Date(manifest.generated_at).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Singapore",
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

function formatDistance(value: number | null | undefined): string {
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

function exposureGapFocusTarget(score: ScoreRecord, gap: ExposureGap, index: number): { key: string; lat: number; lon: number } | null {
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
  return (nearestRoutedTransitM(score, transitMode) ?? 0) > 1200
    ? "Connected walk beyond 1.2 km"
    : `No verified published walk to ${transitModeLabel(transitMode)}`;
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
    if (nearestM !== null && nearestM > 1200) {
      return `Closest published connected shelter-map walk is about ${formatDistance(nearestM)} away; locked transit range is 1.2 km.`;
    }
    return `No verified walk to ${transitModeLabel(transitMode)} is published. The record does not establish why.`;
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

export function selectionForChosenStop(
  baseSelection: LoadedSelection | null,
  chosenStopId: string | null,
  _candidates: TransitCandidate[],
  mapTransitPois: TransitPoiCollection,
  originLatLng: { lat: number; lng: number } | null,
  liveRouteCache?: Record<string, LoadedSelection>
): LoadedSelection | null {
  if (!baseSelection || !chosenStopId) return baseSelection;
  for (const category of ["bus", "mrt_lrt"] as const) {
    const pool = normalizePublishedSelection(baseSelection, category, DATA_BASE);
    const option = publishedOptionForStop(pool, chosenStopId, mapTransitPois, originLatLng);
    if (option) return publishedSelectionView(baseSelection, option);
  }
  const preview = liveRouteCache?.[chosenStopId];
  if (preview?.result.POSTAL === baseSelection.result.POSTAL
      && preview.score?.paths?.routing_type === "live_onemap_preview") return preview;
  // An unknown destination or failed preview is not a straight-line walking route.
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
    return nearestM !== null && nearestM > 1200
      ? [`Closest connected shelter-map walk to ${label} is ${formatDistance(nearestM)}`, "Locked transit range is 1.2 km"]
      : [`No verified published walk to ${label}`, "Distance or connection failure is not established by this record"];
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
  availability,
}: {
  score: ScoreRecord;
  mode: TransitAccessMode;
  setMode: (mode: TransitAccessMode) => void;
  availability?: Partial<Record<TransitAccessMode, boolean>>;
}) {
  if (!score.route_options && !availability) return null;
  return (
    <div className={`${styles.segmented} ${styles.transitSegmented}`} aria-label="Transit stop or exit type">
      {TRANSIT_MODE_OPTIONS.map((option) => {
        const routeOption = option.id === "best_transit" ? score : score.route_options?.[option.id];
        const available = availability ? availability[option.id] === true : Boolean(routeOption?.paths);
        return (
          <button
            key={option.id}
            type="button"
            className={mode === option.id ? styles.segmentedActive : undefined}
            aria-pressed={mode === option.id}
            data-empty={!available}
            disabled={!available}
            title={available ? `Show ${option.label.toLowerCase()} walk` : `No saved walk for ${option.label.toLowerCase()}`}
            onClick={() => setMode(option.id)}
          >
            <span>{option.label}</span>
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
  hideWalkControls = false,
  hideExposureDetails = false,
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
  hideWalkControls?: boolean;
  hideExposureDetails?: boolean;
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
          <span>See how much of the walk to transit is covered, and where it is exposed.</span>
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
          <span>No shelter-map walk is published for this postal yet.</span>
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
  const selectedWalkMetrics = walkMetrics(score, routeMode === "shortest" && !sameRoute, selection.publishedOption);
  const selectedDistance = selectedWalkMetrics.distance;
  const selectedCoverage = selectedWalkMetrics.coverage;
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
  const rankedRecords = rankScoreRecords(rankingRecords, rankMetric, 5);
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
  const exposureGaps = selectedWalkMetrics.uncovered !== null && score.exposure_gaps
    ? [...score.exposure_gaps].sort((a, b) => b.len_m - a.len_m) : [];
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
    : selectedWalkMetrics.uncovered === null
      ? `Exposed gap measurements are unavailable for this ${selectedWalkLabel}.`
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
  const zeroGapEvidenceText = longestGapText;
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

      {!hideWalkControls && <TransitModeControl score={score} mode={transitMode} setMode={setTransitMode} />}

      {!hideExposureDetails && score.paths && (
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

      {!hideWalkControls && score.paths && !directBusFallback && !previewRoute && (
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
          {routeDetailNotes.map((note) => (
            <small key={note}>{note}</small>
          ))}
        </div>
      )}

      {!hideExposureDetails && score.paths && !directBusFallback && !previewRoute && exposureGaps.length === 0 && (
        <div className={styles.gapList} aria-label="Exposed gap evidence">
          <h3>Exposed gaps {selectedWalkHeadingPhrase}</h3>
          <p className={styles.gapSummary}>
            <span>{zeroGapEvidenceText}</span>
          </p>
        </div>
      )}

      {!hideExposureDetails && exposureGaps.length > 0 && (
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

export function DataDetails({ manifest, onToggle, children }: { manifest: Manifest | null; onToggle?: React.ToggleEventHandler<HTMLDetailsElement>; children?: React.ReactNode }) {
  const snapshot = DATA_BASE === `/data/${RECORDED_SOURCE_FRESHNESS.bundle}/` ? RECORDED_SOURCE_FRESHNESS : null;
  const date = (value: unknown) => {
    const parsed = parseFreshnessDate(value);
    return parsed ? <time dateTime={parsed.iso}>{parsed.label}</time> : 'Unknown';
  };
  return (
        <details className={styles.dataLimits} onToggle={onToggle}>
          <summary>About data</summary>
          <div className={styles.dataBody}>
          <p>
            <strong>Bundle data reference:</strong> {date(manifest?.data_as_of)}
          </p>
          <p><strong>Bundle generated:</strong> {date(manifest?.generated_at)}</p>
          <p><strong>Publication date:</strong> {date(snapshot?.releasedAt)}</p>
          <p><strong>Last recorded source-age check:</strong> {date(snapshot?.checkedAt)}</p>
          {snapshot && <p>Static manifest-only check, not live monitoring. Checking a source does not update its data.</p>}
          <p>Some newer addresses and some locked scores are not in this release.</p>
          <p>
            Address list: June 2020 OneMap-derived postal scrape; newer developments may be missing.
          </p>
          <details className={styles.freshnessDetails}>
            <summary>Source freshness detail</summary>
            {snapshot && <>
              <p>Recorded publisher update dates:</p>
              <ul>
                {snapshot.sources.map(source => {
                  const freshness = sourceFreshnessAtCheck({ ...source, checkedAt: snapshot.checkedAt });
                  const status = freshness.status === 'stale' ? 'Stale at that check'
                    : freshness.status === 'within-threshold-at-check' ? 'Within threshold at that check'
                    : freshness.updatedAt ? 'Freshness unknown' : 'Update date unknown';
                  return <li key={source.id}>{source.label}: {date(source.updatedAt)}. {status}.</li>;
                })}
              </ul>
              <p>Fetch dates are not publisher update dates. The historical age report below may use fetch dates when update dates are missing.</p>
              <p>{DATA_FRESHNESS_SUMMARY_COPY}</p>
              <p>{DATA_FRESHNESS_DETAIL_COPY}</p>
              <p>{COVERED_LINKWAY_FRESHNESS_COPY}</p>
            </>}
          <p>
            {RECENT_PUBLIC_SOURCE_SAMPLE_LABEL}: {RECENT_PUBLIC_SOURCE_GAP_COPY}.
          </p>
          <p>
            {OSM_ADDR_POSTCODE_COVERAGE_COPY}
          </p>
          </details>
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
          {children}
          </div>
        </details>
  );
}

// UI availability is separate from server admission. Keep closed until the
// operational and integrated navigation/browser acceptance gates are satisfied.
const RESIDENT_REPORT_UI_AVAILABLE = false;

export default function Home() {
  return <HomeView residentReportingAvailable={RESIDENT_REPORT_UI_AVAILABLE} />;
}

function HomeView({ residentReportingAvailable }: { residentReportingAvailable: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [primary, setPrimary] = useState<LoadedSelection | null>(null);
  const [baseTransitPois, setBaseTransitPois] = useState<TransitPoiCollection>({ type: "FeatureCollection", features: [] });
  const [routeTransitPois, setRouteTransitPois] = useState<TransitPoiCollection>({ type: "FeatureCollection", features: [] });
  const [transitMode, setTransitMode] = useState<TransitAccessMode>("best_transit");
  const [routeMode, setRouteMode] = useState<RouteDisplayMode>("shiokest");
  const [mapLoadStatus, setMapLoadStatus] = useState<MapLoadStatus>("idle");
  const [mapRecovery, setMapRecovery] = useState<RouteMapRecovery | null>(null);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [mapIssue, setMapIssue] = useState<RouteMapIssue | null>(null);
  const [mapDiagnostic, setMapDiagnostic] = useState<{ value: string; key: number; instance: number; retry: number; context?: object } | null>(null);
  const diagnosticSerial = useRef(0);
  const [selectionFailure, setSelectionFailure] = useState<{ value: string; request: number; key: number } | null>(null);
  const [geometryFailure, setGeometryFailure] = useState<{ value: string; request: number; attempt: number } | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(PINNED_DATA_MANIFEST);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [chosenStopId, setChosenStopId] = useState<string | null>(null);
  const [exposureSelection, setExposureSelection] = useState<{ contextKey: string; sectionKey: string } | null>(null);
  const [liveRouteCache, setLiveRouteCache] = useState<Record<string, LoadedSelection>>({});
  const liveRoutePreviewInFlightRef = useRef<Map<string, Promise<LiveRoutePreviewPayload>>>(new Map());
  const [liveRoutePreviewStatuses, setLiveRoutePreviewStatuses] = useState<Record<string, LiveRoutePreviewStatus>>({});
  const loadSelectionRequestIdRef = useRef(0);
  const autoSelectionRequest = useRef<number | null>(null);
  const lastSavedSelection = useRef<{ selection: LoadedSelection; mode: TransitAccessMode; stop: string | null; route: RouteDisplayMode } | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const walkSummaryHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const walkDetailsButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreWalkControlFocus = useCallback(() => {
    walkDetailsButtonRef.current?.focus({ preventScroll: true });
  }, []);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [mapRetryKey, setMapRetryKey] = useState(0);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const [previewRetryKey, setPreviewRetryKey] = useState(0);
  const [geometryError, setGeometryError] = useState(false);
  const [geometryRetrying, setGeometryRetrying] = useState(false);
  const geometryAttemptRef = useRef(0);
  const currentMapInstance = useRef(mapInstanceKey);
  currentMapInstance.current = mapInstanceKey;
  const currentMapRetry = useRef(mapRetryKey);
  currentMapRetry.current = mapRetryKey;
  const pendingSelectionRef = useRef<SearchResult | null>(null);
  // Pending stop id from ?stop= URL param — applied once the postal's candidates load.
  const pendingUrlStopIdRef = useRef<string | null>(null);
  const pendingUrlTransitRef = useRef<TransitAccessMode | null>(null);
  const pendingUrlRouteRef = useRef<RouteDisplayMode | null>(null);
  const pendingUrlPostalRef = useRef<string | null>(null);
  const [transitPoisReady, setTransitPoisReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const focusRecoveryTarget = (control?: HTMLButtonElement) => {
    if (!control || document.activeElement !== control) return;
    (walkSummaryHeadingRef.current ?? searchInputRef.current)?.focus();
  };
  const lastNavigationHref = useRef<string | null>(null);
  const navigationHandler = useRef<() => void>(() => {});
  const [residentReport, setResidentReport] = useState<ResidentReportSession | null>(null);
  const reportRef = useRef<ResidentReportSession | null>(null);
  const reportPhase = useRef<ReportComposerPhase>("draft");
  const reportUnsaved = useRef(false);
  const reportSerial = useRef(0);
  const reportAlive = useRef(true);
  const reportUiAvailable = useRef(residentReportingAvailable);
  reportUiAvailable.current = residentReportingAvailable;
  const reportOpener = useRef<HTMLButtonElement | null>(null);
  const reportPanel = useRef<HTMLElement | null>(null);
  const restoreReportFocus = useRef(false);
  const updateResidentReport = useCallback((next: ResidentReportSession | null) => {
    if (!reportAlive.current) return;
    reportRef.current = next;
    setResidentReport(next);
  }, []);
  const hasReportToLose = useCallback(() => {
    const current = reportRef.current;
    return !!current && (current.stage === "selecting" ? current.points.length > 0
      : reportUnsaved.current || reportPhase.current !== "received");
  }, []);
  const leaveResidentReport = useCallback(() => {
    if (!reportAlive.current) return false;
    if (hasReportToLose()) {
      // An unavailable/suppressed confirmation must fail closed, never imply consent.
      try { if (!window.confirm(REPORT_LEAVE_WARNING)) return false; } catch { return false; }
    }
    reportUnsaved.current = false;
    reportPhase.current = "closed";
    updateResidentReport(null);
    return true;
  }, [hasReportToLose, updateResidentReport]);
  useEffect(() => {
    reportAlive.current = true;
    return () => { reportAlive.current = false; reportRef.current = null; };
  }, []);
  useEffect(() => {
    if (residentReport) reportPanel.current?.querySelector?.<HTMLElement>("h2")?.focus();
    else if (restoreReportFocus.current) {
      restoreReportFocus.current = false;
      (reportOpener.current ?? searchInputRef.current)?.focus({ preventScroll: true });
    }
  }, [residentReport?.id, residentReport?.stage]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasReportToLose()) return;
      event.preventDefault(); event.returnValue = "";
    };
    const followLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      if (anchor.href === window.location.href || !hasReportToLose()) return;
      if (!leaveResidentReport()) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    // Same-page history keeps the independent composer mounted. Guard departures before
    // a supporting browser/Next router can unmount Home; other documents use beforeunload.
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const navigate = (event: Event) => {
      const destination = (event as Event & { destination?: { url: string; sameDocument: boolean } }).destination;
      if (!destination || !event.cancelable || !hasReportToLose()) return;
      if (destination.sameDocument && new URL(destination.url).pathname === new URL(window.location.href).pathname) return;
      if (!leaveResidentReport()) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    if (typeof document !== "undefined") document.addEventListener?.("click", followLink, true);
    navigation?.addEventListener("navigate", navigate);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (typeof document !== "undefined") document.removeEventListener?.("click", followLink, true);
      navigation?.removeEventListener("navigate", navigate);
    };
  }, [hasReportToLose, leaveResidentReport]);
  useEffect(() => {
    // Bootstrap the optional cache without loading a postal record.
    void requestServiceWorkerCache();
  }, []);
  const syncWalkUrl = useCallback((path: string, postal: string, mode: TransitAccessMode, stop: string | null, route: RouteDisplayMode) => {
    writeWalkUrl(path, postal, mode, stop, route);
    lastNavigationHref.current = window.location.href;
  }, []);
  const discardPendingUrlIntent = useCallback(() => {
    autoSelectionRequest.current = null;
    pendingUrlStopIdRef.current = null;
    pendingUrlTransitRef.current = null;
    pendingUrlRouteRef.current = null;
    pendingUrlPostalRef.current = null;
  }, []);

  const pathname = usePathname();

  // Reset live route cache on postal change
  useEffect(() => {
    setLiveRouteCache({});
    setLiveRoutePreviewStatuses({});
    setExposureSelection(null);
  }, [primary?.result?.POSTAL]);

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

  const categoryWalks = useMemo(() => ({
    bus: shortestSavedWalk(primary, DATA_BASE, "bus"),
    mrt_lrt: shortestSavedWalk(primary, DATA_BASE, "mrt_lrt"),
  }), [primary]);

  const publishedCategory: PublishedTransitCategory = transitMode === "best_transit"
    ? primary?.score?.best_node?.type === "mrt_lrt_exit" ? "mrt_lrt" : "bus"
    : transitMode;
  // Normalize the original record and shard, never the already-adapted selected view.
  const publishedPool = useMemo(
    () => normalizePublishedSelection(primary, publishedCategory, DATA_BASE),
    [primary, publishedCategory]
  );
  const defaultOption = useMemo(
    () => publishedDefault(publishedPool, transitMode),
    [publishedPool, transitMode]
  );
  const selectedPublishedOption = useMemo(
    () => chosenStopId ? publishedOptionForStop(publishedPool, chosenStopId, mapTransitPois, originLatLng) : defaultOption,
    [publishedPool, chosenStopId, defaultOption, mapTransitPois, originLatLng]
  );
  const transitSelection = useMemo(
    () => primary ? publishedSelectionView(primary, defaultOption) : null,
    [primary, defaultOption]
  );
  const publishedChoices = useMemo(
    () => selectPublishedTransitChoices(publishedPool, publishedCategory, selectedPublishedOption?.key ?? null),
    [publishedPool, publishedCategory, selectedPublishedOption]
  );

  const bestCandidateId = useMemo(
    () => resolveBestCandidateId(candidates, transitSelection?.score ?? null),
    [candidates, transitSelection]
  );

  // Background fetch to snap arbitrary clicked stops onto real OneMap sidewalks for preview evidence.
  useEffect(() => {
    if (!chosenStopId || !transitSelection || !originLatLng) return;
    if (selectedPublishedOption || liveRouteCache[chosenStopId]) {
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

      let liveScored: ReturnType<typeof scoreLiveRoute>;
      try { liveScored = scoreLiveRoute({
        postal: transitSelection.result.POSTAL,
        originCoords: originLatLng,
        targetStop,
        routeCoordinates: decoded,
        baseScore: transitSelection.score,
        baseGeom: primary?.geom,
      }); } catch {
        setLiveRoutePreviewStatuses(current => ({ ...current, [chosenStopId]: "unavailable" }));
        return false;
      }

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
      request = requestWalkPreview(url)
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
        console.warn("OneMap live route fetch failed; keeping the published walk:", err);
        if (active) {
          setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
        }
      });

    return () => {
      active = false;
    };
  }, [chosenStopId, transitSelection, selectedPublishedOption, primary?.geom, originLatLng, candidates, mapTransitPois, liveRouteCache, previewRetryKey]);

  useEffect(() => {
    if (primary && selectedPublishedOption?.retainable) {
      lastSavedSelection.current = {
        selection: publishedSelectionView(primary, selectedPublishedOption),
        mode: transitMode, stop: chosenStopId, route: routeMode,
      };
    }
  }, [primary, selectedPublishedOption, transitMode, chosenStopId, routeMode]);

  const activeSelection = useMemo(
    () => {
      if (primary && selectedPublishedOption) return publishedSelectionView(primary, selectedPublishedOption);
      if (chosenStopId) {
        const preview = liveRouteCache[chosenStopId];
        if (preview?.result.POSTAL === primary?.result.POSTAL) return preview;
        const saved = lastSavedSelection.current;
        if (saved && saved.selection.result.POSTAL === primary?.result.POSTAL) return saved.selection;
      }
      // A pending/failed preview is not a walking route. Keep the published result.
      return transitSelection;
    },
    [primary, selectedPublishedOption, transitSelection, chosenStopId, liveRouteCache]
  );

  const reportSourceKey = [primary?.result.POSTAL ?? "", activeSelection?.publishedOption?.key ?? "", routeMode].join("|");
  const currentReportSource = useRef(reportSourceKey);
  currentReportSource.current = reportSourceKey;
  const startResidentReport = () => {
    if (!reportUiAvailable.current || !reportAlive.current || loading || !primary || reportRef.current || currentReportSource.current !== reportSourceKey) return;
    const safeIdentifier = (value: unknown): value is string => typeof value === "string" && !/[\r\n]/.test(value)
      && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
    const destination = activeSelection?.publishedOption?.aliases[0];
    const context: ReportContext = Object.freeze({ postal_code: primary.result.POSTAL,
      ...(activeSelection?.publishedOption ? { transit_category: activeSelection.publishedOption.category } : {}),
      ...(safeIdentifier(destination) ? { destination_id: destination } : {}),
    });
    // Reference the actual selected published dataset, not a timestamp or guessed report version.
    const bundleVersion = DATA_BASE.split("/").filter(Boolean).at(-1) ?? "";
    reportPhase.current = "draft"; reportUnsaved.current = false;
    updateResidentReport({ id: ++reportSerial.current, stage: "selecting", mode: "point", points: [],
      context, bundleVersion, sourceKey: reportSourceKey,
      postalPoint: originLatLng ? { ...originLatLng } : null, error: null });
  };
  const reportSelectionCurrent = residentReport?.sourceKey === reportSourceKey;
  const addReportPoint = (point: FeedbackPoint) => {
    const current = reportRef.current;
    if (!current || current.id !== residentReport?.id || current.stage !== "selecting"
      || current.sourceKey !== currentReportSource.current || currentMapInstance.current !== mapInstanceKey) return;
    const points = current.mode === "point" ? [{ ...point }] : [...current.points, { ...point }];
    const candidate = { ...current, points, error: null };
    const validation = current.mode === "section" && points.length === 1 ? { ...candidate, mode: "point" as const } : candidate;
    if (!validResidentReportLocation(validation)) {
      updateResidentReport({ ...current, error: "Choose a valid point or a section up to 1.2 km with at most 32 points." });
      return;
    }
    updateResidentReport(candidate);
  };
  const changeReportMode = (mode: ResidentReportSession["mode"]) => {
    const current = reportRef.current;
    if (!current || current.id !== residentReport?.id || current.stage !== "selecting" || current.mode === mode) return;
    if (current.points.length > 0) {
      try { if (!window.confirm("Replace this selected report location? Nothing has been sent.")) return; } catch { return; }
    }
    updateResidentReport({ ...current, mode, points: [], error: null });
  };
  const composeResidentReport = () => {
    const current = reportRef.current;
    if (!current || current.id !== residentReport?.id || current.stage !== "selecting" || !validResidentReportLocation(current)) return;
    reportPhase.current = "draft";
    updateResidentReport({ ...current, stage: "composing", points: current.points.map(point => ({ ...point })) });
  };
  const closeResidentReport = () => {
    if (reportRef.current?.id !== residentReport?.id) return;
    reportUnsaved.current = false; reportPhase.current = "closed";
    restoreReportFocus.current = true;
    updateResidentReport(null);
  };

  const mapRoutes = useMemo(() => buildRouteItems(activeSelection), [activeSelection]);
  const sameSelectedRoute = activeSelection?.publishedOption
    ? activeSelection.publishedOption.geometry.shortest.signature !== null
      && activeSelection.publishedOption.geometry.shortest.signature === activeSelection.publishedOption.geometry.sheltered.signature
    : routesAreSame(activeSelection);
  const mapRouteMode = sameSelectedRoute || (activeSelection?.publishedOption && activeSelection.publishedOption.geometry.shortest.parts.length === 0)
    ? "shiokest" : routeMode;
  const exposureModel = useMemo(
    () => publishedExposureSections(activeSelection?.publishedOption ?? null, mapRouteMode),
    [activeSelection?.publishedOption, mapRouteMode]
  );
  // Resolve against current evidence during render, before a stale focus could reach the map.
  const focusedExposureGap = useMemo(
    () => resolveMappedExposureFocus(exposureModel, exposureSelection),
    [exposureModel, exposureSelection]
  );
  const currentExposureContext = useRef(exposureModel.contextKey);
  currentExposureContext.current = exposureModel.contextKey;
  useEffect(() => {
    setExposureSelection(current => current?.contextKey === exposureModel.contextKey ? current : null);
  }, [exposureModel.contextKey]);
  const handleExposureSelection = (sectionKey: string | null) => {
    if (currentExposureContext.current !== exposureModel.contextKey) return;
    setExposureSelection(sectionKey === null ? null : { contextKey: exposureModel.contextKey, sectionKey });
  };
  const showDetailOverlay = Boolean(primary);
  const diagnosticContext = useMemo(() => ({}), [
    activeSelection, loadSelectionRequestIdRef.current, transitMode,
    geometryAttemptRef.current, chosenStopId, mapRouteMode,
    mapRetryKey,
  ]);
  const currentDiagnosticContext = useRef(diagnosticContext);
  currentDiagnosticContext.current = diagnosticContext;
  const staleMapProbe = mapIssue?.selectionContext && mapIssue.selectionContext !== diagnosticContext;
  const effectiveMapStatus = staleMapProbe ? 'initializing' : mapLoadStatus;
  const visibleMapStatus = mapStatusLabel(effectiveMapStatus, staleMapProbe ? null : mapLoadError);
  const visibleMapDiagnostic = mapDiagnostic && mapDiagnostic.instance === mapInstanceKey && mapDiagnostic.retry === mapRetryKey
    && (!mapDiagnostic.context || mapDiagnostic.context === diagnosticContext) ? mapDiagnostic : null;

  // Published choices resolve independently of optional POI loading.
  useEffect(() => {
    if (!primary || loading) return;
    if (pendingUrlPostalRef.current !== primary.result.POSTAL) {
      discardPendingUrlIntent();
      return;
    }
    const pendingMode = pendingUrlTransitRef.current;
    const nextMode = pendingMode ?? transitMode;
    const nextRoute = pendingUrlRouteRef.current ?? routeMode;
    if (pendingMode) {
      setTransitMode(pendingMode);
    }
    if (pendingUrlRouteRef.current) {
      setRouteMode(pendingUrlRouteRef.current);
      pendingUrlRouteRef.current = null;
    }
    const pending = pendingUrlStopIdRef.current;
    if (!pending) {
      if (pathname) syncWalkUrl(pathname, primary.result.POSTAL, nextMode, null, nextRoute);
      discardPendingUrlIntent(); return;
    }
    for (const category of ["bus", "mrt_lrt"] as const) {
      const option = publishedOptionForStop(normalizePublishedSelection(primary, category, DATA_BASE), pending, mapTransitPois, originLatLng);
      if (option && (!pendingMode || option.category === pendingMode)) {
        const target = publishedChoiceTarget(option);
        setTransitMode(target.mode);
        setChosenStopId(target.stopId);
        pendingUrlStopIdRef.current = null;
        pendingUrlTransitRef.current = null;
        pendingUrlPostalRef.current = null;
        if (pathname) syncWalkUrl(pathname, primary.result.POSTAL, target.mode, target.stopId, nextRoute);
        return;
      }
    }
    if (!transitPoisReady) return;
    const poi = mapTransitPois.features.find(feature => feature.properties.id === pending);
    const category = poi?.properties.kind === "bus_stop" ? "bus" : poi?.properties.kind === "mrt_exit" ? "mrt_lrt" : null;
    if (category && (!pendingMode || category === pendingMode)) {
      setTransitMode(category);
      setChosenStopId(pending);
      if (pathname) syncWalkUrl(pathname, primary.result.POSTAL, category, pending, nextRoute);
    } else {
      if (pathname) syncWalkUrl(pathname, primary.result.POSTAL, nextMode, null, nextRoute);
    }
    pendingUrlStopIdRef.current = null;
    pendingUrlTransitRef.current = null;
    pendingUrlPostalRef.current = null;
  }, [primary, loading, transitPoisReady, mapTransitPois, originLatLng, pathname, transitMode, routeMode, discardPendingUrlIntent, syncWalkUrl]);

  const loadSelection = async (result: SearchResult, preserveInitialUrl = false) => {
    const postal = normalizePostal(result.POSTAL);
    if (!postal) {
      setSelectionFailure(null);
      pendingSelectionRef.current = null;
      setError("This OneMap match has no 6-digit postal code. Choose another match or enter the postal code directly.");
      return;
    }
    if (!preserveInitialUrl && !leaveResidentReport()) return;
    if (!preserveInitialUrl) discardPendingUrlIntent();
    setExposureSelection(null);
    const requestId = loadSelectionRequestIdRef.current + 1;
    loadSelectionRequestIdRef.current = requestId;
    autoSelectionRequest.current = requestId;
    lastSavedSelection.current = null;
    const geometryAttempt = ++geometryAttemptRef.current;
    setGeometryRetrying(false);
    preloadRouteMap();
    requestServiceWorkerCache();
    setLoading(true);
    setError(null);
    setSelectionFailure(null);
    setGeometryFailure(null);
    pendingSelectionRef.current = result;
    setGeometryError(false);
    let failedArea: 'manifest-data' | 'score-data' | null = null;
    const operationFailed = (area: 'manifest-data' | 'score-data') => (error: unknown): never => {
      failedArea ??= area;
      throw error;
    };
    try {
      const lat = Number.parseFloat(result.LATITUDE);
      const lng = Number.parseFloat(result.LONGITUDE);
      // Text and geometry are independent. A geometry failure must not hide valid record evidence.
      const geometryState: { settled?: { geom: PostalGeom | null; failed: boolean; failure: ArtifactFailure | null } } = {};
      const geometry = fetchGeomForPostal(postal, Number.isFinite(lat) ? lat : undefined, Number.isFinite(lng) ? lng : undefined)
        .then(geom => ({ geom, failed: false, failure: null as ArtifactFailure | null }),
          error => ({ geom: null, failed: true, failure: getArtifactFailure(error) }))
        .then(result => { geometryState.settled = result; return result; });
      const [loadedManifest, score] = await Promise.all([
        manifest ? Promise.resolve(manifest) : fetchManifest().catch(operationFailed('manifest-data')),
        fetchScoreForPostal(postal).catch(operationFailed('score-data')),
      ]);
      if (requestId !== loadSelectionRequestIdRef.current) return;
      const initialSelection = { result: { ...result, POSTAL: postal }, score,
        geom: geometryAttempt === geometryAttemptRef.current ? geometryState.settled?.geom ?? null : null };
      setPrimary(initialSelection);
      setChosenStopId(null);
      setTransitMode("best_transit");
      setLiveRouteCache({});
      setLiveRoutePreviewStatuses({});
      setTransitPoisReady(false);
      setRouteMode("shiokest");
      setSheetExpanded(false);
      if (!preserveInitialUrl && pathname) {
        syncWalkUrl(pathname, postal, "best_transit", null, "shiokest");
      }
      setRouteTransitPois({ type: "FeatureCollection", features: [] });
      const { geom, failed, failure } = await geometry;
      if (requestId !== loadSelectionRequestIdRef.current) return;
      if (geometryAttempt !== geometryAttemptRef.current) return;
      setGeometryError(failed);
      setGeometryFailure(failed ? {
        value: serializeFailureDiagnostics({ area: 'geometry-data', status: 'error', artifactFailure: failure }, DATA_BASE),
        request: requestId, attempt: geometryAttempt,
      } : null);
      if (requestId !== loadSelectionRequestIdRef.current) return;
      setManifest(loadedManifest);
      if (initialSelection.geom !== geom) setPrimary({ ...initialSelection, geom });
      if (autoSelectionRequest.current === requestId && !pendingUrlTransitRef.current && !pendingUrlStopIdRef.current) {
        const closest = shortestSavedWalk({ ...initialSelection, geom }, DATA_BASE);
        if (closest) {
          const target = publishedChoiceTarget(closest.option);
          const nextRoute = pendingUrlRouteRef.current ?? closest.route;
          setTransitMode(target.mode);
          setChosenStopId(target.stopId);
          setRouteMode(nextRoute);
          pendingUrlPostalRef.current = postal;
          pendingUrlTransitRef.current = target.mode;
          pendingUrlStopIdRef.current = target.stopId;
          pendingUrlRouteRef.current = nextRoute;
          if (pathname) syncWalkUrl(pathname, postal, target.mode, target.stopId, nextRoute);
        }
        autoSelectionRequest.current = null;
      }
      void fetchTransitPoisForGeom(geom)
        .then(async (nearbyTransitPois) => {
          if (requestId !== loadSelectionRequestIdRef.current) return;
          if (nearbyTransitPois.features.length === 0) {
            nearbyTransitPois = await fetchTransitPois();
            if (requestId !== loadSelectionRequestIdRef.current) return;
            setBaseTransitPois(nearbyTransitPois);
          }
          setRouteTransitPois(nearbyTransitPois);
          setTransitPoisReady(true);
        })
        .catch(() => {
          if (requestId === loadSelectionRequestIdRef.current) {
            setRouteTransitPois({ type: "FeatureCollection", features: [] });
            setTransitPoisReady(true);
          }
        });
    } catch (err) {
      if (requestId === loadSelectionRequestIdRef.current) {
        const failure = getArtifactFailure(err);
        setError("Shelter-map data could not load. Try this postal code again.");
        setSelectionFailure({
          value: serializeFailureDiagnostics({ area: failedArea ?? 'selection-data',
            status: 'error', artifactFailure: failure }, DATA_BASE),
          request: requestId, key: ++diagnosticSerial.current,
        });
      }
    } finally {
      if (requestId === loadSelectionRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Retired comparison fragments never load or overwrite a saved shortlist.
  navigationHandler.current = () => {
    if (lastNavigationHref.current === window.location.href) return;
    lastNavigationHref.current = window.location.href;
    loadSelectionRequestIdRef.current += 1;
    geometryAttemptRef.current += 1;
    discardPendingUrlIntent();
    setLoading(false);
    setError(null);
    setSelectionFailure(null);
    setGeometryError(false);
    setGeometryFailure(null);
    setExposureSelection(null);
    setGeometryRetrying(false);
    const params = new URLSearchParams(window.location.search);
    const postal = normalizePostal(params.get('postal') || '');
    pendingUrlPostalRef.current = postal;
    pendingUrlStopIdRef.current = params.get('stop');
    const mode = params.get('transit');
    pendingUrlTransitRef.current = mode === 'bus' || mode === 'mrt_lrt' ? mode : null;
    const route = params.get('route');
    pendingUrlRouteRef.current = route === 'shortest' || route === 'both' ? route : null;
    if (postal) {
      setQuery(postal);
      void loadSelection({ POSTAL: postal, BUILDING: `Postal ${postal}`, ROAD_NAME: "", LATITUDE: "", LONGITUDE: "", SEARCHVAL: `S${postal}` }, true);
    } else {
      setPrimary(null);
      setChosenStopId(null);
      setQuery('');
      setResults([]);
    }
  };
  useEffect(() => {
    const navigate = () => navigationHandler.current();
    navigate();
    window.addEventListener('popstate', navigate);
    window.addEventListener('hashchange', navigate);
    return () => {
      window.removeEventListener('popstate', navigate);
      window.removeEventListener('hashchange', navigate);
      lastNavigationHref.current = null;
      loadSelectionRequestIdRef.current += 1;
    };
  }, []);

  const retryGeometry = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!primary) return;
    focusRecoveryTarget(event?.currentTarget);
    const requestId = loadSelectionRequestIdRef.current;
    const postal = primary.result.POSTAL;
    const attempt = ++geometryAttemptRef.current;
    setGeometryRetrying(true);
    setGeometryError(false);
    setGeometryFailure(null);
    try {
      const geom = await fetchGeomForPostal(postal);
      if (requestId !== loadSelectionRequestIdRef.current || attempt !== geometryAttemptRef.current) return;
      setPrimary(current => current?.result.POSTAL === postal ? { ...current, geom } : current);
    } catch (error) {
      if (requestId === loadSelectionRequestIdRef.current && attempt === geometryAttemptRef.current) {
        setGeometryError(true);
        setGeometryFailure({ value: serializeFailureDiagnostics({ area: 'geometry-data', status: 'error',
          artifactFailure: getArtifactFailure(error) }, DATA_BASE), request: requestId, attempt });
      }
    } finally {
      if (requestId === loadSelectionRequestIdRef.current && attempt === geometryAttemptRef.current) {
        setGeometryRetrying(false);
      }
    }
  };

  const syncStopUrl = useCallback(
    (nextStopId: string | null, nextMode: TransitAccessMode = transitMode, nextRoute: RouteDisplayMode = routeMode) => {
      if (pathname && primary?.result.POSTAL) syncWalkUrl(pathname, primary.result.POSTAL, nextMode, nextStopId, nextRoute);
    },
    [pathname, primary?.result.POSTAL, transitMode, routeMode, syncWalkUrl]
  );

  const handleRouteModeChange = useCallback((mode: RouteDisplayMode) => {
    if (!leaveResidentReport()) return;
    discardPendingUrlIntent();
    setRouteMode(mode);
    setExposureSelection(null);
    syncStopUrl(chosenStopId, transitMode, mode);
  }, [chosenStopId, transitMode, syncStopUrl, discardPendingUrlIntent, leaveResidentReport]);

  const handleTransitModeChange = useCallback((mode: TransitAccessMode) => {
    if (!leaveResidentReport()) return;
    discardPendingUrlIntent();
    const closest = mode === "best_transit" ? shortestSavedWalk(primary, DATA_BASE) : categoryWalks[mode];
    if (!closest) {
      setTransitMode(mode);
      setChosenStopId(null);
      setLiveRoutePreviewStatuses({});
      setExposureSelection(null);
      syncStopUrl(null, mode);
      return;
    }
    const target = publishedChoiceTarget(closest.option);
    setTransitMode(target.mode);
    setChosenStopId(target.stopId);
    setRouteMode(closest.route);
    setLiveRoutePreviewStatuses({});
    setExposureSelection(null);
    syncStopUrl(target.stopId, target.mode, closest.route);
  }, [primary, categoryWalks, syncStopUrl, discardPendingUrlIntent, leaveResidentReport]);

  const handleStopSelect = useCallback(
    (nextStopId: string | null) => {
      if (!leaveResidentReport()) return;
      discardPendingUrlIntent();
      if (primary && nextStopId) {
        for (const category of ["bus", "mrt_lrt"] as const) {
          const option = publishedOptionForStop(normalizePublishedSelection(primary, category, DATA_BASE), nextStopId, mapTransitPois, originLatLng);
          if (option) {
            const target = publishedChoiceTarget(option);
            setTransitMode(target.mode);
            setChosenStopId(target.stopId);
            setLiveRoutePreviewStatuses({});
            setExposureSelection(null);
            syncStopUrl(target.stopId, target.mode);
            return;
          }
        }
      }
      const resolved = nextStopId && nextStopId !== bestCandidateId ? nextStopId : null;
      const poi = mapTransitPois.features.find(feature => feature.properties.id === resolved);
      const mode = poi?.properties.kind === "bus_stop" ? "bus" : poi?.properties.kind === "mrt_exit" ? "mrt_lrt" : transitMode;
      setTransitMode(mode);
      setChosenStopId(resolved);
      if (!resolved) {
        setLiveRoutePreviewStatuses({});
      }
      setExposureSelection(null);
      syncStopUrl(resolved, mode);
    },
    [primary, mapTransitPois, originLatLng, transitMode, bestCandidateId, syncStopUrl, discardPendingUrlIntent, leaveResidentReport]
  );

  const handlePublishedChoice = (key: string | null) => {
    const option = publishedPool.options.find(item => item.key === (key ?? publishedChoices.defaultKey));
    if (!option || (key !== null && !option.retainable)) return;
    if (!leaveResidentReport()) return;
    discardPendingUrlIntent();
    const target = publishedChoiceTarget(option);
    setTransitMode(target.mode);
    setChosenStopId(target.stopId);
    setLiveRoutePreviewStatuses({});
    setExposureSelection(null);
    syncStopUrl(target.stopId, target.mode);
  };


  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const control = e.currentTarget.elements.namedItem("postal");
    const value = control instanceof HTMLInputElement ? control.value : "";
    const directPostal = normalizePostal(value);
    setQuery(directPostal ?? postalInputValue(value));
    setSelectionFailure(null);
    if (!value.trim()) { pendingSelectionRef.current = null; setError("Enter a 6-digit Singapore postal code."); return; }
    preloadRouteMap();
    requestServiceWorkerCache();

    if (directPostal) {
      // An explicit submit owns navigation even before the mount URL effect runs.
      lastNavigationHref.current = window.location.href;
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

    setResults([]);
    setSearchAttempted(true);
    pendingSelectionRef.current = null;
    setError("Enter a 6-digit Singapore postal code.");
  };

  const handleMapStatusChange = useCallback((status: MapLoadStatus, message?: string, recovery?: RouteMapRecovery, issue?: RouteMapIssue) => {
    if (currentMapInstance.current !== mapInstanceKey || currentMapRetry.current !== mapRetryKey) return;
    if (issue?.selectionContext && issue.selectionContext !== currentDiagnosticContext.current) return;
    setMapLoadStatus(status);
    setMapLoadError(message ?? null);
    setMapRecovery(recovery ?? null);
    setMapIssue(issue ?? null);
    if (status !== 'error' && status !== 'partial') { setMapDiagnostic(null); return; }
    const value = serializeFailureDiagnostics({ area: 'map', status, mapIssue: issue }, DATA_BASE);
    const next = { value, key: ++diagnosticSerial.current, instance: mapInstanceKey, retry: mapRetryKey, context: issue?.selectionContext };
    setMapDiagnostic(current => current && current.value === value && current.instance === next.instance
      && current.retry === next.retry && current.context === next.context ? current : next);
  }, [mapInstanceKey, mapRetryKey]);

  const backToSavedWalk = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!leaveResidentReport()) return;
    focusRecoveryTarget(event?.currentTarget);
    const saved = lastSavedSelection.current;
    if (!saved || saved.selection.result.POSTAL !== primary?.result.POSTAL) {
      handleStopSelect(null);
      return;
    }
    discardPendingUrlIntent();
    setTransitMode(saved.mode);
    setChosenStopId(saved.stop);
    setRouteMode(saved.route);
    setLiveRoutePreviewStatuses({});
    setExposureSelection(null);
    syncStopUrl(saved.stop, saved.mode, saved.route);
  };
  const previewPending = Boolean(chosenStopId && !selectedPublishedOption && !liveRouteCache[chosenStopId]);
  const displayedStopId = previewPending
    ? activeSelection?.publishedOption?.aliases[0] ?? null
    : chosenStopId ?? bestCandidateId;

  return (
    <main className={styles.appShell} data-map-status={effectiveMapStatus} data-map-stage={staleMapProbe ? undefined : mapIssue?.stage} data-map-failure={staleMapProbe ? undefined : mapIssue?.reason}>
        <RouteEvidenceMap
          key={mapInstanceKey}
          routes={mapRoutes}
          mode={mapRouteMode}
          transitPois={mapTransitPois}
          onSelectTransitStop={handleStopSelect}
          chosenStopId={displayedStopId}
          showLampOverlay
          feedbackEnabled={residentReport ? residentReport.stage === "selecting" && reportSelectionCurrent : undefined}
          feedbackPoints={residentReport?.points}
          onFeedbackPoint={residentReport ? addReportPoint : undefined}
          focusedExposureGap={focusedExposureGap}
          mappedExposureContextKey={exposureModel.contextKey}
          onStatusChange={handleMapStatusChange}
          diagnosticContext={diagnosticContext}
          retryKey={mapRetryKey}
        />
      <div className={styles.searchStack}>
      <section
        className={styles.searchOverlay}
        data-map-overlay="top-left"
        aria-label="Postal-code search"
        aria-busy={loading}
      >
        <div className={styles.searchToolbar}>
        <div className={styles.identityRow}>
          <h1 className={styles.identityBrand} aria-label="S.H.I.O.K. Shelter Map">SHIOK<span aria-hidden="true">.</span></h1>
        </div>
        <form onSubmit={handleSearch} action="/" method="get" className={styles.searchForm} aria-busy={loading}>
          <input
            id="postal-search-input"
            ref={searchInputRef}
            type="text"
            name="postal"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="Enter 6-digit postal"
            value={query}
            onChange={(e) => {
              setQuery(postalInputValue(e.target.value));
              setSearchAttempted(false);
            }}
            onFocus={preloadRouteMap}
            aria-label="Enter 6-digit Singapore postal code"
          />
          <button id="postal-search-button" type="submit" aria-label="Search postal code" title="Search postal code" aria-busy={loading}>
            <span className={loading ? styles.searchSpinner : styles.searchGlyph} aria-hidden="true" />
          </button>
        </form>
        </div>

        <p className={styles.srOnly} role="status" aria-live="polite">{visibleMapStatus}</p>
        {(effectiveMapStatus === "partial" || effectiveMapStatus === "error") && <div className={styles.errorBox} role="status">
          {visibleMapStatus} <button type="button" onClick={event => {
            if (mapRecovery === "reload") {
              if (!leaveResidentReport()) return;
              window.location.reload();
            } else {
              focusRecoveryTarget(event?.currentTarget);
              if (mapLoadStatus === "partial") setMapRetryKey(key => key + 1);
              else setMapInstanceKey(key => key + 1);
            }
          }}>{mapRecovery === "reload" ? "Reload page" : "Retry map"}</button>
          {visibleMapDiagnostic && <FailureDiagnosticsControl value={visibleMapDiagnostic.value} snapshotKey={visibleMapDiagnostic.key} />}
        </div>}
        {geometryError && <div className={styles.errorBox} role="status">Walk geometry could not load. Your record is still available. <button type="button" onClick={retryGeometry}>Retry geometry</button>
          {geometryFailure && geometryFailure.request === loadSelectionRequestIdRef.current && geometryFailure.attempt === geometryAttemptRef.current
            && <FailureDiagnosticsControl value={geometryFailure.value} snapshotKey={'geometry:' + geometryFailure.attempt} />}
        </div>}
        {chosenStopId && !selectedPublishedOption && !liveRouteCache[chosenStopId] && <div className={styles.errorBox} role="status">
          {liveRoutePreviewStatuses[chosenStopId] === "unavailable"
            ? mapRoutes.length ? "Online preview unavailable. Your saved walk is still shown." : "Online preview unavailable. No saved walk is available for this stop."
            : mapRoutes.length ? "Checking this stop. Your saved walk stays on the map." : "Checking this stop..."}
          {liveRoutePreviewStatuses[chosenStopId] === "unavailable" && <button type="button" onClick={event => { focusRecoveryTarget(event?.currentTarget); setPreviewRetryKey(key => key + 1); }}>Retry preview</button>}
          <button type="button" onClick={backToSavedWalk}>Back to saved walk</button>
        </div>}
        {geometryRetrying && <div className={styles.walkLoading} role="status">Loading saved walk...</div>}
        {primary?.score?.paths && !primary.geom && !loading && !geometryError && !geometryRetrying && <div className={styles.errorBox} role="status">No route geometry is published for this walk. Record evidence is still available.</div>}
        <SearchFeedback results={results} loading={loading} error={error} searched={searchAttempted}>
        {error && selectionFailure?.request === loadSelectionRequestIdRef.current
          && <FailureDiagnosticsControl value={selectionFailure.value} snapshotKey={'selection:' + selectionFailure.key} />}
        {error && pendingSelectionRef.current && <button type="button" onClick={event => {
          const pending = pendingSelectionRef.current;
          if (!pending) return;
          focusRecoveryTarget(event?.currentTarget);
          return loadSelection(pending);
        }}>Retry selection</button>}
        </SearchFeedback>
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

      </section>

        {showDetailOverlay && (
          <aside ref={panelRef} data-map-overlay={residentReport ? undefined : "top-left"} className={`${styles.resultPanel} ${sheetExpanded ? styles.sheetExpanded : ""}`} style={residentReport ? { display: "none" } : undefined}>
            <WalkSummary headingRef={walkSummaryHeadingRef} postal={primary!.result.POSTAL} score={activeSelection?.score ?? null} option={activeSelection?.publishedOption} shortest={mapRouteMode === "shortest" && !sameSelectedRoute} />
            {primary?.score && <TransitModeControl score={primary.score} mode={publishedCategory} setMode={handleTransitModeChange}
              availability={{
                bus: Boolean(categoryWalks.bus) || (loading && !primary.geom && Boolean(primary.score.route_options?.bus?.paths)),
                mrt_lrt: Boolean(categoryWalks.mrt_lrt) || (loading && !primary.geom && Boolean(primary.score.route_options?.mrt_lrt?.paths)),
              }} />}
            <div className={styles.walkActions}>
            <button ref={walkDetailsButtonRef} type="button" className={styles.sheetToggle} aria-expanded={sheetExpanded}
              aria-controls="walk-details" onClick={() => setSheetExpanded(value => !value)}>
              {sheetExpanded ? "Collapse walk details" : "Walk details"}
            </button>
            {residentReportingAvailable && <button ref={reportOpener} type="button" className={styles.sheetToggle} disabled={loading} onClick={startResidentReport}>Report a map issue</button>}
            </div>
            <div id="walk-details" className={styles.secondaryDetails} hidden={!sheetExpanded}>
            <ExposureSectionExplorer model={exposureModel} selectedKey={focusedExposureGap?.key ?? null}
              onSelect={handleExposureSelection} mode={mapRouteMode} onFocusedRemoval={restoreWalkControlFocus} />
            <TransitStopPicker selection={publishedChoices} onSelect={handlePublishedChoice}
              onFocusedRemoval={() => walkSummaryHeadingRef.current?.focus()} />

            {activeSelection?.geom && <RouteModeControl mode={mapRouteMode} setMode={handleRouteModeChange}
              disabled={false} sameRoute={sameSelectedRoute} directBusFallback={false} />}
            </div>
          </aside>
        )}
        {residentReport && <aside ref={reportPanel} data-map-overlay="top-left" className={styles.resultPanel} aria-label="Private report">
          {!reportSelectionCurrent && <p role="status">The walk changed. This report remains tied to its original location.</p>}
          {residentReport.stage === "selecting" ? <>
            <h2 tabIndex={-1}>Report location</h2>
            <p>{residentReport.context.postal_code ? `Postal ${residentReport.context.postal_code}` : "Selected map"}</p>
            <div className={styles.segmented} role="group" aria-label="Report location type">
              <button type="button" aria-pressed={residentReport.mode === "point"} onClick={() => changeReportMode("point")}>Point</button>
              <button type="button" aria-pressed={residentReport.mode === "section"} onClick={() => changeReportMode("section")}>Section</button>
            </div>
            <p role="status">{residentReport.points.length === 0 ? "No location selected." : `${residentReport.points.length} selected ${residentReport.points.length === 1 ? "point" : "points"}.`}</p>
            {residentReport.error && <p role="alert">{residentReport.error}</p>}
            <div className={styles.walkActions}>
              {residentReport.mode === "point" && residentReport.postalPoint && <button type="button" className={styles.sheetToggle}
                disabled={!reportSelectionCurrent} onClick={() => { if (residentReport.postalPoint) addReportPoint(residentReport.postalPoint); }}>Use postal location</button>}
              <button type="button" className={styles.sheetToggle} disabled={residentReport.points.length === 0} onClick={() => {
                const current = reportRef.current;
                if (current?.id !== residentReport.id || current.stage !== "selecting") return;
                updateResidentReport({ ...current, points: current.points.slice(0, -1), error: null });
              }}>Undo point</button>
              <button type="button" className={styles.sheetToggle} disabled={!validResidentReportLocation(residentReport)} onClick={composeResidentReport}>Continue report</button>
              <button type="button" className={styles.sheetToggle} onClick={() => {
                if (reportRef.current?.id === residentReport.id && leaveResidentReport()) restoreReportFocus.current = true;
              }}>Cancel report</button>
            </div>
          </> : <ReportComposer key={residentReport.id} geometry={residentReportGeometry(residentReport.points, residentReport.mode)}
            context={residentReport.context} bundleVersion={residentReport.bundleVersion} enabled={false}
            onClose={closeResidentReport}
            onUnsavedChange={value => { if (reportRef.current?.id === residentReport.id) reportUnsaved.current = value; }}
            onPhaseChange={phase => { if (reportRef.current?.id === residentReport.id) reportPhase.current = phase; }} />}
        </aside>}
      </div>

    </main>
  );
}
