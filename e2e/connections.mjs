// Finding links between your own studies, entirely on the device.
import { chromium } from 'playwright'
import { navTo } from './nav.mjs'
const BASE = process.env.BASE_URL || 'http://localhost:4173/'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 950 } })
const cardFile = t => page.locator('.card').filter({ hasText: t }).locator('input[type=file]').first()
page.on('pageerror', e => fail('page error: ' + e.message))
// Nothing here should ever reach the network.
const external = []
page.on('request', r => { const u = r.url(); if (!u.startsWith(BASE) && !u.startsWith('data:')) external.push(u) })
await page.goto(BASE, { waitUntil: 'networkidle' })
const tab = navTo(page)

await tab('Versions')
await cardFile('Import a translation from a file').setInputFiles(
  new URL('./fixture-TESTV.json', import.meta.url).pathname)
await page.waitForSelector('text=/TESTV/', { timeout: 15000 })

// Write three studies that overlap in different ways.
const writeStudy = async (title, body, tags, book, verse) => {
  await tab('Read')
  await page.waitForSelector('.verse .word')
  await page.selectOption('select >> nth=1', String(book))
  await page.waitForTimeout(350)
  await page.locator('.verse').nth(verse - 1).locator('.vnum').click()
  await page.waitForSelector('.actionbar')
  await page.getByRole('button', { name: '+ Study' }).click()
  await page.waitForSelector('.editor-overlay')
  await page.locator('.editor-overlay input[type=text]').first().fill(title)
  await page.locator('.editor-overlay textarea').first().fill(body)
  await page.locator('.editor-overlay input[placeholder*="Tags"]').fill(tags)
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForSelector('.editor-overlay', { state: 'detached' })
}

await writeStudy('Covenant with Abraham',
  'The covenant language here shapes everything that follows about promise and inheritance.',
  'covenant, promise', 1, 1)
await writeStudy('Covenant renewed',
  'Again the covenant theme returns, with promise and inheritance carried forward.',
  'covenant', 1, 2)
await writeStudy('Covenant and inheritance',
  'A third look at covenant, promise and inheritance across the story.',
  'covenant', 1, 3)
await writeStudy('Unrelated entry on light',
  'Something else entirely about lampstands and illumination.',
  'imagery', 43, 5)
ok('four studies written, three sharing a theme')

// From here on nothing should touch the network: connections are worked out
// on the device. (Downloading versions obviously does, hence the reset.)
external.length = 0

await tab('Study')
await page.waitForSelector('.card')
await page.waitForTimeout(400)

// Related for the first study.
const first = page.locator('.card').filter({ hasText: 'Covenant with Abraham' }).first()
await first.getByRole('button', { name: /Related/ }).click()
await page.waitForSelector('.xref-block', { timeout: 10000 })
const relText = await first.locator('.xref-block').innerText()
if (!/Covenant renewed/.test(relText)) fail('did not connect the two covenant studies: ' + relText)
else ok('connects two studies that share a theme')
if (/Unrelated entry/.test(relText)) fail('connected an unrelated study: ' + relText)
else ok('leaves genuinely unrelated studies out')
if (!/tagged|same chapter|same passage|both discuss/.test(relText))
  fail('connections must say why they are there: ' + relText)
else ok('every connection states its reason: ' + JSON.stringify(relText.split('\n').slice(1, 3).join(' | ')))

// Threads across everything.
await page.getByRole('button', { name: /Threads/ }).click()
await page.waitForSelector('text=/Threads running through/')
await page.waitForTimeout(400)
const threads = await page.locator('.card').filter({ hasText: 'Threads running through' }).innerText()
if (!/covenant/i.test(threads)) fail('covenant should surface as a recurring thread: ' + threads)
else ok('recurring themes surface across separate notes')

if (external.length) fail('connections made external requests: ' + external.slice(0, 3).join(', '))
else ok('connections and threads make no network requests — nothing leaves the device')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
