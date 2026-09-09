import { readFileSync } from 'node:fs';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const report = JSON.parse(readFileSync(root + '/qa/revamp-r1/security-triage-20260909/source-corrected.json'));
console.log('working_root=' + root + '\nhostname=' + process.env.COMPUTERNAME);
for (const command of report.commands) {
  console.log('command=' + command.command + ' ' + command.args.join(' '));
  process.stdout.write(command.stdout);
  console.log('exit=' + command.exitCode);
}
console.log('advisory=' + report.advisory + '\npinned_version=' + report.pinnedVersion);
console.log('alert_arithmetic=2 manifest alerts, 1 unique advisory, 1 affected direct dependency');
console.log('correction=' + report.priorAttempt);
console.log('FINDINGS');
report.findings.forEach((finding, index) => console.log((index + 1) + '. ' + finding));
console.log('DISAGREEMENTS');
report.disagreements.forEach((finding, index) => console.log((index + 1) + '. ' + finding));
console.log('owner_question=' + report.ownerQuestion);
console.log('installations=0\npipeline_runs=0\ndeployment_commands=0\nprotected_payload_mutations=0');
