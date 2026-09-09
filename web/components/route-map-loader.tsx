"use client";

import { Component, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import type { RouteEvidenceMap, RouteMapIssue } from "./route-evidence-map";

type Props = ComponentProps<typeof RouteEvidenceMap>;
type StatusCallback = NonNullable<Props["onStatusChange"]>;

const COMPONENT_DOWNLOAD_TIMEOUT_MS = 30_000;

class MapComponentImportError extends Error {
  constructor() {
    super("Map component import rejected");
    this.name = "MapComponentImportError";
  }
}

// Keep the literal import inside module-level dynamic() for Next's preload metadata.
const DynamicRouteEvidenceMap = dynamic<Props>(
  () => import("./route-evidence-map").then(
    module => module.RouteEvidenceMap,
    () => { throw new MapComponentImportError(); },
  ),
  { ssr: false },
);

export async function preloadRouteMap(): Promise<void> {
  // Hints are optional: neither rejected import may become an unhandled rejection.
  await Promise.allSettled([import("./route-evidence-map"), import("maplibre-gl")]);
}

export class RouteMapLoader extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  private active = true;
  private childBegan = false;
  private terminal = false;
  private startedAt: number | null = null;
  private deadline: ReturnType<typeof setTimeout> | undefined;

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidMount() {
    this.active = true;
    this.startedAt = performance.now();
    if (!this.childBegan && !this.terminal) {
      this.deadline = setTimeout(
        () => this.fail("component-download", "timeout"),
        COMPONENT_DOWNLOAD_TIMEOUT_MS,
      );
    }
  }

  componentDidCatch(error: unknown) {
    const rejectedImport = error instanceof MapComponentImportError;
    this.fail(rejectedImport ? "component-download" : "route-render", rejectedImport ? "rejected" : "error");
  }

  componentWillUnmount() {
    this.active = false;
    this.clearDeadline();
  }

  private clearDeadline() {
    clearTimeout(this.deadline);
    this.deadline = undefined;
  }

  private fail(stage: RouteMapIssue["stage"], reason: RouteMapIssue["reason"]) {
    if (!this.active || this.terminal) return;
    this.terminal = true;
    this.clearDeadline();
    this.setState({ failed: true });
    const message = stage === "component-download"
      ? reason === "timeout" ? "The map download did not finish." : "The map download failed."
      : "The map could not be displayed.";
    this.props.onStatusChange?.("error", `${message} Your walk details are still available. Reload the page to try again.`, "reload", {
      stage,
      reason,
      ...(stage === "component-download" ? { elapsedMs: Math.max(0, performance.now() - (this.startedAt ?? performance.now())) } : {}),
    });
  }

  private handleStatus: StatusCallback = (...args) => {
    if (!this.active || this.terminal) return;
    this.childBegan = true;
    this.clearDeadline();
    this.props.onStatusChange?.(...args);
  };

  render() {
    if (this.state.failed) return null;
    return <DynamicRouteEvidenceMap {...this.props} onStatusChange={this.handleStatus} />;
  }
}
