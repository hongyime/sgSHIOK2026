/**
 * DATA ACCESS MODULE
 * Defaults to the pinned published static shelter-map bundle in web/data-bundle.json.
 */
import dataBundle from "../data-bundle.json";
import type { ScoreRecord, PostalGeom, Manifest, TransitPoiCollection } from "./types";
import type { RankableScoreRecord } from "./subscore-ranking";
import { gridDisk, latLngToCell } from "h3-js";
import { decodePolyline } from "./polyline";

export const DEFAULT_DATA_BASE = `/data/${dataBundle.bundle}/`;
export const PINNED_DATA_MANIFEST: Manifest = {
  generated_at: dataBundle.generated_at,
  data_as_of: dataBundle.data_as_of,
  provenance: dataBundle.provenance,
};

export function normalizeDataBase(value?: string): string {
  const raw = value?.trim();
  if (!raw) {
    return DEFAULT_DATA_BASE;
  }
  const withLeadingSlash =
    raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")
      ? raw
      : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export const DATA_BASE = normalizeDataBase(process.env.NEXT_PUBLIC_DATA_BASE);

type GeomIndex = Record<string, string[]>;
type GeomPostalIndex = Record<string, string>;
type ScorePrefixIndex = Record<string, string[]>;
const DATA_FETCH_OPTIONS: RequestInit = { cache: "force-cache" };
const _jsonInFlight = new Map<string, Promise<unknown>>();

function dataUrl(path: string): string {
  return `${DATA_BASE}${path}`;
}

function hasCompressedArtifact(path: string): boolean {
  if (
    path === "manifest.json" ||
    path === "scores/index.json" ||
    path === "geom/index.json" ||
    path === "geom/postal-index.json"
  ) {
    return true;
  }
  return (
    /^geom\/postal-prefix\/[^/]+\.json$/.test(path) ||
    /^transit\/h3\/[^/]+\.json$/.test(path)
  );
}

function compressedOnlyArtifact(path: string): boolean {
  return /^transit\/h3\/[^/]+\.json$/.test(path);
}

async function decodeJsonResponse<T>(res: Response, path: string): Promise<T> {
  const contentEncoding = res.headers?.get("content-encoding") ?? "";
  if (path.endsWith(".gz") && !contentEncoding.toLowerCase().includes("gzip")) {
    if (!res.body || typeof DecompressionStream === "undefined") {
      throw new Error(`gzip data fetch is unsupported for ${path}`);
    }
    const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).json() as Promise<T>;
  }
  return res.json() as Promise<T>;
}

async function fetchJson<T>(path: string): Promise<T> {
  const pending = _jsonInFlight.get(path);
  if (pending) return pending as Promise<T>;

  const request = (async () => {
    if (hasCompressedArtifact(path)) {
      const gzPath = `${path}.gz`;
      const gzRes = await fetch(dataUrl(gzPath), DATA_FETCH_OPTIONS);
      if (gzRes.ok) return decodeJsonResponse<T>(gzRes, gzPath);
      if (compressedOnlyArtifact(path)) {
        throw new Error(`${gzPath} fetch failed: ${gzRes.status}`);
      }
    }

    const res = await fetch(dataUrl(path), DATA_FETCH_OPTIONS);
    if (!res.ok) throw new Error(`${path} fetch failed: ${res.status}`);
    return decodeJsonResponse<T>(res, path);
  })();
  _jsonInFlight.set(path, request);
  try {
    return await request;
  } finally {
    _jsonInFlight.delete(path);
  }
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------
export async function fetchManifest(): Promise<Manifest> {
  if (_manifest) return _manifest;
  if (!_manifestPromise) {
    _manifestPromise = fetchJson<Manifest>("manifest.json")
      .then((manifest) => {
        _manifest = manifest;
        return manifest;
      })
      .finally(() => {
        _manifestPromise = null;
      });
  }
  return _manifestPromise;
}

export async function fetchTransitPois(): Promise<TransitPoiCollection> {
  if (_transitPois) return _transitPois;
  try {
    const payload = await fetchJson<TransitPoiCollection>("transit/pois.json");
    _transitPois = {
      type: "FeatureCollection",
      features: Array.isArray(payload.features) ? payload.features : [],
      provenance: payload.provenance,
    };
    return _transitPois;
  } catch {
    _transitPois = { type: "FeatureCollection", features: [] };
    return _transitPois;
  }
}

// ---------------------------------------------------------------------------
// Score records
// The pipeline shards scores by planning-area into files named by planning
// area slug (e.g. "ANG_MO_KIO.json"). fetchScoreForPostal uses prefix indexes
// first, then falls back to the full area-to-postals index for older bundles.
// ---------------------------------------------------------------------------

/** Area-index maps area-slug → [postal, …] so we can look up which file to fetch. */
let _areaIndex: Record<string, string[]> | null = null;
let _manifest: Manifest | null = null;
let _manifestPromise: Promise<Manifest> | null = null;
let _scorePrefixIndex: ScorePrefixIndex | null | undefined;
let _geomIndex: GeomIndex | null = null;
let _geomPostalIndex: GeomPostalIndex | null = null;
const _geomPostalPrefixIndexes = new Map<string, GeomPostalIndex | null>();
const _geomShards = new Map<string, PostalGeom[] | null>();
let _transitPois: TransitPoiCollection | null = null;
const _transitPoiShards = new Map<string, TransitPoiCollection | null>();
const _scoreAreaRecords = new Map<string, ScoreRecord[]>();

async function getAreaIndex(): Promise<Record<string, string[]>> {
  if (_areaIndex) return _areaIndex;
  _areaIndex = await fetchJson<Record<string, string[]>>("scores/index.json");
  return _areaIndex!;
}

async function getScorePrefixIndex(): Promise<ScorePrefixIndex | null> {
  if (_scorePrefixIndex !== undefined) return _scorePrefixIndex;
  try {
    _scorePrefixIndex = await fetchJson<ScorePrefixIndex>("scores/prefix-index.json");
  } catch {
    _scorePrefixIndex = null;
  }
  return _scorePrefixIndex;
}

async function fetchAreaRecords(areaSlug: string): Promise<ScoreRecord[]> {
  const cached = _scoreAreaRecords.get(areaSlug);
  if (cached) return cached;
  const records = await fetchJson<ScoreRecord[]>(`scores/${areaSlug}.json`);
  _scoreAreaRecords.set(areaSlug, records);
  return records;
}

function scoreAreaBase(areaSlug: string): string {
  return areaSlug.replace(/_PART_\d+$/, "");
}

async function scoreShardsForPostal(postal: string): Promise<string[]> {
  const tried = new Set<string>();
  const prefixIndex = await getScorePrefixIndex();
  for (const shard of prefixIndex?.[postal.slice(0, 3)] ?? []) {
    tried.add(shard);
    const records = await fetchAreaRecords(shard);
    if (records.some((r) => r.postal === postal)) {
      return [shard];
    }
  }

  const index = await getAreaIndex();
  for (const [slug, postals] of Object.entries(index)) {
    if (tried.has(slug)) continue;
    if (postals.includes(postal)) return [slug];
  }
  return [];
}

export async function fetchScoreForPostal(
  postal: string
): Promise<ScoreRecord | null> {
  const primaryShards = await scoreShardsForPostal(postal);
  for (const shard of primaryShards) {
    const records = await fetchAreaRecords(shard);
    const match = records.find((r) => r.postal === postal);
    if (match) return match;
  }

  return null;
}

function rankableScoreRecord(record: ScoreRecord): RankableScoreRecord {
  return {
    postal: record.postal,
    total: record.total,
    subscores: record.subscores,
  };
}

async function fetchAreaRankRecords(areaSlug: string): Promise<RankableScoreRecord[]> {
  const records = await fetchAreaRecords(areaSlug);
  return records.map(rankableScoreRecord);
}

export async function fetchRankRecordsForPostalArea(postal: string): Promise<RankableScoreRecord[]> {
  const primaryShards = await scoreShardsForPostal(postal);
  if (primaryShards.length === 0) return [];
  const base = scoreAreaBase(primaryShards[0]);
  const index = await getAreaIndex();
  const areaShards = Object.keys(index).filter(
    (slug) => slug === base || slug.startsWith(`${base}_PART_`)
  );
  const shards = areaShards.length > 0 ? areaShards.sort() : primaryShards;
  const records = await Promise.all(shards.map(fetchAreaRankRecords));
  return records.flat();
}

async function getGeomIndex(): Promise<GeomIndex | null> {
  if (_geomIndex) return _geomIndex;
  try {
    _geomIndex = await fetchJson<GeomIndex>("geom/index.json");
    return _geomIndex;
  } catch {
    return null;
  }
}

async function getGeomPostalIndex(): Promise<GeomPostalIndex | null> {
  if (_geomPostalIndex) return _geomPostalIndex;
  try {
    _geomPostalIndex = await fetchJson<GeomPostalIndex>("geom/postal-index.json");
    return _geomPostalIndex;
  } catch {
    return null;
  }
}

async function getGeomPostalPrefixIndex(prefix: string): Promise<GeomPostalIndex | null> {
  if (_geomPostalPrefixIndexes.has(prefix)) return _geomPostalPrefixIndexes.get(prefix)!;
  try {
    const payload = await fetchJson<GeomPostalIndex>(`geom/postal-prefix/${prefix}.json`);
    _geomPostalPrefixIndexes.set(prefix, payload);
    return payload;
  } catch {
    _geomPostalPrefixIndexes.set(prefix, null);
    return null;
  }
}

async function fetchGeomShard(shardId: string): Promise<PostalGeom[] | null> {
  if (_geomShards.has(shardId)) return _geomShards.get(shardId)!;
  try {
    const records = await fetchJson<PostalGeom[]>(`geom/h3/${shardId}.json`);
    _geomShards.set(shardId, records);
    return records;
  } catch {
    _geomShards.set(shardId, null);
    return null;
  }
}

async function fetchGeomByLatLng(
  postal: string,
  lat: number,
  lng: number
): Promise<PostalGeom | null> {
  const cell = latLngToCell(lat, lng, 8);
  const parentRecords = await fetchGeomShard(cell);
  const parentMatch = parentRecords?.find((r) => r.postal === postal);
  if (parentMatch) return parentMatch;

  const index = await getGeomIndex();
  for (const child of index?.[cell] ?? []) {
    const childRecords = await fetchGeomShard(child);
    const childMatch = childRecords?.find((r) => r.postal === postal);
    if (childMatch) return childMatch;
  }

  if (!parentRecords && !(index?.[cell]?.length)) {
    console.warn(`geom shard not found for cell ${cell} (postal ${postal})`);
  }
  return null;
}

async function fetchGeomByPostalIndex(postal: string): Promise<PostalGeom | null> {
  const prefixIndex = await getGeomPostalPrefixIndex(postal.slice(0, 3));
  const prefixShard = prefixIndex?.[postal];
  if (prefixShard) {
    const records = await fetchGeomShard(prefixShard);
    const match = records?.find((r) => r.postal === postal);
    if (match) return match;
  }

  const postalIndex = await getGeomPostalIndex();
  const indexedShard = postalIndex?.[postal];
  if (indexedShard) {
    const records = await fetchGeomShard(indexedShard);
    const match = records?.find((r) => r.postal === postal);
    if (match) return match;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Geometry
// The client resolves which H3 res-8 shard to fetch using the postal's lat/lng
// (supplied from the OneMap search result).  geom/h3/{cell}.json holds an
// array of PostalGeom for all postals in that cell.
// ---------------------------------------------------------------------------
export async function fetchGeomForPostal(
  postal: string,
  lat?: number,
  lng?: number
): Promise<PostalGeom | null> {
  const indexedMatch = await fetchGeomByPostalIndex(postal);
  if (indexedMatch) return indexedMatch;

  if (typeof lat === "number" && typeof lng === "number") {
    const latLngMatch = await fetchGeomByLatLng(postal, lat, lng);
    if (latLngMatch) return latLngMatch;
  }

  return null;
}

function emptyTransitPois(): TransitPoiCollection {
  return { type: "FeatureCollection", features: [] };
}

function addRouteCells(cells: Set<string>, encoded: string | undefined) {
  if (!encoded) return;
  for (const [lat, lng] of decodePolyline(encoded)) {
    const cell = latLngToCell(lat, lng, 8);
    for (const nearby of gridDisk(cell, 1)) {
      cells.add(nearby);
    }
  }
}

function transitCellsForGeom(geom: PostalGeom | null): string[] {
  if (!geom) return [];
  const cells = new Set<string>();
  for (const encoded of geom.shortest_parts?.length ? geom.shortest_parts : [geom.shortest]) {
    addRouteCells(cells, encoded);
  }
  for (const encoded of geom.sheltered_parts?.length ? geom.sheltered_parts : [geom.sheltered]) {
    addRouteCells(cells, encoded);
  }
  for (const gap of geom.exposure_gaps || []) {
    addRouteCells(cells, gap.geom);
  }
  return Array.from(cells).sort();
}

async function fetchTransitPoiShard(cell: string): Promise<TransitPoiCollection | null> {
  if (_transitPoiShards.has(cell)) return _transitPoiShards.get(cell)!;
  try {
    const payload = await fetchJson<TransitPoiCollection>(`transit/h3/${cell}.json`);
    _transitPoiShards.set(cell, payload);
    return payload;
  } catch {
    _transitPoiShards.set(cell, null);
    return null;
  }
}

export async function fetchTransitPoisForGeom(
  geom: PostalGeom | null
): Promise<TransitPoiCollection> {
  const cells = transitCellsForGeom(geom);
  if (cells.length === 0) return emptyTransitPois();

  const shards = await Promise.all(cells.map(fetchTransitPoiShard));
  const seen = new Set<string>();
  const features = [];
  for (const shard of shards) {
    for (const feature of shard?.features || []) {
      const coordinates = feature.geometry?.coordinates?.join(",") || "";
      const key = `${feature.properties?.kind}:${feature.properties?.id}:${coordinates}`;
      if (seen.has(key)) continue;
      seen.add(key);
      features.push(feature);
    }
  }

  return { type: "FeatureCollection", features };
}
