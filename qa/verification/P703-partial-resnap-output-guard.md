# P703 partial resnap output guard

## Working root

```text
C:\sgSHIOK2026
```

## Existing-output guard probe

```text
{
  "errors": [
    "refusing to overwrite existing analysis output: qa\\partial_resnap_rescore_sample.json"
  ],
  "ok": false
}
exit=1
```

## Focused tests

```text
.....                                                                    [100%]
5 passed in 11.19s
```

## Test collection

```text
476 tests collected in 6.84s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Diff hygiene

```text
exit=0
```

## Protected-path guard

```text
exit=0
```

## Evidence ignore check

```text
exit=1
```

## FINDINGS

1. `scripts/partial_resnap_rescore.py` required confirmation and explicit `--output`, but it did not reject an existing explicit output before the bounded rescore report path. That could waste rescore time and then overwrite a historical report.
2. The CLI now refuses an existing explicit output before `build_report()` can run, and the final report write uses the shared non-overwriting writer.

## DISAGREEMENTS

1. None.
