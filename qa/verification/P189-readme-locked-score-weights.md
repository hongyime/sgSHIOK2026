# P189 README Locked Score Weights

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Findings

1. The README repo map still described `pipeline/config/weights.yaml` as `locked composite-score weights`.
2. Product-facing and operator-facing copy now consistently makes the locked 0-to-100 value secondary as the `locked score`; the README repo-map label should not reintroduce composite-first wording.

## Verification

```text
...                                                                      [100%]
3 passed in 1.52s
```

```text
repo_integrity=ok
integrity_exit=0
```

```text
weights_diff_start
weights_diff_end
```

```text
C:\sgSHIOK2026\tests\test_readme.py:45:    assert "`pipeline/config/weights.yaml` — locked score weights." in normalized
C:\sgSHIOK2026\tests\test_readme.py:46:    assert "locked composite-score weights" not in normalized
C:\sgSHIOK2026\README.md:60:- `pipeline/config/weights.yaml` — locked score weights.
C:\sgSHIOK2026\README.md:82:> Read README.md, CLAUDE.md, decisions.md, pipeline/config/weights.yaml, and
```

## FINDINGS

1. README was the remaining tracked current documentation surface using `locked composite-score weights` for the locked score weights file.

## DISAGREEMENTS

1. None.
