export const ENABLE_SERVICE_WORKER_CACHE_EVENT = "shiok:enable-service-worker-cache";

export function requestServiceWorkerCache() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ENABLE_SERVICE_WORKER_CACHE_EVENT));
}
