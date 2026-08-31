// Version descriptions in the Versions tab.
import { chromium } from 'playwright'
const BASE = process.env.BASE_URL || 'http://localhost:4173/'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 950 } })
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto(BASE, { waitUntil: 'networkidle' })
const tab = n => page.locator('.tabbar button').filter({ hasText: n }).first()

await tab('Versions').click()
await page.waitForSelector('.verrow')

// Match on the row's id heading — other versions mention "KJV" in their text.
const rowFor = id => page.locator('.verrow').filter({
  has: page.locator('strong', { hasText: new RegExp(`^${id}$`) })
}).first()
const kjvRow = rowFor('KJV')
const summary = await kjvRow.locator('.verinfo-summary').innerText()
if (!/Word-for-word/.test(summary)) fail('KJV should be described as word-for-word: ' + summary)
else ok('each version shows its approach and date at a glance: ' + JSON.stringify(summary))

await kjvRow.locator('.ctx-toggle').click()
await page.waitForTimeout(300)
const body = await kjvRow.locator('.ctx-body').innerText()
if (body.length < 400) fail('KJV description too thin: ' + body.length)
else ok(`expanding gives real history (${body.length} chars for the KJV)`)
for (const want of ['Made by', 'From', 'Reading', 'Good for']) {
  if (!new RegExp(want, 'i').test(body)) fail(`description missing "${want}"`)
}
ok('description covers translators, source texts, reading level and uses')
if (await kjvRow.locator('.placement-note').count() === 0) fail('no honest caveat shown for the KJV')
else ok('each version states its limitations, not just its strengths')

// A source text rather than a translation is labelled as such.
// WLC is Hebrew, so it is filtered out of the English default.
await page.selectOption('#langsel', { label: /All languages/ }).catch(async () => {
  const opts = await page.locator('#langsel option').allTextContents()
  const all = opts.find(o => /All languages/.test(o))
  if (all) await page.selectOption('#langsel', { label: all })
})
await page.waitForTimeout(400)
const wlc = rowFor('WLC')
if (await wlc.count() === 0) fail('WLC row not found in the versions list')
else {
  const s = await wlc.locator('.verinfo-summary').innerText()
  if (!/source text/i.test(s)) fail('WLC should be labelled a source text: ' + s)
  else ok('Hebrew and Greek source texts are labelled as such, not as translations')
}

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
