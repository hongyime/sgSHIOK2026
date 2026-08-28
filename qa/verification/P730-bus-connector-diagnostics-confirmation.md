# P730 bus connector diagnostics confirmation

## root

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## git before change

```text
b4e1e9f064133b7585968d0116cafb912e86c265
b4e1e9f064133b7585968d0116cafb912e86c265	refs/heads/main
```

## focused tests initial failure

```text
...........F.........................                                    [100%]
================================== FAILURES ===================================
_____ test_diagnose_bus_connectors_cli_confirmed_run_reaches_diagnostics ______
E       NameError: name 'json' is not defined. Did you forget to import 'json'
1 failed, 36 passed in 4.72s
```

## direct run.py bus-connector-diagnostics refusal

```text
{
  "errors": [
    "bus connector diagnostics requires --confirm-bus-connector-diagnostics after owner approval"
  ]
}
exit_code=2
```

## direct module refusal

```text
{
  "errors": [
    "bus connector diagnostics requires --confirm-bus-connector-diagnostics after owner approval"
  ]
}
exit_code=2
```

## focused tests after test import fix

```text
.....................................                                    [100%]
37 passed in 6.52s
```

## scratch path after refusal

```text
qa_p730_exists=False
```

## evidence path ignore check

```text
exit_code=1
```

## collect only

```text
528 tests collected in 11.61s
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

1. `bus-connector-diagnostics` is runner-exposed and calls current route scoring logic through `score_postal_row`; explicit output paths alone were enough to run it.
2. The command now requires `--confirm-bus-connector-diagnostics` after explicit outputs are provided and before `build_diagnostics` loads inputs.
3. Test collection increased from 526 to 528 because this change adds two bus connector diagnostics confirmation tests.

## DISAGREEMENTS

1. None.
