# P352 Shelter-Map Smoke Locked-Score Check

## Scope

Operator browser-smoke output now exposes `shelter_map_has_locked_score` as the shelter-map-facing scored-state check, while preserving `score_has_max_denominator` as a compatibility alias.

## Commands

```text
npm --prefix web test -- --runInBand lib/__tests__/deployment.test.ts
python scripts/check_repo_integrity.py
git diff -- pipeline/config/weights.yaml
```

## Output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  14:04:33
   Duration  539ms (transform 72ms, setup 0ms, import 92ms, tests 18ms, environment 0ms)
```

```text
repo_integrity=ok
EXIT=0
```

```text
EXIT=0
```

## FINDINGS

1. Browser-smoke already had shelter-map panel aliases, but the scored-state check still only exposed the legacy `score_has_max_denominator` field as canonical output.
2. The existing decisions record explicitly preserves legacy score-panel keys for compatibility, so the change adds a shelter-map-named alias rather than removing the old field.

## DISAGREEMENTS

1. None.
