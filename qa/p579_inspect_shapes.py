import json
import pathlib

fresh = pathlib.Path("processed/score_batches/subset_p575_networkfix_fresh_20260826/chunks")
recs = {}
for c in sorted(fresh.glob("chunk_*.json")):
    for r in json.loads(c.read_text(encoding="utf-8")):
        recs[str(r["postal"])] = r

nt = recs["059804"]
sc = next(r for r in recs.values() if r["state"] == "SCORED")

print("=== NO_TRANSIT record 059804 ===")
print("top keys:", sorted(nt.keys()))
print("state:", nt["state"], "| total:", nt["total"])
print("subscores:", nt["subscores"])
print("best_node:", nt["best_node"])
print("paths:", nt["paths"])
ro = nt.get("route_options") or {}
print("route_options keys:", sorted(ro.keys()))
for k, v in ro.items():
    if isinstance(v, dict):
        print(
            f"  ro.{k}: state={v.get('state')} total={v.get('total')} "
            f"subscores={'null' if v.get('subscores') is None else 'dict'} "
            f"paths={'null' if v.get('paths') is None else 'dict'}"
        )
    else:
        print(f"  ro.{k}: {type(v).__name__}")
print("candidates count:", len(nt.get("candidates") or []))
cand = (nt.get("candidates") or [None])[0]
if isinstance(cand, dict):
    print("candidate[0] keys:", sorted(cand.keys()))

print()
print("=== SCORED record top-level field types ===")
for k in sorted(sc.keys()):
    v = sc[k]
    extra = f" ({len(v)})" if isinstance(v, (dict, list)) else ""
    print(f"{k}: {type(v).__name__}{extra}")

# How many subset records are NO_TRANSIT, and do ANY carry non-null paths?
nt_rows = [r for r in recs.values() if r.get("state") != "SCORED"]
with_paths = [r for r in nt_rows if r.get("paths")]
print()
print(f"non-SCORED rows: {len(nt_rows)}; of them with non-null paths: {len(with_paths)}")
states = {}
for r in nt_rows:
    states[r["state"]] = states.get(r["state"], 0) + 1
print("non-SCORED states:", states)
