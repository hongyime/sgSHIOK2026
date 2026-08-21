# P395 Access-Walk Source Labels

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed visible route source-strip labels from connector jargon to access-walk copy:
- origin_graph_snap_connector -> Postal access walk
- destination_graph_snap_connector -> Transit access walk
- bus_stop_access_connector -> Bus-stop access walk

The source-layer identifiers remain unchanged.

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. Connector source labels were visible implementation terms in the shelter source strip when connector segments ranked among the top four route-segment totals.
2. The replacement labels describe the resident-facing walk segment while preserving the existing source-layer identifiers for data compatibility.

## DISAGREEMENTS

1. None.
