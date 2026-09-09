import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong root');
const [browserName, buildName, testName] = process.argv.slice(2);
if (![browserName,buildName,testName].every(value=>/^[a-z0-9-]+$/.test(value||''))) throw Error('Explicit final receipts required');
const read = path => JSON.parse(readFileSync(resolve(root,path),'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const checksPath='qa/revamp-r1/published-options-20260909/'+testName+'/checks.json';
const buildPath='qa/revamp-r1/cached-release-20260908/'+buildName+'/build.json';
const browserPath='qa/revamp-r1/comparison-ui-20260909/'+browserName+'/browser.json';
const checks=read(checksPath),build=read(buildPath),browser=read(browserPath);
if(!checks.ok||build.exitCode!==0||!browser.ok||browser.build!==build.buildId)throw Error('Required check failed');
if(!/Tests\s+1269 passed/.test(checks.commands[0].stdout))throw Error('Unexpected final test count');
const match=checks.commands[0].stdout.match(/"snapshot":\s*"([^"]+)"/);
if(!match)throw Error('Missing isolated snapshot');
const snapshot=JSON.parse('"'+match[1]+'"');
if(!snapshot.startsWith(resolve(root,'tmp')+'\\'))throw Error('Unexpected snapshot path');
const sourcePaths=execFileSync('git',['diff','--cached','--name-only','--','web/'],{cwd:root,encoding:'utf8'}).trim().split('\n');
const sources=sourcePaths.map(path=>{
  const bytes=readFileSync(resolve(root,path)),hash=sha(bytes);
  return{path,bytes:bytes.length,sha256:hash,matchesTestedSnapshot:hash===sha(readFileSync(resolve(snapshot,path))),
    matchesBuiltSource:hash===build.sources.find(source=>source.path===path)?.sha256};
});
if(sources.some(source=>!source.matchesTestedSnapshot||!source.matchesBuiltSource))throw Error('Untested/unbuilt source');
const anchors=checks.inputs.map(input=>{
  const bytes=readFileSync(resolve(root,input.path)),hash=sha(bytes);
  if(hash!==input.expected||bytes.length!==input.bytes)throw Error('STOP_INPUT_MISMATCH '+input.path+' '+hash);
  return{path:input.path,bytes:bytes.length,sha256:hash,match:true};
});
let browserAbsent=false;
try{process.kill(browser.chromePid,0);}catch(error){if(error.code!=='ESRCH')throw error;browserAbsent=true;}
if(!browserAbsent)throw Error('Owned browser remains running');
const summary={
  task:'T10',date:new Date().toISOString(),root,hostname:process.env.COMPUTERNAME,
  base:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),status:'complete_local_comparison_ui_not_sharing_or_deployment',
  sources,anchors,validation:{tests:1269,files:50,arithmetic:'1154 + 20 resolver + 42 controller + 45 component + 8 page = 1269; 48 + 2 files = 50',
    targetedCoverage:'64 resolver + 42 controller + 45 component + 52 page = 203 within the full suite',checksPath,buildPath,browserPath,buildId:build.buildId,
    browserChecks:browser.checks.length,captures:browser.captures.length,browserAbsent,
    parentVisualInspection:'All11 final captures inspected:desktop/top/metrics and mobile/top/metrics/last-column. Route, headings, active-map postal and attribution remain visible; bounded table scrolling is intentional.'},
  corrections:[
    'Initial parent page run:49/50; new test incorrectly expected flattened top-level bus geometry instead of the pinned category bus parts. Test corrected to original fixture route_options.bus.sheltered_parts.',
    'Independent controller run:41/42. Already-empty reset caused an unnecessary owned-key write; same42 tests pass after semantic no-op guard. Both raw receipts preserved.',
    'Independent source review found shortest-only geometry sent to sheltered-only map. Two new page regressions fail in shortest-only-red (193pass/2fail), then same195 focused tests pass in shortest-only-green after requiring ready geometry and surviving sheltered parts.',
    'comparison-ui-full-1:1180/48 passed before new component/controller files were included in tracked-source copy; full-2:1261/50 then passed. The final receipt selected above additionally covers the visual-review polish.',
    'acceptance-1 stopped on a QA selector for the unused default MapLibre attribution control. The screenshot showed custom OneMap attribution unobscured; the harness now inspects the actual attribution element.',
    'acceptance-2 passed48 checks/8 captures. Visual review then found mobile vertical scrolling lost postal headings. Compact postal map-select buttons, sticky headers and an active-map postal label were added.',
    'acceptance-3 passed all11 screenshot checks then exposed keyboard focus hidden behind sticky row labels after horizontal scrolling. Matching112px inline scroll padding fixes the obscured removal control.',
    'acceptance-4 hit the existing map startup timeout while valid walk text loaded. This is retained as an unresolved T01/T02 reliability finding. Final harness permits at most one explicit existing Reload page action and records it, never extends the timeout or retries in a loop. Final startupRecovery field below states whether used.',
    'Some Chrome processes did not exit inside the short cleanup grace period; later explicit process inspection found the old90148/91716 browser profiles absent. Final browser absence is checked independently below.',
    'After final browser capture, retired owned QA preview4323/4324 processes97404/100712 were command-line-verified as startup-20260909-3 and stopped. Current4325/4326 and read-only data upstream4321 remained untouched. No performance attribution follows from this cleanup.'
  ],
  catalogue:{
    'C01/C03/C04':'Real fixture contracts and component/page handlers; actual browser adds three postals, switches category, compares four nullable measurements and selects one mapped walk.',
    'C02':'Bounded reducer/controller tests; UI disables fourth-add and redirects an existing postal to its column. No silent replacement.',
    'C05/C06':'Owned-key controller restoration/failures and browser reload. Closed restoration starts no shortlist reads; controller explicitly tests denied, corrupt and obsolete storage.',
    'C09':'Remove updates visible/local state and focus; share-state agreement is intentionally not claimed until T11.',
    'M03/M15':'Actual viewport screenshots/current-route counts, measured overlay fit and unobscured attribution; no representative-phone performance claim.'
  },
  findings:[
    'Home comparison is now a local explicit map-first workflow:up to3 postals, one category, real destinations and4 nullable metrics, one active mapped walk.',
    'ADR-16 source pinning is shared by row and map. No inspected alternate, shortest route, missing field or unavailable record is silently substituted or ranked as zero.',
    'Independent review caught and fixed redundant empty-reset writes and a shortest-only false map visibility failure. Red receipts remain intact.',
    'Stale success/error/geometry delivery is guarded across remove/re-add, category ABA, retry, close/reopen and source replacement. Inactive columns cannot move the map.',
    'Protected data remains read-only; all11 recorded anchors match and tested/built source hashes agree. Pipeline, installations and deployment remain zero.',
    'One final-build cold start hit the existing map-startup timeout although score text loaded. A later functional comparison pass does not erase that reliability failure or close T01/T02.'
  ],
  disagreements:[
    'Pure state predicates were not enough to claim asynchronous UI safety; T10 adds the actual token-owning loader and page/browser evidence.',
    'A valid shortest geometry is not evidence that the sheltered comparison route can be drawn. Valid metrics survive that missing capability without a false map failure.',
    'Comparison UI completion is not shortlist-sharing, representative performance, physical-user acceptance or production release; those remain separate tickets/gates.'
  ],
  limitations:['Headless Chrome with SwiftShader is functional viewport evidence, not representative mobile performance.',
    'T11 sharing and T25 cross-feature accessibility remain. T13 reporting,T21 compute,T26 owner/device/M12,T28 deployment need their explicit gates.',
    'No new pipeline artifact, live preview request, provider provisioning, install, deployment command or X operation.'],
  pipelineRuns:0,pipelineCost:0,installations:0,deploymentCommands:0,
  startupRecovery:browser.startupRecovery ?? null,
};
const output=resolve(root,'qa/revamp-r1/comparison-ui-20260909/summary.json');
writeFileSync(output,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,sources:sources.length,anchors:anchors.length,tests:1269,files:50,
  browserChecks:browser.checks.length,captures:browser.captures.length,browserAbsent,sha256:sha(readFileSync(output))},null,2));
