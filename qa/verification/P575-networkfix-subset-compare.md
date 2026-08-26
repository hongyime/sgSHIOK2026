# P575 network-fix subset compare

## Scope

P575 compares the frozen P573 1,200-postal scored subset against the published
`web\public\data\generated_20260805_prefer_scored_routed` bundle after the P574
origin-aware bus-stop snap repair and island network rebuild.

The subset source is `qa\p573_subset_ids.json`; it contains 1,200 sorted IDs
from `000135` through `069531`.

## Evidence

Module contracts were read first. No module path correction was needed.

```powershell
$env:PYTHONUTF8='1'; $start=Get-Date; uv run python -m scripts.compare_targeted_scores --help > 'C:\sgSHIOK2026\logs\p575_compare_help_20260826.txt' 2>&1; $code=$LASTEXITCODE; $duration=[math]::Round(((Get-Date)-$start).TotalSeconds,3); "compare_help exit=$code duration=$duration path=C:\sgSHIOK2026\logs\p575_compare_help_20260826.txt"; exit $code
```

Exit `0`; duration `33.689` seconds. Key usage lines:

```text
usage: compare_targeted_scores.py [-h] --candidate CANDIDATE
                                  [--bundle-dir BUNDLE_DIR] --output OUTPUT
                                  [--safe-postals-output SAFE_POSTALS_OUTPUT]
                                  [--total-tolerance TOTAL_TOLERANCE]
                                  [--coverage-tolerance COVERAGE_TOLERANCE]
```

```powershell
$env:PYTHONUTF8='1'; $start=Get-Date; uv run python -m pipeline.score_batch --help > 'C:\sgSHIOK2026\logs\p575_score_batch_help_20260826.txt' 2>&1; $code=$LASTEXITCODE; $duration=[math]::Round(((Get-Date)-$start).TotalSeconds,3); "score_batch_help exit=$code duration=$duration path=C:\sgSHIOK2026\logs\p575_score_batch_help_20260826.txt"; exit $code
```

Exit `0`; duration `32.671` seconds. Key usage lines:

```text
usage: score_batch.py [-h] --postal-universe POSTAL_UNIVERSE
                      [--network NETWORK] [--output-dir OUTPUT_DIR]
                      [--limit LIMIT] [--chunk-size CHUNK_SIZE]
                      [--no-geometry] [--no-resume] [--dry-run] [--full-batch]
                      [--confirm-full-batch]
```

```powershell
$env:PYTHONUTF8='1'; $start=Get-Date; uv run python -c "import json; p=r'C:\sgSHIOK2026\qa\p573_subset_ids.json'; obj=json.load(open(p, encoding='utf-8')); ids=obj['ids']; print(len(ids)); print(ids[:3]); print(ids[-3:]); print(ids==sorted(ids))" > 'C:\sgSHIOK2026\logs\p575_subset_ids_check_20260826.txt' 2>&1; $code=$LASTEXITCODE; $duration=[math]::Round(((Get-Date)-$start).TotalSeconds,3); "subset_ids_check exit=$code duration=$duration path=C:\sgSHIOK2026\logs\p575_subset_ids_check_20260826.txt"; exit $code
```

Exit `0`; duration `2.355` seconds. Output confirmed `1200`, first IDs
`000135`, `018593`, `018906`, last IDs `069471`, `069472`, `069531`, sorted
`True`.

The requested `processed\score_batches\subset_p575_networkfix` directory and
`logs\p575_subset_scoring.log` already existed from an earlier local attempt
before this run. To honor the no-overwrite rule for score-batch directories and
logs, the fresh P575 run used suffixed paths:

```powershell
$ErrorActionPreference='Continue'; $env:PYTHONUTF8='1'; $outDir='C:\sgSHIOK2026\processed\score_batches\subset_p575_networkfix_fresh_20260826'; $log='C:\sgSHIOK2026\logs\p575_subset_scoring_fresh_20260826.log'; if (Test-Path -LiteralPath $outDir) { Write-Error "Output directory already exists: $outDir"; exit 99 }; $start=Get-Date; "START=$($start.ToString('o'))" | Tee-Object -FilePath $log; & uv run python -m pipeline.score_batch --postal-universe 'C:\sgSHIOK2026\qa\p575_compare\p575_subset_universe.parquet' --network 'C:\sgSHIOK2026\processed\network_island.parquet' --output-dir $outDir --limit 999999 --chunk-size 100 --no-geometry 2>&1 | Tee-Object -FilePath $log -Append; $code=$LASTEXITCODE; $end=Get-Date; $duration=[math]::Round(($end-$start).TotalSeconds,3); "END=$($end.ToString('o'))" | Tee-Object -FilePath $log -Append; "EXIT_CODE=$code" | Tee-Object -FilePath $log -Append; "DURATION_SECONDS=$duration" | Tee-Object -FilePath $log -Append; exit $code
```

Exit `0`; duration `21766.677` seconds; records `1200`; output directory
`C:\sgSHIOK2026\processed\score_batches\subset_p575_networkfix_fresh_20260826`;
log `C:\sgSHIOK2026\logs\p575_subset_scoring_fresh_20260826.log`.
Liveness was verified repeatedly by CPU-active Python process checks and by
chunk files appearing over the run; 12 chunk files and `batch_manifest.json`
were written.

```powershell
$env:PYTHONUTF8='1'; $code = @'
import json
from pathlib import Path
root = Path(r'C:\sgSHIOK2026')
out = root / 'qa' / 'p575_compare' / 'p575_candidate_records_fresh_20260826.json'
if out.exists():
    raise SystemExit(f'Output exists: {out}')
records = []
for path in sorted((root / 'processed' / 'score_batches' / 'subset_p575_networkfix_fresh_20260826' / 'chunks').glob('chunk_*.json')):
    records.extend(json.loads(path.read_text(encoding='utf-8')))
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(records, ensure_ascii=False, indent=2, sort_keys=True), encoding='utf-8')
print(f'WROTE={out}')
print(f'RECORDS={len(records)}')
print(f"FIRST={records[0].get('postal')} LAST={records[-1].get('postal')}")
'@; $code | uv run python -
```

Exit `0`; duration not separately timed; records `1200`; output
`C:\sgSHIOK2026\qa\p575_compare\p575_candidate_records_fresh_20260826.json`.

```powershell
$env:PYTHONUTF8='1'; $start=Get-Date; uv run python -m scripts.compare_targeted_scores --candidate 'C:\sgSHIOK2026\qa\p575_compare\p575_candidate_records_fresh_20260826.json' --bundle-dir 'C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed' --output 'C:\sgSHIOK2026\qa\p575_compare\p575_compare_report_fresh_20260826.json' --safe-postals-output 'C:\sgSHIOK2026\qa\p575_compare\p575_safe_postals_fresh_20260826.txt'; $code=$LASTEXITCODE; $end=Get-Date; $duration=[math]::Round(($end-$start).TotalSeconds,3); "EXIT_CODE=$code"; "DURATION_SECONDS=$duration"; exit $code
```

Exit `1`; duration `83.151` seconds; compared records `1200`; output
`C:\sgSHIOK2026\qa\p575_compare\p575_compare_report_fresh_20260826.json`;
safe-postals output
`C:\sgSHIOK2026\qa\p575_compare\p575_safe_postals_fresh_20260826.txt`.
The compare tool reported one blocking postal, `059804`, and
`promotion_recommendation=promote_safe_promotable_records_only`.

```powershell
$env:PYTHONUTF8='1'; $code = @'
import json, statistics, csv
from pathlib import Path
from scripts.targeted_bundle_refresh import load_score_index, load_score_records
root=Path(r'C:\sgSHIOK2026')
out_json=root/'qa'/'p575_compare'/'p575_delta_summary_fresh_20260826.json'
out_csv=root/'qa'/'p575_compare'/'p575_delta_rows_fresh_20260826.csv'
for p in (out_json,out_csv):
    if p.exists():
        raise SystemExit(f'Output exists: {p}')
ids=json.loads((root/'qa'/'p573_subset_ids.json').read_text(encoding='utf-8'))['ids']
cands={str(r['postal']).zfill(6):r for r in json.loads((root/'qa'/'p575_compare'/'p575_candidate_records_fresh_20260826.json').read_text(encoding='utf-8'))}
bundle=root/'web'/'public'/'data'/'generated_20260805_prefer_scored_routed'
active={}
for shard in sorted(load_score_index(bundle)):
    for r in load_score_records(bundle, shard):
        if isinstance(r, dict) and r.get('postal'):
            p=str(r['postal']).zfill(6)
            if p in ids:
                active[p]=r
def num(v):
    try:
        return None if v is None else float(v)
    except Exception:
        return None
def nested(r,*keys):
    v=r
    for k in keys:
        if not isinstance(v, dict): return None
        v=v.get(k)
    return v
rows=[]
abs_total=[]; abs_bus=[]
changed_total=0; changed_bus=0; changed_rows=0
bus_zero_to_pos=0; bus_pos_to_zero=0
covered_regressions=[]
base_bus_zero=0; cand_bus_zero=0; routed=0
missing=[]
for p in ids:
    a=active.get(p); c=cands.get(p)
    if not a or not c:
        missing.append(p); continue
    at=num(a.get('total')); ct=num(c.get('total'))
    ab=num(nested(a,'subscores','bus')); cb=num(nested(c,'subscores','bus'))
    ac=num(nested(a,'paths','covered_ratio')); cc=num(nested(c,'paths','covered_ratio'))
    dt=None if at is None or ct is None else round(ct-at,10)
    db=None if ab is None or cb is None else round(cb-ab,10)
    dc=None if ac is None or cc is None else round(cc-ac,10)
    if dt is not None:
        abs_total.append(abs(dt)); changed_total += int(abs(dt) > 1e-9)
    if db is not None:
        abs_bus.append(abs(db)); changed_bus += int(abs(db) > 1e-9)
        bus_zero_to_pos += int(ab == 0 and cb > 0)
        bus_pos_to_zero += int(ab > 0 and cb == 0)
    if (dt is not None and abs(dt)>1e-9) or (db is not None and abs(db)>1e-9) or (dc is not None and abs(dc)>1e-12):
        changed_rows += 1
    if ac is not None and cc is not None and cc + 1e-12 < ac:
        covered_regressions.append({'postal':p,'active':ac,'candidate':cc,'delta':dc})
    routed_ok=a.get('state') in {'SCORED','SCORED_PARTIAL'} and c.get('state') in {'SCORED','SCORED_PARTIAL'} and nested(a,'paths','routing_type') and nested(c,'paths','routing_type')
    if routed_ok and ab is not None and cb is not None:
        routed += 1
        base_bus_zero += int(ab == 0)
        cand_bus_zero += int(cb == 0)
    rows.append({'postal':p,'active_total':at,'candidate_total':ct,'delta_total':dt,'active_bus':ab,'candidate_bus':cb,'delta_bus':db,'active_covered_ratio':ac,'candidate_covered_ratio':cc,'delta_covered_ratio':dc,'active_state':a.get('state'),'candidate_state':c.get('state'),'active_routing_type':nested(a,'paths','routing_type'),'candidate_routing_type':nested(c,'paths','routing_type')})
summary={
  'ids': len(ids), 'candidate_records': len(cands), 'active_records_loaded': len(active), 'missing': missing,
  'changed_rows_any_total_bus_or_coverage': changed_rows,
  'total': {'changed_count': changed_total, 'median_abs_delta': statistics.median(abs_total), 'max_abs_delta': max(abs_total), 'max_signed_delta': max(r['delta_total'] for r in rows if r['delta_total'] is not None), 'min_signed_delta': min(r['delta_total'] for r in rows if r['delta_total'] is not None)},
  'bus': {'changed_count': changed_bus, 'median_abs_delta': statistics.median(abs_bus), 'max_abs_delta': max(abs_bus), 'zero_to_positive_count': bus_zero_to_pos, 'positive_to_zero_count': bus_pos_to_zero, 'baseline_zero_count_routed_verifiable': base_bus_zero, 'candidate_zero_count_routed_verifiable': cand_bus_zero, 'routed_verifiable_count': routed},
  'covered_ratio': {'regression_count': len(covered_regressions), 'regressions': covered_regressions[:50]},
  'assertions': {'a_bus_zero_count_decreases': cand_bus_zero < base_bus_zero, 'b_no_covered_ratio_regressions': len(covered_regressions)==0, 'c_median_abs_total_lte_5': statistics.median(abs_total) <= 5},
}
out_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True), encoding='utf-8')
with out_csv.open('w', newline='', encoding='utf-8') as f:
    w=csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)
print(json.dumps(summary, indent=2, sort_keys=True))
'@; $code | uv run python -
```

Exit `0`; duration `115.144` seconds; outputs:
`C:\sgSHIOK2026\qa\p575_compare\p575_delta_summary_fresh_20260826.json` and
`C:\sgSHIOK2026\qa\p575_compare\p575_delta_rows_fresh_20260826.csv`.

Determinism slice check:

```powershell
$env:PYTHONUTF8='1'; uv run python -c "import pandas as pd; p=r'C:\sgSHIOK2026\qa\p575_compare\p575_subset_first50_universe.parquet'; df=pd.read_parquet(p); print(df.shape); print(df['postal_code'].head(3).tolist()); print(df['postal_code'].tail(3).tolist())"
```

Exit `0`; duration `6.734` seconds; output confirmed `(50, 11)`, first IDs
`000135`, `018593`, `018906`, last IDs `019959`, `038970`, `038971`.

```powershell
$ErrorActionPreference='Continue'; $env:PYTHONUTF8='1'; $outDir='C:\sgSHIOK2026\processed\score_batches\subset_p575_determinism_a_20260826'; $log='C:\sgSHIOK2026\logs\p575_determinism_a_20260826.log'; if (Test-Path -LiteralPath $outDir) { Write-Error "Output directory already exists: $outDir"; exit 99 }; $start=Get-Date; "START=$($start.ToString('o'))" | Tee-Object -FilePath $log; & uv run python -m pipeline.score_batch --postal-universe 'C:\sgSHIOK2026\qa\p575_compare\p575_subset_first50_universe.parquet' --network 'C:\sgSHIOK2026\processed\network_island.parquet' --output-dir $outDir --limit 999999 --chunk-size 50 --no-geometry 2>&1 | Tee-Object -FilePath $log -Append; $code=$LASTEXITCODE; $end=Get-Date; $duration=[math]::Round(($end-$start).TotalSeconds,3); "END=$($end.ToString('o'))" | Tee-Object -FilePath $log -Append; "EXIT_CODE=$code" | Tee-Object -FilePath $log -Append; "DURATION_SECONDS=$duration" | Tee-Object -FilePath $log -Append; exit $code
```

Exit `0`; duration `2076.102` seconds; records `50`; output
`C:\sgSHIOK2026\processed\score_batches\subset_p575_determinism_a_20260826`.

```powershell
$ErrorActionPreference='Continue'; $env:PYTHONUTF8='1'; $outDir='C:\sgSHIOK2026\processed\score_batches\subset_p575_determinism_b_20260826'; $log='C:\sgSHIOK2026\logs\p575_determinism_b_20260826.log'; if (Test-Path -LiteralPath $outDir) { Write-Error "Output directory already exists: $outDir"; exit 99 }; $start=Get-Date; "START=$($start.ToString('o'))" | Tee-Object -FilePath $log; & uv run python -m pipeline.score_batch --postal-universe 'C:\sgSHIOK2026\qa\p575_compare\p575_subset_first50_universe.parquet' --network 'C:\sgSHIOK2026\processed\network_island.parquet' --output-dir $outDir --limit 999999 --chunk-size 50 --no-geometry 2>&1 | Tee-Object -FilePath $log -Append; $code=$LASTEXITCODE; $end=Get-Date; $duration=[math]::Round(($end-$start).TotalSeconds,3); "END=$($end.ToString('o'))" | Tee-Object -FilePath $log -Append; "EXIT_CODE=$code" | Tee-Object -FilePath $log -Append; "DURATION_SECONDS=$duration" | Tee-Object -FilePath $log -Append; exit $code
```

Exit `0`; duration `1297.551` seconds; records `50`; output
`C:\sgSHIOK2026\processed\score_batches\subset_p575_determinism_b_20260826`.

```powershell
$env:PYTHONUTF8='1'; $code = @'
import json, hashlib, difflib
from pathlib import Path
root=Path(r'C:\sgSHIOK2026')
a=root/'processed'/'score_batches'/'subset_p575_determinism_a_20260826'
b=root/'processed'/'score_batches'/'subset_p575_determinism_b_20260826'
out=root/'qa'/'p575_compare'/'p575_determinism_diff_fresh_20260826.json'
if out.exists():
    raise SystemExit(f'Output exists: {out}')
A='subset_p575_determinism_a_20260826'; B='subset_p575_determinism_b_20260826'
def norm(x):
    if isinstance(x, dict):
        y={}
        for k,v in x.items():
            if k in {'generated_at'}:
                y[k]='<normalized-generated-at>'
            elif k in {'manifest_path','output_dir','path'}:
                y[k]=norm(v)
            else:
                y[k]=norm(v)
        return y
    if isinstance(x, list):
        return [norm(v) for v in x]
    if isinstance(x, str):
        return x.replace(A,'<run_dir>').replace(B,'<run_dir>')
    return x
def load_dir(d):
    payload={}
    payload['batch_manifest.json']=norm(json.loads((d/'batch_manifest.json').read_text(encoding='utf-8')))
    for p in sorted((d/'chunks').glob('*.json')):
        payload['chunks/'+p.name]=norm(json.loads(p.read_text(encoding='utf-8')))
    return payload
pa=load_dir(a); pb=load_dir(b)
sa=json.dumps(pa, ensure_ascii=False, sort_keys=True, indent=2)
sb=json.dumps(pb, ensure_ascii=False, sort_keys=True, indent=2)
diff=list(difflib.unified_diff(sa.splitlines(), sb.splitlines(), fromfile='A_normalized', tofile='B_normalized', lineterm=''))
summary={
  'run_a': str(a), 'run_b': str(b),
  'normalized_fields': ['generated_at', 'manifest_path', 'output_dir', 'path strings containing determinism run directory'],
  'files_compared': sorted(pa),
  'normalized_identical': sa==sb,
  'sha256_a_normalized': hashlib.sha256(sa.encode('utf-8')).hexdigest(),
  'sha256_b_normalized': hashlib.sha256(sb.encode('utf-8')).hexdigest(),
  'diff_line_count': len(diff),
  'diff_preview': diff[:80],
}
out.write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True), encoding='utf-8')
print(json.dumps(summary, indent=2, sort_keys=True))
'@; $code | uv run python -
```

Exit `0`; output
`C:\sgSHIOK2026\qa\p575_compare\p575_determinism_diff_fresh_20260826.json`.
After normalization, `normalized_identical=true`, `diff_line_count=0`, and both
normalized SHA256 values were
`47946a259a04273cbc2ec382ead191355af41d606e3766b05b78b6ff27388824`.

## Findings

Delta summary across all 1,200 IDs:

| Metric | Value |
| --- | ---: |
| Rows with any total, bus, or covered-ratio delta | 46 |
| Total changed count | 46 |
| Total median absolute delta | 0.0 |
| Total max absolute delta | 22.8 |
| Bus changed count | 45 |
| Bus median absolute delta | 0.0 |
| Bus max absolute delta | 100.0 |
| Bus 0 to positive | 34 |
| Bus positive to 0 | 0 |

Assertion verdicts:

| Assertion | Verdict | Evidence |
| --- | --- | --- |
| a. `bus==0` count among routed-verifiable subset records decreases versus published baseline | PASS | Baseline `208`; candidate `174`; routed-verifiable count `1199` |
| b. No record regresses on covered-ratio evidence | PASS | Covered-ratio regression count `0` |
| c. Median absolute total delta across all 1,200 is <= 5 points | PASS | Median absolute total delta `0.0` |

The documented compare tool reported `ok=false` due to one `state_regression`
blocking postal, `059804`. This does not trip the P575 median-total regression
stop condition, but it is not promotable wholesale without review.

Determinism verdict: PASS. The first-50 slice outputs were identical after
normalizing run timestamp and run-directory path fields.

## Disagreements

The task context said the prior attempt created no artifact. At start, this
workspace already had `qa\p575_compare\p575_subset_universe.parquet`,
`qa\p575_compare\p575_subset_first50_universe.parquet`, partition parquet files,
zero-byte partition logs, `logs\p575_subset_scoring.log`, and an existing empty
`processed\score_batches\subset_p575_networkfix` directory. I did not delete or
overwrite those paths. Fresh suffixed output directories and logs were used to
preserve the no-overwrite rule.
