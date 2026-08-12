# P6 Bus Honesty And Rerun Timing Verification

Base: `1bc9f19`

## Scope

No filesystem access occurred outside `C:\shiok`. No files outside `C:\shiok` were deleted.

## Strand 1: Bus Fallback Provenance Reaches Client

Command:

```powershell
@'
import gzip, json
from pathlib import Path
base = Path('web/public/data/generated_20260805_prefer_scored_routed/scores')
for path in sorted(base.glob('*.json*')):
    if path.name in {'index.json','prefix-index.json'}: continue
    opener = gzip.open if path.suffix == '.gz' else open
    try:
        with opener(path, 'rt', encoding='utf-8') as f:
            records = json.load(f)
    except Exception:
        continue
    for record in records:
        prov = record.get('provenance') if isinstance(record.get('provenance'), dict) else {}
        fallback = prov.get('direct_bus_fallback') if isinstance(prov, dict) else None
        if record.get('postal') == '530227':
            print('file=', path.name)
            print(json.dumps({
                'postal': record.get('postal'),
                'state': record.get('state'),
                'total': record.get('total'),
                'bus': (record.get('subscores') or {}).get('bus'),
                'direct_bus_fallback': fallback,
            }, indent=2, sort_keys=True))
            raise SystemExit
print('NO_MATCH')
'@ | python -
```

Output:

```text
file= ANG_MO_KIO_PART_001.json
{
  "bus": 0.0,
  "direct_bus_fallback": {
    "best_expected_wait_min": 0.411,
    "candidate_count": 3,
    "coordinate_tolerance_m": 5.0,
    "detour_ratio_threshold": 3.0,
    "geometry": "straight_line_origin_to_bus_stop_not_pedestrian_route",
    "min_extra_m_threshold": 100.0,
    "min_missing_m_threshold": 50.0,
    "nearest_direct_m": 99.1,
    "nearest_graph_routed_m": 396.2,
    "radius_m": 300.0,
    "reason": "implausible_graph_route_to_datamall_bus_stop_within_direct_radius",
    "reason_counts": {
      "implausible_graph_route_to_datamall_bus_stop_within_direct_radius": 3
    },
    "selection_radius_m": 305.0,
    "shortcut_ratio_threshold": 0.5,
    "untrusted_subscores": [
      "rain",
      "heat",
      "crossing"
    ]
  },
  "postal": "530227",
  "state": "SCORED",
  "total": 31.9
}
```

## Strand 1 Rendered Evidence

Command: browser DOM capture at `380x780` against local production server.

Output:

```json
{
  "contradiction_530227": {
    "url": "http://127.0.0.1:3135/?postal=530227",
    "viewport": { "width": 380, "height": 780 },
    "hasPostal": true,
    "reasonList": {
      "x": 23,
      "y": 464.34375,
      "width": 330,
      "height": 50,
      "display": "grid",
      "visibility": "visible",
      "opacity": "1",
      "text": "Nearby bus evidence not route-verified3 direct bus candidates found; nearest 99 m; 0.4 min best scheduled wait."
    },
    "busRow": {
      "x": 24,
      "y": 720.875,
      "width": 328,
      "height": 71,
      "display": "grid",
      "visibility": "visible",
      "opacity": "1",
      "text": "Bus connectivity3 direct bus candidates found; nearest 99 m; 0.4 min best scheduled wait. Walking network access was not verified, so this sub-score remains 0.020%"
    },
    "stateNote": {
      "x": 23,
      "y": 522.34375,
      "width": 330,
      "height": 62.53125,
      "display": "block",
      "visibility": "visible",
      "opacity": "1",
      "text": "Composite caveat: the bus term remains 0 because nearby bus evidence could not be connected to a verified walking route."
    },
    "containsLimitedBus": false,
    "containsFallbackCopy": true
  },
  "no_fallback_560105": {
    "url": "http://127.0.0.1:3135/?postal=560105",
    "viewport": { "width": 380, "height": 780 },
    "hasPostal": true,
    "reasonList": {
      "x": 23,
      "y": 442.953125,
      "width": 330,
      "height": 35,
      "display": "grid",
      "visibility": "visible",
      "opacity": "1",
      "text": "Limited bus connectivity186 m to transit"
    },
    "busRow": {
      "x": 24,
      "y": 613.953125,
      "width": 328,
      "height": 48,
      "display": "grid",
      "visibility": "visible",
      "opacity": "1",
      "text": "Bus connectivity020%"
    },
    "stateNote": null,
    "containsLimitedBus": true,
    "containsFallbackCopy": false
  }
}
```

## Strand 2 Timing

Command:

```powershell
Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors | Format-List
Get-CimInstance Win32_ComputerSystem | Select-Object TotalPhysicalMemory | Format-List
```

Output:

```text
Name                      : Intel(R) Core(TM) Ultra 5 225U
NumberOfCores             : 12
NumberOfLogicalProcessors : 14

TotalPhysicalMemory : 68172009472
```

Score scratch run wrote four part outputs under `qa\p6_rerun_cost_20260812_102712\score`.

Command:

```powershell
@'
from pathlib import Path
from datetime import datetime
root=Path('qa/p6_rerun_cost_20260812_102712/score')
for part in sorted(root.glob('part*_of04')):
    chunks=sorted((part/'chunks').glob('*.json'))
    if chunks:
        latest=max(p.stat().st_mtime for p in chunks)
        total=sum(p.stat().st_size for p in chunks)
        print(f'{part.name}: chunks={len(chunks)} bytes={total} latest_mtime={datetime.fromtimestamp(latest).isoformat()}')
    else:
        print(f'{part.name}: chunks=0')
'@ | uv run python -
```

Output:

```text
part01_of04: chunks=63 bytes=7037897186 latest_mtime=2026-08-12T23:46:10.900438
part02_of04: chunks=63 bytes=7754607622 latest_mtime=2026-08-13T00:33:52.183177
part03_of04: chunks=63 bytes=6694138243 latest_mtime=2026-08-13T00:31:11.184152
part04_of04: chunks=63 bytes=4624684829 latest_mtime=2026-08-13T01:13:32.808474
```

Measured stage times:

```text
score_start=2026-08-12T10:27:13+08:00
score_end=2026-08-13T01:13:32+08:00
score_seconds=53179
score_duration=14h46m19s
export_start=2026-08-13T01:32:01.4513248+08:00
export_end=2026-08-13T02:23:15.9014161+08:00
export_seconds=3074.45
validate_start=2026-08-13T02:23:25.6379717+08:00
validate_end=2026-08-13T02:24:30.7856144+08:00
validate_seconds=65.148
total_score_export_validate=15h57m18s
observed_peak_worker_rss_bytes=3412643840
observed_peak_worker_rss_gib=3.18
```

Validate output:

```json
{
  "errors": [],
  "file_count": 3768,
  "geometry_postals": 113899,
  "geometry_postals_with_route_segments": 113899,
  "indexed_postals": 124032,
  "input_dir": "C:\\shiok\\qa\\p6_rerun_cost_20260812_102712\\exported_bundle",
  "ok": true,
  "score_prefixes": 530,
  "transit_features": 6011,
  "warnings": []
}
```

## Determinism Comparison

Command:

```powershell
@'
import json, hashlib
from pathlib import Path
active=Path('web/public/data/generated_20260805_prefer_scored_routed')
scratch=Path('qa/p6_rerun_cost_20260812_102712/exported_bundle')
def load(p): return json.loads(p.read_text(encoding='utf-8'))
am=load(active/'manifest.json'); sm=load(scratch/'manifest.json')
print('active_manifest_sha256=' + hashlib.sha256((active/'manifest.json').read_bytes()).hexdigest())
print('scratch_manifest_sha256=' + hashlib.sha256((scratch/'manifest.json').read_bytes()).hexdigest())
for key in ['generated_at','data_as_of']:
    print(f'{key}: active={am.get(key)!r} scratch={sm.get(key)!r}')
for section in ['source_hashes','scoring_fingerprints','scores','geometry','geom','transit']:
    av=(am.get('provenance') or {}).get(section, am.get(section))
    sv=(sm.get('provenance') or {}).get(section, sm.get(section))
    print(f'{section}_equal={av==sv}')
    if section == 'scoring_fingerprints' and av != sv:
        print('active_'+section+'=' + json.dumps(av, sort_keys=True))
        print('scratch_'+section+'=' + json.dumps(sv, sort_keys=True))
'@ | uv run python -
```

Output:

```text
active_manifest_sha256=7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e
scratch_manifest_sha256=af5e38eec376d53f26888c2cb720c2b7b1a24d7f9596a8190ba92d6a1fdc5e19
generated_at: active='2026-08-05T14:00:15.974693+00:00' scratch='2026-08-12T18:23:00.419296+00:00'
data_as_of: active='2026-08-01T21:49:20.977890+00:00' scratch='2026-08-01T21:49:20.977890+00:00'
source_hashes_equal=True
scoring_fingerprints_equal=False
active_scoring_fingerprints={"pipeline\\config\\params.yaml": "a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1", "pipeline\\config\\weights.yaml": "5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec", "pipeline\\routing.py": "8fb450690bf9d024b9c43dd02476a7d4e73805cd3b59b6ecbc2022dcc1a69e7c", "pipeline\\scoring.py": "255b4a225a625848e150673b01bccfbc679eea668a254667a9b01c2179bf610c", "pipeline\\scoring_integration.py": "a7b4a8cbaefb4731e6711ffb8595e3241de654032e887691eef7bc91f5b975ae"}
scratch_scoring_fingerprints={"pipeline\\config\\params.yaml": "a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1", "pipeline\\config\\weights.yaml": "5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec", "pipeline\\routing.py": "3d16db9f83b0bf566844570217044a2adbda968d3e7a25b586cd5ebb1b18694c", "pipeline\\scoring.py": "255b4a225a625848e150673b01bccfbc679eea668a254667a9b01c2179bf610c", "pipeline\\scoring_integration.py": "1e55b6fe991730398e973916faf88bc59c55c3602e5ba0999df53a016c12d3d2"}
scores_equal=True
geometry_equal=True
geom_equal=True
transit_equal=True
```

Command:

```powershell
@'
import json
from pathlib import Path
from collections import Counter
active=Path('web/public/data/generated_20260805_prefer_scored_routed')
scratch=Path('qa/p6_rerun_cost_20260812_102712/exported_bundle')
def load_json(path): return json.loads(path.read_text(encoding='utf-8'))
def load_records(bundle):
    idx=load_json(bundle/'scores/index.json')
    out={}
    for shard in sorted(idx):
        for rec in load_json(bundle/f'scores/{shard}.json'):
            out[str(rec['postal'])]=rec
    return out
ar=load_records(active); sr=load_records(scratch)
only_a=sorted(set(ar)-set(sr)); only_s=sorted(set(sr)-set(ar)); common=sorted(set(ar)&set(sr))
print(f'active_records={len(ar)} scratch_records={len(sr)} common={len(common)} only_active={len(only_a)} only_scratch={len(only_s)}')
print('only_active_first20=' + json.dumps(only_a[:20]))
print('only_scratch_first20=' + json.dumps(only_s[:20]))
print('active_state_counts=' + json.dumps(Counter(r.get('state') for r in ar.values()), sort_keys=True))
print('scratch_state_counts=' + json.dumps(Counter(r.get('state') for r in sr.values()), sort_keys=True))
print(f'total_moved_count={sum(1 for p in common if ar[p].get("total") != sr[p].get("total"))}')
'@ | uv run python -
```

Output:

```text
active_records=124443 scratch_records=124032 common=124032 only_active=411 only_scratch=0
only_active_first20=["001025", "001027", "001441", "001543", "049478", "058130", "078880", "079427", "097992", "097994", "097997", "097999", "104001", "105001", "109674", "118537", "118592", "118615", "119480", "119481"]
only_scratch_first20=[]
active_state_counts={"NOT_YET_SCORED": 476, "NO_TRANSIT_IN_RANGE": 9827, "SCORED": 95157, "SCORED_PARTIAL": 18983}
scratch_state_counts={"NOT_YET_SCORED": 319, "NO_TRANSIT_IN_RANGE": 9814, "SCORED": 95100, "SCORED_PARTIAL": 18799}
total_moved_count=7527
```

Determination: the scratch run is a valid timing measurement, but it did not prove current intermediates reproduce the active published bundle. The scratch run used 124,032 processed postal rows while the active bundle contains 124,443 records. Published value equality is therefore not established by this run and must be treated as a finding.

## OneMap Revalidation Determination

For a bus sub-score-only change that consumes existing fallback wait provenance, OneMap walk-validation does not need to be rerun because route geometry is not the thing being changed. If the later fix changes network conflation, candidate selection, route geometry, or route trust, then targeted/full OneMap validation becomes relevant again.

## Test And Build

Command:

```powershell
npm --prefix web test -- --runInBand
```

Output:

```text
RUN  v4.1.10 C:/shiok/web

Test Files  21 passed (21)
Tests  102 passed (102)
Duration  2.33s
```

Reconciliation: P6 baseline was 100 tests / 21 files. P6 adds two rendered bus-honesty tests in an existing file, so 102 / 21 is expected.

Command:

```powershell
npm --prefix web run build
```

Output:

```text
using local data bundle C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
▲ Next.js 16.3.0 (Turbopack)
✓ Compiled successfully in 4.9s
✓ Generating static pages using 7 workers (6/6) in 759ms
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/onemap-route
├ ƒ /api/onemap-search
└ ○ /icon.svg
```

Command:

```powershell
uv run python run.py test
```

Output:

```text
collected 315 items
============================ 315 passed in 23.39s =============================
```

Reconciliation: P6 expected 315 Python tests. Count unchanged.

## Diff Guards

Command:

```powershell
git diff 1bc9f19..HEAD -- pipeline/
git diff 1bc9f19..HEAD -- web/data-bundle.json
git diff 1bc9f19..HEAD -- pipeline/config/weights.yaml
```

Output:

```text

```

## Findings

- `leaf_area_index` remains hash-shipped but unconsumed and `lamp_posts` remains unshipped, carried forward from P1/P2 as deliberately unfixed findings.
- The scratch rerun does not reproduce the active bundle: scratch has 124,032 records, active has 124,443, and 7,527 common postals have different `total` values. This is a major determinism/provenance finding. The run is still useful for timing, but not for proving byte-identical reproduction of the active published bundle.
- Scratch outputs remain untracked under `qa/p6_rerun_cost_20260812_102712` for review and cleanup after acceptance.
- While pushing P6, `origin/main` advanced to `13a2684` with template sync commits. After rebasing, `npm --prefix web test -- --runInBand` failed because root `.vercelignore` had been deleted upstream while `web/lib/__tests__/deployment.test.ts` still reads it. `.vercelignore` was restored exactly from `1bc9f19` in a separate commit so the suite stands on current `main`.

## Disagreements

- No disagreement with the P6 premise for Strand 1.
- Strand 2 premise "no code affecting scores changed since the bundle was generated" did not hold against the observed scratch-vs-active comparison: scoring fingerprints for `routing.py` and `scoring_integration.py` differ from the active manifest, and the local processed postal universe also has fewer records than the active bundle.
