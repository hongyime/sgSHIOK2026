# P396 Access-Link Walk Detail

## Working Root Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

```text
Changed selected-walk detail copy:
- "Snap connector" -> "Access link"
- "Snap connector is the short link..." -> "Access link is the short walk..."

The underlying endpoint_snap_connector_m field remains unchanged.

No scoring, export, rescore, subset run, ingest, network build, public-data write, protected QA evidence mutation, or locked weights change.
```

## FINDINGS

1. The walk details strip still exposed "Snap connector", a graph implementation term, after related source-strip connector labels had been made user-facing.
2. The replacement label keeps the distance visible while describing the resident-facing access walk rather than the internal snap operation.

## DISAGREEMENTS

1. None.
