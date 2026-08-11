# P2 Cleanup Verification

Date: 2026-08-12
Base SHA: ce8eb34e6d84b3ea5c9f8bae2b2e598ff35bb9ab

## Scope

Command:

```powershell
git diff ce8eb34..HEAD -- pipeline/config/weights.yaml; if ($LASTEXITCODE -eq 0) { 'weights_diff_command_exit=0' }
```

Output:

```text
weights_diff_command_exit=0
```

## Dead Route Batch Verification

Command before cleanup:

```powershell
git grep -n "run_routing_batch"
```

Output:

```text
pipeline/routing.py:521:def run_routing_batch(network_path, od_pairs):
```

Command before cleanup:

```powershell
git grep -n "choose_routing_worker_count"
```

Output:

```text
pipeline/routing.py:69:def choose_routing_worker_count(
pipeline/routing.py:538:    num_workers, worker_reason = choose_routing_worker_count(len(origins), routing_params)
tests/test_routing.py:239:def test_choose_routing_worker_count_uses_memory_limit():
tests/test_routing.py:256:def test_choose_routing_worker_count_respects_configured_cap():
```

Command before cleanup:

```powershell
git grep -n "init_route_worker"
```

Output:

```text
pipeline/routing.py:502:def init_route_worker(edges_dict)
pipeline/routing.py:556:    with Pool(num_workers, initializer=init_route_worker, initargs=(edges_dict,)) as pool:
tests/test_routing.py:226:    routing.init_route_worker(edges_dict)
```

Command before cleanup:

```powershell
git grep -n "route_worker_initialized"
```

Output:

```text
pipeline/routing.py:508:def route_worker_initialized(args)
pipeline/routing.py:557:        for res_chunk in pool.imap_unordered(route_worker_initialized, worker_args):
tests/test_routing.py:227:    actual = routing.route_worker_initialized((od_pairs, 0.6, 1.25))
tests/test_routing.py:236:        routing.route_worker_initialized(({0: [2]}, 0.6, 1.25))
```

Command before cleanup:

```powershell
python run.py route; "exit_code=$LASTEXITCODE"
```

Output:

```text
not implemented: route — igraph dual-weight batch, spawn-safe multiprocessing (T1.2)
exit_code=0
```

Command after cleanup:

```powershell
git grep -n "run_routing_batch\|choose_routing_worker_count\|init_route_worker\|route_worker_initialized"; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }
```

Output:

```text
NO_MATCH
```

Command after cleanup:

```powershell
git grep -n "route_worker"
```

Output:

```text
decisions.md:24:The unused route batch entry point and its pool initializer helpers were removed from `pipeline/routing.py`; `route_worker` remains because `pipeline/bus.py` calls it for bus-connector routing. The deleted `routing:` block in `pipeline/config/params.yaml` only configured those removed batch helpers and had no remaining code reader after the cleanup. No scoring formula, routing algorithm, weights, or export shape changed. The next publish or provenance refresh should expect a different params.yaml SHA-256 fingerprint solely because this dead, unused routing config block was removed.
pipeline/bus.py:21:from pipeline.routing import RoutingGraph, route_worker
pipeline/bus.py:320:            route_results = route_worker((edges_dict, od_pairs, 0.0, 1.0))
pipeline/routing.py:414:def route_worker(args):
tests/test_routing.py:6:from pipeline.routing import RoutingGraph, route_worker
tests/test_routing.py:130:    res = route_worker((edges_dict, od_pairs, shelter_lambda, detour_budget))
tests/test_routing.py:154:    res = route_worker((edges_dict, od_pairs, 0.6, 1.25))
tests/test_routing.py:180:    res = route_worker((edges_dict, od_pairs, 0.0, 1.25))
tests/test_routing.py:187:def test_reusable_routing_graph_matches_route_worker():
tests/test_routing.py:196:    worker_result = route_worker((edges_dict, od_pairs, 0.6, 1.25))[0]
tests/test_scoring_integration.py:10:from pipeline.routing import RoutingGraph, route_worker
tests/test_scoring_integration.py:2249:def test_route_worker_coalesces_length_column_into_length_m():
tests/test_scoring_integration.py:2257:    result = route_worker((edges_dict, {0: [2]}, 0.6, 1.25))
```

Command after cleanup:

```powershell
git grep -n "multiprocessing\|Pool(\|imap" pipeline/ scripts/; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }
```

Output:

```text
NO_MATCH
```

Command after cleanup:

```powershell
python run.py route; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=2
usage: run.py [-h]
              {batch-plan,bus-arrivals,bus-connector-diagnostics,candidate-audit,check,compare-targeted,export,export-transit,geocode-universe,ingest,network,network-debug,network-preflight,network-qa,onemap-outlier-replay,onemap-outlier-triage,onemap-validation,overture-addresses,postal-universe,publish,readiness,refresh-provenance,score,score-batch,shell,test,validate}
run.py: error: argument task: invalid choice: 'route' (choose from batch-plan, bus-arrivals, bus-connector-diagnostics, candidate-audit, check, compare-targeted, export, export-transit, geocode-universe, ingest, network, network-debug, network-preflight, network-qa, onemap-outlier-replay, onemap-outlier-triage, onemap-validation, overture-addresses, postal-universe, publish, readiness, refresh-provenance, score, score-batch, shell, test, validate)
```

## Params Fingerprint

Command:

```powershell
git show ce8eb34:pipeline/config/params.yaml | python -c "import sys,hashlib; data=sys.stdin.buffer.read(); print(hashlib.sha256(data).hexdigest())"; Get-FileHash pipeline\config\params.yaml -Algorithm SHA256 | Select-Object -ExpandProperty Hash
```

Output:

```text
dc56cbd5c3cc87ec6aaa7c346e8514b4c5b450a76f05f1ac3e76fa604c46f6b7
A05E9E9AAC805DE4A12217214EE574F6DC8813054D2FA8993A73E7D649BB1CE1
```

Command:

```powershell
git grep -n '"routing"\|\[.routing.\]' pipeline/ scripts/
```

Output:

```text
pipeline/scoring_integration.py:1897:        "routing": {
```

Interpretation: the remaining `routing` hit writes provenance metadata for
`shelter_lambda` and `detour_budget`; it is not a reader of the removed
`params.yaml` worker-count block.

## Deleted Tests

| Deleted test | Reason |
| --- | --- |
| `test_initialized_route_worker_matches_route_worker` | Exclusively covered the deleted initialized worker helper. |
| `test_initialized_route_worker_requires_initializer` | Exclusively covered the deleted initialized worker helper. |
| `test_choose_routing_worker_count_uses_memory_limit` | Exclusively covered the deleted worker-count helper. |
| `test_choose_routing_worker_count_respects_configured_cap` | Exclusively covered the deleted worker-count helper. |

## Determinism Reality Check

| Claim | Reality | Evidence |
| --- | --- | --- |
| Sorted chunking | Enforced for score batches. Postal rows are normalized and sorted by `postal_code` before `chunk_slices()` builds fixed-size chunks. | `pipeline/score_batch.py:107-113`; `pipeline/score_batch.py:236` |
| Sorted JSON keys and record orders | Enforced on public JSON writers inspected. Shared JSON writers use `sort_keys=True`; score and geometry shard maps are sorted before writing. Some helper internals preserve input order before final sorted writes. | `pipeline/export.py:64-68`; `pipeline/export.py:739-749`; `pipeline/export.py:781-807`; `pipeline/score_batch.py:62-66`; `pipeline/score_batch.py:351` |
| Fixed rounding | Enforced at score/export boundaries for public totals, route lengths, gap lengths, candidate summaries, and public coordinates. CLAUDE now records public coordinates as 8 dp rather than the stale 5 dp claim. | `pipeline/scoring_integration.py:607-610`; `pipeline/scoring_integration.py:1522-1524`; `pipeline/export.py:200-215`; `pipeline/export.py:320-324`; `pipeline/export.py:936-944`; `CLAUDE.md:72-74` |
| `PYTHONHASHSEED=0` | Enforced for every `run.py` child module task after P2. Direct module invocation bypasses runner-level enforcement. | `run.py:49-57`; `tests/test_run.py:6-26`; `CLAUDE.md:72-74` |
| Pinned deps | Enforced through committed Python and web lockfiles. Node runtime pinning is not claimed in CLAUDE after P2 because no `.nvmrc` exists. | `uv.lock`; `web/package-lock.json`; `CLAUDE.md:72-74` |

Command:

```powershell
git grep -n PYTHONHASHSEED
```

Output:

```text
CLAUDE.md:74:  set `PYTHONHASHSEED=0`, and pin dependencies via `uv.lock` + `web/package-lock.json`.
run.py:52:    env["PYTHONHASHSEED"] = "0"
tests/test_run.py:16:    monkeypatch.setenv("PYTHONHASHSEED", "random")
tests/test_run.py:25:            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
```

Command:

```powershell
@'
import ast
from pathlib import Path
src = Path('run.py').read_text(encoding='utf-8')
mod = ast.parse(src)
stubs=[]; branches=[]
for node in mod.body:
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id=='STUBS':
                stubs=sorted(k.value for k in node.value.keys if isinstance(k, ast.Constant))
for node in ast.walk(mod):
    if isinstance(node, ast.If):
        t=node.test
        if isinstance(t, ast.Compare) and isinstance(t.left, ast.Name) and t.left.id=='name':
            for comp in t.comparators:
                if isinstance(comp, ast.Constant) and isinstance(comp.value,str): branches.append(comp.value)
                elif isinstance(comp, ast.Tuple): branches.extend(e.value for e in comp.elts if isinstance(e, ast.Constant) and isinstance(e.value,str))
print('MISSING_DISPATCH=' + ','.join(s for s in stubs if s not in set(branches)))
'@ | python -
```

Output:

```text
MISSING_DISPATCH=
```

Command:

```powershell
$paths=@('README.md','CLAUDE.md','AGENTS.md','decisions.md','LICENSE','NOTICE','ATTRIBUTION.md','env.example','run.py','uv.lock','pipeline','pipeline/config','pipeline/config/weights.yaml','pipeline/config/params.yaml','web','web/package-lock.json','web/public/data','raw','tests','scripts','.github/workflows'); foreach ($p in $paths) { "${p}: $(Test-Path $p)" }
```

Output:

```text
README.md: True
CLAUDE.md: True
AGENTS.md: True
decisions.md: True
LICENSE: True
NOTICE: True
ATTRIBUTION.md: True
env.example: True
run.py: True
uv.lock: True
pipeline: True
pipeline/config: True
pipeline/config/weights.yaml: True
pipeline/config/params.yaml: True
web: True
web/package-lock.json: True
web/public/data: True
raw: True
tests: True
scripts: True
.github/workflows: True
```

## Accessibility And Attribution Visibility

Command:

```powershell
node tmp\p2_visibility_check.mjs
```

Output:

```json
{
  "id": 86,
  "result": {
    "result": {
      "type": "object",
      "value": {
        "viewport": {
          "width": 380,
          "height": 780
        },
        "inputValue": "560231",
        "url": "http://127.0.0.1:3127/?postal=560231",
        "postal560231Visible": true,
        "scoreCardOpen": true,
        "attributionText": "OneMap © contributors | Singapore Land Authority",
        "attributionRect": {
          "left": 104,
          "top": 752,
          "right": 372,
          "bottom": 776,
          "width": 268,
          "height": 24
        },
        "searchOverlayRect": {
          "left": 10,
          "top": 10,
          "right": 370,
          "bottom": 565,
          "width": 360,
          "height": 555
        },
        "detailOverlayRect": {
          "left": 10,
          "top": 170,
          "right": 368,
          "bottom": 529,
          "width": 358,
          "height": 359
        },
        "overlapsSearchOverlay": false,
        "overlapsDetailOverlay": false,
        "elementFromPointHits": [
          true,
          true,
          true
        ],
        "computed": {
          "display": "flex",
          "visibility": "visible",
          "opacity": "1",
          "zIndex": "3"
        },
        "visibleByDom": true
      }
    }
  }
}
```

P2-0a choice: kept the custom OneMap/SLA attribution div and added a comment at
the disabled MapLibre attribution control. Reason: the literal OneMap markup
must remain fully visible on narrow screens, while MapLibre's compact control
can collapse attribution behind a toggle.

Accessibility decisions:

| State | Action | Justification |
| --- | --- | --- |
| Search error / 429 | Added `role="alert"` and `aria-live="assertive"`. | Search failure was otherwise visual-only. |
| Search results | Added polite status text. | Results appear asynchronously after search. |
| Loading | Added `aria-busy` on search overlay/form/button and rank panel. | Loading changes can otherwise be silent while controls disable. |
| Score card load, route mode, custom stop, rank load/results | Added polite score/rank status text. | These can change from map clicks or async fetches outside current focus. |
| Transit mode segmented control | No extra live region. | Focused controls already expose state through button text and pressed/selected state; extra announcement would duplicate the control. |

## Test And Build

Command:

```powershell
uv run python run.py test
```

Output:

```text
collected 312 items
============================ 312 passed in 24.26s =============================
```

Reconciliation: 315 previous Python tests - 4 deleted tests for deleted route
batch helpers + 1 new `tests/test_run.py` determinism test = 312.

Command:

```powershell
npm --prefix web test
```

Output:

```text
Test Files  18 passed (18)
Tests       93 passed (93)
Duration    694ms
```

Reconciliation: 90 previous web tests across 17 files + 3 new rendered
accessibility tests in 1 new file = 93 tests across 18 files.

Command:

```powershell
npm --prefix web run build
```

Output:

```text
using local data bundle C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.js took 13ms
✓ Compiled successfully in 304ms
Finished TypeScript in 339ms ...
✓ Generating static pages using 7 workers (6/6) in 535ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/onemap-route
├ ƒ /api/onemap-search
└ ○ /icon.svg
```

## FINDINGS

- P1 finding carried forward: `leaf_area_index` is hash-shipped in provenance but the audited values are not consumed by shipped scoring.
- P1 finding carried forward: `lamp_posts` is fetched/hashed but was not identified as reaching shipped artifacts.
- `npm --prefix web run build` creates untracked `web/AGENTS.md` and `web/CLAUDE.md` from Next.js agent-file generation. They were deliberately removed after build and not committed because they are outside P2 scope.
- Runner-level `PYTHONHASHSEED=0` enforcement applies through `run.py`; directly invoking a Python module bypasses that runner-level environment setting.

## DISAGREEMENTS

- None.
