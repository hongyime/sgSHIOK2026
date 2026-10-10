import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanTransitPoiProperties, transitPoiLabelText, transitPoiPopupContent } from "../transit-popup";

class PopupElement {
  children: PopupElement[] = [];
  attributes = new Map<string, string>();
  private ownText = "";

  constructor(readonly tagName: string) {}

  get textContent() {
    return this.ownText + this.children.map(child => child.textContent).join("");
  }

  set textContent(value: string) {
    this.ownText = value;
    this.children = [];
  }

  set innerHTML(_value: string) {
    throw new Error("Popup content must use textContent instead of innerHTML");
  }

  append(...children: PopupElement[]) {
    this.children.push(...children);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  querySelector(tag: string): PopupElement | null {
    for (const child of this.children) {
      if (child.tagName === tag) return child;
      const nested = child.querySelector(tag);
      if (nested) return nested;
    }
    return null;
  }
}

function popup(properties: Record<string, unknown>, options: { compact?: boolean } = {}) {
  return transitPoiPopupContent(properties, options) as unknown as PopupElement;
}

describe("transit popup content", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { createElement: (tag: string) => new PopupElement(tag) });
  });

  afterEach(() => vi.unstubAllGlobals());

  const fieldsByKind = {
    bus_stop: ["name", "code", "road", "services", "service_nos", "service_count",
      "weekday_first_bus", "weekday_last_bus", "operators"],
    mrt_station: ["name", "exit_count", "system", "station_codes", "lines", "line"],
    mrt_exit: ["name", "station", "exit", "system", "station_codes", "lines", "line"],
  };
  const hostileText = "<details open onload=\"window.__xss=1\" ontoggle=\"window.__xss=2\"><img src=x onerror=\"window.__xss=3\"></img></details>&\"'";

  for (const [kind, fields] of Object.entries(fieldsByKind)) {
    it.each(fields)("keeps hostile " + kind + ".%s data as inert text", field => {
      const content = popup({ kind, name: "Public stop", [field]: hostileText });
      expect(content.textContent.toLowerCase()).toContain("<details");
      expect(content.textContent.toLowerCase()).toContain("onload");
      expect(content.querySelector("details")).toBeNull();
      expect(content.querySelector("img")).toBeNull();
      expect(content.querySelector("script")).toBeNull();
    });
  }

  it.each([
    ["bus_stop", "name"], ["bus_stop", "code"],
    ["mrt_station", "name"], ["mrt_exit", "name"],
  ])("keeps compact %s.%s data as inert text", (kind, field) => {
    const content = popup({ kind, name: "Public stop", [field]: hostileText }, { compact: true });
    expect(content.textContent.toLowerCase()).toContain("<details");
    expect(content.querySelector("details")).toBeNull();
    expect(content.querySelector("img")).toBeNull();
  });

  it("renders compact stop identity without secondary service details", () => {
    const content = popup({
      kind: "bus_stop",
      name: "OPP MAYFLOWER SEC SCH",
      code: "54211",
      services: "71, 76, 262",
      weekday_first_bus: "05:45",
    }, { compact: true });

    expect(content.textContent).toBe("Opp Mayflower Sec SchBus stop / Stop 54211");
    expect(content.querySelector("dl")).toBeNull();
  });

  it("shows static bus stop service details without claiming live arrivals", () => {
    const content = popup({
      kind: "bus_stop",
      name: "OPP MAYFLOWER SEC SCH",
      code: "54211",
      road: "ANG MO KIO AVE 4",
      services: "71, 76, 262",
      weekday_first_bus: "05:45",
      weekday_last_bus: "00:38",
      am_peak_best_min: 4,
      pm_peak_best_min: 6,
      operators: "SBST",
    });
    const text = content.textContent;

    expect(text).toContain("Opp Mayflower Sec Sch");
    expect(text).toContain("Bus stop");
    expect(text).toContain("54211");
    expect(text).toContain("71, 76, 262");
    expect(text).toContain("05:45");
    expect(text).toContain("00:38");
    expect(text).toContain("4 min best scheduled");
    expect(text).toContain("6 min best scheduled");
    expect(text).not.toMatch(/arrival|eta/i);
    expect(content.querySelector("dl")?.children.map(child => child.tagName)).toEqual(["dt", "dd", "dt", "dd", "dt", "dd", "dt", "dd", "dt", "dd", "dt", "dd", "dt", "dd", "dt", "dd"]);
  });

  it("shows MRT station and exit details", () => {
    const station = popup({
      kind: "mrt_station",
      name: "MAYFLOWER MRT STATION",
      system: "MRT",
      station_codes: "TE6",
      lines: "Thomson-East Coast Line",
      exit_count: 5,
    });
    const exit = popup({
      kind: "mrt_exit",
      name: "MAYFLOWER MRT STATION EXIT 5",
      station: "MAYFLOWER MRT STATION",
      exit: "Exit 5",
      system: "MRT",
      station_codes: "TE6",
      lines: "Thomson-East Coast Line",
    });

    expect(station.textContent).toContain("Mayflower MRT Station");
    expect(station.textContent).toContain("MRT/LRT station");
    expect(station.textContent).toContain("Exits5");
    expect(station.textContent).toContain("CodesTE6");
    expect(station.textContent).toContain("Thomson-East Coast Line");
    expect(exit.textContent).toContain("MRT/LRT exit");
    expect(exit.textContent).toContain("Mayflower MRT Station");
    expect(exit.textContent).toContain("Exit 5");
    expect(exit.textContent).toContain("TE6");
  });

  it("cleans labels and excludes object-valued popup properties", () => {
    expect(transitPoiLabelText({ kind: "mrt_station", name: "MAYFLOWER MRT STATION" })).toBe("Mayflower");
    expect(transitPoiLabelText({ kind: "bus_stop", code: "54211" })).toBe("Bus 54211");

    const clean = cleanTransitPoiProperties({
      kind: "bus_stop",
      name: "OPP MAYFLOWER SEC SCH",
      geometry: { type: "Point" },
    });
    expect(clean).toMatchObject({ kind: "bus_stop", label_text: "Opp Mayflower Sec Sch" });
    expect(clean).not.toHaveProperty("geometry");

    const content = popup({ kind: "bus_stop", name: "<script>alert(1)</script>", code: "54211" });
    expect(content.textContent.toLowerCase()).toContain("<script>alert(1)</script>");
    expect(content.querySelector("script")).toBeNull();
  });
});
