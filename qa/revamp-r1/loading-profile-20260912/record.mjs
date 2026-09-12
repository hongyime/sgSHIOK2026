import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { stages } from './analyze.mjs';
import { summarizeTransport } from '../request-audit-20260910/transport.mjs';
const root = 'C:/sgSHIOK2026/qa/revamp-r1/loading-profile-20260912/';
const bytes = readFileSync(root + 'observed-OUYeAZ/browser.json'), raw = JSON.parse(bytes);
const transport = summarizeTransport(raw.entries.filter(e => e.sessionId === raw.mainSession));
const unexplained = raw.errors.filter(e => !transport.explainedCanceledTileCommands.some(c =>
  e.cdp?.sessionId === raw.mainSession && e.cdp.id === c.command.id && e.interception === c.reply.error?.message));
const tests = execFileSync(process.execPath, ['--test', root + 'analyze.test.mjs'], { encoding: 'utf8' });
const captures = raw.samples.map(s => {
  const sha256 = createHash('sha256').update(readFileSync(root + 'observed-OUYeAZ/' + s.cache + '.png')).digest('hex');
  assert.equal(sha256, s.capture.sha256);
  return { cache: s.cache, sha256, before: s.capture.before, after: s.capture.after, parentVisualInspection: 'Map, selected route, matching metric panel visible; both inspected after run.' };
});
const summary = { base: '90dccd9', root: 'C:\\sgSHIOK2026', hostname: raw.hostname,
  traceSha256: createHash('sha256').update(bytes).digest('hex'), rawExitCode: 1, rawPass: raw.ok,
  policy: raw.policy, stages: raw.samples.map(stages), captures,
  host: { minimumAvailableMiB: Math.min(...raw.host.map(h => h.availableMiB)), samples: raw.host.length,
    pagingAvailable: false, counterFailure: raw.hostCounters, samplerExit: raw.samplerExit },
  errors: { count: raw.errors.length, explainedCanceledTiles: transport.explainedCanceledTileCommands.length, unexplained },
  tests: { command: 'node --test qa/revamp-r1/loading-profile-20260912/analyze.test.mjs', exitCode: 0, stdout: tests },
  cleanup: raw.cleanup, anchorsUnchanged: raw.anchorsUnchanged,
  FINDINGS: ['Cold/warm text observed at3798.8/1675.9ms; current route at7559/2125.7ms. One instrumented local pair, not phone acceptance or speedup.',
    'Geometry body completed before score body in both runs. loadSelection still publishes geom:null then awaits already-started geometry and publishes again. Candidate: include an already-settled geometry result in first selection, without waiting when pending.',
    'Ten interception errors retained in raw strict failure; exact cancellation attribution is separate.',
    'Counter escaping was wrong; paging is unknown. Driver now uses tested single-backslash arguments and gates sampler output before launching Chrome. Revised driver was not rerun. Original executed runner preserved.'],
  DISAGREEMENTS: ['No claim that early geometry coalescing saves the measured cold/warm difference. Required late geometry and stale-selection behavior must remain intact.'],
  nextAction: 'Regression-test and implement settled-geometry selection coalescing; delayed/rejected geometry must never delay score text, stale attempts must not publish. No repeat of this profile solely for PASS.',
  noPipeline: true, noInstall: true, noDeployment: true };
writeFileSync(root + 'summary.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({stages:summary.stages.map(({longTasks, ...s})=>s),errors:summary.errors,host:summary.host,tests:5,cleanup:raw.cleanup.verified},null,2));
