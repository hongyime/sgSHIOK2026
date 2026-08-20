# P237 README Score Availability

## Working root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Existing browser disclosure evidence

```text
C:\sgSHIOK2026\web\lib\locked-score-availability.ts:48:  const pctText = pct >= 0.22 && pct <= 0.28 ? "roughly a quarter" : `${Math.round(pct * 100)}%`;
C:\sgSHIOK2026\web\lib\locked-score-availability.ts:51:    ? `do not show a full score: ${breakdown}`
C:\sgSHIOK2026\web\lib\locked-score-availability.ts:52:    : "do not show a full score";
C:\sgSHIOK2026\web\lib\locked-score-availability.ts:53:  return `Locked score availability: ${formatWholeNumber(scored)} full scores out of ${formatWholeNumber(
C:\sgSHIOK2026\web\lib\__tests__\locked-score-availability.test.ts:33:      "Locked score availability: 95,157 full scores out of 124,443; 29,286 records (roughly a quarter) do not show a full score: 18,983 with partial shelter-map evidence, 9,827 beyond current transit range, and 476 awaiting scoring."
```

## Evidence path ignore check

```text
exit=1
```

## Focused README test

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 3 items

tests\test_readme.py ...                                                 [100%]

============================== 3 passed in 1.09s ==============================
```

## Repo integrity

```text
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
```

## FINDINGS

1. The browser already discloses that roughly a quarter of active-bundle records do not show a full locked score.
2. README onboarding did not carry the same limitation beside the active bundle path; it now records 95,157 full scores out of 124,443 and 29,286 non-full records.

## DISAGREEMENTS

1. None.
