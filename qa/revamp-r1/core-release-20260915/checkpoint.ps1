$ErrorActionPreference = 'Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong working root' }
$env:TEMP = 'C:\sgSHIOK2026\tmp'
$env:TMP = $env:TEMP
$root = 'C:\sgSHIOK2026'
$base = Join-Path $root 'qa\revamp-r1\core-release-20260915'
$tests = @()
foreach ($name in @('staging-clz_kjbv','staging-oab1fmml','focused-opa5y9k1','types-zzjk47q8','docs-rgsva0gi')) {
    $path = Join-Path $base "$name\summary.json"
    $data = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if (-not $data.passed) { throw "Check failed: $name" }
    $tests += [ordered]@{ path = "qa/revamp-r1/core-release-20260915/$name/summary.json"; sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower(); passed = $data.passed; elapsedSeconds = $data.elapsedSeconds }
}
$anchors = Get-Content -LiteralPath (Join-Path $root 'qa\revamp-r1\report-operations-20260915\database-checkpoint.json') -Raw | ConvertFrom-Json
$verified = @()
foreach ($anchor in $anchors.protectedAnchors) {
    $path = Join-Path $root $anchor.path
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower()
    $size = (Get-Item -LiteralPath $path).Length
    if ($hash -ne $anchor.sha256 -or $size -ne $anchor.bytes) { throw "INPUT_HASH_MISMATCH $($anchor.path) $hash" }
    $verified += [ordered]@{ path=$anchor.path; bytes=$size; sha256=$hash }
}
$weights = (Get-FileHash -LiteralPath (Join-Path $root 'pipeline\config\weights.yaml') -Algorithm SHA256).Hash.ToLower()
if ($weights -ne $anchors.weights) { throw "INPUT_HASH_MISMATCH weights $weights" }
$evidence = Join-Path $root 'qa\verification\REVAMP-R1-core-walk.md'
$prefix = [ordered]@{bytes=(Get-Item -LiteralPath $evidence).Length; sha256=(Get-FileHash -LiteralPath $evidence -Algorithm SHA256).Hash.ToLower()}
if ($prefix.bytes -ne 540945 -or $prefix.sha256 -ne 'ba6ce82f15ac9a8eca92b7cae3dbc25999f9a3df7a5dc25a446df708ca136b12') { throw 'Evidence prefix changed; inspect before append' }
$ignored = @(git check-ignore -v -- qa/verification/REVAMP-R1-core-walk.md)
$ignoreExit = $LASTEXITCODE
[ordered]@{
    root=$root; host=$env:COMPUTERNAME; base=(git rev-parse HEAD); retentionDays=30
    firstStage=(Get-Content -LiteralPath (Join-Path $base 'stage.json') -Raw | ConvertFrom-Json)
    checks=$tests; protectedAnchors=$verified; weights=$weights; evidenceBefore=$prefix
    checkIgnore=[ordered]@{stdout=$ignored; exitCode=$ignoreExit}
    testInterpretation='70 staging tests pass before matcher tightening; final 23 boundary cases pass with 51 deselected. Focused web 93/3 files plus42 guards; TypeScript and41 docs pass. No fresh full web suite claimed. Earlier eight red regressions and the240second staging timeout are preserved.'
    FINDINGS=@(
        'The first real stage stopped after391.344seconds before copying/building at a raw geometry file without optional gzip. The current loader supports gzip404 then plain JSON; this was an inherited staging-policy defect, not proof of lost route data.'
        'Fixed staging to retain raw bytes when optional gzip is absent. Existing mismatched/corrupt gzip, missing referenced files, raw-only transit and absent plain overlay tiles still fail. Tightened the matcher so nested paths are not wrongly omitted.'
        'Pinned the release wrapper to public next build --webpack. Earlier QA needed a Turbopack root override for linked dependencies. The actual Webpack build/browser remains unexecuted; sanitized environment is still required.'
        'The legacy240second test wrapper timed out after68 dots, not70passes. A later owned-process run completed70tests; final matcher boundaries completed23. Existing failed attempts remain recorded.'
        '30-day retention remains the current policy. No Supabase calls, input regeneration, pipeline run, build or deployment occurred in this checkpoint. Core-map release is independent of private report activation.'
    )
    DISAGREEMENTS=@(
        'Missing an optional compressed companion is not the same as a missing logical artifact. Preserving an existing supported representation is packaging, not repairing or regenerating input.'
        'Passing fixtures or preserving bytes does not establish native zoom, old-client migration, security retirement, rollback or deployed behavior. Those acceptance gates remain open.'
    )
    next='Commit and push the coherent packaging fix, then one fresh supervised stage-current.py attempt. Stop on any actual input hash mismatch. Build only after staging succeeds. Goal remains active.'
} | ConvertTo-Json -Depth 10
