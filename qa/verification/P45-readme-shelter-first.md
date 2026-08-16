# P45 README Shelter-First Framing

## Root Guard

Command:

```powershell
$expected = 'C:\sgSHIOK2026'
$actual = (Get-Location).Path
$hostName = $env:COMPUTERNAME
if ($actual -ne $expected) { throw "ABORT: working directory is $actual, expected $expected" }
"ROOT=$actual"
"HOST=$hostName"
```

Output:

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Credential Gate

Command:

```powershell
"ONEMAP_EMAIL_PRESENT=$([bool]$env:ONEMAP_EMAIL) LENGTH=$($env:ONEMAP_EMAIL.Length)"
"ONEMAP_PASSWORD_PRESENT=$([bool]$env:ONEMAP_PASSWORD) LENGTH=$($env:ONEMAP_PASSWORD.Length)"
"LTA_DATAMALL_ACCOUNT_KEY_PRESENT=$([bool]$env:LTA_DATAMALL_ACCOUNT_KEY) LENGTH=$($env:LTA_DATAMALL_ACCOUNT_KEY.Length)"
```

Output:

```text
ONEMAP_EMAIL_PRESENT=False LENGTH=0
ONEMAP_PASSWORD_PRESENT=False LENGTH=0
LTA_DATAMALL_ACCOUNT_KEY_PRESENT=False LENGTH=0
```

## README Intro

Command:

```powershell
Get-Content -LiteralPath 'C:\sgSHIOK2026\README.md' | Select-Object -First 14
```

Output:

```text
# S.H.I.O.K. Index

A free, non-commercial civic web app for Singapore postal records that answers:
if I move here, what is the walk to transit actually like? It leads with the
covered-walkway ratio and exposed gaps on real routed paths, adds night-lighting
evidence as a map layer, and keeps the locked SHIOK score visible but secondary.

**Status:** live static-first pilot over a 124,443-record source-derived universe.
Current product decisions and known evidence limits are tracked in `decisions.md`.
**Environment:** Windows 11, native pipeline work. No WSL, no Docker, no paid services.
GitHub Actions exists for repository automation and CI, not for heavy pipeline compute.

## Repo map
```

## README Term Checks

Command:

```powershell
rg -n "covered-walkway ratio|exposed gaps|night-lighting evidence|locked SHIOK score visible but secondary" C:\sgSHIOK2026\README.md; "POSITIVE_EXIT=$LASTEXITCODE"
rg -n "comfort score|walk-to-transit comfort|rain shelter, heat, crossing friction" C:\sgSHIOK2026\README.md; "NEGATIVE_EXIT=$LASTEXITCODE"
```

Output:

```text
5:covered-walkway ratio and exposed gaps on real routed paths, adds night-lighting
6:evidence as a map layer, and keeps the locked SHIOK score visible but secondary.
POSITIVE_EXIT=0
NEGATIVE_EXIT=1
```

## Diff Stat

Command:

```powershell
git diff --stat
```

Output:

```text
 .agents/STATE.md | 5 +++--
 README.md        | 8 ++++----
 decisions.md     | 3 +++
 3 files changed, 10 insertions(+), 6 deletions(-)
```

## Verification

Command:

```powershell
python C:\sgSHIOK2026\scripts\check_repo_integrity.py; "EXIT=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
EXIT=0
```

Command:

```powershell
git diff --check
```

Output:

```text
```

Command:

```powershell
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml; "EXIT=$LASTEXITCODE"
```

Output:

```text
EXIT=0
```

## FINDINGS

1. `README.md` still led with the pre-P18 product framing: an explainable five-term `comfort score`. That public repo-facing copy now matches the shipped shelter-first UI: covered-walkway ratio, exposed gaps, night-lighting evidence, and the locked score as secondary.
2. API credentials remain absent from this shell, so the OneMap/LTA measurement track is still gated. This task stayed free-tier: no API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.

## DISAGREEMENTS

1. None for P45. I did not run the web suite because the change is README/decision/state documentation only; repository integrity, whitespace, exact README term checks, and the locked weights diff cover the touched surface.
