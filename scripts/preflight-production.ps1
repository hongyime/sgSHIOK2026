[CmdletBinding()]
param(
    [string]$DataBundle = "",
    [switch]$ConfirmProductionPreflight,
    [switch]$SkipWebTests,
    [switch]$SkipNetworkPreflight
)

$ErrorActionPreference = "Stop"
$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ($RepoRoot -ne "C:\sgSHIOK2026") { throw "Wrong working root; use C:\sgSHIOK2026" }
foreach ($Name in @("SkipWebTests", "SkipNetworkPreflight")) {
    if ($PSBoundParameters.ContainsKey($Name)) {
        throw "$Name is retired; frontend preparation always tests committed source and never runs network pipeline tasks."
    }
}
function Write-PreflightPlan {
    Write-Output "plan_only=true"
    Write-Output "preflight=not_started"
    Write-Output "reason=confirm_production_preflight_not_set"
    Write-Output "scope=fresh_committed_stage_pinned_bundle_required_overlay"
    Write-Output "checks=byte_identity_static_validation_audit_tests_direct_next_build"
    Write-Output "no_install=true"
    Write-Output "deploy=not_started"
}
if (-not $ConfirmProductionPreflight) {
    Write-PreflightPlan
    return
}
$Python = Join-Path $RepoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $Python -PathType Leaf)) {
    throw "Existing Python environment required; this command never installs dependencies."
}
$PrepareArgs = @("--prepare", "--confirm-preparation")
if ($DataBundle) {
    if ($DataBundle -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]*$') { throw "Invalid bundle name" }
    $PrepareArgs += @("--input", (Join-Path $RepoRoot "web\public\data\$DataBundle"))
}
Push-Location $RepoRoot
try {
    & $Python -B -m pipeline.publish @PrepareArgs
    if ($LASTEXITCODE -ne 0) { throw "Release preparation blocked; preserve the failed stage for inspection." }
    Write-Output "deploy=not_started"
}
finally { Pop-Location }
