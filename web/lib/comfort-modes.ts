import type { Subscores } from "./types";

export type ComfortMode = "balanced" | "rain_cover" | "heat_moderate" | "heat_high";

export type ComfortModeConfig = {
  id: ComfortMode;
  label: string;
  status: string;
  weights: Record<keyof Subscores, number> | null;
};

export const COMFORT_MODES: ComfortModeConfig[] = [
  {
    id: "balanced",
    label: "Balanced",
    status: "Balanced scoring with scheduled buses",
    weights: null,
  },
  {
    id: "rain_cover",
    label: "Rain cover",
    status: "Rain cover gives shelter more weight",
    weights: { access: 0.3, bus: 0.25, rain: 0.3, heat: 0.1, crossing: 0.05 },
  },
  {
    id: "heat_moderate",
    label: "Moderate heat weight",
    status:
      "Heat counts for 35% of the score; heat evidence uses a greenery proxy, not measured shade.",
    weights: { access: 0.3, bus: 0.2, rain: 0.1, heat: 0.35, crossing: 0.05 },
  },
  {
    id: "heat_high",
    label: "High heat weight",
    status:
      "Heat counts for 45% of the score; heat evidence uses a greenery proxy, not measured shade.",
    weights: { access: 0.3, bus: 0.15, rain: 0.05, heat: 0.45, crossing: 0.05 },
  },
];

const COMFORT_MODE_IDS = new Set<string>(COMFORT_MODES.map((mode) => mode.id));

const LEGACY_COMFORT_MODE_ALIASES: Record<string, ComfortMode> = {
  rain_am: "rain_cover",
  rain_pm: "rain_cover",
  sunny_am: "heat_moderate",
  sunny_pm: "heat_moderate",
  sunny_midday: "heat_high",
};

export function normalizeComfortMode(value: string): ComfortMode {
  if (COMFORT_MODE_IDS.has(value)) {
    return value as ComfortMode;
  }

  return LEGACY_COMFORT_MODE_ALIASES[value] ?? "balanced";
}

export function comfortModeStatus(mode: ComfortMode): string {
  return COMFORT_MODES.find((item) => item.id === mode)?.status ?? COMFORT_MODES[0].status;
}
