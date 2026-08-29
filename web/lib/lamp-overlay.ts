export const DEFAULT_LAMP_OVERLAY_BASE = "/data/lamp_posts_v1/";
export const LAMP_OVERLAY_BASE = normalizeLampOverlayBase(
  process.env.NEXT_PUBLIC_LAMP_OVERLAY_BASE
);

const LAMP_OVERLAY_FETCH_OPTIONS: RequestInit = { cache: "force-cache" };
const _lampJsonCache = new Map<string, unknown>();
const _lampJsonInFlight = new Map<string, Promise<unknown>>();

export interface LampBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface LampTileIndex {
  cell: string;
  path: string;
  count: number;
  bytes: number;
  bbox: [number, number, number, number] | null;
}

export interface LampOverlayManifest {
  schema_version: number;
  generated_at: string;
  source: {
    path: string;
    sha256: string;
    bytes: number;
  };
  h3_resolution: number;
  point_count: number;
  skipped_feature_count: number;
  tile_count: number;
  tile_bytes: number;
  bbox: [number, number, number, number] | null;
  tiles: LampTileIndex[];
}

export interface LampTilePayload {
  cell: string;
  points: Array<[number, number]>;
}

export interface LampPointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: Record<string, string | number>;
}

export interface LampPointFeatureCollection {
  type: "FeatureCollection";
  features: LampPointFeature[];
}

export function normalizeLampOverlayBase(value?: string): string {
  const raw = value?.trim();
  if (!raw) return DEFAULT_LAMP_OVERLAY_BASE;
  const withLeadingSlash =
    raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")
      ? raw
      : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function lampOverlayUrl(path: string, base = LAMP_OVERLAY_BASE): string {
  const normalizedBase = normalizeLampOverlayBase(base);
  return `${normalizedBase}${path}`;
}

async function fetchLampJson<T>(path: string, base = LAMP_OVERLAY_BASE): Promise<T | null> {
  const url = lampOverlayUrl(path, base);
  if (_lampJsonCache.has(url)) return _lampJsonCache.get(url) as T;

  const pending = _lampJsonInFlight.get(url);
  if (pending) return pending as Promise<T | null>;

  const request = (async () => {
    const res = await fetch(url, LAMP_OVERLAY_FETCH_OPTIONS);
    if (!res.ok) return null;
    const payload = (await res.json()) as T;
    _lampJsonCache.set(url, payload);
    return payload;
  })();
  _lampJsonInFlight.set(url, request);
  try {
    return await request;
  } finally {
    _lampJsonInFlight.delete(url);
  }
}

function validBbox(value: unknown): value is [number, number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function normalizeManifest(payload: LampOverlayManifest): LampOverlayManifest {
  return {
    ...payload,
    bbox: validBbox(payload.bbox) ? payload.bbox : null,
    tiles: Array.isArray(payload.tiles)
      ? payload.tiles
          .filter((tile) => typeof tile.cell === "string" && typeof tile.path === "string")
          .map((tile) => ({
            ...tile,
            bbox: validBbox(tile.bbox) ? tile.bbox : null,
          }))
      : [],
  };
}

export async function fetchLampOverlayManifest(
  base = LAMP_OVERLAY_BASE
): Promise<LampOverlayManifest | null> {
  try {
    const payload = await fetchLampJson<LampOverlayManifest>("manifest.json", base);
    if (!payload) return null;
    return normalizeManifest(payload);
  } catch {
    return null;
  }
}

function bboxIntersectsBounds(
  bbox: [number, number, number, number],
  bounds: LampBounds
): boolean {
  const [west, south, east, north] = bbox;
  const latIntersects = north >= bounds.south && south <= bounds.north;
  const lngIntersects =
    bounds.west <= bounds.east
      ? east >= bounds.west && west <= bounds.east
      : east >= bounds.west || west <= bounds.east;
  return latIntersects && lngIntersects;
}

export function tilesForBounds(
  manifest: LampOverlayManifest,
  bounds: LampBounds
): LampTileIndex[] {
  return manifest.tiles
    .filter((tile) => tile.bbox !== null && bboxIntersectsBounds(tile.bbox, bounds))
    .sort((a, b) => a.cell.localeCompare(b.cell));
}

async function fetchLampTile(
  tile: LampTileIndex,
  base = LAMP_OVERLAY_BASE
): Promise<LampTilePayload | null> {
  try {
    const payload = await fetchLampJson<LampTilePayload>(tile.path, base);
    if (!payload) return null;
    if (payload.cell !== tile.cell || !Array.isArray(payload.points)) return null;
    return {
      cell: payload.cell,
      points: payload.points.filter(
        (point): point is [number, number] =>
          Array.isArray(point) &&
          point.length >= 2 &&
          typeof point[0] === "number" &&
          Number.isFinite(point[0]) &&
          typeof point[1] === "number" &&
          Number.isFinite(point[1])
      ),
    };
  } catch {
    return null;
  }
}

export async function fetchLampTiles(
  tiles: LampTileIndex[],
  base = LAMP_OVERLAY_BASE
): Promise<LampTilePayload[]> {
  const payloads = await Promise.all(tiles.map((tile) => fetchLampTile(tile, base)));
  return payloads.filter((payload): payload is LampTilePayload => payload !== null);
}

export function lampTilesToFeatureCollection(
  tiles: LampTilePayload[]
): LampPointFeatureCollection {
  return {
    type: "FeatureCollection",
    features: tiles.flatMap((tile) =>
      tile.points.map((coordinates, index) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates,
        },
        properties: {
          kind: "lamp_post",
          cell: tile.cell,
          index,
        },
      }))
    ),
  };
}
