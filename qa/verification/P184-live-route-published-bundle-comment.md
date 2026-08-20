# P184 Live Route Published Bundle Comment

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Ignore Check

```text
check_ignore_exit=1
```

## Finding

`web/lib/live-route-scoring.ts` correctly produced preview-only records, but its header comment still said only the `offline pipeline` could produce authoritative SHIOK scores. Current product copy and tests frame authoritative values as coming from the published score bundle.

## Evidence

```text
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:160:    expect(liveScoringSource).toContain("authoritative scores come from");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:161:    expect(liveScoringSource).toContain("the published score bundle with locked weights and full provenance.");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:166:    expect(liveScoringSource).not.toContain("only the offline pipeline can do");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:168:    expect(liveScoringSource).not.toContain("offline pipeline bundle");
C:\sgSHIOK2026\web\lib\live-route-scoring.ts:7: * does not produce authoritative SHIOK scores; authoritative scores come from
C:\sgSHIOK2026\web\lib\live-route-scoring.ts:8: * the published score bundle with locked weights and full provenance.
```

## Scope

This is source-comment and source-test alignment only. It does not change runtime behavior, scoring, export, input artifacts, public data, deployment, or `pipeline/config/weights.yaml`.

## FINDINGS

1. A live-route helper comment still used `offline pipeline` framing after the product had moved to published-bundle authority language.
2. The related source-level test now guards against both `only the offline pipeline can do` and `offline pipeline bundle`.

## DISAGREEMENTS

1. None.
