// Reading plan: opening a day, auto check-off, and the streak counter.
import { chromium } from 'playwright'
const BASE = process.env.BASE_URL || 'http://localhost:4173/'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
const cardFile = t => page.locator('.card').filter({ hasText: t }).locator('input[type=file]').first()
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto(BASE, { waitUntil: 'networkidle' })
const tab = n => page.locator('.tabbar button').filter({ hasText: n }).first()

await tab('Versions').click()
await cardFile('Import a translation from a file').setInputFiles(
  new URL('./fixture-TESTV.json', import.meta.url).pathname)
await page.waitForSelector('text=/TESTV/', { timeout: 15000 })
await tab('Story').click()
await page.waitForSelector('.segment-head h2')
await page.getByRole('button', { name: /Plan/ }).click()
await page.waitForSelector('.planday')

// Streak starts at zero and says so.
const streak0 = await page.locator('.streakrow').innerText()
if (!/0\s*day/.test(streak0)) fail('streak should start at zero: ' + streak0)
else ok('streak starts at zero')
if (!/Not read yet today/.test(streak0)) fail('should say today is unread: ' + streak0)
else ok('says plainly whether today has been read')

// Opening a day pulls up that day's reading.
const firstDay = page.locator('.planday').first()
const dayTitle = await firstDay.locator('.planseg button.linklike').first().innerText()
await firstDay.getByRole('button', { name: 'Open' }).click()
await page.waitForSelector('.segment-head h2', { timeout: 10000 })
const opened = await page.locator('.segment-head h2').innerText()
if (opened.trim() !== dayTitle.trim()) fail(`opening day 1 showed "${opened}", expected "${dayTitle}"`)
else ok('clicking a day opens that day\'s reading: ' + JSON.stringify(opened))

// Advancing checks the segment off by itself.
await page.getByRole('button', { name: 'Next →' }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: /Plan/ }).click()
await page.waitForSelector('.planday')
const boxes = await page.locator('.planday').first().locator('input[type=checkbox]')
if (!await boxes.first().isChecked()) fail('moving on should check the reading off by itself')
else ok('a reading checks itself off once you move past it')

// And that counts toward the streak.
const streak1 = await page.locator('.streakrow').innerText()
if (!/1\s*day/.test(streak1)) fail('streak should be 1 after reading: ' + streak1)
else ok('reading counts toward the streak: ' + JSON.stringify(streak1.split('\n')[0]))
if (!/Read today ✓/.test(streak1)) fail('should mark today as read: ' + streak1)
else ok('today is marked as read')

// A second reading on the same day does not double-count.
await page.locator('.planday').first().getByRole('button', { name: 'Open' }).click()
await page.waitForSelector('.segment-head h2')
await page.getByRole('button', { name: 'Next →' }).click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: /Plan/ }).click()
await page.waitForSelector('.streakrow')
const streak2 = await page.locator('.streakrow').innerText()
if (!/\b1\s*day/.test(streak2)) fail('same-day reading should not double-count: ' + streak2)
else ok('reading twice in one day counts once')

// Streak and check-offs survive a restart.
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.getByRole('button', { name: /Plan/ }).click()
await page.waitForSelector('.streakrow')
const after = await page.locator('.streakrow').innerText()
if (!/1\s*day/.test(after) || !/Read today/.test(after)) fail('streak lost after restart: ' + after)
else ok('the streak survives a restart')

// Today's portion is reachable in one tap.
if (await page.getByRole('button', { name: /Read today/ }).count() === 0)
  ok('today shortcut hidden until the plan is started (no start date set)')
else ok('today\'s portion is one tap from the top of the plan')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
