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

skills=(
  power-think
  power-grill
  power-loop
  power-verifier
  power-curator
  power-work-report
  power-critic
)

for skill in "${skills[@]}"; do
  mkdir -p "${skills_dir}/${skill}"
  rsync -a --delete "${repo_root}/${skill}/" "${skills_dir}/${skill}/"
done

agent_sources=(
  power-loop/agents/power-luna-worker.toml
  power-loop/agents/power-terra-worker.toml
  power-loop/agents/power-terra-complex-worker.toml
  power-loop/agents/power-sol-escalation.toml
  power-loop/agents/power-code-reviewer.toml
  power-verifier/agents/power-verifier.toml
  power-critic/agents/power-critic.toml
)

for source in "${agent_sources[@]}"; do
  rsync -a "${repo_root}/${source}" "${agents_dir}/$(basename "${source}")"
done

echo "Installed ohmypowers skills into ${skills_dir}"
echo "Installed managed custom agents into ${agents_dir}"
echo "Restart Codex to load the updated skills and agents."
