// Scripture search: matching, options, and jumping to the verse.
import { chromium } from 'playwright'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })

await page.getByRole('button', { name: /Versions/ }).click()
await page.locator('input[accept*="json"]').setInputFiles(
  new URL('./fixture-TESTV.json', import.meta.url).pathname)
await page.waitForSelector('text=/TESTV/', { timeout: 15000 })

await page.getByRole('button', { name: /Search/ }).click()
await page.waitForSelector('input[placeholder="Word or phrase…"]')

const search = async (q, opts = {}) => {
  await page.locator('input[placeholder="Word or phrase…"]').fill(q)
  for (const [label, want] of Object.entries(opts)) {
    const box = page.locator(`label:has-text("${label}") input`)
    if (await box.isChecked() !== want) await box.click()
  }
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  // Wait for the search to finish rather than for a particular outcome,
  // since a valid result can legitimately be zero hits.
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Search$/.test(b.textContent || ''))
    return btn && !btn.disabled && !/Searching/.test(btn.textContent || '')
  }, { timeout: 20000 })
  await page.waitForTimeout(250)
  return page.locator('.hitcard').count()
}

// The fixture puts "serpent" only in Genesis 3.
let n = await search('serpent')
if (n !== 24) fail('expected 24 hits for "serpent", got ' + n)
else ok('finds every verse containing a word (24 in Genesis 3)')

const firstRef = await page.locator('.hitref').first().innerText()
if (!/Genesis 3:1/.test(firstRef)) fail('results not in canonical order: ' + firstRef)
else ok('results ordered canonically, first is ' + JSON.stringify(firstRef))

const marked = await page.locator('.hitcard mark').first().innerText()
if (!/serpent/i.test(marked)) fail('match not highlighted: ' + marked)
else ok('matched words highlighted in the result')

// Two words with no phrase = AND across the verse.
n = await search('serpent subtil')
if (n !== 24) fail('expected 24 for both words present, got ' + n)
else ok('multiple words require all of them in the verse')

// A phrase that does not occur in that order.
n = await search('subtil serpent', { 'Exact phrase': true })
if (n !== 0) fail('exact phrase should not match out-of-order words, got ' + n)
else ok('exact phrase respects word order')

n = await search('serpent was more', { 'Exact phrase': true })
if (n !== 24) fail('expected 24 for a real phrase, got ' + n)
else ok('exact phrase matches when the words are in order')

// Whole-word matching.
await page.locator('label:has-text("Exact phrase") input').click()
n = await search('serpen')
if (n !== 24) fail('partial word should match without whole-word, got ' + n)
else ok('partial words match by default')
n = await search('serpen', { 'Whole words': true })
if (n !== 0) fail('whole-word should reject a partial, got ' + n)
else ok('whole-word option rejects partial matches')

// Scope.
await page.locator('label:has-text("Whole words") input').click()
await page.selectOption('select:nth-of-type(2)', 'nt')
n = await search('serpent')
if (n !== 0) fail('New Testament scope should exclude Genesis, got ' + n)
else ok('scope limits the search to a testament')
await page.selectOption('select:nth-of-type(2)', 'all')

// Jump to a result.
await search('Thus the heavens')
await page.locator('.hitcard').first().click()
await page.waitForSelector('.verse .word', { timeout: 10000 })
const heading = await page.locator('.reader h2').first().innerText()
if (!/Genesis 2/.test(heading)) fail('jump did not open the right chapter: ' + heading)
else ok('clicking a result opens the reader at that chapter')
const flashed = await page.locator('.verse.flash').count()
if (flashed !== 1) fail('target verse not highlighted on arrival, got ' + flashed)
else ok('the verse you searched for is highlighted on arrival')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
