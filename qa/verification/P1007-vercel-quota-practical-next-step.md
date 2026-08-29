# P1007 Vercel Quota Practical Next Step

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

### git rev-parse HEAD; git ls-remote origin refs/heads/main

```text
80aa429462d1290a7151045b53629f6b73c42017
80aa429462d1290a7151045b53629f6b73c42017	refs/heads/main
```

### Existing direct-postal search bypass

```text

  web\app\page.tsx:2435:    if (!query.trim()) return;
  web\app\page.tsx:2436:
> web\app\page.tsx:2437:    const directPostal = normalizePostal(query);
  web\app\page.tsx:2438:    if (directPostal) {
  web\app\page.tsx:2439:      setSearchAttempted(false);
  web\app\page.tsx:2440:      await loadSelection({
  web\app\page.tsx:2441:        BUILDING: `Postal ${directPostal}`,
  web\app\page.tsx:2442:        ROAD_NAME: "",
  web\app\page.tsx:2443:        POSTAL: directPostal,
  web\app\page.tsx:2452:      setResults([]);
  web\app\page.tsx:2453:      setSearchAttempted(false);
> web\app\page.tsx:2454:      setError("Enter at least 3 characters for OneMap search, or use a 6-digit postal code.");
  web\app\page.tsx:2455:      return;
  web\app\page.tsx:2456:    }
  web\app\page.tsx:2457:
  web\app\page.tsx:2458:    setLoading(true);
  web\app\page.tsx:2459:    setError(null);
  web\app\page.tsx:2460:    setResults([]);
  web\app\page.tsx:2462:
  web\app\page.tsx:2463:    try {
> web\app\page.tsx:2464:      const data = await searchOneMapLocations(query);
  web\app\page.tsx:2465:      setResults(data.results);
  web\app\page.tsx:2466:    } catch (err) {
  web\app\page.tsx:2467:      if (err instanceof OneMapSearchError && err.status === 429) {
  web\app\page.tsx:2468:        setError("OneMap search is busy. Try again in a moment, or enter a 6-digit postal code.");
  web\app\page.tsx:2469:        return;
  web\app\page.tsx:2470:      }

```

### git check-ignore -v qa/verification/P1007-vercel-quota-practical-next-step.md

```text
p1007_check_ignore_exit=1
```

## Vercel Connector Output

### get_project

```text
{
  "id": "prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE",
  "name": "sgshiok",
  "framework": "nextjs",
  "accountId": "team_ARK7HKobyCMp0PCArQTLxbz6",
  "createdAt": 1785037769440,
  "updatedAt": 1788000403294,
  "nodeVersion": "24.x",
  "live": false,
  "latestDeployment": {
    "id": "dpl_D9yuEBCYuK2Z54j2b6JCUyaGj2mn",
    "url": "sgshiok-mw82e61zu-theprawnvercel.vercel.app",
    "createdAt": 1787999758240,
    "readyState": "READY",
    "target": "production"
  },
  "domains": [
    "sgshiok.hong-yi.me",
    "sgshiok.vercel.app",
    "sgshiok-theprawnvercel.vercel.app",
    "sgshiok-git-main-theprawnvercel.vercel.app"
  ]
}
```

## FINDINGS

1. Six-digit postal-code searches already avoid `/api/onemap-search`; `handleSearch()` loads the selected postal directly from the static bundle when `normalizePostal(query)` succeeds.
2. The Vercel project metadata reports `live: false` while still exposing a latest READY production deployment. Together with P1006's live header check, this reinforces that dashboard quota relief now depends on an owner-level Vercel action, not another local commit alone.
3. The next practical free-tier decision is operational: either deploy current `main` to make the committed cache/crawler reductions active, pause/protect the project if quota must stop immediately, or accept that local code changes will not affect the current live deployment.

## DISAGREEMENTS

1. I do not recommend adding more speculative request micro-optimizations before making the already-committed reductions live or obtaining a dashboard/path-level traffic breakdown that explains the quota counter.
