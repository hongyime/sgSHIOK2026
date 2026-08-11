import { describe, expect, it } from "vitest";

import { COMFORT_MODES, normalizeComfortMode } from "../comfort-modes";
import type { Subscores } from "../types";

const SCORE_KEYS = ["access", "bus", "rain", "heat", "crossing"] as const;
const SAMPLE_SUBSCORES: Subscores = { access: 82, bus: 61, rain: 47, heat: 73, crossing: 91 };

const LEGACY_MODE_WEIGHTS = {
  rain_am: { access: 0.3, bus: 0.25, rain: 0.3, heat: 0.1, crossing: 0.05 },
  rain_pm: { access: 0.3, bus: 0.25, rain: 0.3, heat: 0.1, crossing: 0.05 },
  sunny_am: { access: 0.3, bus: 0.2, rain: 0.1, heat: 0.35, crossing: 0.05 },
  sunny_pm: { access: 0.3, bus: 0.2, rain: 0.1, heat: 0.35, crossing: 0.05 },
  sunny_midday: { access: 0.3, bus: 0.15, rain: 0.05, heat: 0.45, crossing: 0.05 },
} satisfies Record<string, NonNullable<(typeof COMFORT_MODES)[number]["weights"]>>;

function signature(weights: (typeof COMFORT_MODES)[number]["weights"]): string {
  if (!weights) return "baseline";
  return SCORE_KEYS.map((key) => `${key}:${weights[key]}`).join("|");
}

function compositeWithWeights(weights: NonNullable<(typeof COMFORT_MODES)[number]["weights"]>): number {
  return SCORE_KEYS.reduce((sum, key) => sum + SAMPLE_SUBSCORES[key] * weights[key], 0);
}

describe("comfort modes", () => {
  it("ships only distinct weighting vectors", () => {
    const signatures = COMFORT_MODES.map((mode) => signature(mode.weights));

    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("keeps every weighted mode normalized to 1.0", () => {
    for (const mode of COMFORT_MODES) {
      if (!mode.weights) continue;
      const total = SCORE_KEYS.reduce((sum, key) => sum + mode.weights![key], 0);

      expect(total).toBeCloseTo(1.0, 10);
    }
  });

  it("aliases legacy mode identifiers to their equivalent shipped modes", () => {
    expect(normalizeComfortMode("rain_am")).toBe("rain_cover");
    expect(normalizeComfortMode("rain_pm")).toBe("rain_cover");
    expect(normalizeComfortMode("sunny_am")).toBe("heat_moderate");
    expect(normalizeComfortMode("sunny_pm")).toBe("heat_moderate");
    expect(normalizeComfortMode("sunny_midday")).toBe("heat_high");
  });

  it("falls back to balanced only for unrecognized mode identifiers", () => {
    expect(normalizeComfortMode("unknown")).toBe("balanced");
  });

  it("preserves legacy composite scores through aliases", () => {
    for (const [legacyId, legacyWeights] of Object.entries(LEGACY_MODE_WEIGHTS)) {
      const resolvedMode = COMFORT_MODES.find((mode) => mode.id === normalizeComfortMode(legacyId));

      expect(resolvedMode?.weights).not.toBeNull();
      expect(compositeWithWeights(resolvedMode!.weights!)).toBeCloseTo(compositeWithWeights(legacyWeights), 10);
    }
  });

  it("preserves the old distinct weight vectors under honest labels", () => {
    expect(COMFORT_MODES.find((mode) => mode.id === "rain_cover")?.weights).toEqual({
      access: 0.3,
      bus: 0.25,
      rain: 0.3,
      heat: 0.1,
      crossing: 0.05,
    });
    expect(COMFORT_MODES.find((mode) => mode.id === "heat_moderate")?.weights).toEqual({
      access: 0.3,
      bus: 0.2,
      rain: 0.1,
      heat: 0.35,
      crossing: 0.05,
    });
    expect(COMFORT_MODES.find((mode) => mode.id === "heat_high")?.weights).toEqual({
      access: 0.3,
      bus: 0.15,
      rain: 0.05,
      heat: 0.45,
      crossing: 0.05,
    });
  });

  it("does not preserve unshipped interim mode identifiers", () => {
    expect(normalizeComfortMode("rain")).toBe("balanced");
    expect(normalizeComfortMode("sunny")).toBe("balanced");
    expect(normalizeComfortMode("heat_priority")).toBe("balanced");
  });
});
