import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'

export function emptyMemory() {
  return { schemaVersion: 1, todos: [], ideas: [], reports: [] }
}

export async function readMemory(filePath) {
  let value
  try {
    value = JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyMemory()
    throw new Error(`Memory JSON is missing or invalid: ${filePath}: ${error.message}`)
  }
  return normalizeMemory(value)
}

export function normalizeMemory(value) {
  const memory = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    ...memory,
    schemaVersion: 1,
    todos: normalizeTodos(memory.todos),
    ideas: Array.isArray(memory.ideas) ? memory.ideas.map(item => ({ ...item })) : [],
    reports: Array.isArray(memory.reports) ? memory.reports.map(item => ({ ...item })) : [],
  }
}

export function normalizeTodos(items) {
  if (!Array.isArray(items)) return []
  return items
    .map(item => {
      if (typeof item === 'string') return { text: item, project: '', status: 'open' }
      return {
        ...item,
        text: String(item?.text || '').trim(),
        project: item?.project || '',
        status: normalizeTodoStatus(item?.status),
      }
    })
    .filter(item => item.text)
}

export function normalizeTodoStatus(status) {
  if (status === 'done' || status === 'dropped') return status
  return 'open'
}

export function itemKey(item) {
  return `${item.project || ''}::${normalizeText(item.text)}`
}

export function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function stableId(project, text) {
  return crypto.createHash('sha1').update(`${project || ''}\n${normalizeText(text)}`).digest('hex').slice(0, 16)
}

export function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}
