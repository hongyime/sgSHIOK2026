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

const CACHE_PREFIX = "shiok:onemap-search:v1:";
const MIN_FREE_TEXT_LENGTH = 3;

export function normalizeOneMapSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toUpperCase();
}

export function shouldQueryOneMap(query: string): boolean {
  return normalizeOneMapSearchQuery(query).length >= MIN_FREE_TEXT_LENGTH;
}

function readSessionCache(storage: StorageLike | null, key: string): OneMapSearchPayload | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OneMapSearchPayload;
    return {
      found: Number(parsed.found || 0),
      results: Array.isArray(parsed.results) ? parsed.results : [],
    };
  } catch {
    return null;
  }
}

function writeSessionCache(storage: StorageLike | null, key: string, payload: OneMapSearchPayload): void {
  if (!storage) return;
  try {
    storage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch {
    // Browser storage can be unavailable or full; in-memory cache still applies.
  }
}

export function createOneMapSearchClient(options?: {
  fetcher?: Fetcher;
  storage?: StorageLike | null;
}) {
  const fetcher = options?.fetcher ?? fetch;
  const memoryCache = new Map<string, OneMapSearchPayload>();
  const inFlight = new Map<string, Promise<OneMapSearchPayload>>();
  const storage =
    options && "storage" in options
      ? options.storage ?? null
      : typeof sessionStorage === "undefined"
        ? null
        : sessionStorage;

  async function search(query: string): Promise<OneMapSearchPayload> {
    const key = normalizeOneMapSearchQuery(query);
    if (!shouldQueryOneMap(key)) {
      return { found: 0, results: [] };
    }

    const cached = memoryCache.get(key) ?? readSessionCache(storage, key);
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
      writeSessionCache(storage, key, payload);
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
