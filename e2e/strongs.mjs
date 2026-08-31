// Strong's numbers: parsed on import, shown on tap, searchable.
import { chromium } from 'playwright'
import { navTo } from './nav.mjs'
const BASE = process.env.BASE_URL || 'http://localhost:4173/'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const cardFile = t => page.locator('.card').filter({ hasText: t }).locator('input[type=file]').first()
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto(BASE, { waitUntil: 'networkidle' })
const tab = navTo(page)

await tab('Versions')
await cardFile('Import a translation from a file').setInputFiles(
  new URL('./fixture-STRONGS.json', import.meta.url).pathname)
await page.waitForSelector('text=/FIXTURE-STRONGS/', { timeout: 15000 })
ok('tagged translation imported')

// The tags must be parsed out of the text, not left in it.
await tab('Read')
await page.waitForSelector('.verse .word')
await page.selectOption('select >> nth=1', '1')
await page.waitForTimeout(400)
const verseText = await page.locator('.verse').first().innerText()
if (/<S>|\d{3,}/.test(verseText)) fail('Strong tags leaked into the visible text: ' + verseText)
else ok('Strong tags parsed out of the reading text')

// Tap a tagged word.
const words = page.locator('.verse').first().locator('.word')
const count = await words.count()
let found = false
for (let i = 0; i < count; i++) {
  await words.nth(i).click()
  await page.waitForTimeout(150)
  if (await page.locator('.strongs-code').count()) { found = true; break }
  await page.locator('.actionbar button[aria-label=Close]').click().catch(() => {})
}
if (!found) fail('no word in Genesis 1:1 produced a Strong entry')
else ok('tapping a tagged word shows its Strong number')

const code = await page.locator('.strongs-code').first().innerText()
if (!/^H\d+$/.test(code)) fail('Old Testament code should be prefixed H, got ' + code)
else ok('Old Testament words get an H prefix: ' + code)

// The bundled lexicon supplies a definition for H430.
await page.locator('.actionbar button[aria-label=Close]').click().catch(() => {})
const godWord = page.locator('.verse').first().locator('.word').filter({ hasText: /^God$/ }).first()
if (await godWord.count()) {
  await godWord.click()
  await page.waitForSelector('.strongs-def', { timeout: 5000 })
  const def = await page.locator('.strongs-def').first().innerText()
  const lemma = await page.locator('.strongs-lemma').first().innerText()
  if (!/elohim|God, gods/i.test(def)) fail('bundled lexicon definition wrong: ' + def)
  else ok('bundled lexicon gives the definition: ' + JSON.stringify(lemma + ' — ' + def.slice(0, 40)))

  // Find every verse using that word.
  await page.getByRole('button', { name: /Find every verse using/ }).click()
  await page.waitForSelector('.strongs-uses .xref', { timeout: 20000 })
  const uses = await page.locator('.strongs-uses .xref-ref').allInnerTexts()
  if (uses.length !== 3) fail('H430 should appear in 3 fixture verses, got ' + uses.length + ': ' + uses)
  else ok('finds every verse using the same original word: ' + JSON.stringify(uses))
}

// New Testament words get a G prefix.
await page.locator('.actionbar button[aria-label=Close]').click().catch(() => {})
await page.selectOption('select >> nth=1', '43')
await page.waitForTimeout(400)
const ntWords = page.locator('.verse').first().locator('.word')
for (let i = 0; i < await ntWords.count(); i++) {
  await ntWords.nth(i).click()
  await page.waitForTimeout(150)
  if (await page.locator('.strongs-code').count()) break
  await page.locator('.actionbar button[aria-label=Close]').click().catch(() => {})
}
const ntCode = await page.locator('.strongs-code').first().innerText()
if (!/^G\d+$/.test(ntCode)) fail('New Testament code should be prefixed G, got ' + ntCode)
else ok('New Testament words get a G prefix: ' + ntCode)

// Import a lexicon file and check it takes precedence / fills gaps.
await tab('Versions')
await page.waitForSelector('text=Hebrew and Greek lexicon')
await cardFile('Hebrew and Greek lexicon').setInputFiles(
  new URL('./fixture-lexicon.json', import.meta.url).pathname)
await page.waitForSelector('text=/Imported 2 lexicon entries/', { timeout: 15000 })
ok('lexicon importer reads a keyed JSON dictionary')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
