# P731 export confirmation

## root

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## git before change

```text
b47d1b29aba224f004265d362bfb82807d64dc54
b47d1b29aba224f004265d362bfb82807d64dc54	refs/heads/main
```

## focused tests initial failure

```text
...........F............... [ 82%]
...............                                                          [100%]
================================== FAILURES ===================================
_______ test_export_cli_requires_explicit_output_before_loading_records _______
E       AssertionError: assert {'errors': ['..., 'ok': False} == {'errors': ['..., 'ok': False}
1 failed, 86 passed in 322.56s (0:05:22)
```

## direct missing-output refusal after ordering fix

```text
{
  "errors": [
    "export requires explicit --output; choose a new bundle directory"
  ],
  "ok": false
}
exit_code=1
```

## direct records-dir export confirmation refusal

```text
{
  "errors": [
    "export requires --confirm-export after owner approval; choose a new bundle directory"
  ],
  "ok": false
}
exit_code=1
```

## focused tests after ordering fix

```text
........................................................................ [ 82%]
...............                                                          [100%]
87 passed in 347.78s (0:05:47)
```

## scratch path after refusal

```text
qa_p731_exists=False
```

## evidence path ignore check

```text
exit_code=1
```

## collect only

```text
531 tests collected in 51.34s
```

## repo integrity

```text
repo_integrity=ok
exit_code=0
```

## diff check

```text
exit_code=0
```

## protected path diff check

```text
exit_code=0
```

## FINDINGS

1. `pipeline.export export --records-dir` avoided live scoring but could still write a new bundle without an explicit export approval flag.
2. Every `export` action now requires `--confirm-export`; live-scoring export still additionally requires `--confirm-live-score-export`.
3. The export preflight reports missing or non-empty output before approval errors, preserving the earliest concrete refusal.
4. Test collection increased from 528 to 531 because this change adds three export confirmation tests.

## DISAGREEMENTS

1. None.
