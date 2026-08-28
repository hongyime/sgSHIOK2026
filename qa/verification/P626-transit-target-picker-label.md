# P626 transit target picker label

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web accessibility copy change. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
The transit picker's outer accessible name now says "Transit target picker" instead of "Transit stop picker", matching its visible "Nearby transit targets" header and the MRT/LRT-exit-or-bus-stop model.
```

## Copy search

```text
rg -n "Transit stop picker|Transit target picker|Nearby transit targets|Nearby transit stops" web/components/transit-stop-picker.tsx web/lib/__tests__/transit-stop-picker.test.tsx web/lib/__tests__/score-card-copy.test.ts
web/lib/__tests__/score-card-copy.test.ts:125:    expect(pickerSource).toContain("Nearby transit targets");
web/lib/__tests__/score-card-copy.test.ts:126:    expect(pickerSource).toContain('aria-label="Transit target picker"');
web/lib/__tests__/score-card-copy.test.ts:127:    expect(pickerSource).toContain('aria-label="Nearby transit targets"');
web/lib/__tests__/score-card-copy.test.ts:128:    expect(pickerSource).not.toContain('aria-label="Transit stop picker"');
web/lib/__tests__/score-card-copy.test.ts:129:    expect(pickerSource).not.toContain('aria-label="Nearby transit stops"');
web/components/transit-stop-picker.tsx:115:    <div className={styles.pickerShell} aria-label="Transit target picker">
web/components/transit-stop-picker.tsx:116:      <div className={styles.pickerHeader}>Nearby transit targets</div>
web/components/transit-stop-picker.tsx:121:        aria-label="Nearby transit targets"
web/lib/__tests__/transit-stop-picker.test.tsx:310:    expect(html).toContain("Nearby transit targets");
web/lib/__tests__/transit-stop-picker.test.tsx:311:    expect(html).toContain('aria-label="Transit target picker"');
web/lib/__tests__/transit-stop-picker.test.tsx:312:    expect(html).toContain('aria-label="Nearby transit targets"');
web/lib/__tests__/transit-stop-picker.test.tsx:314:    expect(html).not.toContain('aria-label="Transit stop picker"');
web/lib/__tests__/transit-stop-picker.test.tsx:315:    expect(html).not.toContain('aria-label="Nearby transit stops"');
```

## Focused tests

```text
npm --prefix web test -- lib/__tests__/transit-stop-picker.test.tsx lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  49 passed (49)
   Start at  09:39:58
   Duration  5.00s (transform 1.10s, setup 0ms, import 1.53s, tests 497ms, environment 2ms)
```

## Full web test

```text
npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  09:40:23
   Duration  31.64s (transform 2.04s, setup 0ms, import 3.91s, tests 10.96s, environment 11ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 16.60s
```

## Repository integrity

```text
python scripts/check_repo_integrity.py
Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Evidence path ignore check

```text
git check-ignore -v qa/verification/P626-transit-target-picker-label.md
Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Protected diff

```text
git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'
Write-Output "exit=$LASTEXITCODE"
exit=0
```

## Diff stat before commit

```text
web/components/transit-stop-picker.tsx         | 2 +-
web/lib/__tests__/score-card-copy.test.ts      | 2 ++
web/lib/__tests__/transit-stop-picker.test.tsx | 2 ++
3 files changed, 5 insertions(+), 1 deletion(-)
```

## FINDINGS

1. The transit picker's visible header and chip group already said "Nearby transit targets", but the outer accessible name still said "Transit stop picker".
2. P626 aligns the accessible picker name with the transit-target model used for MRT/LRT exits and bus stops.
3. This is an accessibility copy change only; no score values, route geometry, transit data, exported artifacts, deployment, or locked weights changed.

## DISAGREEMENTS

1. None.
