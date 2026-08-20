# P74 Visible Night-Lighting Status Evidence

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Current Head At Start

```text
73052ce fix: disclose night-lighting source status
21fc772 fix: guard night-lighting overlay readiness
749926d fix: load env for batch-plan credential readiness
3a8ef33 fix: report API credential readiness
1a358f4 docs: align MCST proxy terminology
c66a6df fix: clarify MCST proxy wording in universe caveat
73052ce292e6f06f0538b8231e611ae83439b0e6
73052ce292e6f06f0538b8231e611ae83439b0e6	refs/heads/main
```

## Focused Web Test

Command:

```text
npm --prefix web test -- route-evidence-map-interaction
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  18:01:46
   Duration  1.12s (transform 390ms, setup 0ms, import 118ms, tests 378ms, environment 0ms)
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "repo_integrity_exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Diff And Weight Guard

Command:

```text
git diff --check; Write-Output "diff_check_exit=$LASTEXITCODE"; git diff -- pipeline/config/weights.yaml; Write-Output "weights_exit=$LASTEXITCODE"
```

Output:

```text
diff_check_exit=0
weights_exit=0
```

## FINDINGS

1. Before P74, the night-lighting overlay status was available to screen-reader users through the map summary and to debug tooling, but sighted users could turn the layer on and see no visible loading, unavailable, empty, or in-view status.
2. P74 reuses the existing `nightLightingSummary()` text for the visible map status, so the visual and non-visual status contracts stay aligned.
3. The change is browser-only. It does not modify the lamp artifact, public data, inputs, scoring, exports, deployment, or locked weights.

## DISAGREEMENTS

1. None.
