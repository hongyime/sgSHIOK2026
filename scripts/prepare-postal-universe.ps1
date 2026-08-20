[CmdletBinding()]
param(
    [ValidateSet("official_current", "candidate_full_registered", "candidate_full_all")]
    [string]$Mode = "candidate_full_registered",
    [ValidatePattern("^v[0-9]+$")]
    [string]$Version = "v2",
    [switch]$ConfirmBoundedGeocode,
    [switch]$DownloadMissing,
    [switch]$RetryCachedFailures,
    [switch]$PlanOnly
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$UniversePath = "processed\postal_universe_${Mode}_${Version}.parquet"
$SummaryPath = "processed\postal_universe_${Mode}_${Version}_summary.json"
$GeocodedPath = "processed\postal_universe_${Mode}_${Version}_geocoded.parquet"
$GeocodedSummaryPath = "processed\postal_universe_${Mode}_${Version}_geocoded_summary.json"

function Write-PreparePlan {
    param([string]$Reason)
    Write-Output "== S.H.I.O.K. postal universe prep =="
    Write-Output "repo=$RepoRoot"
    Write-Output "mode=$Mode"
    Write-Output "version=$Version"
    Write-Output "plan_only=true"
    Write-Output "prepare=not_started"
    Write-Output "reason=$Reason"
    Write-Output ""
    Write-Output "commands:"
    Write-Output ".\scripts\prepare-postal-universe.bat -Mode $Mode -Version $Version -ConfirmBoundedGeocode -DownloadMissing"
    Write-Output ""
    Write-Output "This refreshes the source-derived postal universe, runs bounded OneMap geocode only for source-derived gaps, then prints the batch plan. It does not score postals, activate a bundle, or deploy."
}

if ($PlanOnly) {
    Write-PreparePlan -Reason "plan_only_requested"
    return
}

if (-not $ConfirmBoundedGeocode) {
    Write-PreparePlan -Reason "confirm_bounded_geocode_not_set"
    return
}

Push-Location $RepoRoot
try {
    Write-Output "== S.H.I.O.K. postal universe prep =="
    Write-Output "repo=$RepoRoot"
    Write-Output "mode=$Mode"
    Write-Output "version=$Version"
    Write-Output "score=false"
    Write-Output "deploy=false"

    foreach ($artifactPath in @($UniversePath, $SummaryPath, $GeocodedPath, $GeocodedSummaryPath)) {
        if (Test-Path -LiteralPath $artifactPath) {
            throw "refusing to overwrite existing versioned artifact: $artifactPath"
        }
    }

    Write-Output ""
    Write-Output "== Git status =="
    git status --short --branch
    if ($LASTEXITCODE -ne 0) { throw "git status failed" }

    Write-Output ""
    Write-Output "== Build source-derived postal universe =="
    $UniverseArgs = @(
        "run", "python", "run.py", "postal-universe",
        "--mode", $Mode,
        "--output", $UniversePath,
        "--summary", $SummaryPath
    )
    if ($DownloadMissing) { $UniverseArgs += "--download-missing" }
    & uv @UniverseArgs
    if ($LASTEXITCODE -ne 0) { throw "postal-universe failed" }

    Write-Output ""
    Write-Output "== Bounded OneMap geocode fill =="
    $GeocodeArgs = @(
        "run", "python", "run.py", "geocode-universe",
        "--input", $UniversePath,
        "--output", $GeocodedPath,
        "--summary", $GeocodedSummaryPath,
        "--confirm-bounded-geocode"
    )
    if ($RetryCachedFailures) { $GeocodeArgs += "--retry-cached-failures" }
    & uv @GeocodeArgs
    if ($LASTEXITCODE -ne 0) { throw "geocode-universe failed" }

    Write-Output ""
    Write-Output "== Batch plan =="
    uv run python run.py batch-plan --mode $Mode --summary $GeocodedSummaryPath --universe $GeocodedPath
    if ($LASTEXITCODE -ne 0) { throw "batch-plan failed" }

    Write-Output ""
    Write-Output "prepare=ok"
    Write-Output "universe=$UniversePath"
    Write-Output "geocoded_universe=$GeocodedPath"
    Write-Output "next_full_rescore_command=.\scripts\full-rescore-production.bat -ConfirmFullBatch -Workers 4 -SkipActivateBundle -PostalUniverse $GeocodedPath"
}
finally {
    Pop-Location
}
