# P615 empty-panel honesty

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web UI copy/wiring change. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
The no-selection shelter-map panel now tells users before search that the published bundle is tied to the frozen June 2020 address universe and, when manifest provenance is loaded, shows the manifest-derived locked-score coverage line. This brings the empty score panel up to the same honesty standard as the title card without hardcoding coverage counts into ScoreCard.
```

## Focused tests

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  47 passed (47)
   Start at  08:45:16
   Duration  6.10s (transform 1.98s, setup 0ms, import 2.39s, tests 1.18s, environment 1ms)
```

## Full web test

```text
npm --prefix web test

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  158 passed (158)
   Start at  08:45:54
   Duration  61.53s (transform 2.38s, setup 0ms, import 5.22s, tests 23.79s, environment 13ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 14.84s
```

## Repository integrity

```text
python scripts/check_repo_integrity.py
Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Evidence path ignore check

```text
git check-ignore -v qa/verification/P615-empty-panel-honesty.md
Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Protected diff

```text
git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'
Write-Output "exit=$LASTEXITCODE"
exit=0
```

## Diff stat before commit

```text
web/app/page.tsx                                | 5 +++++
web/lib/__tests__/accessibility-render.test.tsx | 6 ++++++
web/lib/__tests__/score-card-copy.test.ts       | 3 +++
3 files changed, 14 insertions(+)
```

## FINDINGS

1. Before P615, the first-view title card carried both the frozen-address-universe and locked-score coverage caveats, but the empty shelter-map panel only told users what to search for.
2. The empty panel now repeats the address-universe caveat and uses the existing manifest-derived locked-score coverage line when available, keeping the caveat tied to bundle provenance rather than hardcoded score counts in the component.
3. This is a small user-visible honesty improvement; it does not change score values, exported data, public artifacts, protected QA evidence, deployment state, or locked weights.

## DISAGREEMENTS

1. None.
