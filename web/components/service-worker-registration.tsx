"use client";

import { useEffect } from "react";
import { ENABLE_SERVICE_WORKER_CACHE_EVENT } from "../lib/service-worker-cache";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    let registered = false;

    const register = () => {
      if (registered) return;
      registered = true;
      navigator.serviceWorker
        .getRegistration("/")
        .then((registration) => {
          if (registration) return registration;
          return navigator.serviceWorker.register("/sw.js");
        })
        .catch(() => {
          // Quota relief is opportunistic; the app must work without SW support.
        });
    };

    window.addEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register);
    return () => window.removeEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register);
  }, []);

  return null;
}
