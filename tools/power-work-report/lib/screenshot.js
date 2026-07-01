import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promises as fs } from 'node:fs'
import { chromium } from '@playwright/test'

export async function screenshotReport({ htmlPath, outDir }) {
  await fs.mkdir(outDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 })
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
    const desktopPath = path.join(outDir, 'report-desktop-1440x1200.png')
    await page.screenshot({ path: desktopPath, fullPage: true })

    await page.setViewportSize({ width: 390, height: 1200 })
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
    const mobilePath = path.join(outDir, 'report-mobile-390x1200.png')
    await page.screenshot({ path: mobilePath, fullPage: true })

    return { desktopPath, mobilePath }
  } finally {
    await browser.close()
  }
}
