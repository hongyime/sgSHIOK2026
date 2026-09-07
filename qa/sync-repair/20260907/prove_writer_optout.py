"""Read the pinned external writer and execute only its opt-out branch with no-op I/O."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(r"C:\sgSHIOK2026")
OUT = ROOT / "qa/sync-repair/20260907"
SOURCE_REPO = "hongyime/sourcerepo"
SOURCE_COMMIT = "bc7594f3b888f5253f5c0d28518394a2ca2ea15e"
SOURCE_PATH = ".github/scripts/sync-selected-paths.sh"
EXPECTED_BLOB = "84ffc061340110dc5e483cb8832d6d3c5c8b190e"


def main() -> None:
    assert Path.cwd() == ROOT
    result = json.loads(subprocess.check_output([
        "gh", "api", f"repos/{SOURCE_REPO}/contents/{SOURCE_PATH}?ref={SOURCE_COMMIT}",
    ], cwd=ROOT))
    data = base64.b64decode(result["content"])
    digest = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
    assert result["sha"] == digest == EXPECTED_BLOB
    lines = data.decode().splitlines()
    start = lines.index('  if [[ ",$REPO_TOPICS," == *",no-config-sync,"* ]]; then')
    end = next(i for i in range(start + 1, len(lines)) if lines[i] == "  fi")
    branch = "\n".join(lines[start:end + 1])
    # Run the exact branch. All its filesystem/archive operations are inert stubs.
    # No complete sync script, repo clone, deletion, API mutation or push is executed.
    program = """
set -eu
cd() { :; }
rm() { printf 'cleanup-suppressed\\n'; }
rearchive_repo() { printf 'archive-suppressed\\n'; }
for diagnostic_attempt in 1; do
""" + branch + """
printf 'would-reach-config-writes\\n'
done
"""
    cases = []
    bash = Path(r"C:\Program Files\Git\bin\bash.exe")
    assert bash.is_file(), "Use the installed Git Bash; do not install tools"
    for topics, should_skip in [
        ("python,singapore,data,web", False),
        ("python,singapore,data,web,no-config-sync", True),
        ("no-config-sync", True),
        ("keep-lfs", False),
        ("prefix-no-config-sync-suffix", False),
    ]:
        env = {k: v for k, v in os.environ.items() if k not in {"BASH_ENV", "ENV"}}
        env.update(REPO_TOPICS=topics, REPO_NAME="sgSHIOK2026", WORKDIR="unused", TARGET_DIR="unused", UNARCHIVED_HERE="false")
        execution = subprocess.run([str(bash), "--noprofile", "--norc", "-s"], input=program, text=True, capture_output=True, cwd=ROOT, env=env, check=True)
        skipped = "Skipping all config sync" in execution.stdout
        writes_reached = "would-reach-config-writes" in execution.stdout
        assert skipped == should_skip and writes_reached != should_skip
        cases.append({"topics": topics.split(","), "skip": skipped, "wouldReachConfigWrites": writes_reached, "exitCode": execution.returncode, "stdout": execution.stdout})
    copy_line = lines.index('    copy_if_exists "$WORKDIR/$src" "$dst"') + 1
    delete_line = lines.index("  delete_unlisted_dot_items") + 1
    ignore_line = lines.index("  inject_gitignore_entries") + 1
    push_line = next(i + 1 for i, line in enumerate(lines) if 'retry git push origin HEAD:' in line)
    assert end + 1 < min(copy_line, delete_line, ignore_line, push_line)
    proof = {
        "sourceRepository": SOURCE_REPO, "sourceCommit": SOURCE_COMMIT,
        "sourcePath": SOURCE_PATH, "sourceBlob": digest,
        "upstreamEdited": False, "sourceBranchLines": [start + 1, end + 1],
        "exactBranchExecuted": branch, "cases": cases,
        "laterWriterOperations": {"forceCopy": copy_line, "deleteDots": delete_line, "replaceGitignoreBlock": ignore_line, "directPush": push_line},
        "proofScope": "Exact pinned opt-out branch executed with filesystem/archive commands stubbed; sentinel shows whether control reaches later writer operations. No full external sync run or real cleanup was executed.",
        "workflow": {"path": ".github/workflows/sync-repo-settings.yml", "blob": "d8da00d65ad6f9ad14a2b9f0652ad45aa6ef208d", "job": "force-sync-general-config", "invocationLine": 282},
        "mechanism": "GitHub topic no-config-sync on hongyime/sgSHIOK2026 skips this target's general-config writer. It does not disable target Actions, Dependabot, or the separate settings/secrets jobs.",
        "limit": "Proof applies to this inspected writer and topic state. Future upstream changes or removal of the topic can invalidate it; no future scheduled run is claimed.",
    }
    path = OUT / "writer-proof.json"
    assert not path.exists(), "Preserve prior evidence; do not overwrite a proof"
    path.write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    print(f"writer_optout_cases={len(cases)} passed; source_blob={digest}; filesystem_operations=stubbed")


if __name__ == "__main__":
    main()
