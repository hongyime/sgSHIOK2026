"use client";

import { useEffect } from "react";
import { requestServiceWorkerCache } from "../lib/service-worker-cache";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    requestServiceWorkerCache();
  }, []);

  return null;
}
