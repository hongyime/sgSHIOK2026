import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const label = process.argv[2];
if (!/^[a-z0-9-]+$/.test(label || '')) throw Error('Fresh receipt label required');
const commands = [
  ['gh', ['api', 'repos/hongyime/sgSHIOK2026/dependabot/alerts?state=open&per_page=100', '--jq',
    '[.[] | select(.security_advisory.severity == "critical") | {number,state,dependency,ghsa_id:.security_advisory.ghsa_id,html_url:.html_url,range:.security_vulnerability.vulnerable_version_range,patched:.security_vulnerability.first_patched_version}]']],
  ['rg', ['-n', 'maplibre-gl|setHTML|setDOMContent|AttributionControl|attributionControl|ONE_MAP_ATTRIBUTION', 'web/components', 'web/lib/transit-popup.ts', 'web/package.json']],
];
const report = { root, hostname: process.env.COMPUTERNAME, at: new Date().toISOString(), commands: [] };
for (const [command, args] of commands) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30_000 });
  report.commands.push({ command, args, stdout: result.stdout, stderr: result.stderr, exitCode: result.status, error: result.error?.message });
}
report.pinnedVersion = JSON.parse(readFileSync(resolve(root, 'web/package.json'))).dependencies['maplibre-gl'];
report.advisory = 'https://github.com/maplibre/maplibre-gl-js/security/advisories/GHSA-jrc7-96c5-q579';
report.findings = [
  'GitHub reports two open critical alerts for one MapLibre advisory, against package.json and package-lock.json. This is one affected dependency, not two distinct vulnerabilities.',
  'MapLibre6.1.0 is pinned; the publisher identifies6.4.1 as patched. Current map uses attributionControl:false and a fixed local attribution constant. This scoped inspection is not an exploit demonstration or a complete proof of non-reachability.',
  'Upgrade must also update the pinned worker/shared module URLs, their integrity tests and immutable caching rules. Keep old versioned assets for retained clients; no protected data changes.',
];
report.disagreements = ['Passing functional tests does not clear a dependency advisory. Treat remediation as a pre-deployment owner gate; no install or deploy has been performed.'];
report.ownerQuestion = 'Approve MapLibre6.4.1 and matching worker asset installation, with zero pipeline or deployment work?';
report.priorAttempt = 'checks.json retains the first rg error for a nonexistent guessed transit-poi.ts path; this follow-up uses the actual imported transit-popup.ts. No source-scan success is claimed for the earlier command.';
writeFileSync(resolve(root, 'qa/revamp-r1/security-triage-20260909/' + label + '.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.commands.every(command => command.exitCode === 0) ? 0 : 1;
