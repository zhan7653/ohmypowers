#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
codex_home="${CODEX_HOME:-${HOME}/.codex}"
skills_dir="${codex_home}/skills"
agents_dir="${codex_home}/agents"

if ! command -v rsync >/dev/null 2>&1; then
  echo "ohmypowers install: rsync is required" >&2
  exit 1
fi

mkdir -p "${skills_dir}" "${agents_dir}"

python3 - "${codex_home}/config.toml" <<'PY'
from pathlib import Path
import re
import sys
import tomllib

config_path = Path(sys.argv[1])
text = config_path.read_text(encoding='utf-8') if config_path.exists() else ''
if text.strip():
    tomllib.loads(text)

lines = text.splitlines(keepends=True)
section_start = None
section_end = len(lines)
for index, line in enumerate(lines):
    if re.match(r'^\[agents\]\s*(?:#.*)?$', line.rstrip('\r\n')):
        section_start = index
        break
if section_start is None:
    if text and not text.endswith(('\n', '\r')):
        lines.append('\n')
    if lines and lines[-1].strip():
        lines.append('\n')
    lines.extend(['[agents]\n', 'default_subagent_reasoning_effort = "medium"\n'])
else:
    for index in range(section_start + 1, len(lines)):
        if re.match(r'^\s*\[\[?[^]]+\]\]?\s*(?:#.*)?$', lines[index].rstrip('\r\n')):
            section_end = index
            break
    setting = re.compile(r'^(\s*default_subagent_reasoning_effort\s*=\s*).*$')
    for index in range(section_start + 1, section_end):
        match = setting.match(lines[index].rstrip('\r\n'))
        if match:
            newline = '\r\n' if lines[index].endswith('\r\n') else '\n'
            lines[index] = f'{match.group(1)}"medium"{newline}'
            break
    else:
        lines.insert(section_start + 1, 'default_subagent_reasoning_effort = "medium"\n')

updated = ''.join(lines)
tomllib.loads(updated)
config_path.write_text(updated, encoding='utf-8')
PY

skills=(
  power-gan
  power-check
  power-curator
)

retired_skills=(
  power-critic
  power-think
  power-grill
  power-loop
  power-verifier
  power-work-report
)

for skill in "${retired_skills[@]}"; do
  rm -rf "${skills_dir}/${skill}"
done

for skill in "${skills[@]}"; do
  mkdir -p "${skills_dir}/${skill}"
  rsync -a --delete "${repo_root}/${skill}/" "${skills_dir}/${skill}/"
done

retired_agent_profiles=(
  power-critic.toml
  reviewer.toml
  worker.toml
  explorer.toml
  power-worker.toml
  power-scout.toml
  power-explorer.toml
  power-planner.toml
  power-luna-worker.toml
  power-sol-worker.toml
  power-terra-reviewer.toml
  power-sol-reviewer.toml
  power-sol-high-reviewer.toml
  power-terra-worker.toml
  power-terra-complex-worker.toml
  power-sol-escalation.toml
  power-code-reviewer.toml
  power-verifier.toml
)

for profile in "${retired_agent_profiles[@]}"; do
  rm -f "${agents_dir}/${profile}"
done

agent_sources=(
  agents/worker.toml
  agents/explorer.toml
  agents/reviewer.toml
)

for source in "${agent_sources[@]}"; do
  rsync -a "${repo_root}/${source}" "${agents_dir}/$(basename "${source}")"
done

echo "Installed ohmypowers skills into ${skills_dir}"
echo "Installed managed global agents into ${agents_dir}"
echo "Restart Codex to load the updated skills and global agents."
