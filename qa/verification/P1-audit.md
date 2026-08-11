# P1 Shipped-Source Audit Summary

Date: 2026-08-11

Subagent B reported the following sources as reaching shipped artifacts and
therefore requiring attribution:

- covered_linkway (LTA)
- overhead_bridge_underpass (LTA)
- bus_stops (LTA)
- bus_services (LTA)
- bus_routes (LTA)
- mrt_lrt_exits (data.gov.sg/LTA)
- train_station_codes (LTA)
- traffic_signals (LTA)
- building_points (data.gov.sg/HDB)
- sla_dwelling_information (data.gov.sg/SLA)
- ura_no_dwelling_units (data.gov.sg/URA)
- planning_area_boundary (data.gov.sg/URA)
- nparks_nature_ways (data.gov.sg/NParks)
- nparks_park_connector_loop (data.gov.sg/NParks)
- nparks_tracks (data.gov.sg/NParks)
- nparks_heritage_trees (data.gov.sg/NParks)
- nparks_heritage_road_green_buffers (data.gov.sg/NParks)
- osm_extract (Geofabrik/OpenStreetMap)

Subagent B reported that Overture candidate and lamp_posts do not reach shipped
artifacts. The leaf_area_index hash ships but values are not consumed.

Subagent B reported the OSM geometry path to the client as:

Geofabrik PBF -> network build -> processed network -> scoring -> exported geom
shards -> web/lib/data.ts -> route-geojson -> RouteEvidenceMap.

Subagent B found the previous attribution surfaces insufficient: NOTICE only
contained copyright; README had no attribution link; map attribution was compact
with no visible logo; and the page source line was terse.
