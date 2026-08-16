import { readFileSync } from "fs";
import { join } from "path";

describe("route evidence map interactions", () => {
  it("does not refit map bounds when feedback points change", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");
    const fitEffect = source.match(/map\.fitBounds[\s\S]+?\}, \[loaded, routeData\.bounds, routeFitKey\]\);/)?.[0];

    expect(fitEffect).toBeTruthy();
    expect(fitEffect).not.toContain("feedback");
    expect(source).toContain('setSourceData(map, "feedback-route", feedbackData.route)');
    expect(source).toContain('setSourceData(map, "feedback-points", feedbackData.points)');
  });

  it("keeps route evidence and transit POIs visible on the subdued basemap", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");

    expect(source).toContain('"line-width": 6.8');
    expect(source).toContain('"line-width": 4.8');
    expect(source).toContain('minzoom: 9.8');
    expect(source).toContain('minzoom: 11.5');
    expect(source).toContain('TRANSIT_POI_HOT_PINK');
    expect(source).toContain('"lamp-posts"');
    expect(source).toContain('id: "lamp-post-dots"');
    expect(source).toContain("LAMP_OVERLAY_MIN_ZOOM");
    expect(source).toContain('setSourceData(map, "lamp-posts", lampData)');
    expect(source).toContain("nightLightingSummary(showLampOverlay, lampData.features.length)");
  });

  it("pre-fetches manifest on mount and wires interactive click-to-route in page.tsx", () => {
    const pageSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    // Cold-load manifest prefetch
    expect(pageSource).toContain("void fetchManifest().then");

    // Dynamic stop routing
    expect(pageSource).toContain("selectionForChosenStop");
    expect(pageSource).toContain("isCustomStopSelected");
    expect(pageSource).toContain("onResetChosenStop");
    expect(pageSource).toContain("resetCustomStopBtn");
    expect(pageSource).toContain("focusedExposureGap");
    expect(pageSource).toContain("onFocusExposureGap={setFocusedExposureGap}");
    expect(pageSource).toContain("onClick={() => onFocusExposureGap(focusTarget)}");
    expect(pageSource).toContain("const handleRouteModeChange = useCallback((mode: RouteDisplayMode) => {");
    expect(pageSource).toContain("setRouteMode={handleRouteModeChange}");
    expect(pageSource).toContain("lampOverlayEnabled");
    expect(pageSource).toContain("showLampOverlay={lampOverlayEnabled}");
    expect(pageSource).toContain("Night lighting");
    expect(pageSource).toContain("Shows LTA lamp post locations when zoomed in");
  });

  it("summarizes the night-lighting overlay for non-visual map users", async () => {
    const { nightLightingSummary } = await import("../../components/route-evidence-map");

    expect(nightLightingSummary(false, 12)).toBeNull();
    expect(nightLightingSummary(true, 0)).toBe(
      "Night lighting overlay is on; no lamp points are loaded in the current map view."
    );
    expect(nightLightingSummary(true, 1)).toBe("Night lighting overlay is on with 1 lamp point in view.");
    expect(nightLightingSummary(true, 14)).toBe("Night lighting overlay is on with 14 lamp points in view.");
  });

  it("centers the map when an exposed gap is focused from the score card", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");

    expect(source).toContain("focusedExposureGap?: FocusedExposureGap | null");
    expect(source).toContain("map.easeTo({");
    expect(source).toContain("center: [focusedExposureGap.lon, focusedExposureGap.lat]");
    expect(source).toContain("zoom: Math.max(map.getZoom(), 16.4)");
    expect(source).toContain('"active-exposure-gap"');
    expect(source).toContain('id: "active-exposure-gap-ring"');
    expect(source).toContain("activeExposureGapCollection(focusedExposureGap)");
    expect(source).toContain("coordinates: [focusedExposureGap.lon, focusedExposureGap.lat]");
    expect(source).toContain('setSourceData(map, "active-exposure-gap", activeGapData)');
  });

  it("clears a focused exposed gap when the selected route context changes", () => {
    const pageSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const routeModeHandler =
      pageSource.match(/const handleRouteModeChange = useCallback\(\(mode: RouteDisplayMode\) => \{[\s\S]+?\}, \[\]\);/)?.[0] ?? "";
    const transitModeHandler =
      pageSource.match(/const handleTransitModeChange = useCallback\(\(mode: TransitAccessMode\) => \{[\s\S]+?\}, \[\]\);/)?.[0] ?? "";
    const stopSelectHandler =
      pageSource.match(/const handleStopSelect = useCallback\([\s\S]+?\n  \);/)?.[0] ?? "";

    expect(routeModeHandler).toContain("setRouteMode(mode);");
    expect(routeModeHandler).toContain("setFocusedExposureGap(null);");
    expect(transitModeHandler).toContain("setTransitMode(mode);");
    expect(transitModeHandler).toContain("setChosenStopId(null);");
    expect(transitModeHandler).toContain("setFocusedExposureGap(null);");
    expect(stopSelectHandler).toContain("setChosenStopId(resolved);");
    expect(stopSelectHandler).toContain("setFocusedExposureGap(null);");
  });

  it("keeps arbitrary clicked OneMap routes preview-only and resettable", () => {
    const pageSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    const liveScoringSource = readFileSync(
      join(__dirname, "../../lib/live-route-scoring.ts"),
      "utf-8"
    );

    expect(liveScoringSource).toContain('state: "NOT_YET_SCORED"');
    expect(liveScoringSource).toContain("total: null");
    expect(liveScoringSource).toContain("subscores: null");
    expect(liveScoringSource).toContain('routing_type: "live_onemap_preview"');
    expect(liveScoringSource).toContain("authoritative_score: false");

    expect(pageSource).toContain("Preview route evidence only");
    expect(pageSource).toContain("Preview only: this clicked stop has route evidence");
    expect(pageSource).toContain('<Metric label="Preview walk" value={formatDistance(selectedDistance)} />');
    expect(pageSource).toContain('<Metric label="Sheltered evidence" value={formatPercent(selectedCoverage)} />');
    expect(pageSource).toContain('<Metric label="Score status" value="Not scored" />');
    expect(pageSource).toContain('previewRoute ? "Preview route" : "Covered route"');
    expect(pageSource).toContain("{score.paths && !previewRoute && (");
    expect(pageSource).toContain("{score.paths && previewRoute && (");
    expect(pageSource).toContain("{score.paths && !directBusFallback && !previewRoute && (");

    expect(pageSource).toContain("params.delete(\"stop\")");
    expect(pageSource).toContain("onResetChosenStop={() => handleStopSelect(null)}");
    expect(pageSource).toContain("const resolved = nextStopId && nextStopId !== bestCandidateId ? nextStopId : null");
  });

  it("keeps precomputed candidate geometry authoritative instead of demoting it to preview", () => {
    const pageSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");

    expect(pageSource).toContain("const candGeomOption = baseSelection.geom?.candidates?.[chosenStopId]");
    expect(pageSource).toContain("const candScore = baseSelection.score?.candidates?.find");
    expect(pageSource).toContain("if (candGeomOption && baseSelection.geom)");
    expect(pageSource).toContain('routing_type: candScore?.routing_type ?? "precomputed_candidate"');
    expect(pageSource.indexOf("if (candGeomOption && baseSelection.geom)")).toBeLessThan(
      pageSource.indexOf("Fallback: show route evidence only while OneMap loads in background")
    );
  });
});
