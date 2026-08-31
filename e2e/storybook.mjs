// Importing a public-domain narrative retelling and reading it.
import { chromium } from 'playwright'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1100, height: 860 } })
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })

await page.getByRole('button', { name: /Versions/ }).click()
await page.waitForSelector('text=Story books')
await page.locator('input[accept*="txt"]').setInputFiles(
  new URL('./fixture-storybook.txt', import.meta.url).pathname)
await page.waitForSelector('text=/chapters found/', { timeout: 10000 })

const found = await page.locator('text=/chapters found/').innerText()
if (!/4 chapters found/.test(found)) fail('expected 4 chapters, got: ' + found)
else ok('detected 4 chapters from the Gutenberg-style text')

const previewText = await page.locator('ol.small').innerText()
if (!/How the World Was Made/.test(previewText)) fail('chapter titles wrong: ' + previewText)
else ok('chapter titles parsed: ' + JSON.stringify(previewText.split('\n')[0]))
if (/PROJECT GUTENBERG/i.test(previewText)) fail('licence header leaked into a chapter')
else ok('Project Gutenberg header and footer stripped')

await page.locator('input[placeholder="Book title"]').fill('Story of the Bible')
await page.locator('input[placeholder="Author (optional)"]').fill('Jesse Lyman Hurlbut')
await page.getByRole('button', { name: 'Save story book' }).click()
await page.waitForSelector('text=/read it in the Story tab/', { timeout: 10000 })
ok('story book saved to the device')

// Read it.
await page.getByRole('button', { name: /Story/ }).click()
await page.waitForSelector('.segment-head h2')
// With no translation downloaded the app opens straight into the retelling;
// with one, pick it from the order dropdown.
const orderSelect = page.locator('select').filter({ hasText: 'retelling' }).first()
if (await orderSelect.count()) {
  await orderSelect.selectOption({ label: 'Story of the Bible (retelling)' })
}
await page.waitForTimeout(400)
const head = await page.locator('.segment-head').innerText()
if (!/How the World Was Made/.test(head)) fail('story chapter not shown: ' + head)
else ok('opens the first chapter of the retelling')
if (!/retelling, not scripture/.test(head)) fail('missing the "not scripture" label')
else ok('labelled plainly as a retelling, not scripture')

const paras = await page.locator('.story-para').count()
if (paras !== 2) fail('expected 2 paragraphs, got ' + paras)
else ok('paragraphs preserved as prose')

await page.getByRole('button', { name: 'Next →' }).click()
await page.waitForTimeout(300)
if (!/The First Garden/.test(await page.locator('.segment-head').innerText()))
  fail('next chapter did not advance')
else ok('next/previous move through the chapters')

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)
if (!/First Garden/.test(await page.locator('.segment-head').innerText()))
  fail('story book position lost after restart')
else ok('the book and your place survive a restart')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
