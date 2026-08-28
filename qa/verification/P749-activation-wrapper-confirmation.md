# P749 activation wrapper confirmation

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Command output

```text
PS C:\sgSHIOK2026> rg -n "activate-data-bundle|release-data-bundle|generated_20260805|generated\b|Copy-Item|Move-Item|Remove-Item|New-Item|Set-Content|Out-File|checksums|vercel|deploy" 'C:\sgSHIOK2026\scripts' 'C:\sgSHIOK2026\README.md' 'C:\sgSHIOK2026\CLAUDE.md' 'C:\sgSHIOK2026\tests'
C:\sgSHIOK2026\scripts\activate-data-bundle.ps1:12:$RootIgnorePath = Join-Path $RepoRoot ".vercelignore"
C:\sgSHIOK2026\scripts\activate-data-bundle.ps1:13:$WebIgnorePath = Join-Path $WebDir ".vercelignore"
C:\sgSHIOK2026\scripts\activate-data-bundle.ps1:32:        $RemoteUrl = "https://sgshiok.vercel.app/data/$DataBundle/manifest.json"
C:\sgSHIOK2026\scripts\activate-data-bundle.ps1:78:web/.vercel/
C:\sgSHIOK2026\scripts\activate-data-bundle.ps1:90:.vercel/
C:\sgSHIOK2026\scripts\release-data-bundle.ps1:60:    Write-Output "This will validate locally, direct-deploy the ignored data bundle, wait for the production manifest, activate web/data-bundle.json, preflight, commit, and push."
C:\sgSHIOK2026\scripts\release-data-bundle.ps1:91:    Write-Output "== Direct production deploy =="
C:\sgSHIOK2026\scripts\release-data-bundle.ps1:94:    & (Join-Path $PSScriptRoot "deploy-production.ps1") @DeployArgs
C:\sgSHIOK2026\scripts\release-data-bundle.ps1:102:            & (Join-Path $PSScriptRoot "activate-data-bundle.ps1") -DataBundle $DataBundle
```

## FINDINGS

1. `scripts/activate-data-bundle.ps1` could be invoked directly and rewrite `web/data-bundle.json`, root `.vercelignore`, and `web/.vercelignore` without an activation-specific confirmation.
2. `scripts/release-data-bundle.ps1` already had `-ConfirmProduction`; it now passes `-ConfirmActivation` into the activation wrapper so the approved release path still reaches activation.

## DISAGREEMENTS

1. None.
