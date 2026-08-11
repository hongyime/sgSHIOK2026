# S.H.I.O.K. Index

A free, non-commercial civic web app giving source-derived Singapore postal records an
explainable "comfort score" for the walk to transit — rain shelter, heat, crossing
friction, transit access, and bus frequency — computed on real routed paths from open
government data.

**Status:** live static-first pilot with a scored 124,032-record source-derived universe.
Current product decisions and known evidence limits are tracked in `decisions.md`.
**Environment:** Windows 11, native pipeline work. No WSL, no Docker, no paid services.
GitHub Actions exists for repository automation and CI, not for heavy pipeline compute.

## Repo map

- `CLAUDE.md` — agent instructions: hard constraints, stack, layout, conventions. Read first.
  (Using a non-Claude agent? It still applies — point your agent at it explicitly.)
- `decisions.md` — durable decision log. Append evidence and rationale; do not overwrite.
- `pipeline/config/weights.yaml` — locked composite-score weights.
- `pipeline/config/params.yaml` — tunable pipeline constants.
- `.github/workflows/` — CI and repository automation workflows.
- `env.example` — copy to `.env` and fill in (see prerequisites).
- `run.py` — cross-platform task runner (check | ingest | network | score | export |
  validate | publish | test). `publish` always runs `validate` first.

## Human prerequisites (do these once — agents can't register accounts)

1. Install **Python 3.12+** and **uv** (https://docs.astral.sh/uv/), **Node LTS**, and **Git**.
2. One-time Windows setup, in an elevated PowerShell:
   - `git config --global core.longpaths true`
   - Enable long paths: `Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1`
   - Set UTF-8 for Python: `setx PYTHONUTF8 1`
   - (Optional, speeds up raw-data I/O): add the repo's `raw\` folder to Microsoft Defender exclusions.
3. Register a free **LTA DataMall** account → `AccountKey` (datamall.lta.gov.sg).
4. Register a free **OneMap** developer account (onemap.gov.sg).
5. `copy env.example .env` and fill in the credentials.
6. `npm i -g vercel`, then `vercel login` once (Hobby tier, no card).

## Kickoff prompt for the coding agent

> Read README.md, CLAUDE.md, decisions.md, pipeline/config/weights.yaml, and
> pipeline/config/params.yaml. Infer missing product context from code, tests, and tracked
> release evidence. Verify acceptance criteria before moving on. Log durable decisions in
> decisions.md. This machine is Windows 11 — PowerShell commands only, no WSL, no Docker.

## Ground rules (enforced in CLAUDE.md — summary)

$0 budget, no paid services, Vercel Hobby only, no Cloudflare; all heavy compute runs
natively on this Windows machine (uv-managed Python); runtime backend surface is limited to
the two current OneMap helper routes; all routing runs in python-igraph on the project's own
graph; every published score is reproducible from hashed inputs + tagged code.

## License And Attribution

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Source data and map
attribution are recorded in [ATTRIBUTION.md](ATTRIBUTION.md).
