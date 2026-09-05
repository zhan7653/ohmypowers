import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
const installedPowerGan = path.join(codexHome, 'skills', 'power-gan')
const evalModel = process.env.POWER_GAN_EVAL_MODEL || 'gpt-6-astra'
const evalReasoningEffort = process.env.POWER_GAN_EVAL_REASONING_EFFORT || 'medium'
const comparedSkillFiles = [
  'SKILL.md',
  'references/test-capability.md',
]

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['decisions'],
  properties: {
    decisions: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'verdict', 'claim_boundary', 'minimum_evidence', 'reason'],
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['accept', 'reject'] },
          claim_boundary: {
            type: 'string',
            enum: ['agent_behavior', 'filesystem_installer'],
          },
          minimum_evidence: {
            type: 'string',
            enum: ['model_forward_eval', 'execute_installer_in_temp_home'],
          },
          reason: { type: 'string', minLength: 1 },
        },
      },
    },
  },
}

const proposals = {
  proposals: [
    {
      id: 'ceremonial-agent-behavior',
      claimed_behavior: 'power-check waits for a stable final candidate at runtime',
      test_mechanism: [
        'read power-check/SKILL.md',
        'assert that the Markdown contains the phrase "stable final candidate"',
      ],
    },
    {
      id: 'installer-filesystem-behavior',
      claimed_behavior: 'the installer replaces managed files, removes retired entries, preserves unrelated agents, and is idempotent',
      test_mechanism: [
        'create an isolated temporary CODEX_HOME with retired entries and an unrelated agent',
        'execute scripts/install.sh twice against that temporary home',
        'compare the installed tree after each run with the repository sources and the original unrelated agent',
      ],
    },
  ],
}

const prompt = `$power-gan ALIGN_ONLY。读取当前工作区的 test-proposals.json，并使用 power-gan 的测试能力规则审查其中两个测试提案。只判断每个测试机制能否证伪它声称的行为，不修改文件，也不运行提案中的测试。对每项返回 verdict、实际 claim_boundary、足以支持主张的 minimum_evidence 和简短 reason。这是单一事实域，不要委派。最终只返回符合所给 JSON Schema 的对象。`

await assertInstalledSkillMatchesRepository()

const beforeRepositoryStatus = gitStatus()
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'ohmypowers-model-evidence-'))
const controlDirectory = path.join(temporaryDirectory, 'control')
const workspace = path.join(temporaryDirectory, 'workspace')
const schemaPath = path.join(controlDirectory, 'result.schema.json')
const startedAt = Date.now()

try {
  await mkdir(controlDirectory)
  await mkdir(workspace)
  await writeFile(schemaPath, `${JSON.stringify(schema, null, 2)}\n`, 'utf8')
  await writeFile(
    path.join(workspace, 'test-proposals.json'),
    `${JSON.stringify(proposals, null, 2)}\n`,
    'utf8',
  )
  const beforeManifest = await directoryManifest(workspace)
  const { stdout, stderr } = await runCodex(schemaPath, workspace)
  const events = parseJsonLines(stdout)
  const finalMessage = events.findLast(
    event => event.item?.type === 'agent_message' && typeof event.item.text === 'string',
  )
  assert.ok(
    finalMessage?.item?.text,
    `Codex JSONL did not contain a final agent message; events: ${events.map(event => event.type).join(', ')}`,
  )
  const result = JSON.parse(finalMessage.item.text)

  assertDecision(result, 'ceremonial-agent-behavior', {
    verdict: 'reject',
    claim_boundary: 'agent_behavior',
    minimum_evidence: 'model_forward_eval',
  })
  assertDecision(result, 'installer-filesystem-behavior', {
    verdict: 'accept',
    claim_boundary: 'filesystem_installer',
    minimum_evidence: 'execute_installer_in_temp_home',
  })

  const commandEvents = events.filter(event => event.item?.type === 'command_execution')
  const fileChangeEvents = events.filter(event => event.item?.type === 'file_change')
  assert.ok(commandEvents.length > 0, 'forward eval must expose fixture-inspection tool events')
  assert.equal(fileChangeEvents.length, 0, 'read-only forward eval must not request file changes')
  assert.deepEqual(await directoryManifest(workspace), beforeManifest, 'forward eval changed its fixture')
  assert.equal(gitStatus(), beforeRepositoryStatus, 'forward eval changed the repository state')

  const completed = events.findLast(event => event.type === 'turn.completed')
  process.stdout.write(`${JSON.stringify({
    status: 'passed',
    model: evalModel,
    reasoning_effort: evalReasoningEffort,
    duration_ms: Date.now() - startedAt,
    command_events: commandEvents.length,
    repository_unchanged: true,
    usage: completed?.usage,
    stderr: stderr.trim() || undefined,
    decisions: result.decisions,
  }, null, 2)}\n`)
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}

async function assertInstalledSkillMatchesRepository() {
  for (const relativePath of comparedSkillFiles) {
    const repositoryBytes = await readFile(path.join(root, 'power-gan', relativePath))
    const installedBytes = await readFile(path.join(installedPowerGan, relativePath))
    assert.deepEqual(
      installedBytes,
      repositoryBytes,
      `installed power-gan differs at ${relativePath}; run ./scripts/install.sh and restart Codex`,
    )
  }
}

async function runCodex(schemaPath, workspace) {
  const environment = { ...process.env }
  for (const variable of [
    'CODEX_CI',
    'CODEX_PERMISSION_PROFILE',
    'CODEX_SESSION_ID',
    'CODEX_THREAD_ID',
  ]) delete environment[variable]

  const result = spawnSync(
    'codex',
    [
      'exec',
      '--ephemeral',
      '--sandbox',
      'read-only',
      '--color',
      'never',
      '--json',
      '--model',
      evalModel,
      '-c',
      `model_reasoning_effort="${evalReasoningEffort}"`,
      '--output-schema',
      schemaPath,
      '--skip-git-repo-check',
      '-C',
      workspace,
      '-',
    ],
    {
      cwd: workspace,
      env: environment,
      input: prompt,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      timeout: 5 * 60 * 1000,
    },
  )
  if (result.error) throw new Error(`Could not run Codex forward eval: ${result.error.message}`)
  if (result.status !== 0) {
    throw new Error(
      `Codex forward eval failed (${result.signal || `exit ${result.status}`}):\n${result.stderr || result.stdout}`,
    )
  }
  return result
}

function gitStatus() {
  const result = spawnSync(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    { cwd: root, encoding: 'utf8' },
  )
  if (result.status !== 0) throw new Error(`Could not inspect repository state:\n${result.stderr}`)
  return result.stdout
}

async function directoryManifest(directory, relativeDirectory = '') {
  const manifest = []
  const entries = await readdir(path.join(directory, relativeDirectory), { withFileTypes: true })
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = path.join(relativeDirectory, entry.name)
    if (entry.isDirectory()) {
      manifest.push({ path: relativePath, type: 'directory' })
      manifest.push(...await directoryManifest(directory, relativePath))
    } else if (entry.isFile()) {
      const contents = await readFile(path.join(directory, relativePath))
      manifest.push({
        path: relativePath,
        type: 'file',
        contents: contents.toString('base64'),
      })
    } else {
      manifest.push({ path: relativePath, type: 'other' })
    }
  }
  return manifest
}

function parseJsonLines(output) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        throw new Error(`Codex emitted invalid JSONL on line ${index + 1}`, { cause: error })
      }
    })
}

function assertDecision(result, id, expected) {
  const decision = result.decisions?.find(candidate => candidate.id === id)
  assert.ok(decision, `missing forward-eval decision ${id}`)
  for (const [field, value] of Object.entries(expected)) assert.equal(decision[field], value)
}
