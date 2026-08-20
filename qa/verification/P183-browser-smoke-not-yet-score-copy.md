# P183 Browser Smoke Not-Yet-Scored Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Ignore Check

```text
check_ignore_exit=1
```

## Finding

The browser smoke harness still accepted an older not-yet-scored phrase:
`No score` plus `needs usable location evidence`. The rendered app now describes this state as a frozen-bundle scoring state with `No full score in this bundle` and `Awaiting bundle score`.

## Evidence

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:50:    expect(smokeSource).toContain('summary.cardText.includes("No full score in this bundle")');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:51:    expect(smokeSource).toContain('summary.cardText.includes("Awaiting bundle score")');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:52:    expect(smokeSource).not.toContain("needs usable location evidence");
C:\sgSHIOK2026\web\app\page.tsx:705:  if (score.state === "NOT_YET_SCORED") return ["No full score in this bundle", "Awaiting bundle score"];
C:\sgSHIOK2026\web\app\page.tsx:1090:        ? "No full score in this bundle"
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:577:    summary.cardText.includes("No full score in this bundle") ||
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:578:    summary.cardText.includes("Awaiting bundle score");
```

## Scope

This is browser-smoke verification alignment only. It does not change app rendering, scoring, export, input artifacts, public data, deployment, or `pipeline/config/weights.yaml`.

## FINDINGS

1. Browser smoke still had a stale not-yet-scored detector for `needs usable location evidence`.
2. The smoke harness now checks the current frozen-bundle state copy: `No full score in this bundle` / `Awaiting bundle score`.

## DISAGREEMENTS

1. None.
