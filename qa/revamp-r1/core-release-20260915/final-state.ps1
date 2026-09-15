$ErrorActionPreference='Stop'
$root='C:\sgSHIOK2026'
if ((Get-Location).Path -ne $root) { throw 'Wrong working root' }
$env:TEMP=Join-Path $root 'tmp'; $env:TMP=$env:TEMP
$base=Join-Path $root 'qa\revamp-r1\core-release-20260915'
$previous=Get-Content -LiteralPath (Join-Path $base 'checkpoint.json') -Raw | ConvertFrom-Json
foreach ($anchor in $previous.protectedAnchors) {
  $path=Join-Path $root $anchor.path
  $hash=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower()
  if ($hash -ne $anchor.sha256 -or (Get-Item -LiteralPath $path).Length -ne $anchor.bytes) { throw "INPUT_HASH_MISMATCH $($anchor.path) $hash" }
}
$weights=(Get-FileHash -LiteralPath (Join-Path $root 'pipeline\config\weights.yaml') -Algorithm SHA256).Hash.ToLower()
if ($weights -ne $previous.weights) { throw "INPUT_HASH_MISMATCH weights $weights" }
$full=Get-Content -LiteralPath (Join-Path $base 'full-5mudtbs0\summary.json') -Raw | ConvertFrom-Json
if (-not $full.passed) { throw 'Full suite failed' }
$matches=@()
foreach ($name in @('web/scripts/build-next-release.mjs','web/lib/__tests__/frontend-retention.test.ts','web/lib/data.ts')) {
  $a=(Get-FileHash -LiteralPath (Join-Path $root $name) -Algorithm SHA256).Hash.ToLower()
  $b=(Get-FileHash -LiteralPath (Join-Path 'C:\sgSHIOK2026\tmp\test-without-data-0V4elz' $name) -Algorithm SHA256).Hash.ToLower()
  if ($a -ne $b -or $a -ne $full.before.$name) { throw "Snapshot source mismatch $name" }
  $matches += [ordered]@{path=$name;sha256=$a;snapshotMatches=$true}
}
$file=Join-Path $root 'qa\verification\REVAMP-R1-core-walk.md'
[ordered]@{
  root=$root;host=$env:COMPUTERNAME;sourceRevision=(git rev-parse HEAD);retentionDays=30
  attempt=(Get-Content -LiteralPath (Join-Path $base 'attempt-2\invocation.json') -Raw | ConvertFrom-Json)
  execution=(Get-Content -LiteralPath (Join-Path $base 'attempt-2\execution.json') -Raw | ConvertFrom-Json)
  successLedgerExists=(Test-Path -LiteralPath 'C:\sgSHIOK2026\tmp\core-release-20260915-candidate-2\release-manifest.json')
  formerWorkerPid41700Present=[bool](Get-Process -Id 41700 -ErrorAction SilentlyContinue)
  fullWeb=[ordered]@{tests=3326;files=85;dependencyGuards=42;elapsedSeconds=$full.elapsedSeconds;countArithmetic='3325 + 1 compiler invocation contract = 3326';sourceMatches=$matches;receipt='qa/revamp-r1/core-release-20260915/full-5mudtbs0/summary.json';isolation=(Get-Content -LiteralPath 'C:\sgSHIOK2026\tmp\test-without-data-0V4elz\isolation.json' -Raw | ConvertFrom-Json)}
  protectedAnchorsVerified=$previous.protectedAnchors.Count;weights=$weights
  evidenceBefore=[ordered]@{bytes=(Get-Item -LiteralPath $file).Length;sha256=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLower()}
  builds=0;browserRuns=0;deployments=0;installs=0;pipelineRuns=0
  FINDINGS=@(
    'Packaging correction4f0234b is pushed. Real stage2 no longer reports the optional-gzip prerequisite error; it progressed into copying and input verification but timed out at1200seconds. There is no success ledger and no completed candidate.'
    'The owned process supervisor reports cleanup_complete=true. The partial scratch copy is preserved. No blind stage3, compiler run, browser replay or deployment followed.'
    'Current isolated web suite3326/85files+42guards passes. Build-wrapper and loader sources match the isolated snapshot. This adds one compiler invocation contract to the prior3325tests, not a user-facing feature.'
    'Native same-document zoom preparation has61offline contracts plus syntax/Win32 ABI checks at qa/revamp-r1/same-document-zoom-20260915/offline-GKmkV0/offline.json. No browser was launched; both reviewers are closed.'
    '30-day private retention remains unchanged. All11protected anchors and locked weights still match. No Supabase calls or new reporting activation occurred.'
  )
  DISAGREEMENTS=@(
    'A staged directory without a verified success ledger is not a release candidate. Test passes do not override the preparation timeout or prove a deployment.'
    'Do not infer that uncompressed staging bytes alone require a paid plan: Vercel documents split archives behind --archive=tgz. The actual upload package, quota, rollback and exact deployment still need verification; no archive or upload is claimed.'
  )
  documentation=@('https://vercel.com/docs/cli/deploy','https://vercel.com/changelog/split-tgz-is-now-the-default-cli-archive-deployment-behavior','https://vercel.com/docs/limits')
  next='Goal active. Diagnose expensive staging IO without rerunning a full copy. Preserve both partial candidates and all frozen inputs. Obtain an authenticated complete stage, then execute the sanitized bounded compiler and same-document browser acceptance. Owner moderator email remains pending; core-map release stays independent of reporting.'
} | ConvertTo-Json -Depth 10
