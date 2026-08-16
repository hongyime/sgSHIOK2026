# P23 Leaf Area Index Provenance Evidence

## Root And Head

```text
C:\sgSHIOK2026
Prawn-E14
9b6ec125e6d135ff1a56ee9b194845a5d0ff22d5
9b6ec125e6d135ff1a56ee9b194845a5d0ff22d5	refs/heads/main
 M pipeline/scoring_integration.py
 M scripts/production_readiness.py
 M tests/test_scoring_integration.py
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Evidence Path Ignore Check

```text
exit=1
```

## Leaf Area Index File Identity

```text
FullName      : C:\sgSHIOK2026\raw\26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd6
                28c899\leaf_area_index.xlsx
Length        : 204855
LastWriteTime : 29/7/2026 8:17:34 pm


Algorithm : SHA256
Hash      : 26281DBACF4D8707DF48D40B83060C65BF81C3F1A39FF81AEBAEFB8FD628C899
Path      : C:\sgSHIOK2026\raw\26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c8
            99\leaf_area_index.xlsx
```

## XLSX Structure, Parsed Read-Only From Workbook XML

```text
path=raw\26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c899\leaf_area_index.xlsx
exists=True
bytes=204855
zip_member_count=14
shared_string_count=5310
sheets=['Version History', 'How to calculate LAI Value', 'Plant List with LAI Value']
sheet=Version History
worksheet_path=xl/worksheets/sheet1.xml
dimension=A1:D3
row_count_xml=3
A1=Version History
A2=Version | B2=Date | C2=Agency | D2=Status
A3=V1 | B3=46122 | C3=NParks | D3=Approved and Published
sheet=How to calculate LAI Value
worksheet_path=xl/worksheets/sheet2.xml
dimension=A1:H17
row_count_xml=14
A1=Leaf Area Index of Tropical Plants | B1= | C1= | D1= | E1= | F1= | G1= | H1=
A2=The Leaf Area Index (LAI) is an important ecological metric that quantifies the amount of leaf surface area relative to the ground area it covers. The index is widely used to assess the density and structure of plant canopies, influencing processes such as light interception, photosynthesis, and evapotranspiration. Additionally, LAI is utilized in estimating greenery coverage through calculations like the Green Plot Ratio.

Table 1 shows the generic LAI values according to different plant groups. The accompanying plant lists provide examples of species for each sub-category as a reference. Given the wide variety of plants used in Singapore's landscapes, the plant list is not exhaustive. For species not listed, please use the most appropriate generic LAI value that matches the plant's growth form for your needs.

To identify the LAI value for trees that are not listed,  the LAI value of the closest resembling species of the same Genus  may be  used (refer to 'Plant List with LAI Value'). Where trees of the same Genus are not listed, the LAI value of the closest resembling species of the same Family  may be used (refer to 'Plant List with LAI Value'). In instances where the Family and/or Genus occur in more than one category, a conservative approach should be used to use the lower LAI value.

To identify the LAI value for palms that are not listed, determine the growth habit of the species (i.e. solitary or cluster) and match against the LAI value in Table 1 below.

To identify the LAI value for shrubs that are not listed, determine the sub-category of the species (i.e. monocotyledonous or dicotyledonous) and match against the LAI value in Table 1 below.

For all turf and climber species, the LAI value of '2' may be used (Table 1 below).

Information compiled by Centre for Science of Urban Nature (CSUN), extracted from Tan, P. Y. & A. Sia, Leaf Area Index of Tropical Plants. Centre of Urban Greenery and Ecology, Singapore, published in 2009.  | B2= | C2= | D2= | E2= | F2= | G2= | H2=
A4=Table 1
A5=Plant Group | B5=Sub-categories | C5=Generic LAI Values | D5=
A6=Tree | B6=Open Canopy | C6=2.5 | D6=
A7= | B7=Intermediate Canopy | C7=3 | D7=
A8= | B8=Dense Canopy | C8=4 | D8=
A9=Palm | B9=Solitary | C9=2.5 | D9=
sheet=Plant List with LAI Value
worksheet_path=xl/worksheets/sheet3.xml
dimension=A1:L1609
row_count_xml=1609
A1=Species ID | B1=Family Name | C1=Genus Epithet | D1=Species Epithet | E1=Species Epithet Type | F1=Infraspecific Epithet | G1=Full Scientific Name | H1=Common Names | I1=Plant Growth Form | J1=Local Conservation Status | K1=Leaf Area Index (LAI) for Green Plot Ratio | L1=
A2=3463 | B2=Caprifoliaceae | C2=Abelia | D2= | E2= | F2=× grandiflora 'Francis Mason' | G2=Abelia × grandiflora 'Francis Mason' | H2=Golden Abelia, Francis Mason Glossy Abelia | I2=Shrub | J2=Non-native | K2=4.5 (Shrub & Groundcover - Dicot)
A3=1582 | B3=Malvaceae | C3=Abutilon | D3=indicum | E3= | F3= | G3=Abutilon indicum | H3=India Abutilon, Monkey Bush, 磨盘草 | I3=Shrub | J3=Native to Singapore , Critically Endangered (CR) | K3=4.5 (Shrub & Groundcover - Dicot)
A4=2693 | B4=Fabaceae (Leguminosae) | C4=Acacia | D4=auriculiformis | E4= | F4= | G4=Acacia auriculiformis | H4=Acacia-tree, Earleaf Acacia, Black Wattle, Wattle, Bunga Siam, Akasia Kuning, Yellow Wattle, Ear-pod Wattle, Northern Black Wattle, Papua Wattle, 大叶相思, 耳叶相思 | I4=Tree, Medium (16m-30m) | J4=Non-native | K4=3.0 (Tree - Intermediate Canopy)
A5=2694 | B5=Fabaceae (Leguminosae) | C5=Acacia | D5=confusa | E5= | F5= | G5=Acacia confusa | H5=Formosan Koa, Fine Leaved Wattle, Taiwan Acacia | I5=Tree | J5=Non-native | K5=3.0 (Tree - Intermediate Canopy)
A6=2695 | B6=Fabaceae (Leguminosae) | C6=Acacia | D6=mangium | E6= | F6= | G6=Acacia mangium | H6=Silver Wattle, Brown Salwood, Sabah Salwood, Mangge Hutan, Tongke Hutan, Lancewood, Mangium, Mangium Wattle, Forest Mangrove, Mange, Hickory Wattle, Black Wattle, Sally Wattle, Broadleaf Salwood, 马占相思 | I6=Tree, Medium (16m-30m) | J6=Non-native | K6=3.0 (Tree - Intermediate Canopy)
A7=5740 | B7=Euphorbiaceae | C7=Acalypha | D7=aristata | E7= | F7= | G7=Acalypha aristata | H7=Field Copperleaf | I7=Herbaceous Plant | J7=Non-native | K7=4.5 (Shrub & Groundcover - Dicot)
A8=1587 | B8=Euphorbiaceae | C8=Acalypha | D8=chamaedrifolia | E8= | F8= | G8=Acalypha chamaedrifolia | H8=Red Cat's Tail, Bastard Copperleaf, Strawberry Firetail | I8=Herbaceous Plant | J8=Non-native, Horticultural / Cultivated Only | K8=4.5 (Shrub & Groundcover - Dicot)
```

## Provenance Source Hashes Before Code Change

```text
{
  "has_leaf_area_index": true,
  "heat_status": "provisional_covered_plus_nparks_shade_proxy_heat_only",
  "source_hash_count": 14,
  "source_hash_keys": [
    "bus_routes",
    "bus_services",
    "bus_stops",
    "covered_linkway",
    "leaf_area_index",
    "mrt_lrt_exits",
    "nparks_heritage_road_green_buffers",
    "nparks_heritage_trees",
    "nparks_nature_ways",
    "nparks_park_connector_loop",
    "nparks_tracks",
    "osm_extract",
    "overhead_bridge_underpass",
    "traffic_signals"
  ]
}
```

## Provenance Source Hashes After Code Change

```text
{
  "has_leaf_area_index": false,
  "heat_status": "provisional_covered_plus_nparks_shade_proxy_heat_only",
  "source_hash_count": 13,
  "source_hash_keys": [
    "bus_routes",
    "bus_services",
    "bus_stops",
    "covered_linkway",
    "mrt_lrt_exits",
    "nparks_heritage_road_green_buffers",
    "nparks_heritage_trees",
    "nparks_nature_ways",
    "nparks_park_connector_loop",
    "nparks_tracks",
    "osm_extract",
    "overhead_bridge_underpass",
    "traffic_signals"
  ]
}
```

## Focused Python Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 23 items

tests\test_production_readiness.py ................                      [ 69%]
tests\test_scoring_integration.py .                                      [ 73%]
tests\test_shade.py ......                                               [100%]

======================== 23 passed in 97.02s (0:01:37) ========================
```

## Repository Integrity And Diff Checks

```text
repo_integrity=ok
exit=0
```

```text
diff_check_exit=0
weights_diff_exit=0
```

## FINDINGS

1. `leaf_area_index.xlsx` is not route geometry. It is a version/calculation/species-reference workbook with a 1,609-row plant list and generic LAI values.
2. Future score provenance now excludes `leaf_area_index` from per-record `source_hashes`; the count moves from 14 to 13 while the heat status remains `provisional_covered_plus_nparks_shade_proxy_heat_only`.
3. The current heat shade proxy still depends on the five spatial NParks sources: `nparks_nature_ways`, `nparks_park_connector_loop`, `nparks_tracks`, `nparks_heritage_trees`, and `nparks_heritage_road_green_buffers`.
4. `raw/manifest.json` and source freshness can still track `leaf_area_index` as an upstream reference candidate, but score provenance should not imply score dependence until there is species-located canopy geometry and a model.

## DISAGREEMENTS

1. None.
