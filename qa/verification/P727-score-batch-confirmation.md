# P727 score-batch confirmation

## root

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## git before change

```text
27901f41f58776e17595be14c0d8e0eae5aae3a8
27901f41f58776e17595be14c0d8e0eae5aae3a8	refs/heads/main
```

## evidence path ignore check

```text
exit_code=1
```

## focused tests

```text
.....................................                                    [100%]
37 passed in 23.82s
```

## direct run.py score-batch refusal

```text
{
  "errors": [
    "limited score-batch requires --confirm-score-batch-run after owner approval"
  ],
  "ok": false
}
exit_code=1
```

## direct module refusal

```text
{
  "errors": [
    "limited score-batch requires --confirm-score-batch-run after owner approval"
  ],
  "ok": false
}
exit_code=1
```

## scratch path after refusal

```text
qa_p726_exists=False
```

## collect only

```text
520 tests collected in 10.49s
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

1. `run.py score-batch` and `python -m pipeline.score_batch` previously allowed a limited non-dry score batch with only `--postal-universe` and `--output-dir`; that is still a scoring run and now requires `--confirm-score-batch-run`.
2. Dry-run behavior stays ungated, and full-batch behavior stays governed by the existing stricter `--confirm-full-batch` path.
3. Test collection increased from 517 to 520 because this change adds three score-batch guard tests.

## DISAGREEMENTS

1. None.
