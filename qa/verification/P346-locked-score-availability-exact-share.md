# P346 Locked-Score Availability Exact Share

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
Current published manifest counts:
record_count = 124443
SCORED = 95157
not_full = 124443 - 95157 = 29286
share = 29286 / 124443 * 100 = 23.534467991929637%
Rounded browser copy = 23.5%, roughly a quarter
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/locked-score-availability.test.ts lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  13:35:07
   Duration  1.97s (transform 415ms, setup 0ms, import 599ms, tests 305ms, environment 2ms)
```

```text
uv run pytest "C:\sgSHIOK2026\tests\test_readme.py" -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 4 items

tests\test_readme.py ....                                                [100%]

============================== 4 passed in 1.49s ==============================
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

1. The browser already derived no-full-score availability from manifest counts, but collapsed the current 23.534% share into only `roughly a quarter`.

## Disagreements

1. None.
