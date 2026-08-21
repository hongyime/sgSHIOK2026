# Attribution

S.H.I.O.K. Shelter Map is a civic shelter-map pilot. Public outputs include
source-derived scores, route geometry, evidence summaries, night lighting
evidence, and map views. This file records the sources that reach shipped
artifacts, their publishers, licences, and the derived use in this repository.
It is attribution and engineering provenance, not legal advice.

## Licences

- Singapore Open Data Licence v1.0: https://data.gov.sg/open-data-licence
- Open Database License (ODbL): https://opendatacommons.org/licenses/odbl/1-0/
- OneMap: https://www.onemap.gov.sg/
- Singapore Land Authority: https://www.sla.gov.sg/

## OneMap

- Publisher: OneMap and Singapore Land Authority.
- Licence / terms: OneMap API Terms identify API datasets as Singapore Open Data
  Licence v1.0 datasets. OneMap GreyLite map display requires visible OneMap and
  Singapore Land Authority attribution.
- Derived use: GreyLite basemap tiles are displayed in the web map. OneMap
  Search and Routing APIs support address search, snapped live route previews,
  validation evidence, and bounded geocoding checks.
- Required map attribution:
  `<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>`

## Singapore Open Data Licence Sources

The following shipped sources are attributed to their public-sector publisher
and treated as Singapore Open Data Licence v1.0 inputs:

| Source | Publisher | Licence URL | Derived use |
| --- | --- | --- | --- |
| covered_linkway | Land Transport Authority | https://data.gov.sg/open-data-licence | Covered-linkway geometry used for rain-shelter route evidence and scoring. |
| overhead_bridge_underpass | Land Transport Authority | https://data.gov.sg/open-data-licence | Bridge and underpass geometry used as sheltered-route connectors and shelter evidence. |
| bus_stops | Land Transport Authority | https://data.gov.sg/open-data-licence | Bus stop locations used for candidate transit access and routing destinations. |
| bus_services | Land Transport Authority | https://data.gov.sg/open-data-licence | Service metadata used for bus-connectivity evidence. |
| bus_routes | Land Transport Authority | https://data.gov.sg/open-data-licence | Route metadata used for bus-connectivity evidence. |
| mrt_lrt_exits | data.gov.sg / Land Transport Authority | https://data.gov.sg/open-data-licence | MRT/LRT exit points used for candidate transit access and routing destinations. |
| train_station_codes | Land Transport Authority | https://data.gov.sg/open-data-licence | Station-code metadata used to join rail evidence. |
| traffic_signals | Land Transport Authority | https://data.gov.sg/open-data-licence | Crossing signal locations used for crossing-friction evidence. |
| building_points | data.gov.sg / Housing & Development Board | https://data.gov.sg/open-data-licence | Building/address points used in source-derived postal universe and location evidence. |
| sla_dwelling_information | data.gov.sg / Singapore Land Authority | https://data.gov.sg/open-data-licence | Dwelling information used in source-derived postal universe checks. |
| ura_no_dwelling_units | data.gov.sg / Urban Redevelopment Authority | https://data.gov.sg/open-data-licence | Dwelling-unit information used in source-derived postal universe checks. |
| planning_area_boundary | data.gov.sg / Urban Redevelopment Authority | https://data.gov.sg/open-data-licence | Planning-area boundaries used for area grouping, summaries, and map context. |
| nparks_nature_ways | data.gov.sg / National Parks Board | https://data.gov.sg/open-data-licence | Greenery proxy evidence used in heat-comfort/shade context. |
| nparks_park_connector_loop | data.gov.sg / National Parks Board | https://data.gov.sg/open-data-licence | Park connector geometry used in greenery proxy and route context. |
| nparks_tracks | data.gov.sg / National Parks Board | https://data.gov.sg/open-data-licence | Track geometry used in greenery proxy and route context. |
| nparks_heritage_trees | data.gov.sg / National Parks Board | https://data.gov.sg/open-data-licence | Heritage tree locations used in greenery proxy evidence. |
| nparks_heritage_road_green_buffers | data.gov.sg / National Parks Board | https://data.gov.sg/open-data-licence | Heritage road green-buffer geometry used in greenery proxy evidence. |
| lamp_posts | Land Transport Authority | https://data.gov.sg/open-data-licence | Lamp-post locations used as the separate night lighting map layer. |

Contains information from the datasets listed above, accessed on 2026-08-11
from data.gov.sg, LTA DataMall, OneMap, and the named public-sector publishers,
which is made available under the terms of the Singapore Open Data Licence
version 1.0: https://data.gov.sg/open-data-licence

## OpenStreetMap

- Source: osm_extract.
- Publisher / distributor: OpenStreetMap contributors, obtained via Geofabrik.
- Licence: Open Database License (ODbL)
  https://opendatacommons.org/licenses/odbl/1-0/
- Derived use: OSM pedestrian-network geometry is used in the network build,
  processed walking graph, scored route geometry, exported geometry shards,
  route GeoJSON, and the RouteEvidenceMap client display.
- Notice: Contains information from OpenStreetMap, which is made available under
  the Open Database License. © OpenStreetMap contributors.
- Conservative publication stance: OSM-derived published static data in this
  repository is treated as ODbL-licensed. Whether the published static data is a
  Produced Work or a Derivative Database under ODbL section 4.4 remains an open
  legal classification question.

## Candidate Or Unshipped Sources

Overture was probed as a candidate source but is not identified as reaching
shipped artifacts in the P1 audit. Leaf area index hashes ship in legacy
provenance as a non-score reference source, but the audited values are not
consumed by shipped scoring.
