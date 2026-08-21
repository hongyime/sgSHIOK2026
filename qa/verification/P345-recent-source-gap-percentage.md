# P345 Recent-Source Gap Percentage

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
P19 evidence:
combined_recent_completion_signal.missing_rows = 8
combined_recent_completion_signal.rows_with_postal = 976
combined_recent_completion_signal.row_miss_rate = 0.008197
batch_plan.RECENT_PUBLIC_SOURCE_GAP_SAMPLE.missing_pct = 0.819672
Arithmetic: 8 / 976 * 100 = 0.819672131147541%
Rounded browser copy: 0.82%
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  13:29:42
   Duration  2.36s (transform 1.22s, setup 0ms, import 1.59s, tests 410ms, environment 1ms)
```

```text
uv run pytest "C:\sgSHIOK2026\tests\test_readme.py" "C:\sgSHIOK2026\tests\test_agent_docs.py" "C:\sgSHIOK2026\tests\test_production_readiness.py" -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 30 items

tests\test_readme.py ....                                                [ 13%]
tests\test_agent_docs.py .                                               [ 16%]
tests\test_production_readiness.py .........................             [100%]

======================== 30 passed in 61.15s (0:01:01) ========================
```

```text
python "C:\sgSHIOK2026\scripts\check_repo_integrity.py"; $code=$LASTEXITCODE; Write-Output "EXIT_CODE=$code"; exit $code
repo_integrity=ok
EXIT_CODE=0
```

```text
git -C "C:\sgSHIOK2026" diff -- "pipeline/config/weights.yaml"; Write-Output "WEIGHTS_DIFF_EXIT=$LASTEXITCODE"
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The browser and README recent-source disclosure carried the measured count but not the measured miss-rate percentage, making the current-source gap harder to size quickly.
2. Agent and readiness policy prose carried the same count-only phrase, while structured batch/readiness data already exposed `missing_pct: 0.819672`.

## Disagreements

1. None.
