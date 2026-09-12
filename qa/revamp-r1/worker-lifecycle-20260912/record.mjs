import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { analyze } from './analyze.mjs';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const dir = resolve(root, 'qa/revamp-r1/worker-lifecycle-20260912');
const r = JSON.parse(readFileSync(resolve(dir, 'observed-Btxfds/browser.json'))), analysis = analyze(r);
assert.equal(analysis.workerLifecycleConfirmed, true); assert.equal(analysis.unexplainedErrors.length, 0);
const sha = b => createHash('sha256').update(b).digest('hex');
assert.equal(sha(readFileSync(resolve(dir, 'observed-Btxfds/current-map.png'))), r.capture.sha256);
assert.equal(sha(readFileSync(resolve(root, 'web/public/maplibre/6.4.1/maplibre-gl-worker.mjs'))), r.workerBody.sha256);
const commands = [];
for (const [command, args] of [
  [process.execPath, ['--test', resolve(dir, 'analyze.test.mjs'), resolve(root, 'qa/revamp-r1/lifecycle-probe-20260910/analyze.test.mjs')]],
  [resolve(root, '.venv/Scripts/python.exe'), ['-B', resolve(root, 'scripts/check_repo_integrity.py')]],
]) {
  const stdout = execFileSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  commands.push({ command, args, stdout, exitCode: 0 }); console.log(stdout);
}
const report = { root, hostname: process.env.COMPUTERNAME, base: 'aa36d3d0eb60dca3997823a45001920bdd59cff3',
  originalBrowserPass: r.ok, scope: analysis.scope, analysis, workerBody: r.workerBody, commands,
  capture: { path: 'qa/revamp-r1/worker-lifecycle-20260912/observed-Btxfds/current-map.png', sha256: r.capture.sha256, inspected: true, reviewer: 'parent', before: r.capture.before, after: r.capture.after },
  anchorsUnchanged: r.anchorsUnchanged, cleanup: r.cleanup.verified, elapsedMs: r.elapsedMs,
  findings: [
    'Actual app worker request transfers from the page to its explicitly attached worker session, returns200 and loadingFinished there;18592response bytes match the packaged6.4.1worker sha256.',
    'Ten raw Invalid InterceptionId command errors match exact canceled tile identities within this trace. The original strict browser run remains failed4pass/1fail; offline attribution is separately tested, not a changed raw result.',
    'Current selected map has4same-key features before/after its inspected capture. Complete transport remains open with four gzip404 probes; lifecycle observation is not a speed claim or retroactive explanation of other traces.',
    'T13 provider/privacy/caps/moderator/backup questions have now been sent to the owner asynchronously. No answer is assumed; no Cloudflare resource, credential request in chat or reporting store was created.',
  ],
  disagreements: ['A page-only missing worker terminal is not evidence of a failed worker. Its owning session must be inspected; this current-app trace now demonstrates that mechanism.'],
  pipelineRuns: 0, deployments: 0, installations: 0, productComplete: false,
};
writeFileSync(resolve(dir, 'summary.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ workerLifecycleConfirmed: analysis.workerLifecycleConfirmed, explainedErrors: analysis.page.explainedCanceledTileCommands.length, unexplainedErrors: analysis.unexplainedErrors.length, remainingPageRequests: analysis.remainingPageRequests.length, originalBrowserPass: r.ok }));
