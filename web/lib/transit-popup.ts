export function toProperCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bMrt\b/g, "MRT")
    .replace(/\bLrt\b/g, "LRT")
    .replace(/\bHdb\b/g, "HDB")
    .replace(/\bAve\b/g, "Ave")
    .replace(/\bSt\b/g, "St");
}

function asPopupText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function formatPeakMinutes(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${value} min best scheduled`;
}

function styledTextElement<Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  text: string,
  style: string,
): HTMLElementTagNameMap[Tag] {
  const element = document.createElement(tag);
  element.setAttribute("style", style);
  element.textContent = text;
  return element;
}

export function transitPoiPopupContent(
  properties: Record<string, unknown>,
  options: { compact?: boolean } = {},
): HTMLDivElement {
  const kind =
    properties.kind === "bus_stop"
      ? "Bus stop"
      : properties.kind === "mrt_station"
        ? "MRT/LRT station"
        : "MRT/LRT exit";
  const title = typeof properties.name === "string" ? toProperCase(properties.name) : kind;
  const content = document.createElement("div");
  content.append(styledTextElement("strong", title, "display:block;color:#17211f;font-size:12px;line-height:1.25"));

  if (options.compact) {
    const code = properties.kind === "bus_stop" ? asPopupText(properties.code) : null;
    content.append(styledTextElement(
      "span",
      kind + (code ? " / Stop " + code : ""),
      "display:block;color:#4f625b;font-size:11px;margin-top:2px",
    ));
    return content;
  }

  const rows: Array<[string, string]> = [];
  if (properties.kind === "bus_stop") {
    const code = asPopupText(properties.code);
    const road = asPopupText(properties.road);
    const services = asPopupText(properties.services) ?? asPopupText(properties.service_nos);
    const serviceCount = asPopupText(properties.service_count);
    const firstBus = asPopupText(properties.weekday_first_bus);
    const lastBus = asPopupText(properties.weekday_last_bus);
    const amPeak = formatPeakMinutes(properties.am_peak_best_min);
    const pmPeak = formatPeakMinutes(properties.pm_peak_best_min);
    const operators = asPopupText(properties.operators);
    if (code) rows.push(["Stop", code]);
    if (road) rows.push(["Road", toProperCase(road)]);
    if (services) rows.push(["Services", services]);
    if (!services && serviceCount) rows.push(["Services", serviceCount]);
    if (firstBus) rows.push(["First bus", firstBus]);
    if (lastBus) rows.push(["Last bus", lastBus]);
    if (amPeak) rows.push(["AM peak", amPeak]);
    if (pmPeak) rows.push(["PM peak", pmPeak]);
    if (operators) rows.push(["Operator", operators]);
  } else if (properties.kind === "mrt_station") {
    const exits = asPopupText(properties.exit_count);
    const system = asPopupText(properties.system);
    const stationCodes = asPopupText(properties.station_codes);
    const lines = asPopupText(properties.lines) ?? asPopupText(properties.line);
    if (system) rows.push(["System", system]);
    if (exits) rows.push(["Exits", exits]);
    if (stationCodes) rows.push(["Codes", stationCodes]);
    if (lines) rows.push(["Lines", lines]);
  } else {
    const station = asPopupText(properties.station);
    const exit = asPopupText(properties.exit);
    const system = asPopupText(properties.system);
    const stationCodes = asPopupText(properties.station_codes);
    const lines = asPopupText(properties.lines) ?? asPopupText(properties.line);
    if (station) rows.push(["Station", toProperCase(station)]);
    if (exit) rows.push(["Exit", exit]);
    if (system) rows.push(["System", system]);
    if (stationCodes) rows.push(["Codes", stationCodes]);
    if (lines) rows.push(["Lines", lines]);
  }

  content.append(styledTextElement("span", kind, "display:block;color:#4f625b;font-size:11px;margin-top:2px"));
  if (rows.length) {
    const details = document.createElement("dl");
    details.setAttribute("style", "display:grid;grid-template-columns:auto 1fr;gap:2px 7px;margin:6px 0 0;color:#5f6f69;font-size:10px");
    for (const [label, value] of rows) {
      details.append(
        styledTextElement("dt", label, "font-weight:800;color:#43564f"),
        styledTextElement("dd", value, "margin:0"),
      );
    }
    content.append(details);
  }
  return content;
}

export function transitPoiLabelText(properties: Record<string, unknown>): string | null {
  const kind = asPopupText(properties.kind);
  if (kind === "mrt_station") {
    const label = asPopupText(properties.label);
    if (label) return toProperCase(label);
    const name = asPopupText(properties.name);
    return name ? toProperCase(name.replace(/\s+(MRT|LRT)\s+STATION$/i, "")) : null;
  }

  if (kind === "mrt_exit") {
    const exit = asPopupText(properties.exit);
    if (exit) return exit;
  }

  if (kind === "bus_stop") {
    const name = asPopupText(properties.name);
    if (name) return toProperCase(name);
    const code = asPopupText(properties.code);
    return code ? `Bus ${code}` : null;
  }

  return null;
}

export function cleanTransitPoiProperties(properties: Record<string, unknown>): Record<string, string | number> {
  const clean = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => typeof value === "string" || typeof value === "number")
  ) as Record<string, string | number>;
  const label = transitPoiLabelText(properties);
  return label ? { ...clean, label_text: label } : clean;
}
