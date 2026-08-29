export interface SearchResult {
  BUILDING: string;
  ROAD_NAME: string;
  POSTAL: string;
  LATITUDE: string;
  LONGITUDE: string;
  SEARCHVAL: string;
}

export interface OneMapSearchPayload {
  found: number;
  results: SearchResult[];
}

export class OneMapSearchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OneMapSearchError";
    this.status = status;
  }
}

type Fetcher = typeof fetch;
type StorageLike = Pick<Storage, "getItem" | "setItem">;

const CACHE_PREFIX = "shiok:onemap-search:v2:";
const STORAGE_TTL_MS = 604_800_000;
const STORAGE_MAX_ENTRIES = 50;
const MIN_FREE_TEXT_LENGTH = 3;

export function normalizeOneMapSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toUpperCase();
}

export function shouldQueryOneMap(query: string): boolean {
  return normalizeOneMapSearchQuery(query).length >= MIN_FREE_TEXT_LENGTH;
}

function parsePayload(value: unknown): OneMapSearchPayload {
  const payload = value as Partial<OneMapSearchPayload>;
  return {
    found: Number(payload.found || 0),
    results: Array.isArray(payload.results) ? payload.results : [],
  };
}

function readStoredCache(
  storage: StorageLike | null,
  key: string,
  nowMs: number = Date.now(),
): OneMapSearchPayload | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { cached_at?: unknown; payload?: unknown };
    const cachedAt = Number(parsed.cached_at);
    if (!Number.isFinite(cachedAt) || nowMs - cachedAt > STORAGE_TTL_MS) return null;
    return parsePayload(parsed.payload);
  } catch {
    return null;
  }
}

function pruneStoredCache(
  storage: StorageLike | null,
  nowMs: number = Date.now(),
  maxEntries: number = STORAGE_MAX_ENTRIES,
): void {
  if (!storage || !("length" in storage) || !("key" in storage) || !("removeItem" in storage)) return;
  const fullStorage = storage as Storage;
  const entries: Array<{ key: string; cachedAt: number }> = [];

  for (let index = 0; index < fullStorage.length; index += 1) {
    const key = fullStorage.key(index);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(fullStorage.getItem(key) || "{}") as { cached_at?: unknown };
      const cachedAt = Number(parsed.cached_at);
      if (!Number.isFinite(cachedAt) || nowMs - cachedAt > STORAGE_TTL_MS) {
        fullStorage.removeItem(key);
        index -= 1;
        continue;
      }
      entries.push({ key, cachedAt });
    } catch {
      fullStorage.removeItem(key);
      index -= 1;
    }
  }

  entries
    .sort((a, b) => b.cachedAt - a.cachedAt)
    .slice(maxEntries)
    .forEach((entry) => fullStorage.removeItem(entry.key));
}

function writeStoredCache(
  storage: StorageLike | null,
  key: string,
  payload: OneMapSearchPayload,
  nowMs: number = Date.now(),
): void {
  if (!storage) return;
  try {
    pruneStoredCache(storage, nowMs, STORAGE_MAX_ENTRIES - 1);
    storage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ cached_at: nowMs, payload }));
  } catch {
    try {
      pruneStoredCache(storage, nowMs, STORAGE_MAX_ENTRIES - 1);
      storage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ cached_at: nowMs, payload }));
    } catch {
      // Browser storage can be unavailable or full; in-memory cache still applies.
    }
  }
}

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage) return window.localStorage;
  } catch {
    // Some privacy modes expose Storage but reject access.
  }
  try {
    if (window.sessionStorage) return window.sessionStorage;
  } catch {
    // Search still works with memory-only caching.
  }
  return null;
}

export function createOneMapSearchClient(options?: {
  fetcher?: Fetcher;
  storage?: StorageLike | null;
  nowMs?: () => number;
}) {
  const fetcher = options?.fetcher ?? fetch;
  const nowMs = options?.nowMs ?? Date.now;
  const memoryCache = new Map<string, OneMapSearchPayload>();
  const inFlight = new Map<string, Promise<OneMapSearchPayload>>();
  const storage = options && "storage" in options ? options.storage ?? null : defaultStorage();

  async function search(query: string): Promise<OneMapSearchPayload> {
    const key = normalizeOneMapSearchQuery(query);
    if (!shouldQueryOneMap(key)) {
      return { found: 0, results: [] };
    }

    const cached = memoryCache.get(key) ?? readStoredCache(storage, key, nowMs());
    if (cached) {
      memoryCache.set(key, cached);
      return cached;
    }

    const pending = inFlight.get(key);
    if (pending) return pending;

    const request = (async () => {
      const res = await fetcher(`/api/onemap-search?searchVal=${encodeURIComponent(key)}`);
      if (!res.ok) {
        throw new OneMapSearchError(res.status, `Search failed with status ${res.status}`);
      }
      const data = (await res.json()) as OneMapSearchPayload;
      const payload = {
        found: Number(data.found || 0),
        results: Array.isArray(data.results) ? data.results : [],
      };
      memoryCache.set(key, payload);
      writeStoredCache(storage, key, payload, nowMs());
      return payload;
    })();

    inFlight.set(key, request);
    try {
      return await request;
    } finally {
      inFlight.delete(key);
    }
  }

  return { search };
}

const defaultClient = createOneMapSearchClient();

export function searchOneMapLocations(query: string): Promise<OneMapSearchPayload> {
  return defaultClient.search(query);
}
