[CmdletBinding()]
param(
    [string]$DataBundle = "",
    [switch]$ConfirmProduction,
    [switch]$SkipWebTests
)

$ErrorActionPreference = "Stop"
$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ($RepoRoot -ne "C:\sgSHIOK2026") { throw "Wrong working root; use C:\sgSHIOK2026" }
if ($PSBoundParameters.ContainsKey("SkipWebTests")) {
    throw "SkipWebTests is retired; committed-stage tests are required."
}

function Write-DeployPlan {
    Write-Output "plan_only=true"
    Write-Output "deploy=not_started"
    Write-Output "reason=confirm_production_not_set"
    Write-Output "scope=committed_frontend_with_pinned_bundle_and_lamp_overlay"
    Write-Output "preparation=existing_dependencies_no_install_no_data_preparation"
    Write-Output "completion=exact_provider_READY_then_separate_production_smoke"
}

if (-not $ConfirmProduction) {
    Write-DeployPlan
    return
}

$Python = Join-Path $RepoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $Python -PathType Leaf)) {
    throw "Existing Python environment required; this command never installs dependencies."
}
$PublishArgs = @("--deploy", "--confirm-publish", "--confirm-production")
if ($DataBundle) {
    if ($DataBundle -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]*$') { throw "Invalid bundle name" }
    $PublishArgs += @("--input", (Join-Path $RepoRoot "web\public\data\$DataBundle"))
}
Push-Location $RepoRoot
try {
    & $Python -B (Join-Path $RepoRoot "run.py") publish @PublishArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Publish did not reach verified provider READY. Inspect its state/URL before any retry."
    }
    Write-Output "production_smoke=not_verified"
}
finally { Pop-Location }
