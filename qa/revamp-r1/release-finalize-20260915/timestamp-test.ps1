$ErrorActionPreference='Stop'
if((Get-Location).Path -ne 'C:\sgSHIOK2026'){throw 'Wrong working root'}
$path='C:\sgSHIOK2026\qa\revamp-r1\same-document-zoom-20260915\processes.ps1'
$tokens=$null;$errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile($path,[ref]$tokens,[ref]$errors)
if($errors.Count){throw 'Parser error'}
$function=$ast.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -ceq 'RecordedCreation'},$true)
if(-not $function){throw 'Production helper missing'}
. ([ScriptBlock]::Create($function.Extent.Text))
$iso='2020-01-01T01:02:03.1234560Z'
$parsed=('{"created":"'+$iso+'"}' | ConvertFrom-Json).created
$checks=@(
  @{name='String receipt exact timestamp';passed=(RecordedCreation $iso)-ceq $iso},
  @{name='JSON DateTime receipt exact timestamp';passed=(RecordedCreation $parsed)-ceq $iso},
  @{name='Distinct microsecond remains distinct';passed=(RecordedCreation '2020-01-01T01:02:03.1234570Z')-cne $iso},
  @{name='Offset represents same instant';passed=(RecordedCreation '2020-01-01T09:02:03.1234560+08:00')-ceq $iso}
)
$refused=$false
try{RecordedCreation 'not-a-timestamp' | Out-Null}catch{$refused=$true}
$checks+=@{name='Malformed timestamp refused';passed=$refused}
$result=@{checks=$checks;passed=@($checks|Where-Object{-not $_.passed}).Count -eq 0;helperSha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant();shell=$PSVersionTable.PSVersion.ToString()}
$out='C:\sgSHIOK2026\qa\revamp-r1\release-finalize-20260915\timestamp-tests.json'
if(Test-Path -LiteralPath $out){throw 'Receipt exists'}
$text=$result|ConvertTo-Json -Depth 6
[IO.File]::WriteAllText($out,$text+"`n")
Write-Output $text
if(-not $result.passed){exit 1}
