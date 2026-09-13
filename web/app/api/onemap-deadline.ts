export const ONEMAP_REQUEST_TIMEOUT_MS = 10_000;
export const ONEMAP_NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

export class OneMapRequestEnded extends Error {
  constructor(readonly code: "provider_timeout" | "request_cancelled") {
    super(code === "provider_timeout" ? "OneMap request timed out" : "Request cancelled");
  }

  get status() { return this.code === "provider_timeout" ? 504 : 499; }
}

export async function withOneMapDeadline<T>(
  caller: AbortSignal,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  if (caller.aborted) throw new OneMapRequestEnded("request_cancelled");
  const controller = new AbortController();
  let reject!: (reason: OneMapRequestEnded) => void;
  const ended = new Promise<never>((_, fail) => { reject = fail; });
  const end = (code: "provider_timeout" | "request_cancelled") => {
    if (controller.signal.aborted) return;
    const error = new OneMapRequestEnded(code);
    reject(error);
    controller.abort(error);
  };
  const onDisconnect = () => end("request_cancelled");
  caller.addEventListener("abort", onDisconnect, { once: true });
  // One budget includes authentication, retry and body consumption, even if a transport ignores abort.
  const timer = setTimeout(() => end("provider_timeout"), ONEMAP_REQUEST_TIMEOUT_MS);
  try {
    return await Promise.race([ended, operation(controller.signal)]);
  } finally {
    clearTimeout(timer);
    caller.removeEventListener("abort", onDisconnect);
  }
}
