# P855 Nearby-Greenery Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Route details now label the walk-adjacent greenery signal as nearby greenery rather than greenery proxy, while retaining the heat-proxy limitation.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:42:28
   Duration  9.24s (transform 3.24s, setup 0ms, import 3.84s, tests 1.54s, environment 2ms)
```

### rg -n "Greenery proxy|greenery proxy|Nearby greenery|nearby greenery|Heat proxy" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:1315:      ? `Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}; nearby greenery ${formatDistance(score.paths.shade_m)}.`
C:\sgSHIOK2026\web\app\page.tsx:1334:    routeDetailItems.push({ label: "Nearby greenery", value: `${shadeProxyPct}%` });
C:\sgSHIOK2026\web\app\page.tsx:1336:      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
C:\sgSHIOK2026\web\app\page.tsx:1440:            "Heat also includes sparse nearby greenery, so SHIOK shows covered-walkway ratio first.",
C:\sgSHIOK2026\web\app\page.tsx:2483:          <p>Heat proxy: shelter plus sparse nearby greenery, not measured temperature</p>
C:\sgSHIOK2026\web\lib\__tests__\subscore-ranking.test.ts:25:      { id: "heat", label: "Heat proxy score factor" },
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:445:    expect(source).toContain("Heat proxy: shelter plus sparse nearby greenery, not measured temperature");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:478:    expect(source).not.toContain("Heat proxy: shelter + sparse NParks greenery");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:571:  it("keeps nearby greenery and access link in a subtle walk-details strip, not a duplicate metric row", () => {
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:581:    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Nearby greenery\"");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:582:    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Greenery proxy\"");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:585:      tsxSource.indexOf('routeDetailItems.push({ label: "Nearby greenery"')
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:588:      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:590:    expect(tsxSource).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:714:      '{ id: "heat", label: "Heat proxy score factor" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:735:      '{ id: "heat", label: "Heat proxy evidence" }'
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:812:    expect(source).toContain("Heat also includes sparse nearby greenery, so SHIOK shows covered-walkway ratio first.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:813:    expect(source).not.toContain("Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:814:    expect(source).toContain("Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:815:    expect(source).not.toContain("greenery proxy ${formatDistance(score.paths.shade_m)}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:823:    expect(source).not.toContain('label: "Heat proxy"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:855:    expect(proposalSource).toContain("Heat: shelter plus sparse NParks greenery proxy");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:629:    expect(breakdownHtml).not.toContain(">Heat proxy<");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:637:      "Heat also includes sparse nearby greenery, so SHIOK shows covered-walkway ratio first."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:641:    expect(html).toContain("Heat proxy evidence: covered 149 m; nearby greenery 23 m.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:644:      "Nearby greenery uses sparse NParks walk-adjacent geometry for heat only; it is not measured temperature or Leaf Area Index."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:646:    expect(html).not.toContain(">Greenery proxy</strong>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:647:    expect(html).not.toContain("greenery proxy");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:648:    expect(html).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=1
```

### git check-ignore -v qa/verification/P855-nearby-greenery-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The route-detail strip still exposed `Greenery proxy` as a displayed row label, which named the modelling role rather than the user-visible walk context.

## DISAGREEMENTS

1. None.
