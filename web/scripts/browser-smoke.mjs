import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");
const repoRoot = resolve(webRoot, "..");
const debugRunsRoot = resolve(repoRoot, "qa", "debug-runs");
const TRANSIT_MODE_LABELS = {
  best_transit: "Best transit",
  mrt_lrt: "MRT/LRT",
  bus: "Bus",
};
const ROUTE_MODE_LABELS = {
  shiokest: "Sheltered",
  both: "Both",
  shortest: "Shortest",
};

function normalizePostalValue(value) {
  const postal = String(value).trim().padStart(6, "0");
  if (!/^\d{6}$/.test(postal)) {
    throw new Error(`postal must be six digits: ${postal}`);
  }
  return postal;
}

function parsePostalList(value) {
  const postals = String(value)
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizePostalValue);
  if (postals.length === 0) {
    throw new Error("postals list is empty");
  }
  return postals;
}

function parseArgs(argv) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  const args = {
    url: process.env.SHIOK_BROWSER_QA_URL || "http://127.0.0.1:3000/",
    postal: "",
    postals: [],
    out: "",
    screenshots: false,
    debugPort: 9224,
    chrome: process.env.CHROME_PATH || "",
    timeoutMs: 30000,
    inputMode: "keyboard",
    expectedState: "scored",
    transitMode: "best_transit",
    routeMode: "shiokest",
    mustInclude: [],
    runRoot: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`missing value for ${arg}`);
      return argv[index];
    };

    if (arg === "--url") args.url = next();
    else if (arg === "--postal") args.postals = [normalizePostalValue(next())];
    else if (arg === "--postals") args.postals = parsePostalList(next());
    else if (arg === "--out") args.out = next();
    else if (arg === "--run-root") args.runRoot = next();
    else if (arg === "--debug-port") args.debugPort = Number(next());
    else if (arg === "--chrome") args.chrome = next();
    else if (arg === "--timeout-ms") args.timeoutMs = Number(next());
    else if (arg === "--input-mode") args.inputMode = next();
    else if (arg === "--expected-state") args.expectedState = next();
    else if (arg === "--transit-mode") args.transitMode = next();
    else if (arg === "--walk-mode" || arg === "--route-mode") args.routeMode = next();
    else if (arg === "--must-include") args.mustInclude.push(next());
    else if (arg === "--screenshots") args.screenshots = true;
    else if (arg === "--no-screenshots") args.screenshots = false;
    else throw new Error(`unknown arg: ${arg}`);
  }

  if (args.postals.length === 0) {
    args.postals = [normalizePostalValue("560234")];
  }
  args.postal = args.postals[0];
  if (!Number.isInteger(args.debugPort) || args.debugPort < 1) {
    throw new Error(`invalid debug port: ${args.debugPort}`);
  }
  if (!Number.isInteger(args.timeoutMs) || args.timeoutMs < 1000) {
    throw new Error(`invalid timeout: ${args.timeoutMs}`);
  }
  if (!["keyboard", "programmatic"].includes(args.inputMode)) {
    throw new Error(`invalid input mode: ${args.inputMode}`);
  }
  if (!["scored", "no_transit", "not_yet_scored", "any"].includes(args.expectedState)) {
    throw new Error(`invalid expected state: ${args.expectedState}`);
  }
  if (!Object.prototype.hasOwnProperty.call(TRANSIT_MODE_LABELS, args.transitMode)) {
    throw new Error(`invalid transit mode: ${args.transitMode}`);
  }
  if (!Object.prototype.hasOwnProperty.call(ROUTE_MODE_LABELS, args.routeMode)) {
    throw new Error(`invalid route mode: ${args.routeMode}`);
  }
  if (!args.out) {
    const suffix = args.postals.length === 1 ? args.postal : `${args.postals[0]}_plus_${args.postals.length - 1}`;
    args.runRoot = args.runRoot || join(debugRunsRoot, `route-visibility-${timestamp}-${suffix}`);
    args.out = join(args.runRoot, "summary.json");
  }
  args.out = resolve(webRoot, args.out);
  args.runRoot = resolve(webRoot, args.runRoot || dirname(args.out));
  assertInside(args.runRoot, debugRunsRoot, "run root");
  assertInside(args.out, args.runRoot, "summary output");
  return args;
}

function assertInside(childPath, parentPath, label) {
  const child = resolve(childPath);
  const parent = resolve(parentPath);
  if (child !== parent && !child.startsWith(`${parent}${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error(`${label} must stay under ${parent}: ${child}`);
  }
}

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeNdjson(file, rows) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""));
}

function gitValue(args) {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function activeBundle() {
  try {
    return JSON.parse(execFileSync(process.execPath, ["-e", "console.log(JSON.stringify(require('./data-bundle.json')))"], { cwd: webRoot, encoding: "utf8" }));
  } catch {
    return null;
  }
}

function candidateChromePaths() {
  if (process.platform === "win32") {
    return [
      process.env.CHROME_PATH,
      join(process.env.ProgramFiles || "", "Google", "Chrome", "Application", "chrome.exe"),
      join(process.env["ProgramFiles(x86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
      join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    ].filter(Boolean);
  }
  if (process.platform === "darwin") {
    return [
      process.env.CHROME_PATH,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ].filter(Boolean);
  }
  return [process.env.CHROME_PATH, "google-chrome", "chromium", "chromium-browser"].filter(Boolean);
}

function resolveChrome(explicitPath) {
  if (explicitPath) return explicitPath;
  const found = candidateChromePaths().find((candidate) => existsSync(candidate) || !candidate.includes("/") && !candidate.includes("\\"));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH or pass --chrome.");
  return found;
}

function httpJson(url, method = "GET") {
  return new Promise((resolvePromise, rejectPromise) => {
    const req = http.request(url, { method }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
          rejectPromise(new Error(`${method} ${url} failed ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        resolvePromise(data ? JSON.parse(data) : {});
      });
    });
    req.on("error", rejectPromise);
    req.end();
  });
}

async function waitForDebugEndpoint(debugBase, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      return await httpJson(`${debugBase}/json/version`);
    } catch {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
    }
  }
  throw new Error(`Chrome debug endpoint not ready: ${debugBase}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.eventLog = [];
    this.ws = new WebSocket(wsUrl);
  }

  async open() {
    await new Promise((resolvePromise, rejectPromise) => {
      this.ws.addEventListener("open", resolvePromise, { once: true });
      this.ws.addEventListener("error", rejectPromise, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolvePromise, rejectPromise } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) rejectPromise(new Error(JSON.stringify(msg.error)));
        else resolvePromise(msg.result || {});
      } else if (msg.method) {
        this.eventLog.push({ ts: new Date().toISOString(), method: msg.method, params: msg.params });
        if (
          [
            "Runtime.exceptionThrown",
            "Runtime.consoleAPICalled",
            "Log.entryAdded",
            "Network.loadingFailed",
            "Network.responseReceived",
          ].includes(msg.method)
        ) {
          this.events.push(msg);
        }
        this.events = this.events.slice(-20);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolvePromise, rejectPromise });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          rejectPromise(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });
  }

  close() {
    this.ws.close();
  }
}

async function waitForExpression(cdp, expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await cdp.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.result?.value) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
  }
  const diagnostics = await cdp.send("Runtime.evaluate", {
    expression: `(() => ({
      href: location.href,
      readyState: document.readyState,
      title: document.title,
      bodyText: (document.body?.innerText || "").slice(0, 500),
      bodyHtml: (document.body?.innerHTML || "").slice(0, 500),
    }))()`,
    returnByValue: true,
  });
  throw new Error(
    `timed out waiting for expression: ${expression}; page=${JSON.stringify(diagnostics.result?.value || {})}; events=${JSON.stringify(cdp.events)}`
  );
}

async function pressEnter(cdp) {
  const keyEvent = {
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  };
  await cdp.send("Input.dispatchKeyEvent", { ...keyEvent, type: "rawKeyDown" });
  await cdp.send("Input.dispatchKeyEvent", {
    ...keyEvent,
    type: "char",
    text: "\r",
    unmodifiedText: "\r",
  });
  await cdp.send("Input.dispatchKeyEvent", { ...keyEvent, type: "keyUp" });
}

async function clickSearchInput(cdp, timeoutMs) {
  await waitForExpression(cdp, "Boolean(document.querySelector('#postal-search-input'))", timeoutMs);
  const result = await cdp.send("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(() => {
      const input = document.querySelector('#postal-search-input');
      const rect = input.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  });
  const point = result.result?.value;
  if (!point || typeof point.x !== "number" || typeof point.y !== "number") {
    throw new Error("could not resolve postal input click target");
  }
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await waitForExpression(cdp, "document.activeElement === document.querySelector('#postal-search-input')", timeoutMs);
}

async function typeText(cdp, text) {
  for (const character of text) {
    const keyEvent = {
      key: character,
      code: `Digit${character}`,
      windowsVirtualKeyCode: character.charCodeAt(0),
      nativeVirtualKeyCode: character.charCodeAt(0),
    };
    await cdp.send("Input.dispatchKeyEvent", { ...keyEvent, type: "rawKeyDown" });
    await cdp.send("Input.dispatchKeyEvent", {
      ...keyEvent,
      type: "char",
      text: character,
      unmodifiedText: character,
    });
    await cdp.send("Input.dispatchKeyEvent", { ...keyEvent, type: "keyUp" });
  }
}

async function searchPostalWithKeyboard(cdp, postal, timeoutMs) {
  await clickSearchInput(cdp, timeoutMs);
  await typeText(cdp, postal);
  await waitForExpression(
    cdp,
    `document.querySelector('#postal-search-input')?.value === '${postal}'`,
    timeoutMs
  );
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
  await pressEnter(cdp);
}

async function searchPostalProgrammatically(cdp, postal, timeoutMs) {
  await waitForExpression(cdp, "Boolean(document.querySelector('#postal-search-input'))", timeoutMs);
  await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression: `(() => {
      const input = document.querySelector('#postal-search-input');
      const button = document.querySelector('#postal-search-button');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, '${postal}');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      button.click();
    })()`,
  });
}

async function searchPostal(cdp, postal, timeoutMs, inputMode) {
  if (inputMode === "keyboard") {
    await searchPostalWithKeyboard(cdp, postal, timeoutMs);
  } else {
    await searchPostalProgrammatically(cdp, postal, timeoutMs);
  }
  await waitForExpression(
    cdp,
    `document.body.innerText.includes('Postal ${postal}')`,
    timeoutMs
  );
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 1500));
}

async function selectTransitMode(cdp, transitMode, timeoutMs) {
  const label = TRANSIT_MODE_LABELS[transitMode];
  if (!label) throw new Error(`invalid transit mode: ${transitMode}`);
  if (transitMode === "best_transit") return;
  await waitForExpression(
    cdp,
    `Array.from(document.querySelectorAll('[aria-label="Transit target"] button')).some((button) => button.textContent?.trim() === '${label}')`,
    timeoutMs
  );
  await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression: `(() => {
      const button = Array.from(document.querySelectorAll('[aria-label="Transit target"] button'))
        .find((item) => item.textContent?.trim() === '${label}');
      button.click();
    })()`,
  });
  await waitForExpression(
    cdp,
    `Array.from(document.querySelectorAll('[aria-label="Transit target"] button')).some((button) => button.textContent?.trim() === '${label}' && button.getAttribute('aria-pressed') === 'true')`,
    timeoutMs
  );
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 700));
}

async function selectRouteMode(cdp, routeMode, timeoutMs) {
  const label = ROUTE_MODE_LABELS[routeMode];
  if (!label) throw new Error(`invalid route mode: ${routeMode}`);
  if (routeMode === "shiokest") return;
  const sameRoute = await cdp.send("Runtime.evaluate", {
    returnByValue: true,
    expression: `Boolean(Array.from(document.querySelectorAll('[class*=sameRouteNote]')).some((item) => item.textContent?.includes('Shortest same as sheltered walk')))`,
  });
  if (sameRoute.result?.value) return;
  await waitForExpression(
    cdp,
    `Array.from(document.querySelectorAll('[aria-label="Walk display"] button')).some((button) => button.textContent?.trim() === '${label}')`,
    timeoutMs
  );
  await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression: `(() => {
      const button = Array.from(document.querySelectorAll('[aria-label="Walk display"] button'))
        .find((item) => item.textContent?.trim() === '${label}');
      button.click();
    })()`,
  });
  await waitForExpression(
    cdp,
    `Array.from(document.querySelectorAll('[aria-label="Walk display"] button')).some((button) => button.textContent?.trim() === '${label}' && button.getAttribute('aria-pressed') === 'true')`,
    timeoutMs
  );
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 700));
}

async function captureScreenshot(cdp, viewport, file) {
  assertInside(file, dirname(dirname(file)), "screenshot");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.mobile ? 2 : 1,
    mobile: viewport.mobile,
  });
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 700));
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(shot.data, "base64"));
}

async function collectMapState(cdp) {
  const result = await cdp.send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const map = window.__shiokRouteMap;
      const debug = window.__shiokRouteDebug || null;
      const sourceIds = ["shortest-route", "shiokest-route", "exposure-gaps", "transit-node", "transit-pois"];
      const routeLayerIds = [
        "shortest-route-casing",
        "shortest-route-line",
        "shiokest-route-casing",
        "shiokest-route-line",
        "exposure-gap-casing",
        "exposure-gap-line"
      ];
      if (!map) return { available: false, debug };
      const sourceFeatureCounts = Object.fromEntries(sourceIds.map((sourceId) => {
        try {
          return [sourceId, map.getSource(sourceId) ? map.querySourceFeatures(sourceId).length : null];
        } catch (error) {
          return [sourceId, { error: String(error?.message || error) }];
        }
      }));
      const renderedFeatureCounts = Object.fromEntries(routeLayerIds.map((layerId) => {
        try {
          const rect = map.getCanvas().getBoundingClientRect();
          const box = [[0, 0], [Math.max(1, rect.width), Math.max(1, rect.height)]];
          return [layerId, map.getLayer(layerId) ? map.queryRenderedFeatures(box, { layers: [layerId] }).length : null];
        } catch (error) {
          return [layerId, { error: String(error?.message || error) }];
        }
      }));
      const routeLayers = Object.fromEntries(routeLayerIds.map((layerId) => {
        if (!map.getLayer(layerId)) return [layerId, null];
        return [layerId, {
          visibility: map.getLayoutProperty(layerId, "visibility") || "visible",
          lineWidth: map.getPaintProperty(layerId, "line-width") ?? null,
          lineColor: map.getPaintProperty(layerId, "line-color") ?? null
        }];
      }));
      return {
        available: true,
        debug,
        center: map.getCenter?.()?.toArray?.() || null,
        zoom: map.getZoom?.() ?? null,
        bounds: map.getBounds?.()?.toArray?.() || null,
        sourceFeatureCounts,
        renderedFeatureCounts,
        routeLayers
      };
    })()`,
  });
  return result.result.value;
}

async function collectPageSummary(cdp) {
  const result = await cdp.send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const card = document.querySelector('section[aria-label="Shelter map panel"]');
      const map = document.querySelector('[aria-describedby="route-map-summary"]');
      const summary = document.querySelector('#route-map-summary');
      const details = document.querySelector('details');
      const overlay = document.querySelector('[class*=detailOverlay]');
      const activeTransitButton = Array.from(document.querySelectorAll('[aria-label="Transit target"] button'))
        .find((button) => button.getAttribute('aria-pressed') === 'true');
      const activeRouteButton = Array.from(document.querySelectorAll('[aria-label="Walk display"] button'))
        .find((button) => button.getAttribute('aria-pressed') === 'true');
      const sameRouteNote = document.querySelector('[class*=sameRouteNote]');
      const rect = card?.getBoundingClientRect();
      return {
        cardText: card?.innerText || '',
        mapLabel: map?.getAttribute('aria-label') || '',
        mapSummary: summary?.innerText || '',
        activeTransitMode: activeTransitButton?.textContent?.trim() || '',
        activeRouteMode: activeRouteButton?.textContent?.trim() || '',
        sameRouteNote: sameRouteNote?.textContent?.trim() || '',
        metrics: {
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          cardBottom: rect?.bottom ?? null,
          viewportBottom: innerHeight,
          detailsVisible: Boolean(details),
          overlayClientHeight: overlay?.clientHeight ?? null,
          overlayScrollHeight: overlay?.scrollHeight ?? null
        }
      };
    })()`,
  });
  return result.result.value;
}

function normalizeSmokeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-SG");
}

function includesSmokeText(haystack, needle) {
  const normalizedNeedle = normalizeSmokeText(needle);
  return normalizedNeedle.length === 0 || normalizeSmokeText(haystack).includes(normalizedNeedle);
}

function collectChecks(summary, mapState, cdp, postal, inputMode, expectedState, transitMode, routeMode, mustInclude) {
  const hasScore = summary.cardText.includes("/100");
  const hasNoTransit =
    summary.cardText.includes("No routed") ||
    summary.cardText.includes("No transit found nearby") ||
    summary.cardText.includes("No best transit walk was found") ||
    summary.cardText.includes("Transit beyond scoring range") ||
    summary.cardText.includes("Closest routed transit");
  const hasNotYetScored =
    summary.cardText.includes("Not scored") ||
    summary.cardText.includes("No full score in this bundle") ||
    summary.cardText.includes("Awaiting bundle score");
  const routeSourceFeatures =
    Number(mapState?.debug?.sourceFeatureCounts?.shiokest || 0) +
    Number(mapState?.debug?.sourceFeatureCounts?.shortest || 0);
  const routeRenderedFeatures = Object.entries(mapState?.renderedFeatureCounts || {})
    .filter(([layerId]) => layerId.includes("route"))
    .reduce((total, [, count]) => total + (typeof count === "number" ? count : 0), 0);
  const routeLayersVisible = Object.entries(mapState?.routeLayers || {})
    .filter(([layerId]) => layerId.includes("route"))
    .some(([, layer]) => layer && layer.visibility !== "none");
  const hasSameRouteNote =
    summary.sameRouteNote.includes("Shortest same as sheltered walk");
  const pageErrorCount = cdp.eventLog.filter((event) => event.method === "Runtime.exceptionThrown").length;
  const routeNetworkFailures = cdp.eventLog.filter((event) => {
    if (event.method === "Network.loadingFailed") {
      return !event.params?.canceled && event.params?.errorText !== "net::ERR_ABORTED";
    }
    if (event.method !== "Network.responseReceived") return false;
    const url = event.params?.response?.url || "";
    const status = Number(event.params?.response?.status || 0);
    if (status === 404 && url.includes("/data/") && url.includes(".json.gz")) return false;
    return status >= 400 && /\/(api|data|_next)\//.test(url);
  }).length;
  const routeEvidencePanelLoaded = summary.cardText.includes(`Postal ${postal}`);
  const checks = {
    route_evidence_panel_loaded: routeEvidencePanelLoaded,
    score_panel_loaded: routeEvidencePanelLoaded,
    pending_badge_absent: !summary.cardText
      .split("\n")
      .some((line) => line.trim().toLowerCase() === "pending"),
    map_has_text_equivalent: Boolean(summary.mapSummary),
    short_mobile_card_bottom_visible:
      typeof summary.metrics.cardBottom === "number" &&
      (summary.metrics.cardBottom <= summary.metrics.viewportBottom + 2 ||
        (typeof summary.metrics.overlayScrollHeight === "number" &&
          typeof summary.metrics.overlayClientHeight === "number" &&
          summary.metrics.overlayScrollHeight > summary.metrics.overlayClientHeight)),
    keyboard_search_used: inputMode === "keyboard",
    transit_mode_selected:
      transitMode === "best_transit" || summary.activeTransitMode === TRANSIT_MODE_LABELS[transitMode],
    walk_mode_selected:
      routeMode === "shiokest" ||
      summary.activeRouteMode === ROUTE_MODE_LABELS[routeMode] ||
      hasSameRouteNote,
    route_mode_selected:
      routeMode === "shiokest" ||
      summary.activeRouteMode === ROUTE_MODE_LABELS[routeMode] ||
      hasSameRouteNote,
    required_text_present: mustInclude.every(
      (text) => includesSmokeText(summary.cardText, text) || includesSmokeText(summary.mapSummary, text)
    ),
    no_uncaught_page_errors: pageErrorCount === 0,
    route_network_ok: routeNetworkFailures === 0,
  };
  if (expectedState === "scored") {
    return {
      ...checks,
      score_has_max_denominator: hasScore,
      transit_legend_present: summary.cardText.includes("MRT/LRT") && summary.cardText.includes("Bus stop"),
      route_mode_present:
        summary.cardText.includes("Sheltered route") ||
        summary.cardText.includes("Direct bus estimate"),
      route_source_features_present: routeSourceFeatures > 0,
      route_rendered_features_present: routeRenderedFeatures > 0 || (routeSourceFeatures > 0 && routeLayersVisible),
    };
  }
  if (expectedState === "no_transit") {
    return { ...checks, no_transit_state_present: hasNoTransit };
  }
  if (expectedState === "not_yet_scored") {
    return {
      ...checks,
      not_yet_scored_state_present: hasNotYetScored,
      not_yet_copy_distinct_from_no_transit:
        !summary.cardText.includes("No Transit Found Nearby") && !summary.cardText.includes("No routed transit"),
    };
  }
  return checks;
}

async function runPostalCase(cdp, args, postal, outputDir, shotBase) {
  const url = new URL(args.url);
  url.searchParams.set("debugMap", "1");
  await cdp.send("Page.navigate", { url: url.toString() });
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  await waitForExpression(cdp, "document.readyState === 'complete'", args.timeoutMs);
  await searchPostal(cdp, postal, args.timeoutMs, args.inputMode);
  await selectTransitMode(cdp, args.transitMode, args.timeoutMs);
  await selectRouteMode(cdp, args.routeMode, args.timeoutMs);

  const summary = await collectPageSummary(cdp);
  const mapState = await collectMapState(cdp);
  const screenshots = [];
  const caseShotBase = args.postals.length === 1 ? shotBase : `${shotBase}_${postal}`;

  if (args.screenshots) {
    const screenshotDir = join(outputDir, "screenshots");
    const desktop = join(screenshotDir, `${caseShotBase}_desktop.png`);
    const mobile = join(screenshotDir, `${caseShotBase}_mobile.png`);
    const mobileShort = join(screenshotDir, `${caseShotBase}_mobile_short.png`);
    await captureScreenshot(cdp, { width: 1440, height: 950, mobile: false }, desktop);
    await captureScreenshot(cdp, { width: 390, height: 844, mobile: true }, mobile);
    await captureScreenshot(cdp, { width: 390, height: 667, mobile: true }, mobileShort);
    screenshots.push(desktop, mobile, mobileShort);
    Object.assign(summary, await collectPageSummary(cdp));
    Object.assign(mapState, await collectMapState(cdp));
  } else {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 700));
    Object.assign(summary, await collectPageSummary(cdp));
  }

  const mapStatePath = join(outputDir, "map-state", `${caseShotBase}.json`);
  writeJson(mapStatePath, mapState);

  const checks = collectChecks(
    summary,
    mapState,
    cdp,
    postal,
    args.inputMode,
    args.expectedState,
    args.transitMode,
    args.routeMode,
    args.mustInclude
  );
  const routeEvidencePanelExcerpt = summary.cardText.split("\n").slice(0, 32);
  return {
    postal,
    input_mode: args.inputMode,
    expected_state: args.expectedState,
    transit_mode: args.transitMode,
    walk_mode: args.routeMode,
    route_mode: args.routeMode,
    must_include: args.mustInclude,
    screenshots,
    route_evidence_panel_excerpt: routeEvidencePanelExcerpt,
    score_panel_excerpt: routeEvidencePanelExcerpt,
    map_label: summary.mapLabel,
    map_summary: summary.mapSummary,
    active_transit_mode: summary.activeTransitMode,
    active_walk_mode: summary.activeRouteMode,
    active_route_mode: summary.activeRouteMode,
    same_route_note: summary.sameRouteNote,
    map_state: mapStatePath,
    route_debug: mapState?.debug || null,
    rendered_feature_counts: mapState?.renderedFeatureCounts || null,
    metrics: summary.metrics,
    checks,
    ok: Object.values(checks).every(Boolean),
  };
}

async function runSmoke(args) {
  const chrome = resolveChrome(args.chrome);
  const debugBase = `http://127.0.0.1:${args.debugPort}`;
  const userDataDir = join(repoRoot, "tmp", `browser-smoke-${process.pid}-${Date.now()}`);
  mkdirSync(userDataDir, { recursive: true });
  const chromeProcess = spawn(
    chrome,
    [
      "--headless=new",
      `--remote-debugging-port=${args.debugPort}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true }
  );

  let cdp = null;
  try {
    await waitForDebugEndpoint(debugBase, args.timeoutMs);
    const page = await httpJson(`${debugBase}/json/new?${encodeURIComponent(args.url)}`, "PUT");
    cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    await cdp.send("Network.enable");
    await cdp.send("Page.bringToFront");
    const outputDir = args.runRoot;
    const shotBase = basename(args.out, ".json");
    const manifest = {
      generated_at: new Date().toISOString(),
      git_sha: gitValue(["rev-parse", "HEAD"]),
      active_bundle: activeBundle(),
      url: args.url,
      output: args.out,
      run_root: args.runRoot,
      browser_debug_port: args.debugPort,
      postals: args.postals,
      input_mode: args.inputMode,
      expected_state: args.expectedState,
      transit_mode: args.transitMode,
      walk_mode: args.routeMode,
      route_mode: args.routeMode,
    };
    writeJson(join(outputDir, "run_manifest.json"), manifest);
    const results = [];
    for (const postal of args.postals) {
      results.push(await runPostalCase(cdp, args, postal, outputDir, shotBase));
    }

    const commonPayload = {
      generated_at: new Date().toISOString(),
      url: args.url,
      input_mode: args.inputMode,
      expected_state: args.expectedState,
      transit_mode: args.transitMode,
      walk_mode: args.routeMode,
      route_mode: args.routeMode,
      must_include: args.mustInclude,
    };
    const payload =
      results.length === 1
        ? { ...commonPayload, ...results[0] }
        : {
            ...commonPayload,
            postals: args.postals,
            result_count: results.length,
            results,
            ok: results.every((result) => result.ok),
          };

    const consoleEvents = cdp.eventLog.filter((event) =>
      ["Runtime.consoleAPICalled", "Log.entryAdded", "Runtime.exceptionThrown"].includes(event.method)
    );
    const networkEvents = cdp.eventLog.filter((event) => event.method.startsWith("Network."));
    writeNdjson(join(outputDir, "console", "browser-console.ndjson"), consoleEvents);
    writeNdjson(
      join(outputDir, "console", "page-errors.ndjson"),
      consoleEvents.filter((event) => event.method === "Runtime.exceptionThrown")
    );
    writeNdjson(join(outputDir, "network", "requests.ndjson"), networkEvents);
    writeNdjson(
      join(outputDir, "network", "failed-requests.ndjson"),
      networkEvents.filter((event) => event.method === "Network.loadingFailed")
    );
    writeJson(args.out, payload);
    console.log(JSON.stringify(payload, null, 2));

    if (!payload.ok) {
      process.exitCode = 1;
    }
  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill();
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // Temp cleanup failure is not a browser QA failure.
    }
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  await runSmoke(args);
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}
