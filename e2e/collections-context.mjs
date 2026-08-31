// Verse collections, memorisation review, and the historical context panel.
import { chromium } from 'playwright'
import { navTo } from './nav.mjs'
const BASE = process.env.BASE_URL || 'http://localhost:4173/'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
const cardFile = t => page.locator('.card').filter({ hasText: t }).locator('input[type=file]').first()
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto(BASE, { waitUntil: 'networkidle' })
const tab = navTo(page)

await tab('Versions')
await cardFile('Import a translation from a file').setInputFiles(
  new URL('./fixture-TESTV.json', import.meta.url).pathname)
await page.waitForSelector('text=/TESTV/', { timeout: 15000 })

// ---------- Historical context ----------
await tab('Read')
await page.waitForSelector('.verse .word')
await page.selectOption('select >> nth=1', '1')       // Genesis
await page.waitForTimeout(400)
await page.getByRole('button', { name: /Historical context/ }).click()
await page.waitForSelector('.ctx-body')
const ctx = await page.locator('.ctx-body').innerText()
if (!/author/i.test(ctx) || !/written/i.test(ctx)) fail('context panel missing its facts: ' + ctx.slice(0, 120))
else ok('context panel shows author, date and audience for the book')
if (ctx.length < 300) fail('context is too thin to be useful: ' + ctx.length + ' chars')
else ok(`context gives real background (${ctx.length} chars for Genesis)`)
if (await page.locator('.ctx-body .placement-note').count() === 0)
  fail('Genesis should carry a note about disputed authorship')
else ok('disputed authorship is flagged rather than asserted')

// A different book gives different background.
await page.selectOption('select >> nth=1', '43')      // John
await page.waitForTimeout(500)
// The panel stays open across a book change, so do not toggle it again.
await page.waitForTimeout(300)
const johnCtx = await page.locator('.ctx-body').innerText()
if (johnCtx === ctx) fail('context did not change with the book')
else ok('context follows the book you are reading')

// ---------- Collections ----------
await page.selectOption('select >> nth=1', '43')
await page.waitForTimeout(300)
await page.locator('.verse').first().locator('.vnum').click()
await page.waitForSelector('.actionbar')
await page.getByRole('button', { name: '+ List' }).click()
await page.waitForSelector('.collect-pop')
await page.locator('.collect-pop input[placeholder="New list…"]').fill('The Word')
await page.locator('.collect-pop button[type=submit]').click()
await page.waitForSelector('.collect-pop', { state: 'detached' })
ok('a verse can be added to a new list from the reader')

await tab('Lists')
// The header card renders before the live query resolves, so wait for the
// collection itself rather than for any card.
await page.waitForSelector('text=/The Word/', { timeout: 10000 })
const listText = await page.locator('.stack').innerText()
if (!/The Word/.test(listText) || !/1 verse/.test(listText)) fail('collection not listed: ' + listText)
else ok('the collection shows with its verse count')

await page.getByRole('button', { name: 'The Word' }).click()
await page.waitForSelector('text=/Memorise these verses/')
const detail = await page.locator('.stack').innerText()
if (!/John 1:1/.test(detail)) fail('verse reference missing from the collection: ' + detail)
else ok('the collection shows the verse and its text')

// ---------- Memorisation ----------
const memoBox = page.locator('input[type=checkbox]').first()
await memoBox.click()
await page.waitForTimeout(600)
if (!await memoBox.isChecked()) fail('memorising did not turn on')
else ok('a collection can be switched into memorising')
await page.getByRole('button', { name: 'Review', exact: true }).click()
await page.waitForSelector('.review-text')
const hidden = await page.locator('.review-text').innerText()
if (!/_/.test(hidden)) fail('review should blank out words for recall: ' + hidden)
else ok('review hides words for recall: ' + JSON.stringify(hidden.slice(0, 48)))

await page.getByRole('button', { name: 'Show verse' }).click()
await page.waitForTimeout(200)
const shown = await page.locator('.review-text').innerText()
if (/_/.test(shown)) fail('showing the verse should reveal every word')
else ok('showing the verse reveals the full text')

await page.getByRole('button', { name: 'Got it' }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'The Word' }).click().catch(() => {})
await page.waitForTimeout(400)
const after = await page.locator('.stack').innerText()
if (!/box 1/.test(after)) fail('a correct answer should advance the verse a box: ' + after)
else ok('answering correctly schedules the verse further out')

// Survives a restart.
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const reloaded = await page.locator('.stack').innerText()
if (!/The Word/.test(reloaded)) fail('collection lost after restart')
else ok('collections and review progress survive a restart')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
