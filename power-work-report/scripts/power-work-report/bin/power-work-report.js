#!/usr/bin/env node

import { runCli } from '../lib/cli.js'

runCli(process.argv.slice(2)).catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`power-work-report: ${message}`)
  process.exitCode = 1
})
