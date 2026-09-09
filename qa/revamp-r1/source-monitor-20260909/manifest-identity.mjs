import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const relative = 'raw/manifest.json';
const committed = execFileSync('git', ['show', 'HEAD:' + relative], { cwd: root });
const local = readFileSync(resolve(root, relative));
const sha = value => createHash('sha256').update(value).digest('hex');
const describe = value => ({ bytes: value.length, sha256: sha(value),
  crlf: (value.toString('utf8').match(/\r\n/g) ?? []).length,
  lf: (value.toString('utf8').match(/\n/g) ?? []).length,
  bom: value.subarray(0, 3).equals(Buffer.from([239, 187, 191])) });
const base = JSON.parse(committed.toString('utf8')), current = JSON.parse(local.toString('utf8'));
const sourceKeys = [...new Set([...Object.keys(base.sources), ...Object.keys(current.sources)])].sort();
const sources = sourceKeys.map(key => ({ key, entireEntryEqual: isDeepStrictEqual(base.sources[key], current.sources[key]),
  recordedPayloadHashEqual: base.sources[key]?.sha256 === current.sources[key]?.sha256 }));
const result = { path: relative, committed: describe(committed), local: describe(local),
  equalBytes: committed.equals(local),
  exactAfterCRLFToLF: committed.toString('utf8').replace(/\r\n/g, '\n') === local.toString('utf8').replace(/\r\n/g, '\n'),
  equalParsedJSON: isDeepStrictEqual(base, current), sourceCount: sources.length, sources,
  byteArithmetic: `${local.length} - ${committed.length} = ${local.length - committed.length}; ${describe(local).crlf} CRLF terminators add one CR byte each`,
  gitEol: execFileSync('git', ['ls-files', '--eol', '--', relative], { cwd: root, encoding: 'utf8' }),
  localAfterSha256: sha(readFileSync(resolve(root, relative))),
  scope: 'Manifest representations only. Recorded source-entry hashes are equal, but underlying datasets were not rehashed by this diagnosis.',
  inputWrites: 0, networkRequests: 0, pipelineRuns: 0,
};
writeFileSync(resolve(root, 'qa/revamp-r1/source-monitor-20260909/manifest-identity.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result));
if (!result.exactAfterCRLFToLF || !result.equalParsedJSON || result.local.sha256 !== result.localAfterSha256 || sources.some(source => !source.entireEntryEqual)) process.exitCode = 1;
