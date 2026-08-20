# P230 Source Comment Shelter-Map Language

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Commands

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

```text
C:\sgSHIOK2026\scripts\audit_560234_shelter.py:380:- The current shelter lambda is also too weak for this case: lambda 0.6 leaves the sheltered route identical to shortest, while lambda 1.5+ finds a valid +55 m route within the 25% detour cap and lifts covered ratio from 3.1% to 13.9%.
C:\sgSHIOK2026\tests\test_agent_docs.py:21:    assert "preview-route evidence" not in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:23:    assert "route display is score" not in normalized
C:\sgSHIOK2026\scripts\analysis\analyze_heat_presentation.py:74:        "verdict": "Acceptable honesty copy for preview route evidence.",
C:\sgSHIOK2026\web\app\page.tsx:326: *   - the sheltered route and shortest route are the same (nothing to compare)
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 0 items

============================ no tests ran in 1.76s ============================
ERROR: not found: C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
(no match in any of [<Dir __tests__>])
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 1 item

tests\test_agent_docs.py .                                               [100%]

============================== 1 passed in 1.07s ==============================
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  05:40:25
   Duration  935ms (transform 124ms, setup 0ms, import 161ms, tests 73ms, environment 1ms)
```

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:190:    expect(source).not.toContain("sheltered route and shortest route");
C:\sgSHIOK2026\tests\test_agent_docs.py:21:    assert "preview-route evidence" not in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:23:    assert "route display is score" not in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:24:    assert "preview route evidence" not in normalized
```

```text
exit=1
```

```text
scripts/analysis/analyze_heat_presentation.py | 2 +-
tests/test_agent_docs.py                      | 1 +
web/app/page.tsx                              | 2 +-
web/lib/__tests__/score-card-copy.test.ts     | 1 +
4 files changed, 4 insertions(+), 2 deletions(-)
```

## Findings

1. Two maintained source comments still used stale route-first wording after the P229 doc guard: `web/app/page.tsx` said the sheltered route and shortest route were the same, and `scripts/analysis/analyze_heat_presentation.py` called preview shelter-map evidence preview route evidence.
2. The stale text was explanatory only. No runtime code, scoring, export, input, public data, deployment, or locked weights changed.

## Disagreements

1. None.
