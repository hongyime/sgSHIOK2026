# P1 Shipped-Source Surface Audit

Date: 2026-08-11

Scope: read-only audit of sources, shipped artifacts, and attribution surfaces
before P1 implementation.

## Commands

Command:

```powershell
git rev-parse HEAD
```

Output at audit start:

```text
07eafd39728aa884fcdd51b4f8b04184f5bb8e8a
```

Command:

```powershell
rg -n "covered_linkway|overhead_bridge_underpass|bus_stops|bus_services|bus_routes|mrt_lrt_exits|train_station_codes|traffic_signals|building_points|sla_dwelling_information|ura_no_dwelling_units|planning_area_boundary|leaf_area_index|nparks_|osm_extract|overture_addresses" pipeline/config/sources.yaml
```

Output:

```text
5:  covered_linkway:
12:  overhead_bridge_underpass:
19:  bus_stops:
26:  bus_services:
33:  bus_routes:
40:  mrt_lrt_exits:
47:  train_station_codes:
51:    filename: "train_station_codes.zip"
55:  traffic_signals:
69:  building_points:
76:  sla_dwelling_information:
83:  ura_no_dwelling_units:
90:  planning_area_boundary:
96:  leaf_area_index:
103:  nparks_nature_ways:
110:  nparks_park_connector_loop:
117:  nparks_tracks:
124:  nparks_heritage_trees:
131:  nparks_heritage_road_green_buffers:
138:  osm_extract:
147:  overture_addresses_sg_candidate:
```

## Source Inventory

| Source | Publisher | Shipped artifact status | Code path evidence |
| --- | --- | --- | --- |
| covered_linkway | LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:5`, `scripts/run_network_build.py`, `pipeline/export.py`, `web/lib/route-geojson.ts`, `web/components/route-evidence-map.tsx` |
| overhead_bridge_underpass | LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:12`, `scripts/run_network_build.py`, `pipeline/scoring_integration.py`, `pipeline/export.py` |
| bus_stops | LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:19`, `pipeline/bus.py:246`, `pipeline/export.py`, `web/lib/data.ts` |
| bus_services | LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:26`, `pipeline/bus.py:247`, `pipeline/export.py` |
| bus_routes | LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:33`, `pipeline/bus.py:248`, `pipeline/export.py` |
| mrt_lrt_exits | data.gov.sg / LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:40`, `pipeline/scoring_integration.py`, `pipeline/export.py` |
| train_station_codes | LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:47`, `pipeline/export.py` |
| traffic_signals | LTA | Reaches shipped artifact | `pipeline/config/sources.yaml:55`, `pipeline/scoring_integration.py` |
| building_points | data.gov.sg / HDB | Reaches shipped artifact | `pipeline/config/sources.yaml:69`, `pipeline/postal_universe.py`, `scripts/run_network_build.py`, `web/app/page.tsx` |
| sla_dwelling_information | data.gov.sg / SLA | Reaches shipped artifact | `pipeline/config/sources.yaml:76`, `pipeline/postal_universe.py` |
| ura_no_dwelling_units | data.gov.sg / URA | Reaches shipped artifact | `pipeline/config/sources.yaml:83`, `pipeline/postal_universe.py`, `scripts/production_readiness.py` |
| planning_area_boundary | data.gov.sg / URA | Reaches shipped artifact | `pipeline/config/sources.yaml:90`, `scripts/run_network_build.py`, `pipeline/export.py`, `pipeline/network_preflight.py` |
| nparks_nature_ways | data.gov.sg / NParks | Reaches shipped artifact | `pipeline/config/sources.yaml:103`, `pipeline/shade.py`, `scripts/run_network_build.py`, `pipeline/scoring_integration.py` |
| nparks_park_connector_loop | data.gov.sg / NParks | Reaches shipped artifact | `pipeline/config/sources.yaml:110`, `pipeline/shade.py`, `scripts/run_network_build.py`, `pipeline/scoring_integration.py` |
| nparks_tracks | data.gov.sg / NParks | Reaches shipped artifact | `pipeline/config/sources.yaml:117`, `pipeline/shade.py`, `scripts/run_network_build.py`, `pipeline/scoring_integration.py` |
| nparks_heritage_trees | data.gov.sg / NParks | Reaches shipped artifact | `pipeline/config/sources.yaml:124`, `pipeline/shade.py`, `scripts/run_network_build.py`, `pipeline/scoring_integration.py` |
| nparks_heritage_road_green_buffers | data.gov.sg / NParks | Reaches shipped artifact | `pipeline/config/sources.yaml:131`, `pipeline/shade.py`, `scripts/run_network_build.py`, `pipeline/scoring_integration.py` |
| osm_extract | Geofabrik / OpenStreetMap contributors | Reaches shipped artifact | `pipeline/config/sources.yaml:138`, `pipeline/fetch.py`, `scripts/run_network_build.py`, `pipeline/scoring_integration.py`, `pipeline/export.py`, `web/lib/data.ts`, `web/lib/route-geojson.ts`, `web/components/route-evidence-map.tsx` |
| lamp_posts | data.gov.sg / LTA | Fetched/hashed; no shipped value consumer found | `pipeline/config/sources.yaml:62`; no production scoring/export consumer found by `rg` |
| leaf_area_index | data.gov.sg / NParks | Hash/provenance ships; values not consumed by shipped scoring | `pipeline/config/sources.yaml:96`; no shipped value consumer found by `rg` |
| overture_addresses_sg_candidate | Overture Maps | Candidate/probe only; not shipped | `pipeline/config/sources.yaml:147`; no active client/scoring artifact consumer found |

## OSM Geometry Client Trace

Command:

```powershell
rg -n "osm_extract|network_island|geom/h3|postalGeomToRouteGeoJson|RouteEvidenceMap" pipeline scripts web/lib web/components
```

Relevant output:

```text
pipeline/config/sources.yaml:138:  osm_extract:
web/lib/data.ts:177:    _geomIndex = await fetchJson<GeomIndex>("geom/index.json");
web/lib/data.ts:187:    _geomPostalIndex = await fetchJson<GeomPostalIndex>("geom/postal-index.json");
web/lib/data.ts:208:    return await fetchJson<PostalGeom[]>(`geom/h3/${shardId}.json`);
web/lib/route-geojson.ts:95:export function postalGeomToRouteGeoJson(geom: PostalGeom): RouteGeoJson {
web/components/route-evidence-map.tsx:6:import { postalGeomToRouteGeoJson } from "../lib/route-geojson";
web/components/route-evidence-map.tsx:775:    const data = postalGeomToRouteGeoJson(route.geom);
web/components/route-evidence-map.tsx:925:export function RouteEvidenceMap({
```

Trace: Geofabrik PBF configured as `osm_extract` -> network build creates the
walking graph -> scoring/export write route geometry shards -> `web/lib/data.ts`
loads `geom/*` JSON -> `web/lib/route-geojson.ts` decodes route geometry ->
`RouteEvidenceMap` renders it in the browser.

## Existing Attribution Surfaces Before P1

| Surface | Pre-P1 state | Gap |
| --- | --- | --- |
| `NOTICE` | One copyright line only | No third-party attribution. |
| `LICENSE` | Apache-2.0 project licence | Does not discharge source-data attribution. |
| `README.md` | Links LICENSE/NOTICE only | No ATTRIBUTION link. |
| `CLAUDE.md` | States attribution obligations | Not a user-facing/distribution attribution surface. |
| `web/components/route-evidence-map.tsx` | Text-only OneMap attribution, compact control | No always-visible OneMap logo; attribution hidden behind compact toggle. |
| `web/app/page.tsx` | `Sources: LTA, data.gov.sg, OneMap, OSM` | Missing OpenStreetMap contributor text, ODbL link, and detailed attribution link. |

## Gap Table

| Obligation | Existing surface was sufficient? | P1 fix required |
| --- | --- | --- |
| OneMap GreyLite logo and SLA attribution visible without user interaction | No | Add visible OneMap markup and remove compact MapLibre attribution toggle. |
| OneMap Search/Routing API data attribution | Partial | Document OneMap/SLA and SODL API-dataset treatment in NOTICE/ATTRIBUTION. |
| SODL attribution for LTA/data.gov.sg/NParks/HDB/SLA/URA sources | No | NOTICE and ATTRIBUTION source tables. |
| OSM / Geofabrik ODbL attribution | No | `© OpenStreetMap contributors`, ODbL link, and conservative ODbL publication note. |
| Candidate/unshipped Overture | Not applicable to shipped artifacts | Document as candidate/unshipped only. |
