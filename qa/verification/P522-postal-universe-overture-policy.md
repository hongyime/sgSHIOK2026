# P522 Postal-universe Overture policy help

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
334fb67b11cd9af02839d55649624d8c44fce2b0
334fb67b11cd9af02839d55649624d8c44fce2b0	refs/heads/main
```

## Evidence path ignore check

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_postal_universe.py -q
```

Output:

```text
................                                                         [100%]
16 passed in 6.29s
```

## Help probe

Command:

```text
uv run python -m pipeline.postal_universe --help | Select-String -Pattern "Overture|candidate-only|address-registry|scoring"
```

Output:

```text

                          [--summary SUMMARY] [--include-overture-candidate]
                          [--overture-candidate OVERTURE_CANDIDATE]
  --include-overture-candidate
                        Include archived Overture Addresses SG as candidate-only postal-universe evidence; does not approve scoring or address-registry use and does not change defaults.
  --overture-candidate OVERTURE_CANDIDATE
                        Override archived Overture postcode-candidate parquet path.

```

## FINDINGS

1. `pipeline.postal_universe --include-overture-candidate` still used generic Overture candidate wording, even though the settled policy is candidate-only evidence and not scoring or address-registry approval.
2. The CLI help and generated summary warning now carry the same candidate-only boundary as `pipeline.overture_addresses`.

## DISAGREEMENTS

1. None.
