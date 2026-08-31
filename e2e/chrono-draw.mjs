// Integration test: chronological/story reading, and the stylus drawing layer
// mounted in the real reader. See reader-marks.mjs for the run instructions.
import { chromium } from 'playwright'

const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })

await page.getByRole('button', { name: /Versions/ }).click()
await page.locator('input[type=file]').setInputFiles(new URL('./fixture-TESTV.json', import.meta.url).pathname)
await page.waitForSelector('text=/TESTV/', { timeout: 15000 })
ok('fixture translation imported')

// ---------- Chronological / story reading ----------
await page.getByRole('button', { name: /Story/ }).click()
await page.waitForSelector('.segment-head h2', { timeout: 10000 })
const firstTitle = await page.locator('.segment-head h2').innerText()
if (!/creation/i.test(firstTitle)) fail('chronological order should open at the creation, got: ' + firstTitle)
else ok('chronological order opens at the creation: ' + JSON.stringify(firstTitle))

const chapters = await page.locator('.chrono-chapter').count()
if (chapters < 2) fail('Gen 1:1-2:3 should span two chapters, got ' + chapters)
else ok('segment spans its passage across ' + chapters + ' chapters')

// Verse numbers visible in verse view, gone in story view.
if (await page.locator('.chrono-chapter .vnum').count() === 0) fail('verse numbers missing in verse view')
else ok('verse numbers shown in verse view')
await page.getByRole('button', { name: /Verse view|Story view/ }).click()
await page.waitForTimeout(300)
if (await page.locator('.chrono-chapter .vnum').count() !== 0) fail('story view still shows verse numbers')
else ok('story view hides verse numbers and runs as prose')

// Marking works in the chronological reader too, and lands on the right chapter.
const w = page.locator('.chrono-chapter').first().locator('.word')
await w.nth(2).click()
await page.waitForSelector('.actionbar')
await page.locator('.actionbar .markbtn').nth(0).click()
await page.waitForSelector('.actionbar', { state: 'detached' })
await page.waitForTimeout(300)
const hl = await page.evaluate(() =>
  [...document.querySelectorAll('.chrono-chapter .word')].filter(x => x.style.background).length)
if (hl !== 1) fail('expected 1 highlighted word in chronological view, got ' + hl)
else ok('marking works in the chronological reader')

// The mark must still be there when we come back to this segment.
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(400)
if (await page.locator('.segment-head h2').count() === 0) {
  fail('app did not reopen on the tab it was left on')
  await page.getByRole('button', { name: /Story/ }).click()
}
await page.waitForSelector('.segment-head h2', { timeout: 10000 })
await page.waitForTimeout(600)
const hlBack = await page.evaluate(() =>
  [...document.querySelectorAll('.chrono-chapter .word')].filter(x => x.style.background).length)
if (hlBack !== 1) fail('mark lost in chronological view after reload: ' + hlBack)
else ok('marks persist in the chronological reader across a restart')

// Era jump + plan.
await page.selectOption('.row select:nth-of-type(3)', 'christ').catch(() => {})
await page.getByRole('button', { name: /Plan/ }).click()
await page.waitForSelector('.planday')
const days = await page.locator('.planday').count()
if (days !== 365) fail('expected 365 plan days, got ' + days)
else ok('reading plan builds 365 days covering the whole order')
await page.getByRole('button', { name: /Back to reading/ }).click()
await page.waitForSelector('.segment-head h2')

// ---------- Stylus drawing in the real reader ----------
await page.getByRole('button', { name: /Read/ }).click()
await page.waitForSelector('.verse .word')

// Drawing off: taps must still select words.
const canvasPE = await page.evaluate(() => {
  const c = document.querySelector('.dl-canvas')
  return c ? getComputedStyle(c).pointerEvents : 'no-canvas'
})
if (canvasPE !== 'none') fail('canvas should be pointer-events:none when drawing is off, got ' + canvasPE)
else ok('drawing layer is inert while off')

await page.locator('.verse').first().locator('.word').nth(1).click()
await page.waitForSelector('.actionbar', { timeout: 5000 }).catch(() => fail('word selection blocked by the canvas'))
ok('verse selection still works with the drawing layer mounted')
await page.locator('.actionbar button[aria-label=Close]').click()

// Turn drawing on and draw a stroke with a synthetic pen.
const toggle = page.locator('.dl-bar button').first()
await toggle.click()
await page.waitForTimeout(200)
const box = await page.locator('.dl-canvas').boundingBox()
if (!box) fail('no canvas box')
await page.mouse.move(box.x + 60, box.y + 60)
await page.mouse.down()
for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 60 + i * 12, box.y + 60 + i * 5)
await page.mouse.up()
await page.waitForTimeout(500)

const stored = await page.evaluate(async () => {
  const req = indexedDB.open('myversionbible')
  const dbh = await new Promise(res => { req.onsuccess = () => res(req.result) })
  const tx = dbh.transaction('strokes').objectStore('strokes').getAll()
  const rows = await new Promise(res => { tx.onsuccess = () => res(tx.result) })
  return rows.filter(r => !r.deleted).map(r => ({ pageKey: r.pageKey, pts: r.points.length }))
})
if (stored.length !== 1) fail('expected 1 stored stroke, got ' + JSON.stringify(stored))
else ok(`stroke saved to the chapter (${stored[0].pageKey}, ${stored[0].pts / 2} points)`)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.verse .word', { timeout: 10000 })
await page.waitForTimeout(700)
const after = await page.evaluate(async () => {
  const req = indexedDB.open('myversionbible')
  const dbh = await new Promise(res => { req.onsuccess = () => res(req.result) })
  const tx = dbh.transaction('strokes').objectStore('strokes').getAll()
  const rows = await new Promise(res => { tx.onsuccess = () => res(tx.result) })
  const painted = await new Promise(res => {
    const c = document.querySelector('.dl-canvas')
    if (!c) return res(false)
    const ctx = c.getContext('2d')
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return res(true)
    res(false)
  })
  return { rows: rows.filter(r => !r.deleted).length, painted }
})
if (after.rows !== 1) fail('stroke lost after reload')
else ok('stroke survives a full app restart')
if (!after.painted) fail('stroke did not repaint onto the canvas after reload')
else ok('stroke is repainted over the text on return')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
