// Cross references: the bundled core set, the importer, and the panel.
import { chromium } from 'playwright'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })

const tab = name => page.locator('.tabbar button').filter({ hasText: name }).first()
await tab('Versions').click()
await page.locator('input[accept*="json"]').setInputFiles(
  new URL('./fixture-TESTV.json', import.meta.url).pathname)
await page.waitForSelector('text=/TESTV/', { timeout: 15000 })

// The bundled core set works with no import at all.
await tab('Read').click()
await page.waitForSelector('.verse .word')
await page.selectOption('select >> nth=1', '1')       // Genesis
await page.waitForTimeout(400)
await page.locator('.verse').first().locator('.vnum').click()
await page.waitForSelector('.xref-block', { timeout: 10000 })
await page.waitForSelector('.xref', { timeout: 10000 })
const coreRefs = await page.locator('.xref-ref').allInnerTexts()
if (!coreRefs.some(r => /John 1:1/.test(r))) fail('Gen 1:1 core refs missing John 1:1: ' + coreRefs)
else ok('bundled core set works with no import: Gen 1:1 → ' + JSON.stringify(coreRefs.slice(0, 3)))

// Cross-reference text is pulled from the downloaded translation.
const withText = await page.locator('.xref-text').first().innerText()
if (!withText || /not in/.test(withText)) fail('no verse text shown for a downloaded ref: ' + withText)
else ok('reference shows the verse text from the downloaded version')

// Clicking a reference jumps to it.
const target = await page.locator('.xref').filter({ hasText: 'John 1:1' }).first()
await target.click()
await page.waitForTimeout(600)
const heading = await page.locator('.reader h2').first().innerText()
if (!/John 1/.test(heading)) fail('cross reference did not jump: ' + heading)
else ok('clicking a cross reference opens that passage')

// Now import the full-format file.
await tab('Versions').click()
await page.waitForSelector('text=Cross references')
await page.locator('input[accept*="txt"]').first().setInputFiles(
  new URL('./fixture-xrefs.txt', import.meta.url).pathname)
await page.waitForSelector('text=/Imported .* cross references/', { timeout: 20000 })
const msg = await page.locator('text=/Imported .* cross references/').innerText()
// 9 valid rows: one has negative votes, one has an unknown book.
if (!/Imported 8 cross references across 5 verses/.test(msg)) fail('unexpected import result: ' + msg)
else ok('importer parses the openbible format: ' + JSON.stringify(msg))
if (!/2 lines skipped/.test(msg)) fail('should report skipped lines: ' + msg)
else ok('low-voted and unrecognised lines are skipped and reported')

// Imported refs merge with the bundled ones, without duplicates.
await tab('Read').click()
await page.waitForSelector('.verse .word')
await page.selectOption('select >> nth=1', '1')
await page.waitForTimeout(400)
await page.locator('.verse').first().locator('.vnum').click()
await page.waitForSelector('.xref')
const shown = await page.locator('.xref-ref').allInnerTexts()
const johns = shown.filter(r => /^John 1:1$/.test(r)).length
if (johns !== 1) fail('John 1:1 should appear once after merging, got ' + johns)
else ok('imported and bundled references merge without duplicates')

// A verse only the import knows about.
await page.selectOption('select >> nth=2', '3')       // Genesis 3
await page.waitForTimeout(400)
await page.locator('.verse').first().locator('.vnum').click()
await page.waitForSelector('.xref')
const gen3 = await page.locator('.xref-ref').allInnerTexts()
if (!gen3.some(r => /Rev 12:9|Revelation 12:9/.test(r))) fail('imported ref missing for Gen 3:1: ' + gen3)
else ok('imported references appear for verses the core set does not cover')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
