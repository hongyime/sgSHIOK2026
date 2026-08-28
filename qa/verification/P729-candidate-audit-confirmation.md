# P729 candidate audit confirmation

## root

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## git before change

```text
df2aed7acaa8daa542106f5d6e9bbfa23db6900d
df2aed7acaa8daa542106f5d6e9bbfa23db6900d	refs/heads/main
```

## evidence path ignore check

```text
exit_code=1
```

## focused tests

```text
.............................                                            [100%]
29 passed in 4.53s
```

## direct run.py candidate-audit refusal

```text
{
  "errors": [
    "candidate audit requires --confirm-candidate-audit after owner approval"
  ],
  "ok": false
}
exit_code=2
```

## direct module refusal

```text
{
  "errors": [
    "candidate audit requires --confirm-candidate-audit after owner approval"
  ],
  "ok": false
}
exit_code=2
```

## scratch path after refusal

```text
qa_p729_exists=False
```

## collect only

```text
526 tests collected in 9.01s
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

1. `candidate-audit` is a runner-exposed script that calls `score_postals`; it previously required only `--postal` and `--output`, so a diagnostic audit could run scoring without explicit owner approval.
2. The existing output-overwrite guard still runs before the new confirmation guard.
3. Test collection increased from 524 to 526 because this change adds two candidate-audit confirmation tests.

## DISAGREEMENTS

1. None.
