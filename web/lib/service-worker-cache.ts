let serviceWorkerRegistrationRequested = false;

export function requestServiceWorkerCache() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;
  if (serviceWorkerRegistrationRequested) return;
  serviceWorkerRegistrationRequested = true;

  navigator.serviceWorker
    .getRegistration("/")
    .then((registration) => {
      if (registration) return registration;
      return navigator.serviceWorker.register("/sw.js");
    })
    .catch(() => {
      // Quota relief is opportunistic; the app must work without SW support.
    });
}
