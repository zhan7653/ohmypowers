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
  power-gan
  power-check
  power-curator
  power-work-report
  power-critic
)

retired_skills=(
  power-think
  power-grill
  power-loop
  power-verifier
)

for skill in "${retired_skills[@]}"; do
  rm -rf "${skills_dir}/${skill}"
done

for skill in "${skills[@]}"; do
  mkdir -p "${skills_dir}/${skill}"
  rsync -a --delete "${repo_root}/${skill}/" "${skills_dir}/${skill}/"
done

agent_sources=(
  power-critic/agents/power-critic.toml
  power-check/agents/reviewer.toml
  power-gan/agents/power-worker.toml
  power-gan/agents/power-explorer.toml
  power-gan/agents/power-planner.toml
)

retired_agent_profiles=(
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

for source in "${agent_sources[@]}"; do
  rsync -a "${repo_root}/${source}" "${agents_dir}/$(basename "${source}")"
done

echo "Installed ohmypowers skills into ${skills_dir}"
echo "Installed managed custom agents into ${agents_dir}"
echo "Restart Codex to load the updated skills and agents."
