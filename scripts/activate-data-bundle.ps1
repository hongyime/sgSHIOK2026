[CmdletBinding()]
param(
    [string]$DataBundle = "",
    [switch]$ConfirmActivation,
    [switch]$SkipRemoteCheck
)

$ErrorActionPreference = "Stop"
foreach ($Name in @("ConfirmActivation", "SkipRemoteCheck")) {
    if ($PSBoundParameters.ContainsKey($Name)) {
        throw "Data activation is retired ($Name). Frontend-only deployment does not change the artifact pointer; data release requires a separately approved implementation."
    }
}
if ($DataBundle -and $DataBundle -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]*$') { throw "Invalid bundle name" }
Write-Output "plan_only=true"
Write-Output "activation=not_started"
Write-Output "reason=data_activation_requires_separately_approved_implementation"
Write-Output "bundle=$DataBundle"
Write-Output "existing_pointer_and_ignore_files=unchanged"
