# P5 ingest and heat evidence


Command: git log --oneline -8

```text
83bb359 fix: present heat evidence as proxy
5db6ff4 fix: fail ingest on source and count validation errors
0910e0c fix: close P4 carry-forward web issues
b7d7708 chore: add heat presentation investigation
1552a75 test: add P4 verification evidence
8ad91c4 fix: repair rank record type guard
c8e39d1 test: add bus saturation analysis
e321c07 fix: defer rank payload loading
```

Command: git diff --stat 1552a75..HEAD

```text
 pipeline/config/sources.yaml                       |   3 +
 pipeline/fetch.py                                  | 392 ++++++++++++++++++---
 qa/verification/P4-security-payload.md             |  70 ++++
 .../heat_presentation_investigation_20260812.json  | 375 ++++++++++++++++++++
 scripts/analysis/analyze_heat_presentation.py      | 375 ++++++++++++++++++++
 tests/test_fetch.py                                | 140 ++++++++
 web/app/layout.tsx                                 |   2 +-
 web/app/page.tsx                                   |  30 +-
 web/lib/__tests__/accessibility-render.test.tsx    |  23 ++
 web/lib/__tests__/score-card-copy.test.ts          |   4 +-
 web/lib/__tests__/transit-popup.test.ts            |   4 +-
 web/lib/__tests__/typescript-contract.test.ts      |  17 +
 web/lib/data.ts                                    |  13 -
 web/lib/subscore-ranking.ts                        |   2 +-
 web/lib/transit-popup.ts                           |   2 +-
 web/next.config.js                                 |   2 +-
 16 files changed, 1383 insertions(+), 71 deletions(-)
```

Command: git diff 1552a75..HEAD -- pipeline/

```text
diff --git a/pipeline/config/sources.yaml b/pipeline/config/sources.yaml
index 99a7fc7..f2f25b6 100644
--- a/pipeline/config/sources.yaml
+++ b/pipeline/config/sources.yaml
@@ -1,6 +1,9 @@
 # Upstream data sources configuration for S.H.I.O.K. Index (PRD v4.2 §5, DATA_SOURCES.md)
 # Verified: 2026-07-26 — all URLs and dataset IDs empirically confirmed via HTTP probe.
 
+ingest_validation:
+  max_count_delta_ratio: 0.2
+
 sources:
   covered_linkway:
     name: "Covered Linkway"
diff --git a/pipeline/fetch.py b/pipeline/fetch.py
index c79b1f3..a079854 100644
--- a/pipeline/fetch.py
+++ b/pipeline/fetch.py
@@ -1,22 +1,27 @@
 """Fetch and hash pipeline module for S.H.I.O.K. Index (T0.3)."""
 
 import argparse
+import csv
 import hashlib
+import io
 import json
 import os
 import re
+import struct
 import sys
 import time
+import zipfile
 from datetime import UTC, datetime
 from pathlib import Path
 from typing import Any
 from urllib.parse import parse_qsl, unquote, urlsplit, urlunsplit
+from xml.etree import ElementTree
 
 import httpx
 import yaml  # type: ignore[import-untyped]
 from dotenv import load_dotenv
 
-from pipeline.bus import fetch_paginated, write_api_records_to_raw
+from pipeline.bus import fetch_paginated
 
 load_dotenv()
 
@@ -52,6 +57,22 @@ SIGNED_URL_QUERY_KEYS = {
     "x-amz-signature",
     "x-amz-signedheaders",
 }
+SHAPE_TYPES = {
+    0: "Null",
+    1: "Point",
+    3: "LineString",
+    5: "Polygon",
+    8: "MultiPoint",
+    11: "PointZ",
+    13: "LineStringZ",
+    15: "PolygonZ",
+    18: "MultiPointZ",
+    21: "PointM",
+    23: "LineStringM",
+    25: "PolygonM",
+    28: "MultiPointM",
+    31: "MultiPatch",
+}
 
 
 def get_headers(extra: dict[str, str] | None = None) -> dict[str, str]:
@@ -69,13 +90,24 @@ def get_datamall_headers() -> dict[str, str]:
     return headers
 
 
-def load_sources() -> dict[str, Any]:
+def load_source_config() -> dict[str, Any]:
     with open(CONFIG_PATH, "r", encoding="utf-8") as f:
         data: dict[str, Any] = yaml.safe_load(f) or {}
+    return data
+
+
+def load_sources() -> dict[str, Any]:
+    data = load_source_config()
     sources: dict[str, Any] = data.get("sources", {})
     return sources
 
 
+def load_ingest_validation_config() -> dict[str, Any]:
+    data = load_source_config()
+    config: dict[str, Any] = data.get("ingest_validation", {})
+    return config
+
+
 def select_sources(sources: dict[str, Any], source_keys: list[str]) -> dict[str, Any]:
     requested = list(dict.fromkeys(key.strip() for key in source_keys if key.strip()))
     if not requested:
@@ -182,6 +214,205 @@ def static_raw_filename(source_key: str, url: str, spec: dict[str, Any]) -> str:
     return f"{source_key}{suffix or '.bin'}"
 
 
+def json_content_metrics(payload: Any) -> dict[str, Any]:
+    if isinstance(payload, dict) and isinstance(payload.get("features"), list):
+        features = payload["features"]
+        geometry_types = sorted(
+            {
+                str(feature.get("geometry", {}).get("type"))
+                for feature in features
+                if isinstance(feature, dict)
+                and isinstance(feature.get("geometry"), dict)
+                and feature.get("geometry", {}).get("type")
+            }
+        )
+        return {
+            "payload_type": "geojson_feature_collection",
+            "count_field": "feature_count",
+            "feature_count": len(features),
+            "record_count": len(features),
+            "geometry_types": geometry_types,
+        }
+    if isinstance(payload, dict) and isinstance(payload.get("value"), list):
+        return {
+            "payload_type": "json_value_array",
+            "count_field": "record_count",
+            "record_count": len(payload["value"]),
+        }
+    if isinstance(payload, list):
+        return {
+            "payload_type": "json_array",
+            "count_field": "record_count",
+            "record_count": len(payload),
+        }
+    if isinstance(payload, dict):
+        return {
+            "payload_type": "json_object",
+            "count_field": "record_count",
+            "record_count": len(payload),
+        }
+    return {"payload_type": "json", "count_field": None}
+
+
+def csv_content_metrics(content: bytes) -> dict[str, Any]:
+    text = content.decode("utf-8-sig")
+    reader = csv.reader(io.StringIO(text))
+    rows = list(reader)
+    row_count = max(0, len(rows) - 1)
+    return {
+        "payload_type": "csv",
+        "count_field": "row_count",
+        "row_count": row_count,
+        "record_count": row_count,
+    }
+
+
+def xlsx_content_metrics(content: bytes) -> dict[str, Any]:
+    with zipfile.ZipFile(io.BytesIO(content)) as archive:
+        worksheet_names = sorted(
+            name for name in archive.namelist() if name.startswith("xl/worksheets/sheet")
+        )
+        if not worksheet_names:
+            return {"payload_type": "xlsx", "count_field": None, "sheet_count": 0}
+        sheet_xml = archive.read(worksheet_names[0])
+    row_count = 0
+    for _event, elem in ElementTree.iterparse(io.BytesIO(sheet_xml), events=("end",)):
+        if elem.tag.endswith("}row") or elem.tag == "row":
+            row_count += 1
+        elem.clear()
+    data_rows = max(0, row_count - 1)
+    return {
+        "payload_type": "xlsx",
+        "count_field": "row_count",
+        "row_count": data_rows,
+        "record_count": data_rows,
+        "sheet_count": len(worksheet_names),
+    }
+
+
+def shapefile_metrics_from_zip(content: bytes) -> dict[str, Any]:
+    with zipfile.ZipFile(io.BytesIO(content)) as archive:
+        names = archive.namelist()
+        shp_names = sorted(name for name in names if name.lower().endswith(".shp"))
+        dbf_names = sorted(name for name in names if name.lower().endswith(".dbf"))
+        shx_names = sorted(name for name in names if name.lower().endswith(".shx"))
+        metrics: dict[str, Any] = {
+            "payload_type": "zip",
+            "zip_entry_count": len(names),
+            "count_field": None,
+        }
+        if shp_names:
+            shp_header = archive.read(shp_names[0])[:100]
+            if len(shp_header) >= 36:
+                shape_type = struct.unpack("<i", shp_header[32:36])[0]
+                metrics["geometry_types"] = [SHAPE_TYPES.get(shape_type, f"ShapeType{shape_type}")]
+        record_count: int | None = None
+        if dbf_names:
+            dbf_header = archive.read(dbf_names[0])[:8]
+            if len(dbf_header) >= 8:
+                record_count = struct.unpack("<I", dbf_header[4:8])[0]
+        elif shx_names:
+            shx_header = archive.read(shx_names[0])[:100]
+            if len(shx_header) >= 28:
+                file_length_words = struct.unpack(">i", shx_header[24:28])[0]
+                record_count = max(0, ((file_length_words * 2) - 100) // 8)
+        if record_count is not None:
+            metrics["count_field"] = "feature_count"
+            metrics["feature_count"] = record_count
+            metrics["record_count"] = record_count
+        return metrics
+
+
+def content_metrics(content: bytes, filename: str) -> dict[str, Any]:
+    suffix = Path(filename).suffix.lower()
+    if suffix in {".json", ".geojson"}:
+        return json_content_metrics(json.loads(content.decode("utf-8")))
+    if suffix == ".csv":
+        return csv_content_metrics(content)
+    if suffix == ".xlsx":
+        return xlsx_content_metrics(content)
+    if suffix == ".zip":
+        return shapefile_metrics_from_zip(content)
+    if suffix == ".pbf":
+        return {"payload_type": "osm_pbf", "count_field": None}
+    return {"payload_type": suffix.lstrip(".") or "binary", "count_field": None}
+
+
+def validation_count(metrics: dict[str, Any]) -> int | None:
+    count_field = metrics.get("count_field")
+    if isinstance(count_field, str) and isinstance(metrics.get(count_field), int):
+        return int(metrics[count_field])
+    if isinstance(metrics.get("record_count"), int):
+        return int(metrics["record_count"])
+    return None
+
+
+def validation_threshold(spec: dict[str, Any]) -> float:
+    source_validation = spec.get("ingest_validation", {})
+    if isinstance(source_validation, dict) and "max_count_delta_ratio" in source_validation:
+        return float(source_validation["max_count_delta_ratio"])
+    config = load_ingest_validation_config()
+    if "max_count_delta_ratio" not in config:
+        raise ValueError("ingest_validation.max_count_delta_ratio missing from sources.yaml")
+    return float(config["max_count_delta_ratio"])
+
+
+def attach_and_validate_metrics(
+    key: str,
+    name: str,
+    spec: dict[str, Any],
+    current_entry: dict[str, Any],
+    new_entry: dict[str, Any],
+    metrics: dict[str, Any],
+) -> None:
+    threshold = validation_threshold(spec)
+    count = validation_count(metrics)
+    previous_validation = current_entry.get("validation", {})
+    previous_count = (
+        validation_count(previous_validation) if isinstance(previous_validation, dict) else None
+    )
+
+    validation = {
+        **metrics,
+        "max_count_delta_ratio": threshold,
+    }
+    if count is None:
+        validation["baseline_status"] = "no_count_available"
+    elif previous_count is None:
+        validation["baseline_status"] = "new_baseline"
+    elif previous_count == 0:
+        delta_ratio = 0.0 if count == 0 else 1.0
+        validation["previous_record_count"] = previous_count
+        validation["count_delta_ratio"] = delta_ratio
+        validation["baseline_status"] = "within_threshold" if delta_ratio <= threshold else "failed"
+    else:
+        delta_ratio = abs(count - previous_count) / previous_count
+        validation["previous_record_count"] = previous_count
+        validation["count_delta_ratio"] = round(delta_ratio, 6)
+        validation["baseline_status"] = "within_threshold" if delta_ratio <= threshold else "failed"
+
+    new_entry["validation"] = validation
+    if validation.get("baseline_status") == "failed":
+        raise ValueError(
+            f"content validation failed for {key} ({name}): count changed from "
+            f"{previous_count} to {count}, exceeding max_count_delta_ratio {threshold}"
+        )
+
+
+def datamall_api_content(
+    source_key: str, source_name: str, endpoint: str, records: list[dict[str, Any]]
+) -> bytes:
+    payload = {
+        "source_key": source_key,
+        "source_name": source_name,
+        "endpoint": endpoint,
+        "value": records,
+    }
+    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode(
+        "utf-8"
+    )
+
+
 def resolve_datamall_static_url(keyword: str) -> str:
     from datetime import timedelta
 
@@ -423,6 +654,7 @@ def run_ingest(sources: dict[str, Any]) -> int:
     manifest_sources: dict[str, Any] = manifest.setdefault("sources", {})
     RAW_DIR.mkdir(parents=True, exist_ok=True)
     TMP_DIR.mkdir(parents=True, exist_ok=True)
+    errors: list[str] = []
 
     print("Ingesting upstream datasets...")
 
@@ -434,16 +666,41 @@ def run_ingest(sources: dict[str, Any]) -> int:
             endpoint = spec.get("endpoint", "")
             if not endpoint:
                 continue
+            current_entry = manifest_sources.get(key, {})
             try:
                 records = fetch_paginated(endpoint)
-                sha256 = write_api_records_to_raw(key, name, endpoint, records)
-                manifest = load_manifest()
-                manifest_sources = manifest.setdefault("sources", {})
+                content = datamall_api_content(key, name, endpoint, records)
+                sha256 = hashlib.sha256(content).hexdigest()
+                new_entry = {
+                    "source_name": name,
+                    "url_as_discovered": endpoint,
+                    "sha256": sha256,
+                    "bytes": len(content),
+                    "etag": None,
+                    "last_modified": None,
+                    "fetched_at": datetime.now(UTC).isoformat(),
+                }
+                attach_and_validate_metrics(
+                    key,
+                    str(name),
+                    spec,
+                    current_entry,
+                    new_entry,
+                    content_metrics(content, f"{key}.json"),
+                )
+                target_dir = RAW_DIR / sha256
+                target_dir.mkdir(parents=True, exist_ok=True)
+                target_path = target_dir / f"{key}.json"
+                with open(target_path, "wb") as f:
+                    f.write(content)
+                manifest_sources[key] = new_entry
                 print(
                     f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{key}.json ({len(records)} records)"
                 )
             except (httpx.HTTPError, ValueError, OSError) as e:
-                print(f"[{key}] Error ingesting {name}: {e}")
+                message = f"[{key}] Error ingesting {name}: {e}"
+                errors.append(message)
+                print(message)
 
         elif kind == "datamall_geospatial_listing":
             keyword = spec.get("search_keyword", "")
@@ -451,7 +708,9 @@ def run_ingest(sources: dict[str, Any]) -> int:
             try:
                 url = resolve_datamall_geospatial_url(keyword)
             except (ValueError, httpx.HTTPError, OSError) as e:
-                print(f"[{key}] Error discovering url for {name}: {e}")
+                message = f"[{key}] Error discovering url for {name}: {e}"
+                errors.append(message)
+                print(message)
                 continue
 
             try:
@@ -472,16 +731,8 @@ def run_ingest(sources: dict[str, Any]) -> int:
                     sha256 = hashlib.sha256(content).hexdigest()
                     etag = resp.headers.get("ETag", "")
                     last_modified = resp.headers.get("Last-Modified", "")
-
-                    target_dir = RAW_DIR / sha256
-                    target_dir.mkdir(parents=True, exist_ok=True)
                     filename = f"{key}.zip"
-                    target_path = target_dir / filename
-
-                    with open(target_path, "wb") as f:
-                        f.write(content)
-
-                    manifest_sources[key] = {
+                    new_entry = {
                         "source_name": name,
                         "url_as_discovered": stable_manifest_url(url),
                         "sha256": sha256,
@@ -490,11 +741,27 @@ def run_ingest(sources: dict[str, Any]) -> int:
                         "last_modified": last_modified,
                         "fetched_at": datetime.now(UTC).isoformat(),
                     }
+                    attach_and_validate_metrics(
+                        key,
+                        str(name),
+                        spec,
+                        current_entry,
+                        new_entry,
+                        content_metrics(content, filename),
+                    )
+                    target_dir = RAW_DIR / sha256
+                    target_dir.mkdir(parents=True, exist_ok=True)
+                    target_path = target_dir / filename
+                    with open(target_path, "wb") as f:
+                        f.write(content)
+                    manifest_sources[key] = new_entry
                     print(
                         f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                     )
             except (httpx.HTTPError, ValueError, OSError) as e:
-                print(f"[{key}] Error ingesting {name}: {e}")
+                message = f"[{key}] Error ingesting {name}: {e}"
+                errors.append(message)
+                print(message)
 
         elif kind == "datagov_polldownload":
             dataset_id = spec.get("dataset_id")
@@ -523,15 +790,8 @@ def run_ingest(sources: dict[str, Any]) -> int:
                     etag = resp.headers.get("ETag", "")
                     last_modified = resp.headers.get("Last-Modified", "")
 
-                    target_dir = RAW_DIR / sha256
-                    target_dir.mkdir(parents=True, exist_ok=True)
                     filename = datagov_raw_filename(key, download_url, resp.headers)
-                    target_path = target_dir / filename
-
-                    with open(target_path, "wb") as f:
-                        f.write(content)
-
-                    manifest_sources[key] = {
+                    new_entry = {
                         "source_name": name,
                         "url_as_discovered": stable_manifest_url(download_url),
                         "sha256": sha256,
@@ -540,11 +800,27 @@ def run_ingest(sources: dict[str, Any]) -> int:
                         "last_modified": last_modified,
                         "fetched_at": datetime.now(UTC).isoformat(),
                     }
+                    attach_and_validate_metrics(
+                        key,
+                        str(name),
+                        spec,
+                        current_entry,
+                        new_entry,
+                        content_metrics(content, filename),
+                    )
+                    target_dir = RAW_DIR / sha256
+                    target_dir.mkdir(parents=True, exist_ok=True)
+                    target_path = target_dir / filename
+                    with open(target_path, "wb") as f:
+                        f.write(content)
+                    manifest_sources[key] = new_entry
                     print(
                         f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                     )
             except (httpx.HTTPError, ValueError, OSError) as e:
-                print(f"[{key}] Error ingesting {name}: {e}")
+                message = f"[{key}] Error ingesting {name}: {e}"
+                errors.append(message)
+                print(message)
 
         elif kind == "datamall_static_file":
             url = str(spec.get("url", "")).strip()
@@ -572,15 +848,8 @@ def run_ingest(sources: dict[str, Any]) -> int:
                 etag = resp.headers.get("ETag", "")
                 last_modified = resp.headers.get("Last-Modified", "")
 
-                target_dir = RAW_DIR / sha256
-                target_dir.mkdir(parents=True, exist_ok=True)
                 filename = static_raw_filename(key, url, spec)
-                target_path = target_dir / filename
-
-                with open(target_path, "wb") as f:
-                    f.write(content)
-
-                manifest_sources[key] = {
+                new_entry = {
                     "source_name": name,
                     "url_as_discovered": stable_manifest_url(url),
                     "sha256": sha256,
@@ -589,11 +858,27 @@ def run_ingest(sources: dict[str, Any]) -> int:
                     "last_modified": last_modified,
                     "fetched_at": datetime.now(UTC).isoformat(),
                 }
+                attach_and_validate_metrics(
+                    key,
+                    str(name),
+                    spec,
+                    current_entry,
+                    new_entry,
+                    content_metrics(content, filename),
+                )
+                target_dir = RAW_DIR / sha256
+                target_dir.mkdir(parents=True, exist_ok=True)
+                target_path = target_dir / filename
+                with open(target_path, "wb") as f:
+                    f.write(content)
+                manifest_sources[key] = new_entry
                 print(
                     f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                 )
             except (httpx.HTTPError, ValueError, OSError) as e:
-                print(f"[{key}] Error ingesting {name}: {e}")
+                message = f"[{key}] Error ingesting {name}: {e}"
+                errors.append(message)
+                print(message)
 
         elif kind == "osm_pbf":
             url = spec.get("url")
@@ -618,20 +903,16 @@ def run_ingest(sources: dict[str, Any]) -> int:
                     resp.raise_for_status()
                     content = resp.content
                     if len(content) > limit:
-                        print(f"[{key}] Error: downloaded file exceeds max_bytes")
+                        message = f"[{key}] Error: downloaded file exceeds max_bytes"
+                        errors.append(message)
+                        print(message)
                         continue
 
                     sha256 = hashlib.sha256(content).hexdigest()
                     last_modified = resp.headers.get("Last-Modified", "")
-                    target_dir = RAW_DIR / sha256
-                    target_dir.mkdir(parents=True, exist_ok=True)
                     filename = f"{key}.osm.pbf"
-                    target_path = target_dir / filename
-
-                    with open(target_path, "wb") as f:
-                        f.write(content)
-
-                    manifest_sources[key] = {
+                    current_entry = manifest_sources.get(key, {})
+                    new_entry = {
                         "source_name": name,
                         "url_as_discovered": stable_manifest_url(url),
                         "sha256": sha256,
@@ -639,14 +920,35 @@ def run_ingest(sources: dict[str, Any]) -> int:
                         "last_modified": last_modified,
                         "fetched_at": datetime.now(UTC).isoformat(),
                     }
+                    attach_and_validate_metrics(
+                        key,
+                        str(name),
+                        spec,
+                        current_entry,
+                        new_entry,
+                        content_metrics(content, filename),
+                    )
+                    target_dir = RAW_DIR / sha256
+                    target_dir.mkdir(parents=True, exist_ok=True)
+                    target_path = target_dir / filename
+                    with open(target_path, "wb") as f:
+                        f.write(content)
+                    manifest_sources[key] = new_entry
                     print(
                         f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{filename} ({len(content)} bytes)"
                     )
             except (httpx.HTTPError, ValueError, OSError) as e:
-                print(f"[{key}] Error ingesting {name}: {e}")
+                message = f"[{key}] Error ingesting {name}: {e}"
+                errors.append(message)
+                print(message)
 
     save_manifest(manifest)
     print("Manifest updated successfully.")
+    if errors:
+        print("Ingest completed with errors:")
+        for error in errors:
+            print(f"  - {error}")
+        return 1
     return 0
```

Command: git diff 1552a75..HEAD -- pipeline/config/weights.yaml

```text

```

Command: git diff --name-only 1552a75..HEAD -- web/public/data raw/manifest.json pipeline/scoring.py pipeline/scoring_integration.py pipeline/routing.py pipeline/export.py pipeline/config/weights.yaml

```text

```

Command: git diff --name-only 1552a75..HEAD -- pipeline/

```text
pipeline/config/sources.yaml
pipeline/fetch.py
```

Command: git grep -n -e "row_count\|record_count\|min_features\|sanity\|expected_count" 1552a75 -- pipeline/fetch.py; "BASE_GREP_EXIT=$LASTEXITCODE"

```text
BASE_GREP_EXIT=1
```

Command: git show 1552a75:pipeline/fetch.py | Select-String -Pattern "except \(httpx.HTTPError, ValueError, OSError\)|return 0|Manifest updated successfully"

```text

        except (httpx.HTTPError, ValueError, OSError):
            except (httpx.HTTPError, ValueError, OSError):
            except (httpx.HTTPError, ValueError, OSError) as e:
            except (httpx.HTTPError, ValueError, OSError) as e:
            except (httpx.HTTPError, ValueError, OSError) as e:
    return 0
            except (httpx.HTTPError, ValueError, OSError) as e:
            except (httpx.HTTPError, ValueError, OSError) as e:
            except (httpx.HTTPError, ValueError, OSError) as e:
            except (httpx.HTTPError, ValueError, OSError) as e:
            except (httpx.HTTPError, ValueError, OSError) as e:
    print("Manifest updated successfully.")
    return 0
```

## 1.1 old ingest broken-source demonstration

```text
Ingesting upstream datasets...
[train_station_codes] Error ingesting Train Station Codes and Chinese Names: [WinError 10061] No connection could be made because the target machine actively refused it
Manifest updated successfully.
BEFORE_EXIT_CODE=0
```

## 1.3 fixed ingest broken-source demonstration

```text
Ingesting upstream datasets...
[train_station_codes] Error ingesting Train Station Codes and Chinese Names: [WinError 10061] No connection could be made because the target machine actively refused it
Manifest updated successfully.
Ingest completed with errors:
  - [train_station_codes] Error ingesting Train Station Codes and Chinese Names: [WinError 10061] No connection could be made because the target machine actively refused it
AFTER_EXIT_CODE=1
```

Command: @'
import json
from pipeline import fetch
current = {"source_name":"Sample GeoJSON","sha256":"old","validation":{"count_field":"feature_count","feature_count":100,"record_count":100}}
new = {"source_name":"Sample GeoJSON","sha256":"new"}
metrics = fetch.content_metrics(json.dumps({"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{}} for _ in range(90)]}).encode("utf-8"), "sample.geojson")
fetch.attach_and_validate_metrics("sample_geojson", "Sample GeoJSON", {"ingest_validation":{"max_count_delta_ratio":0.2}}, current, new, metrics)
print("BEFORE")
print(json.dumps(current, indent=2, sort_keys=True))
print("AFTER")
print(json.dumps(new, indent=2, sort_keys=True))
'@ | uv run python -

```text
BEFORE
{
  "sha256": "old",
  "source_name": "Sample GeoJSON",
  "validation": {
    "count_field": "feature_count",
    "feature_count": 100,
    "record_count": 100
  }
}
AFTER
{
  "sha256": "new",
  "source_name": "Sample GeoJSON",
  "validation": {
    "baseline_status": "within_threshold",
    "count_delta_ratio": 0.1,
    "count_field": "feature_count",
    "feature_count": 90,
    "geometry_types": [
      "Point"
    ],
    "max_count_delta_ratio": 0.2,
    "payload_type": "geojson_feature_collection",
    "previous_record_count": 100,
    "record_count": 90
  }
}
```

Command: rg -n "source_hashes" pipeline/export.py pipeline/scoring_integration.py; rg -n 'get\("sha256"\)' pipeline/export.py pipeline/scoring_integration.py; rg -n 'data_as_of|generated_at' pipeline/export.py pipeline/scoring_integration.py

```text
pipeline/export.py:557:    source_hashes: dict[str, str] = {}
pipeline/export.py:564:        raw_hashes = provenance.get("source_hashes")
pipeline/export.py:568:                    source_hashes[key] = value
pipeline/export.py:582:        "source_hashes": dict(sorted(source_hashes.items())),
pipeline/export.py:828:            "source_hashes": score_provenance["source_hashes"],
pipeline/export.py:881:            "source_hashes": source_hashes(TRANSIT_SOURCE_KEYS),
pipeline/export.py:923:def source_hashes(source_keys: Iterable[str]) -> dict[str, Any]:
pipeline/export.py:1359:            "source_hashes": source_hashes(TRANSIT_SOURCE_KEYS),
pipeline/export.py:1377:        "source_hashes": source_hashes(TRANSIT_SOURCE_KEYS),
pipeline/export.py:1390:        "source_hashes": transit_report["source_hashes"],
pipeline/export.py:1439:    provenance["source_hashes"] = score_provenance["source_hashes"]
pipeline/export.py:1449:        "source_hash_count": len(score_provenance["source_hashes"]),
pipeline/scoring_integration.py:1876:        "source_hashes": {
pipeline/scoring_integration.py:165:    sha = source.get("sha256")
pipeline/scoring_integration.py:1877:            key: value.get("sha256")
pipeline/export.py:930:        key: sources.get(key, {}).get("sha256")
pipeline/export.py:932:        if isinstance(sources.get(key, {}).get("sha256"), str)
pipeline/export.py:812:    data_as_of_values = sorted(
pipeline/export.py:814:            str(record.get("data_as_of"))
pipeline/export.py:816:            if record.get("data_as_of") is not None
pipeline/export.py:821:        "generated_at": datetime.now(UTC).isoformat(),
pipeline/export.py:822:        "data_as_of": data_as_of_values[-1] if data_as_of_values else None,
pipeline/export.py:848:                    "data_as_of",
pipeline/scoring_integration.py:118:    data_as_of: str | None = None
pipeline/scoring_integration.py:137:        return {"generated_at": None, "sources": {}}
pipeline/scoring_integration.py:1957:    data_as_of = load_manifest().get("generated_at")
pipeline/scoring_integration.py:1971:        data_as_of=data_as_of,
pipeline/scoring_integration.py:1978:    data_as_of: str | None,
pipeline/scoring_integration.py:1993:            "data_as_of": data_as_of,
pipeline/scoring_integration.py:2028:        "data_as_of": data_as_of,
pipeline/scoring_integration.py:2181:    data_as_of: str | None = None,
pipeline/scoring_integration.py:2229:    record_data_as_of = (
pipeline/scoring_integration.py:2230:        data_as_of if data_as_of is not None else load_manifest().get("generated_at")
pipeline/scoring_integration.py:2242:        record = assemble_score_record(postal, [], record_data_as_of, provenance)
pipeline/scoring_integration.py:2727:    record = assemble_score_record(postal, candidate_scores, record_data_as_of, provenance)
pipeline/scoring_integration.py:2787:                context.data_as_of,
```

Command: git ls-files raw/manifest.json; git check-ignore -v raw/manifest.json; if ($LASTEXITCODE -ne 0) { "git check-ignore: not ignored" }

```text
raw/manifest.json
git check-ignore: not ignored
```

Command: rg -n "fetchScoreRecordsForPostalArea" web; "FETCH_SCORE_RECORDS_FOR_POSTAL_AREA_EXIT=$LASTEXITCODE"

```text
FETCH_SCORE_RECORDS_FOR_POSTAL_AREA_EXIT=1
```

Command: git grep -n "fetchScoreRecordsForPostalArea" 1552a75 -- web

```text
1552a75:web/lib/data.ts:162:export async function fetchScoreRecordsForPostalArea(postal: string): Promise<ScoreRecord[]> {
```

## 5-0a CSP runtime checks

```text
npm --prefix web run build after removing unsafe-eval only: build passed and CDP at 380x780 for postal 560231 returned scorePanelPresent=true, mapCanvasPresent=true, attribution visible with logoSrc=https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png.

npm --prefix web run build after removing unsafe-eval and unsafe-inline: build passed but runtime did not hydrate; CDP postal search returned has560231=false, hasSubscores=false, canvas=false.

rg --pcre2 -n "<script(?![^>]*src=)" web/.next/server/app -g "*.html" showed inline Next bootstrap/RSC scripts in index.html. Final CSP removes unsafe-eval and keeps unsafe-inline.
```

Command: git diff 1552a75..HEAD -- web/next.config.js; rg -n "Content-Security-Policy|script-src" web/next.config.js

```text
diff --git a/web/next.config.js b/web/next.config.js
index c61a8aa..0302e3f 100644
--- a/web/next.config.js
+++ b/web/next.config.js
@@ -4,7 +4,7 @@ const securityHeaders = [
     key: "Content-Security-Policy",
     value: [
       "default-src 'self'",
-      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
+      "script-src 'self' 'unsafe-inline'",
       "style-src 'self' 'unsafe-inline'",
       "img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg",
       "font-src 'self' data:",
4:    key: "Content-Security-Policy",
7:      "script-src 'self' 'unsafe-inline'",
```

Command: @'
import json
from pathlib import Path
payload = json.loads(Path("qa/verification/heat_presentation_investigation_20260812.json").read_text(encoding="utf-8"))
score = payload["score_analysis"]
print(f"bundle={score['bundle']}")
for section in ["manifest_counts","manifest_subscore_status","totals","fractions"]:
    print(section)
    for key, value in score[section].items():
        print(f"  {key}={value}")
print("overclaim_table")
for item in payload["ui_audit"]:
    print(f"{item['file']}:{item['line']} | {item['string']} | {item['verdict']} | {item['action']}")
'@ | python -

```text
bundle=C:/shiok/web/public/data/generated_20260805_prefer_scored_routed
manifest_counts
  NOT_YET_SCORED=476
  NO_TRANSIT_IN_RANGE=9827
  SCORED=95157
  SCORED_PARTIAL=18983
manifest_subscore_status
  access=real_routed_shortest_distance
  bus=real
  crossing=real_traffic_signals_with_grade_separated_exemption
  heat=provisional_covered_plus_nparks_shade_proxy_heat_only
  rain=real_routed_covered_length_ratio
totals
  rain_heat_equal_after_display_rounding=75834
  rain_heat_raw_equal=73905
  records=124443
  score_files=304
  scored_candidates=417178
  scored_candidates_with_shade_ratio=316407
  scored_candidates_with_shade_ratio_exactly_zero=249885
  scored_records=95157
  scored_with_numeric_rain_heat=95157
  scored_with_paths=95157
  scored_with_shade_ratio=95157
  scored_with_shade_ratio_exactly_zero=73891
  scored_with_shade_ratio_null_or_missing=0
fractions
  candidate_shade_ratio_exactly_zero_over_candidates_with_shade_ratio=0.7897581279807336
  chosen_route_shade_ratio_exactly_zero_over_scored_with_shade_ratio=0.7765167039734334
  rain_heat_equal_after_display_rounding_over_scored_numeric_rain_heat=0.7969355906554431
  rain_heat_raw_equal_over_scored_numeric_rain_heat=0.7766638292506068
overclaim_table
web/app/layout.tsx:7 | An explainable comfort score for source-derived Singapore postal records measuring rain shelter, heat, crossing friction, transit access, and bus frequency. | Overclaim: 'measuring heat' implies measured thermal/heat conditions; bundle marks heat as provisional covered + NParks shade proxy. | Change metadata copy to say rain shelter, transit access, crossings, bus service, and a provisional heat proxy.
web/app/page.tsx:69 | Heat comfort | Overclaim risk: standalone label can read as actual thermal comfort rather than a proxy. | Prefer 'Heat proxy' or make it visually subordinate to rain shelter.
web/app/page.tsx:71 | Mostly covered shelter plus sparse NParks greenery proxy; not measured shade. | Acceptable disclosure, but it contradicts stronger 'Heat comfort' and metadata wording. | Keep the caveat; align the row label and metadata with it.
web/app/page.tsx:99 | Better heat comfort | Overclaim risk: reason copy presents inferred proxy as comfort improvement. | Use 'More shelter/greenery proxy coverage' or 'Better heat-proxy score'.
web/app/page.tsx:910 | Search any Singapore address to see its walk-to-transit comfort score. | Mostly acceptable, but broad 'comfort score' should remain tied to source-derived/proxy evidence. | Optional: 'source-derived walk-to-transit comfort score'.
web/app/page.tsx:1025 | Best route | Potential overclaim: reset target says 'best route' although output is a locked bundle-selected route, not personalized navigation. | Use 'Bundle route' or 'Scored route'.
web/app/page.tsx:1091 | <Metric label={selectedRouteLabel} value={formatDistance(selectedDistance)} /> | Acceptable if selectedRouteLabel remains 'Covered/Shortest/Preview'; it controls map/distance display, not score recomputation. | No fix required; keep score unchanged copy nearby.
web/app/page.tsx:1092 | <Metric label="Sheltered" value={formatPercent(selectedCoverage)} /> | Acceptable for rain/covered-linkway presentation; it is sourced by route coverage, not weather awareness. | No fix required.
web/app/page.tsx:1106 | <Metric label="Sheltered evidence" value={formatPercent(selectedCoverage)} /> | Acceptable honesty copy for preview route evidence. | No fix required.
web/app/page.tsx:1112 | {reasons.map((reason) => ( | Contains generated reason chips; heat chips can overclaim when using 'heat comfort' language. | Revise heat-specific reason strings rather than removing reason chips.
web/app/page.tsx:1121 | Locked score breakdown | Acceptable provenance framing; tells user these are fixed bundle scores. | No fix required.
web/app/page.tsx:1122 | Composite uses weights.yaml | Acceptable provenance framing, though technical. | No fix required.
web/app/page.tsx:1154 | Single sub-score view; SHIOK score is unchanged. | Acceptable: explicitly says ranking control does not change score output. | No fix required.
web/app/page.tsx:1266 | {item.label} <strong>{item.value}</strong> | Contains 'Shade proxy N%'; acceptable if kept as proxy, but can duplicate rounded rain/heat values without explaining dependence. | Prefer explicit covered metres vs shade-proxy metres if presenting heat separately.
web/app/page.tsx:1699 | Singapore walk-to-transit comfort | Acceptable headline-level summary if nearby source/proxy disclosures remain visible. | No fix required.
web/app/page.tsx:1700 | Data as of {formatDataDate(manifest)} | Acceptable: static data timestamp, not time/weather awareness. | No fix required.
web/app/page.tsx:1701 | <p className={styles.sourceLine}> | Acceptable provenance surface for numbers/source claims. | No fix required.
web/app/page.tsx:1715 | Heat: shelter + NParks shade proxy | Acceptable concise heat disclosure; stronger than 'Heat comfort'. | Keep or extend with 'not measured temperature/shade'.
web/components/route-evidence-map.tsx:863 | return `Route evidence map for ${labels}, showing ${routeModeLabel(mode)}`; | Acceptable: says evidence map rather than scored/current route. | No fix required.
web/components/route-evidence-map.tsx:904 | return `Route evidence for ${routeLabels}. Showing ${visibleRoutes}, ${exposed}, and ${poiText}.`; | Acceptable screen-reader evidence summary; numbers are derived from loaded GeoJSON features. | No fix required.
web/lib/transit-popup.ts:28 | return `${value} min best`; | Overclaim risk: 'best' lacks provenance/window detail and can read as current wait time. | Use 'best scheduled peak headway' or include AM/PM peak context in value copy.
```

Command: git diff 1552a75..HEAD -- web/app/layout.tsx web/app/page.tsx web/lib/subscore-ranking.ts web/lib/transit-popup.ts web/lib/__tests__/accessibility-render.test.tsx web/lib/__tests__/score-card-copy.test.ts web/lib/__tests__/transit-popup.test.ts

```text
diff --git a/web/app/layout.tsx b/web/app/layout.tsx
index 8f3a8da..796770e 100644
--- a/web/app/layout.tsx
+++ b/web/app/layout.tsx
@@ -4,7 +4,7 @@ import "maplibre-gl/dist/maplibre-gl.css";
 export const metadata = {
   title: "S.H.I.O.K. Index",
   description:
-    "An explainable comfort score for source-derived Singapore postal records measuring rain shelter, heat, crossing friction, transit access, and bus frequency.",
+    "An explainable comfort score for source-derived Singapore postal records measuring rain shelter, provisional heat proxy, crossing friction, transit access, and bus frequency.",
 };
 
 export default function RootLayout({
diff --git a/web/app/page.tsx b/web/app/page.tsx
index b763742..4797772 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -66,9 +66,9 @@ const SUBSCORE_DETAILS: Array<{
   { key: "bus", label: "Bus connectivity", weight: "20%" },
   {
     key: "heat",
-    label: "Heat comfort",
+    label: "Heat proxy",
     weight: "15%",
-    note: "Mostly covered shelter plus sparse NParks greenery proxy; not measured shade.",
+    note: "Derived from covered walk plus sparse NParks greenery proxy; not live weather or measured shade.",
   },
   { key: "crossing", label: "Crossing friction", weight: "5%" },
 ];
@@ -96,7 +96,7 @@ const SOURCE_LABELS: Record<string, string> = {
 const REASON_COPY: Record<keyof Subscores, { low: string; high: string }> = {
   access: { low: "Longer walk to transit", high: "Short walk to transit" },
   rain: { low: "Mostly exposed to rain", high: "Good rain shelter coverage" },
-  heat: { low: "Low shade and shelter comfort", high: "Better heat comfort" },
+  heat: { low: "Low heat-proxy evidence", high: "Better heat-proxy score" },
   bus: { low: "Limited bus connectivity", high: "Strong bus connectivity" },
   crossing: { low: "More crossing friction", high: "Easy crossing profile" },
 };
@@ -152,7 +152,7 @@ export function scoreCardAnnouncement({
     ? previewRoute
       ? "Preview route evidence selected."
       : "Custom stop selected."
-    : "Best route selected.";
+    : "Scored route selected.";
   return `${postal} score panel loaded. ${stationName ?? "Transit target loaded"}. Score ${scoreText}. ${stopText} Route display ${routeMode}; ${selectedRouteLabel ?? "route"} active.`;
 }
 
@@ -996,6 +996,17 @@ export function ScoreCard({
     score.paths && typeof score.paths.shade_ratio === "number"
       ? Math.round(score.paths.shade_ratio * 100)
       : null;
+  const heatEvidenceDetail =
+    score.paths &&
+    typeof score.paths.covered_m === "number" &&
+    typeof score.paths.shade_m === "number"
+      ? `Score evidence: covered ${formatDistance(score.paths.covered_m)}; greenery proxy ${formatDistance(score.paths.shade_m)}.`
+      : null;
+  const heatMatchesRain =
+    score.subscores &&
+    formatScore(score.subscores.heat) === formatScore(score.subscores.rain)
+      ? "Same displayed value as rain shelter for this postal."
+      : null;
   const routeDetailItems: Array<{ label: string; value: string }> = [];
   if (shadeProxyPct !== null) {
     routeDetailItems.push({ label: "Shade proxy", value: `${shadeProxyPct}%` });
@@ -1022,7 +1033,7 @@ export function ScoreCard({
                   className={styles.resetCustomStopBtn}
                   onClick={onResetChosenStop}
                 >
-                  ↺ Best route
+                  ↺ Scored route
                 </button>
               )}
             </div>
@@ -1124,11 +1135,20 @@ export function ScoreCard({
           <div className={styles.subscoreList}>
           {SUBSCORE_DETAILS.map(({ key, label, weight, note }) => {
             const value = score.subscores?.[key] ?? null;
+            const heatNotes: string[] =
+              key === "heat"
+                ? [heatMatchesRain, heatEvidenceDetail].filter((heatNote): heatNote is string =>
+                    Boolean(heatNote)
+                  )
+                : [];
             return (
               <div key={key} className={styles.subscoreRow}>
                 <div>
                   <span>{label}</span>
                   {note && <em>{note}</em>}
+                  {heatNotes.map((heatNote) => (
+                    <em key={heatNote}>{heatNote}</em>
+                  ))}
                 </div>
                 <div className={styles.subscoreMeta}>
                   <strong>{formatScore(value)}</strong>
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index b285f6d..2aba344 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -39,7 +39,9 @@ const scoredRecord: ScoreRecord = {
     shortest_m: 210,
     sheltered_m: 240,
     detour_pct: 14,
+    covered_m: 149,
     covered_ratio: 0.62,
+    shade_m: 23,
     shortest_covered_ratio: 0.48,
     routing_type: "sheltered",
     shade_ratio: 0.31,
@@ -142,4 +144,25 @@ describe("rendered accessibility output", () => {
     expect(html).toContain('aria-busy="true"');
     expect(html).toContain("Loading Overall SHIOK ranks.");
   });
+
+  it("renders heat proxy disclosure and equality note at the score breakdown", () => {
+    const recordWithEqualRainHeat: ScoreRecord = {
+      ...scoredRecord,
+      subscores: { access: 78, rain: 69, heat: 69, bus: 82, crossing: 90 },
+    };
+    const html = renderScoreCard({
+      selection: {
+        ...selection,
+        score: recordWithEqualRainHeat,
+      },
+      rankingRecords: [recordWithEqualRainHeat],
+    });
+
+    expect(html).toContain("Heat proxy");
+    expect(html).toContain(
+      "Derived from covered walk plus sparse NParks greenery proxy; not live weather or measured shade."
+    );
+    expect(html).toContain("Same displayed value as rain shelter for this postal.");
+    expect(html).toContain("Score evidence: covered 149 m; greenery proxy 23 m.");
+  });
 });
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 0dbd258..72e744f 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -95,9 +95,9 @@ describe("score card copy", () => {
     expect(source).toContain('weight: "25%"');
     expect(source).toContain('label: "Bus connectivity"');
     expect(source).toContain('weight: "20%"');
-    expect(source).toContain('label: "Heat comfort"');
+    expect(source).toContain('label: "Heat proxy"');
     expect(source).toContain('weight: "15%"');
-    expect(source).toContain("Mostly covered shelter plus sparse NParks greenery proxy; not measured shade.");
+    expect(source).toContain("Derived from covered walk plus sparse NParks greenery proxy; not live weather or measured shade.");
     expect(source).toContain('label: "Crossing friction"');
     expect(source).toContain('weight: "5%"');
 
diff --git a/web/lib/__tests__/transit-popup.test.ts b/web/lib/__tests__/transit-popup.test.ts
index 9bf63ca..29d48fc 100644
--- a/web/lib/__tests__/transit-popup.test.ts
+++ b/web/lib/__tests__/transit-popup.test.ts
@@ -21,8 +21,8 @@ describe("transit popup formatting", () => {
     expect(html).toContain("71, 76, 262");
     expect(html).toContain("05:45");
     expect(html).toContain("00:38");
-    expect(html).toContain("4 min best");
-    expect(html).toContain("6 min best");
+    expect(html).toContain("4 min best scheduled");
+    expect(html).toContain("6 min best scheduled");
     expect(html).not.toMatch(/arrival|eta/i);
   });
 
diff --git a/web/lib/subscore-ranking.ts b/web/lib/subscore-ranking.ts
index 6db7abc..85a0664 100644
--- a/web/lib/subscore-ranking.ts
+++ b/web/lib/subscore-ranking.ts
@@ -7,7 +7,7 @@ export const RANK_METRIC_OPTIONS: Array<{ id: RankMetric; label: string }> = [
   { id: "rain", label: "Rain shelter" },
   { id: "access", label: "Transit access" },
   { id: "bus", label: "Bus connectivity" },
-  { id: "heat", label: "Heat comfort" },
+  { id: "heat", label: "Heat proxy" },
   { id: "crossing", label: "Crossing friction" },
 ];
 
diff --git a/web/lib/transit-popup.ts b/web/lib/transit-popup.ts
index c9ea07e..5505fc0 100644
--- a/web/lib/transit-popup.ts
+++ b/web/lib/transit-popup.ts
@@ -25,7 +25,7 @@ function asPopupText(value: unknown): string | null {
 
 function formatPeakMinutes(value: unknown): string | null {
   if (typeof value !== "number" || !Number.isFinite(value)) return null;
-  return `${value} min best`;
+  return `${value} min best scheduled`;
 }
 
 export function transitPoiPopupHtml(properties: Record<string, unknown>): string {
```

## 2.2 rendered DOM capture at 380px postal 560231

```text
{
  "viewport": { "width": 380, "height": 780 },
  "heatRow": {
    "x": 24,
    "y": 661.953125,
    "width": 318,
    "height": 90,
    "display": "grid",
    "visibility": "visible",
    "opacity": "1",
    "text": "Heat proxyDerived from covered walk plus sparse NParks greenery proxy; not live weather or measured shade.Same displayed value as rain shelter for this postal.Score evidence: covered 179 m; greenery proxy 0 m.9215%"
  },
  "oneMapAttribution": {
    "x": 104,
    "y": 752,
    "width": 268,
    "height": 24,
    "display": "flex",
    "visibility": "visible",
    "opacity": "1",
    "zIndex": "3",
    "text": "OneMap © contributors | Singapore Land Authority"
  }
}
```

## 1.5 disabled-gate negative proof

```text
F                                                                        [100%]
================================== FAILURES ===================================
_____________ test_ingest_validation_fails_on_large_count_shrink ______________
>       assert fetch.run_ingest(_static_source()) == 1
E       AssertionError: assert 0 == 1
---------------------------- Captured stdout call -----------------------------
Ingesting upstream datasets...
[sample_geojson] Ingested Sample GeoJSON -> raw/ca83ff97.../sample_geojson.geojson (6553 bytes)
Manifest updated successfully.
=========================== short test summary info ===========================
FAILED tests/test_fetch.py::test_ingest_validation_fails_on_large_count_shrink
1 failed in 1.15s
TEMP_DISABLED_GATE_EXIT=1
```

Command: uv run pytest tests/test_fetch.py::test_ingest_validation_fails_on_large_count_shrink -q

```text
.                                                                        [100%]
1 passed in 0.98s
```

Command: uv run python run.py test

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\shiok
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 315 items

tests\test_audit_current_bundle.py ....                                  [  1%]
tests\test_audited_shelter_corrections.py ..                             [  1%]
tests\test_batch_plan.py .......                                         [  4%]
tests\test_bus.py ...                                                    [  5%]
tests\test_bus_arrivals.py ...                                           [  6%]
tests\test_compare_targeted_scores.py ...........                        [  9%]
tests\test_connector_candidates.py ....                                  [ 10%]
tests\test_diagnose_bus_connectors.py .........                          [ 13%]
tests\test_env.py ..                                                     [ 14%]
tests\test_export.py ...........................                         [ 22%]
tests\test_fetch.py ..........                                           [ 26%]
tests\test_geocode_universe.py ...                                       [ 26%]
tests\test_hdb_void_deck_inference.py .............                      [ 31%]
tests\test_manifest_schema.py .                                          [ 31%]
tests\test_mayflower_qa_summary.py ....                                  [ 32%]
tests\test_network_preflight.py .....                                    [ 34%]
tests\test_network_qa.py .....                                           [ 35%]
tests\test_onemap_validation.py .........................                [ 43%]
tests\test_osm_tags.py ....                                              [ 45%]
tests\test_overture_addresses.py .....                                   [ 46%]
tests\test_partial_resnap_rescore.py ..                                  [ 47%]
tests\test_postal_universe.py ..........                                 [ 50%]
tests\test_production_readiness.py ........                              [ 53%]
tests\test_promote_audited_shelter_corrections.py ...                    [ 53%]
tests\test_publish.py ....                                               [ 55%]
tests\test_rebuild_network_debug.py ..                                   [ 55%]
tests\test_replay_onemap_outliers.py .........                           [ 58%]
tests\test_route_feedback.py .....                                       [ 60%]
tests\test_routing.py ........                                           [ 62%]
tests\test_run.py .                                                      [ 63%]
tests\test_score_batch.py .......                                        [ 65%]
tests\test_scoring.py ...........                                        [ 68%]
tests\test_scoring_integration.py ...................................... [ 80%]
.......................                                                  [ 88%]
tests\test_shade.py ....                                                 [ 89%]
tests\test_shelter_skeleton.py ..                                        [ 90%]
tests\test_stub.py .                                                     [ 90%]
tests\test_targeted_bundle_refresh.py .........                          [ 93%]
tests\test_triage_onemap_outliers.py .....................               [100%]

============================ 315 passed in 25.08s =============================
```

Command: npm --prefix web test -- --runInBand

```text

 RUN  v4.1.10 C:/shiok/web


 Test Files  21 passed (21)
      Tests  100 passed (100)
   Start at  09:54:26
   Duration  1.48s (transform 1.71s, setup 0ms, import 2.79s, tests 2.06s, environment 5ms)
```

Command: npm --prefix web run build

```text
using local data bundle C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.js took 12ms

  Creating an optimized production build ...
✓ Compiled successfully in 339ms
  Running TypeScript ...
  Finished TypeScript in 359ms ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/6) ...
  Generating static pages using 7 workers (1/6) 
  Generating static pages using 7 workers (2/6) 
  Generating static pages using 7 workers (4/6) 
✓ Generating static pages using 7 workers (6/6) in 715ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/onemap-route
├ ƒ /api/onemap-search
└ ○ /icon.svg


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## FINDINGS

```text
1. Additive validation fields in raw/manifest.json are ignored by scoring/export provenance except sha256/generated_at, but a real ingest run would still be a tracked raw metadata change because raw/manifest.json is tracked. This task did not modify raw/manifest.json.
2. Next 16 static App Router output still requires script-src unsafe-inline for generated inline bootstrap/RSC scripts. unsafe-eval is not required and was removed.
3. Full-bundle heat/rain presentation equality is high: 75,834 of 95,157 SCORED records, 79.6936%, display equal rounded rain and heat subscores.
4. The current UI still uses broad walk-to-transit comfort language; the overclaim sweep judged it acceptable only because locked score/proxy/source disclosures remain visible nearby.
```

## DISAGREEMENTS

```text
No disagreements with the P5 premises. Strand 2 measurement corrected the exact equality rate for the local full bundle to 79.6936%, rather than the prompt's 86.1% sample figure.
```
