[CmdletBinding()]
param(
    [string]$DataBundle = "",
    [switch]$ConfirmProduction,
    [switch]$SkipWebTests,
    [switch]$SkipGitPush,
    [switch]$PlanOnly,
    [int]$RemoteWaitSeconds = 900,
    [int]$RemotePollSeconds = 20,
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"
# Retained entry point, not a dormant deploy/activation implementation.
foreach ($Name in @("ConfirmProduction", "SkipWebTests", "SkipGitPush", "RemoteWaitSeconds", "RemotePollSeconds", "CommitMessage")) {
    if ($PSBoundParameters.ContainsKey($Name)) {
        throw "Data-release execution is retired ($Name). Frontend-only deployment does not change the artifact pointer; data release requires a separately approved implementation."
    }
}
if ($DataBundle -and $DataBundle -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]*$') { throw "Invalid bundle name" }
Write-Output "plan_only=true"
Write-Output "release=not_started"
Write-Output "activation=not_started"
Write-Output "reason=data_release_requires_separately_approved_implementation"
Write-Output "bundle=$DataBundle"
Write-Output "frontend_deployment=deploy-production.ps1_with_unchanged_pinned_bundle"
