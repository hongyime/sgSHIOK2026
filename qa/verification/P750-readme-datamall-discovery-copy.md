# P750 README DataMall discovery copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Command output

```text
PS C:\sgSHIOK2026> rg -n "21 Aug|28 Aug|discovery-only|DataMall discovery|Covered Linkway|bridge/underpass|Traffic Signals|still match|differ from frozen" 'C:\sgSHIOK2026\decisions.md' 'C:\sgSHIOK2026\qa\verification' 'C:\sgSHIOK2026\README.md' 'C:\sgSHIOK2026\CLAUDE.md' 'C:\sgSHIOK2026\web\app\page.tsx' 'C:\sgSHIOK2026\web\lib\__tests__' 'C:\sgSHIOK2026\tests'
C:\sgSHIOK2026\web\app\page.tsx:109:  "Covered Linkway follows a quarterly 120-day freshness threshold; frozen v1 uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 discovery-only DataMall check found Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1; stale payload ages still require a new numbered input version before any refresh.";
C:\sgSHIOK2026\README.md:94:newer upstream release exists. A 21 Aug 2026 metadata-only DataMall discovery
C:\sgSHIOK2026\README.md:95:check found current Covered Linkway and bridge/underpass discovery URLs differ
C:\sgSHIOK2026\README.md:96:from frozen v1, while traffic signals still matched. To rerun that
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:14:uv run python run.py check --geospatial-discovery-only; Write-Output "exit=$LASTEXITCODE"
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:23:[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:27:[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:44:1. The 28 Aug 2026 discovery-only check found no DataMall geospatial discovery URL drift for Covered Linkway, Pedestrian Overhead Bridge / Underpass, or Traffic Signals.
C:\sgSHIOK2026\qa\verification\P683-ui-datamall-discovery-line.md:26:1. The UI still displayed the older 21 Aug 2026 DataMall discovery note saying Covered Linkway and bridge/underpass URLs differed from frozen v1. P682 superseded that with a 28 Aug 2026 discovery-only check showing Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1.
```

## FINDINGS

1. README still described the superseded 21 Aug 2026 DataMall discovery drift result, while the browser and P682/P683 evidence use the later 28 Aug 2026 discovery-only result showing Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1.
2. The refresh conclusion remains unchanged: stale payload ages still require a new numbered input version before refresh, and changed discovery URLs would still be a new-version trigger.

## DISAGREEMENTS

1. None.
