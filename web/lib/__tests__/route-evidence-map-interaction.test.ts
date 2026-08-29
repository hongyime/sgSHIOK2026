import { readFileSync } from "fs";
import { join } from "path";

describe("shelter map interactions", () => {
  it("does not refit map bounds when feedback points change", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");
    const fitEffect = source.match(/map\.fitBounds[\s\S]+?\}, \[loaded, routeData\.bounds, routeFitKey\]\);/)?.[0];

    expect(fitEffect).toBeTruthy();
    expect(fitEffect).not.toContain("feedback");
    expect(source).toContain('setSourceData(map, "feedback-route", feedbackData.route)');
    expect(source).toContain('setSourceData(map, "feedback-points", feedbackData.points)');
  });

  it("keeps shelter-map evidence and transit POIs visible on the subdued basemap", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");
    const cssSource = readFileSync(join(__dirname, "../../components/route-evidence-map.module.css"), "utf-8");
    const appCssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");

    expect(source).toContain('"line-width": 6.8');
    expect(source).toContain('"line-width": 4.8');
    expect(source).toContain('minzoom: 9.8');
    expect(source).toContain('minzoom: 11.5');
    expect(source).toContain('TRANSIT_POI_HOT_PINK');
    expect(source).toContain('const TRANSIT_POI_BUS_PURPLE = "#6f4c8b";');
    expect(source).toContain('"circle-color": TRANSIT_POI_BUS_PURPLE');
    expect(source).toContain('"text-color": "#4c3760"');
    expect(source).toContain('"lamp-posts"');
    expect(source).toContain('id: "lamp-post-dots"');
    expect(source).toContain("LAMP_OVERLAY_MIN_ZOOM");
    expect(source).toContain('setSourceData(map, "lamp-posts", lampData)');
    expect(source).toContain("nightLightingSummary(lampOverlayStatus, lampData.features.length)");
    expect(source).toContain("visibleLampOverlaySummary");
    expect(source).toContain("styles.lampOverlayStatus");
    expect(source).toContain('{visibleLampOverlaySummary && (');
    expect(cssSource).toContain(".lampOverlayStatus");
    expect(cssSource).toContain("max-width: min(88vw, 360px);");
    expect(appCssSource).toContain(".busDot {\n  background: #6f4c8b;");
  });

  it("uses sheltered walk copy in non-visual map summaries", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");

    expect(source).toContain('return "sheltered walk";');
    expect(source).toContain('return "shortest and sheltered walks";');
    expect(source).toContain("sheltered-walk segments");
    expect(source).toContain("shortest-walk segments");
    expect(source).toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit stops and exits, and the night-lighting map layer");
    expect(source).not.toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and the night-lighting map layer");
    expect(source).not.toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit stops, and night lighting evidence");
    expect(source).not.toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and night lighting evidence");
    expect(source).toContain("Singapore shelter-map view with ${poiText}.");
    expect(source).not.toContain("Singapore shelter map for covered-walkway ratio, exposed gaps, transit stops, and night lighting evidence");
    expect(source).not.toContain("Singapore map with ${poiText}.");
    expect(source).not.toContain("Singapore shelter map for covered-walkway ratio, exposed gaps, transit stops, and night-lighting evidence");
    expect(source).not.toContain("Singapore shelter map with MRT stations, LRT stations, bus stops, and night-lighting evidence");
    expect(source).not.toContain("Singapore shelter map with MRT stations, LRT stations, and bus stops");
    expect(source).toContain("Shelter-map view for ${labels}, showing ${routeModeLabel(mode)}");
    expect(source).toContain("Shelter-map view for ${routeLabels}.");
    expect(source).not.toContain("Shelter map for ${labels}, showing ${routeModeLabel(mode)}");
    expect(source).not.toContain("Shelter map for ${routeLabels}.");
    expect(source).toContain(
      "Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio and exposed gaps on the walk to a transit stop or exit, plus the night-lighting map layer.",
    );
    expect(source).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting on the walk to transit.");
    expect(source).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting near transit.");
    expect(source).not.toContain("Search for a postal code to show covered-walkway ratio, exposed gaps, night lighting, and nearby transit.");
    expect(source).not.toContain("Search a OneMap address or 6-digit postal code to show covered-walkway ratio, exposed gaps, night lighting, and nearby transit.");
    expect(source).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, night lighting, and nearby transit.");
    expect(source).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio and exposed gaps on the walk to transit, plus the night-lighting map layer.");
    expect(source).not.toContain("Singapore transit map with MRT stations, LRT stations, and bus stops");
    expect(source).not.toContain('return "sheltered route";');
    expect(source).not.toContain('return "shortest and sheltered routes";');
    expect(source).not.toContain("sheltered-route segments");
    expect(source).not.toContain("Route evidence for ${routeLabels}.");
    expect(source).not.toContain("Route evidence map for ${labels}, showing ${routeModeLabel(mode)}");
    expect(source).not.toContain("Search for a postal code to show route evidence.");
    expect(source).not.toContain("covered-route segments");
    expect(source).not.toContain('return "covered route";');
    expect(source).not.toContain('return "shortest and covered routes";');
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
    expect(pageSource).toContain("showLampOverlay?: boolean;");
    expect(pageSource).toContain("LTA lamp-post points");
    expect(pageSource).not.toContain("LTA lamp points");
    expect(pageSource).toContain('{lampOverlayEnabled ? "Night-lighting layer shown" : "Show night-lighting layer"}');
    expect(pageSource).not.toContain('{lampOverlayEnabled ? "Night lighting on" : "Night lighting off"}');
    expect(pageSource).not.toContain('{lampOverlayEnabled ? "Night-lighting layer on" : "Night-lighting layer off"}');
    expect(pageSource).not.toContain(">Night lighting</button>");
    expect(pageSource).toContain(
      'title="Night-lighting layer: LTA lamp-post locations; map layer only, not part of the locked score"'
    );
    expect(pageSource).not.toContain(
      'title="Night lighting: LTA lamp-post locations; night-lighting map layer only, not part of the locked score"'
    );
    expect(pageSource).not.toContain(
      'title="LTA lamp post locations; map evidence only, not part of the locked score"'
    );
    expect(pageSource).not.toContain(
      'title="Night lighting: LTA lamp-post locations; map evidence only, not part of the locked score"'
    );
    expect(pageSource).toContain("night-lighting-layer-note");
    expect(pageSource).toContain("nightLightingLayerNote(lampOverlayEnabled)");
    expect(pageSource).toContain("export function nightLightingLayerNote(lampOverlayEnabled: boolean): string");
    expect(pageSource).toContain("LTA lamp-post locations can be shown on the map.");
    expect(pageSource).toContain("LTA lamp-post locations are shown on the map.");
    expect(pageSource).toContain("Map layer only; not part of the locked score.");
    expect(pageSource).not.toContain("LTA lamp-post locations load from the published lamp-post layer.");
    expect(pageSource).not.toContain("LTA lamp-post locations load from the published night-lighting artifact.");
    expect(pageSource).not.toContain("Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026.");
    expect(pageSource).not.toContain("LTA lamp-post layer: 126,144 points");
  });

  it("summarizes the night-lighting overlay for non-visual map users", async () => {
    const { nightLightingSummary } = await import("../../components/route-evidence-map");

    expect(nightLightingSummary("off", 12)).toBeNull();
    expect(nightLightingSummary("below_zoom", 0)).toBe(
      "Night lighting map layer is on; zoom in to load LTA lamp-post points. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("loading", 0)).toBe(
      "Night lighting map layer is on; LTA lamp-post points are loading for the current map view. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("empty", 0)).toBe(
      "Night lighting map layer is on; no lamp-post points are indexed in the current map view. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("unavailable", 0)).toBe(
      "Night lighting map layer is on; lamp-post tiles are unavailable for the current map view. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("partial", 1)).toBe(
      "Night lighting map layer is on with 1 lamp-post point in view; some lamp-post tiles are unavailable. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("partial", 14)).toBe(
      "Night lighting map layer is on with 14 lamp-post points in view; some lamp-post tiles are unavailable. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("loaded", 1)).toBe(
      "Night lighting map layer is on with 1 lamp-post point in view. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("loaded", 14)).toBe(
      "Night lighting map layer is on with 14 lamp-post points in view. Night-lighting map layer only; not part of the locked score."
    );
    expect(nightLightingSummary("loaded", 14)).not.toContain("overlay");
  });

  it("keeps failed lamp manifest loads retryable", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");

    expect(source).toContain("manifest = await fetchLampOverlayManifest();");
    expect(source).toContain("if (manifest) {\n            lampManifestRef.current = manifest;\n          }");
    expect(source).not.toContain("lampManifestRef.current = manifest;\n        }\n        if (!active");
  });

  it("centers the map when an exposed gap is focused from the shelter-map panel", () => {
    const source = readFileSync(join(__dirname, "../../components/route-evidence-map.tsx"), "utf-8");

    expect(source).toContain("focusedExposureGap?: FocusedExposureGap | null");
    expect(source).toContain("mapTextSummary(routes, mode, routeData, transitPoiData, lampOverlayStatus, lampData, focusedExposureGap)");
    expect(source).toContain("map.easeTo({");
    expect(source).toContain("center: [focusedExposureGap.lon, focusedExposureGap.lat]");
    expect(source).toContain("zoom: Math.max(map.getZoom(), 16.4)");
    expect(source).toContain('"active-exposure-gap"');
    expect(source).toContain('id: "active-exposure-gap-ring"');
    expect(source).toContain("activeExposureGapCollection(focusedExposureGap)");
    expect(source).toContain("coordinates: [focusedExposureGap.lon, focusedExposureGap.lat]");
    expect(source).toContain('setSourceData(map, "active-exposure-gap", activeGapData)');
  });

  it("summarizes the selected exposed gap marker for non-visual map users", async () => {
    const { selectedExposureGapSummary } = await import("../../components/route-evidence-map");

    expect(selectedExposureGapSummary(null)).toBeNull();
    expect(selectedExposureGapSummary({ key: "bad", lat: Number.NaN, lon: 103.84235 })).toBeNull();
    expect(selectedExposureGapSummary({ key: "gap-1", lat: 1.371234, lon: 103.842354 })).toBe(
      "Selected exposed gap marker at map coordinate 1.37123, 103.84235."
    );
    expect(selectedExposureGapSummary({ key: "gap-1", lat: 1.371234, lon: 103.842354 })).not.toContain(
      "near 1.37123, 103.84235"
    );
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
    expect(liveScoringSource).toContain("published locked scores come");
    expect(liveScoringSource).toContain("from the published shelter-map data with locked weights.");
    expect(liveScoringSource).not.toContain("from the shelter-map bundle with locked weights.");
    expect(liveScoringSource).toContain("preview shelter-map evidence");
    expect(liveScoringSource).toContain("preview-only shelter-map evidence");
    expect(liveScoringSource).toContain("Clicked transit POI has preview shelter-map evidence only");
    expect(liveScoringSource).not.toContain("Clicked transit POI has shelter-map evidence only");
    expect(liveScoringSource).not.toContain("preview route evidence");
    expect(liveScoringSource).not.toContain("preview-only route evidence");
    expect(liveScoringSource).toContain("published locked scores come from the published shelter-map data.");
    expect(liveScoringSource).not.toContain("published locked scores come from the shelter-map bundle.");
    expect(liveScoringSource).not.toContain("Clicked transit POI has route evidence only");
    expect(liveScoringSource).not.toContain("authoritative SHIOK scores come from the published score bundle.");
    expect(liveScoringSource).not.toContain("the published score bundle with locked weights and full provenance.");
    expect(liveScoringSource).not.toContain("only the offline pipeline can do");
    expect(liveScoringSource).not.toContain("SHIOK scores come from offline bundle scoring.");
    expect(liveScoringSource).not.toContain("offline pipeline bundle");

    expect(pageSource).toContain("Preview shelter-map evidence");
    expect(pageSource).not.toContain("Preview shelter-map evidence only");
    expect(pageSource).toContain("↺ Published shelter-map walk");
    expect(pageSource).not.toContain(">↺ Published walk</button>");
    expect(pageSource).toContain("Preview only: this clicked MRT/LRT exit or bus stop has shelter-map evidence");
    expect(pageSource).not.toContain("Preview only: this clicked transit target has shelter-map evidence");
    expect(pageSource).not.toContain("Preview only: this clicked transit stop has shelter-map evidence");
    expect(pageSource).not.toContain("Preview only: this clicked stop or exit has shelter-map evidence");
    expect(pageSource).toContain("outside the published shelter-map data");
    expect(pageSource).not.toContain("not part of the published shelter-map data yet");
    expect(pageSource).not.toContain("not part of the published score bundle yet");
    expect(pageSource).not.toContain("Preview route evidence only");
    expect(pageSource).not.toContain("↺ Scored route");
    expect(pageSource).not.toContain("Preview only: this clicked stop has shelter map evidence");
    expect(pageSource).not.toContain("Preview only: this clicked stop has route evidence");
    expect(pageSource).not.toContain("not an authoritative SHIOK score");
    expect(pageSource).not.toContain("until an offline bundle includes it");
    expect(pageSource).toContain("liveRoutePreviewStatuses");
    expect(pageSource).toContain("Fetching OneMap walking preview");
    expect(pageSource).toContain("until that walk preview returns");
    expect(pageSource).not.toContain("until that route returns");
    expect(pageSource).toContain("OneMap walking preview could not load");
    expect(pageSource).not.toContain("OneMap walking preview is unavailable");
    expect(pageSource).toContain("showing straight-line distance only");
    expect(pageSource).toContain('[chosenStopId]: "loading"');
    expect(pageSource).toContain('[chosenStopId]: "unavailable"');
    expect(pageSource).toContain('<Metric label="OneMap preview walk" value={formatDistance(selectedDistance)} />');
    expect(pageSource).not.toContain('<Metric label="Preview walk" value={formatDistance(selectedDistance)} />');
    expect(pageSource).toContain('<Metric label="Covered-walkway ratio" value={formatPercent(selectedCoverage)} />');
    expect(pageSource).not.toContain('<Metric label="Sheltered evidence" value={formatPercent(selectedCoverage)} />');
    expect(pageSource).toContain('<Metric label="Locked score" value="Preview only" />');
    expect(pageSource).toContain('previewRoute ? "Shelter-map preview" : "Sheltered walk"');
    expect(pageSource).not.toContain('previewRoute ? "Shelter-map preview" : "Sheltered route"');
    expect(pageSource).not.toContain('previewRoute ? "Preview route" : "Sheltered route"');
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
      pageSource.indexOf("Fallback: show shelter-map evidence only while OneMap loads in background")
    );
  });
});
