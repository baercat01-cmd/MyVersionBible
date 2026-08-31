// Selecting a word, a phrase, verses, and a whole chapter — and acting on it.
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
await tab('Read')
await page.waitForSelector('.verse .word')
await page.selectOption('select >> nth=1', '1')     // Genesis
await page.waitForTimeout(400)

const selCount = () => page.locator('.word.wsel').count()
const verses = () => page.locator('.verse')
const clearSel = async () => {
  const x = page.locator('.actionbar button[aria-label=Close]')
  if (await x.count()) await x.click()
  await page.waitForTimeout(150)
}

// --- one word ---
await verses().nth(0).locator('.word').nth(2).click()
await page.waitForSelector('.actionbar')
if (await selCount() !== 1) fail('a single tap should select one word, got ' + await selCount())
else ok('tapping selects a single word')

// --- a phrase: second tap extends from the anchor ---
await verses().nth(0).locator('.word').nth(6).click()
await page.waitForTimeout(200)
const phrase = await selCount()
if (phrase !== 5) fail('tapping a second word should select the run between them, got ' + phrase)
else ok('a second tap extends the selection into a phrase (5 words)')

// --- a phrase spanning two verses ---
await clearSel()
await verses().nth(0).locator('.word').nth(8).click()
await page.waitForTimeout(150)
await verses().nth(1).locator('.word').nth(1).click()
await page.waitForTimeout(200)
const across = await page.evaluate(() => {
  const vs = [...document.querySelectorAll('.verse')]
  return vs.slice(0, 3).map(v => v.querySelectorAll('.word.wsel').length)
})
if (across[0] === 0 || across[1] === 0) fail('selection did not cross the verse boundary: ' + across)
else ok(`a phrase can cross verses (${across[0]} words in v1, ${across[1]} in v2)`)

// --- whole verse, then a run of verses ---
await clearSel()
await verses().nth(1).locator('.vnum').click()
await page.waitForTimeout(200)
const v2words = await verses().nth(1).locator('.word').count()
if (await selCount() !== v2words) fail('verse number should select the whole verse')
else ok('tapping the verse number selects the whole verse')

await verses().nth(3).locator('.vnum').click()
await page.waitForTimeout(250)
const spanned = await page.evaluate(() =>
  [...document.querySelectorAll('.verse')].slice(0, 5).map(v => v.querySelectorAll('.word.wsel').length))
if (spanned[1] === 0 || spanned[2] === 0 || spanned[3] === 0)
  fail('tapping a later verse number should select the run: ' + spanned)
else ok('tapping a second verse number selects every verse between (vv 1-4)')

// --- widen to whole verses from a phrase ---
await clearSel()
await verses().nth(0).locator('.word').nth(3).click()
await page.waitForTimeout(150)
await verses().nth(1).locator('.word').nth(2).click()
await page.waitForTimeout(150)
await page.getByRole('button', { name: /Verse/ }).first().click()
await page.waitForTimeout(250)
const widened = await page.evaluate(() =>
  [...document.querySelectorAll('.verse')].slice(0, 2).map(v => ({
    all: v.querySelectorAll('.word').length, sel: v.querySelectorAll('.word.wsel').length })))
if (widened.some(w => w.all !== w.sel)) fail('widening did not cover the full verses: ' + JSON.stringify(widened))
else ok('a phrase widens to cover its whole verses')

// --- whole chapter ---
await page.getByRole('button', { name: /Chapter/ }).first().click()
await page.waitForTimeout(400)
const all = await page.evaluate(() => ({
  words: document.querySelectorAll('.verse .word').length,
  sel: document.querySelectorAll('.verse .word.wsel').length
}))
if (all.words !== all.sel) fail(`chapter select missed words: ${all.sel}/${all.words}`)
else ok(`the whole chapter can be selected (${all.sel} words)`)

// --- highlight a whole chapter, and it persists ---
await page.locator('.actionbar .markbtn').nth(0).click()
await page.waitForSelector('.actionbar', { state: 'detached' })
await page.waitForTimeout(600)
const marked = await page.evaluate(() =>
  [...document.querySelectorAll('.verse .word')].filter(w => w.style.background).length)
if (marked !== all.words) fail(`highlight covered ${marked} of ${all.words} words`)
else ok('highlighting applies across the entire chapter')

await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.verse .word')
await page.waitForTimeout(700)
const after = await page.evaluate(() =>
  [...document.querySelectorAll('.verse .word')].filter(w => w.style.background).length)
if (after !== all.words) fail(`after restart ${after} of ${all.words} words still marked`)
else ok('a chapter-wide highlight survives a restart')

// --- erase the range ---
await verses().nth(0).locator('.vnum').click()
await page.waitForTimeout(150)
await verses().nth(2).locator('.vnum').click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Erase' }).click()
await page.waitForTimeout(600)
const left = await page.evaluate(() =>
  [...document.querySelectorAll('.verse')].slice(0, 3)
    .reduce((n, v) => n + [...v.querySelectorAll('.word')].filter(w => w.style.background).length, 0))
if (left !== 0) fail('erase left ' + left + ' marked words across the range')
else ok('erase clears marks across a multi-verse range')

// --- a note and a study on the range ---
await verses().nth(4).locator('.vnum').click()
await page.waitForTimeout(150)
await verses().nth(6).locator('.vnum').click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: '+ Study' }).click()
await page.waitForSelector('.editor-overlay')
const refLine = await page.locator('.editor-overlay .meta').first().innerText()
if (!/5-7/.test(refLine)) fail('study should carry the whole range: ' + refLine)
else ok('a study can be started on a multi-verse range: ' + JSON.stringify(refLine))
if (!await page.locator('.editor-overlay select').count()) fail('study editor should offer templates')
else ok('the study editor offers the study templates')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
