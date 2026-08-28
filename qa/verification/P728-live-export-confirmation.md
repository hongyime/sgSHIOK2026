# P728 live export confirmation

## root

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## git before change

```text
3f8598bf4b40d59980f302f4a3ec04600fe98089
3f8598bf4b40d59980f302f4a3ec04600fe98089	refs/heads/main
```

## evidence path ignore check

```text
exit_code=1
```

## focused tests

```text
........................................................................ [ 85%]
............                                                             [100%]
84 passed in 180.77s (0:03:00)
```

## direct run.py export live-score refusal

```text
{
  "errors": [
    "live score export requires --confirm-live-score-export after owner approval; use --records-dir for pre-scored re-export"
  ],
  "ok": false
}
exit_code=1
```

## direct module export live-score refusal

```text
{
  "errors": [
    "live score export requires --confirm-live-score-export after owner approval; use --records-dir for pre-scored re-export"
  ],
  "ok": false
}
exit_code=1
```

## records-dir path remains non-live-scoring

```text
{
  "errors": [
    "score batch chunks directory not found: C:\\sgSHIOK2026\\qa\\p728\\missing_records\\chunks"
  ],
  "ok": false
}
exit_code=1
```

## scratch path after refusal

```text
qa_p728_exists=False
```

## collect only

```text
524 tests collected in 21.36s
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

1. `pipeline.export export` previously called `score_postals` whenever `--records-dir` was omitted, including the default limited export path; that is live scoring and now requires `--confirm-live-score-export`.
2. `--records-dir` re-export remains outside the live-scoring guard and still fails on missing chunks rather than demanding a scoring confirmation.
3. Test collection increased from 520 to 524 because this change adds four live-export guard tests.

## DISAGREEMENTS

1. None.
