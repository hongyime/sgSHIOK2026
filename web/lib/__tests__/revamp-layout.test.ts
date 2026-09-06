import { readFileSync } from "fs";
import { join } from "path";

describe("revamp Round 1 — map reliability (M01-M08, M10-M15)", () => {
  it("M05: does not call onStatusChange ready from map load event when routes present", () => {
    const source = readFileSync(
      join(__dirname, "../../components/route-evidence-map.tsx"),
      "utf-8"
    );
    // The load event must NOT unconditionally call ready
    expect(source).toContain("routesRef.current.length === 0");
    expect(source).not.toContain("setLoaded(true);\n        onStatusChange?.");
    // Route visibility verifier must exist
    expect(source).toContain("verifyRouteVisible");
    expect(source).toContain('queryRenderedFeatures(undefined, { layers');
    expect(source).toContain('"shiokest-route-line"');
    expect(source).toContain('"shortest-route-line"');
    expect(source).toContain('onStatusChangeRef.current?.("ready")');
    expect(source).toContain('map.once("render", verifyRouteVisible)');
  });

  it("M04: basemap tile errors after route is visible do not erase route or text", () => {
    const source = readFileSync(
      join(__dirname, "../../components/route-evidence-map.tsx"),
      "utf-8"
    );
    expect(source).toContain("routeVisibleRef.current = true;");
    expect(source).toContain("if (routeVisibleRef.current) return;");
  });

  it("M10: does not snap map back after user panning — fitBounds guarded by routeFitKey", () => {
    const source = readFileSync(
      join(__dirname, "../../components/route-evidence-map.tsx"),
      "utf-8"
    );
    expect(source).toContain("lastFitKeyRef.current = routeFitKey;");
    expect(source).toContain("if (lastFitKeyRef.current === routeFitKey) return;");
    // Refit only fires on route change, not on user-triggered renders
    const fitEffectStart = source.indexOf("lastFitKeyRef.current = routeFitKey;");
    const fitEffectEnd = source.indexOf("}, [loaded, routeData.bounds, routeFitKey]);");
    const fitEffect = source.slice(fitEffectStart, fitEffectEnd);
    expect(fitEffect).not.toContain("feedback");
    expect(fitEffect).not.toContain("transitMode");
    expect(fitEffect).not.toContain("chosenStopId");
  });

  it("M13: route-evidence map exposes feature counts for screenshot+count parity checks", () => {
    const source = readFileSync(
      join(__dirname, "../../components/route-evidence-map.tsx"),
      "utf-8"
    );
    expect(source).toContain("__shiokRouteDebug");
    expect(source).toContain("sourceFeatureCounts");
    expect(source).toContain("shiokest: routeData.shiokest.features.length");
    expect(source).toContain("shortest: routeData.shortest.features.length");
  });

  it("M11: stale request does not replace B's selection when A resolves late", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    // catch block guards with requestId
    const catchIdx = source.indexOf(
      "if (requestId === loadSelectionRequestIdRef.current) {\n        setError"
    );
    expect(catchIdx).toBeGreaterThan(-1);
    // try block also guards
    expect(source).toContain("if (requestId !== loadSelectionRequestIdRef.current) return;");
  });

  it("M15: fitRouteBounds uses measured padding not hardcoded 300/390px guesses", () => {
    const source = readFileSync(
      join(__dirname, "../../components/route-evidence-map.tsx"),
      "utf-8"
    );
    // Accepts optional fitPadding override
    expect(source).toContain("fitPadding?: { top?: number; right?: number; bottom?: number; left?: number }");
    // Default padding changed from 390px left to reflect ~270px panel
    expect(source).not.toContain("left: 390");
    expect(source).not.toContain("top: 300");
  });
});

describe("revamp Round 1 — approved layout (O10)", () => {
  it("O10: weights.yaml untouched (PRD v4.2 §7 LOCKED keys unchanged)", () => {
    const source = readFileSync(
      join(__dirname, "../../../pipeline/config/weights.yaml"),
      "utf-8"
    );
    // Verify PRD v4.2 §7 locked weights are present with exact values
    expect(source).toContain("transit_access: 0.35");
    expect(source).toContain("bus_connectivity: 0.20");
    expect(source).toContain("rain_shelter: 0.25");
    expect(source).toContain("heat_comfort: 0.15");
    expect(source).toContain("crossing_friction: 0.05");
    expect(source).toContain("LOCKED");
  });

  it("layout: navigation zoom/reset control removed", () => {
    const source = readFileSync(
      join(__dirname, "../../components/route-evidence-map.tsx"),
      "utf-8"
    );
    expect(source).not.toContain("NavigationControl");
  });

  it("layout: tagline hidden from primary UI but present in source for screen readers", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    expect(source).toContain("Check how sheltered the walk to transit feels before you pick a place.");
    expect(source).toContain("styles.srOnly");
    // Tagline is inside a srOnly-classed element
    const taglineIdx = source.indexOf("Check how sheltered the walk to transit feels before you pick a place.");
    const srOnlyBeforeTagline = source.lastIndexOf("styles.srOnly", taglineIdx);
    expect(srOnlyBeforeTagline).toBeGreaterThan(taglineIdx - 200);
  });

  it("layout: identity row visible separately from the result panel", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    expect(source).toContain("styles.identityRow");
    expect(source).toContain("styles.identityBrand");
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
    expect(cssSource).toContain(".identityRow");
    expect(cssSource).toContain(".identityBrand");
  });

  it("S01-S03: search form structure and postal-only validation preserved", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    expect(source).toContain('<form onSubmit={handleSearch} className={styles.searchForm} aria-busy={loading}>');
    expect(source).toContain('inputMode="numeric"');
    expect(source).toContain('maxLength={6}');
    expect(source).toContain('pattern="[0-9]{6}"');
    expect(source).toContain("Enter a 6-digit Singapore postal code.");
  });

  it("W11: map shows immediately when postal loaded without a 'Show map' gate", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    // setShowMap(true) is called in loadSelection
    const loadIdx = source.indexOf("const loadSelection = async");
    const showMapIdx = source.indexOf("setShowMap(true);", loadIdx);
    expect(showMapIdx).toBeGreaterThan(loadIdx);
    // setShowMap(false) is never called
    expect(source).not.toContain("setShowMap(false);");
  });

  it("mobile sheet: expand/collapse toggle wired for compact bottom sheet", () => {
    const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
    expect(source).toContain("const [sheetExpanded, setSheetExpanded] = useState(false);");
    expect(source).toContain("styles.sheetToggle");
    expect(source).toContain("styles.sheetExpanded");
    const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
    expect(cssSource).toContain(".sheetToggle");
    expect(cssSource).toContain(".sheetExpanded");
  });
});
