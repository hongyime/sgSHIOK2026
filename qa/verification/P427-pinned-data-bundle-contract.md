# P427 pinned data bundle contract evidence

## Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deploy, or public-data write was run.
Protected files and directories were not intentionally modified.
```

## Search

```text
C:\sgSHIOK2026\web\lib\__tests__\data-base.test.ts:21:      "Defaults to the pinned published static shelter-map bundle in web/data-bundle.json."
C:\sgSHIOK2026\web\lib\__tests__\data-base.test.ts:23:    expect(source).not.toContain("Defaults to the latest validated static shelter-map bundle.");
C:\sgSHIOK2026\web\lib\data.ts:3: * Defaults to the pinned published static shelter-map bundle in web/data-bundle.json.
```

## Verification

```text
npm --prefix C:\sgSHIOK2026\web test -- data-base.test.ts --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data-base.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  20:20:18
   Duration  926ms (transform 142ms, setup 0ms, import 223ms, tests 11ms, environment 0ms)
```

```text
git -C C:\sgSHIOK2026 check-ignore -v -- C:\sgSHIOK2026\qa\verification\P427-pinned-data-bundle-contract.md
EXIT=1
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
EXIT=0
```

```text
git -C C:\sgSHIOK2026 diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases
EXIT=0
```

## FINDINGS

1. `web/lib/data.ts` still described the default data source as the `latest validated static shelter-map bundle`, but the runtime default is the pinned bundle named in `web/data-bundle.json`.
2. The source contract now matches the release policy: the browser defaults to the pinned published static shelter-map bundle unless an explicit `NEXT_PUBLIC_DATA_BASE` override is supplied.

## DISAGREEMENTS

1. None.
