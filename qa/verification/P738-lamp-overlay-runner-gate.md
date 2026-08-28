# P738 lamp-overlay runner confirmation gate

## Root and host

```text
pwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## Focused tests

```text
.........................                                                [100%]
25 passed in 5.95s
```

## Diff summary

```text
diff --git a/run.py b/run.py
index 0b1dd27..f0dfd98 100644
--- a/run.py
+++ b/run.py
@@ -18,6 +18,7 @@ Safe reports:
 Gated pipeline tasks:
   ingest | lamp-overlay | network | score | score-batch | export | export-transit | refresh-provenance | validate | publish | onemap-probe | geocode-universe
   ingest mutates raw/ and raw/manifest.json; through run.py it requires --confirm-input-refresh, and any refresh must write a new numbered input version rather than repair frozen v1.
+  lamp-overlay writes a compact lamp-post artifact directory from existing raw data; it requires explicit --output and --confirm-lamp-overlay.
   network writes processed network artifacts and QA outputs; it requires --confirm-network-build after owner approval.
   score runs routed scoring even at its default limit; it requires --confirm-score-run after owner approval.
   score-batch runs routed scoring for non-dry limited batches; it requires --confirm-score-batch-run unless --full-batch uses --confirm-full-batch.
@@ -40,11 +41,12 @@ load_dotenv()
 
 SAFE_CHECK_FLAGS = {"--freshness-only", "--geospatial-discovery-only"}
 INPUT_REFRESH_CONFIRM_FLAG = "--confirm-input-refresh"
+LAMP_OVERLAY_CONFIRM_FLAG = "--confirm-lamp-overlay"
 
 STUBS = {
     "check": "refuses bare upstream checks; use --freshness-only or --geospatial-discovery-only for zero-mutation reports",
     "ingest": "download changed sources to raw/ (T0.3); run.py requires --confirm-input-refresh",
-    "lamp-overlay": "build compact lamp-post overlay artifact from existing raw source",
+    "lamp-overlay": "build compact lamp-post overlay artifact from existing raw source; requires explicit --output and --confirm-lamp-overlay",
     "network": "build conflated graph + QA report (T1.1); requires --confirm-network-build",
     "network-debug": "rebuild compact network debug GeoJSON from QA JSON",
     "network-preflight": "verify network build inputs without building graph",
@@ -126,7 +128,16 @@ def run_task(name: str, extra: list[str]) -> int:
         forwarded = [arg for arg in extra if arg != INPUT_REFRESH_CONFIRM_FLAG]
         return run_module("pipeline.fetch", [name], forwarded)
     if name == "lamp-overlay":
-        return run_module("pipeline.lamp_overlay")
+        if LAMP_OVERLAY_CONFIRM_FLAG not in extra:
+            print(
+                "run.py lamp-overlay writes a compact lamp-post artifact directory; pass "
+                "--confirm-lamp-overlay only after approval to create a new versioned "
+                "lamp overlay output. Do not overwrite existing public-data artifacts.",
+                file=sys.stderr,
+            )
+            return 2
+        forwarded = [arg for arg in extra if arg != LAMP_OVERLAY_CONFIRM_FLAG]
+        return run_module("pipeline.lamp_overlay", extra_args=forwarded)
     if name == "network":
         return run_module("pipeline.network")
     if name == "network-debug":
```

## Findings

1. `run.py` documented `lamp-overlay` as a gated pipeline task, but it previously invoked `pipeline.lamp_overlay` with only `--output` and no confirmation.
2. The runner now refuses `lamp-overlay` without `--confirm-lamp-overlay`, so building a new lamp-post artifact directory requires explicit approval at the same entrypoint as other writer tasks.

## Disagreements

1. None.
