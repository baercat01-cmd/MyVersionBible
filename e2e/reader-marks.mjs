// Regression test for verse marking and per-section persistence.
// Playwright is intentionally NOT a package.json dependency: its postinstall
// downloads browsers, which would slow down (or break) the Vercel build.
// Run with:  npm run build && npx vite preview --port 4173 &
//            npm i --no-save playwright && node e2e/reader-marks.mjs
import { chromium } from 'playwright'

const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const cardFile = t => page.locator('.card').filter({ hasText: t }).locator('input[type=file]').first()
page.on('pageerror', e => fail('page error: ' + e.message))
await page.goto('http://localhost:4174/', { waitUntil: 'networkidle' })

// 1. Import the fixture translation.
await page.getByRole('button', { name: /Versions/ }).click()
await cardFile('Import a translation from a file').setInputFiles(new URL('./fixture-TESTV.json', import.meta.url).pathname)
await page.waitForSelector('text=/TESTV/', { timeout: 15000 })
ok('translation imported and listed')

// 2. Read tab renders verses as individually clickable words.
await page.getByRole('button', { name: /Read/ }).click()
await page.waitForSelector('.verse .word', { timeout: 10000 })
const wordCount = await page.locator('.verse').first().locator('.word').count()
if (wordCount < 5) fail('expected several words in a verse, got ' + wordCount)
else ok(`verse tokenised into ${wordCount} clickable words`)

// 3. Mark two words of verse 1 with an underline.
const v1 = page.locator('.verse').first()
await v1.locator('.word').nth(3).click()
await v1.locator('.word').nth(4).click()
await page.waitForSelector('.actionbar')
await page.locator('.actionbar .swatch').nth(2).click()          // blue
await page.locator('.actionbar .markbtn').nth(1).click()          // underline
await page.waitForSelector('.actionbar', { state: 'detached' })

const marked = await page.evaluate(() =>
  [...document.querySelectorAll('.verse .word')].filter(w => w.style.boxShadow).map(w => w.textContent))
if (marked.length !== 2) fail('expected 2 underlined words, got ' + JSON.stringify(marked))
else ok('underline applied to exactly the selected words: ' + JSON.stringify(marked))

// 4. Whole-verse highlight on verse 2.
const v2 = page.locator('.verse').nth(1)
await v2.locator('.vnum').click()
await page.waitForSelector('.actionbar')
await page.locator('.actionbar .markbtn').nth(0).click()          // highlight
await page.waitForSelector('.actionbar', { state: 'detached' })
const hl = await page.evaluate(() =>
  [...document.querySelectorAll('.verse')][1].querySelectorAll('.word').length ===
  [...[...document.querySelectorAll('.verse')][1].querySelectorAll('.word')].filter(w => w.style.background).length)
if (!hl) fail('whole-verse highlight did not cover every word')
else ok('whole-verse highlight covers the entire verse')

// 5. Add a note on the selection; it must appear in the side panel.
const v3 = page.locator('.verse').nth(2)
await v3.locator('.vnum').click()
await page.waitForSelector('.actionbar')
await page.getByRole('button', { name: '+ Note', exact: true }).click()
await page.locator('.editor-overlay input[type=text]').first().fill('Logos study')
await page.locator('.editor-overlay textarea').first().fill('The Word is eternal.')
await page.getByRole('button', { name: 'Save' }).click()
await page.waitForSelector('.editor-overlay', { state: 'detached' })
await page.waitForSelector('.notescol .notecard')
const panelText = await page.locator('.notescol').innerText()
if (!panelText.includes('Logos study')) fail('note missing from side panel: ' + panelText)
else ok('note shows in the side panel beside the text')

// 6. THE REQUIREMENT: leave the section and come back — marks and note persist.
await page.getByRole('button', { name: 'Next →' }).click()
await page.waitForTimeout(400)
const awayMarks = await page.evaluate(() =>
  [...document.querySelectorAll('.verse .word')].filter(w => w.style.boxShadow || w.style.background).length)
if (awayMarks !== 0) fail('marks leaked into the next chapter (' + awayMarks + ')')
else ok('next chapter is clean — marks are anchored to their own section')

await page.getByRole('button', { name: '← Previous' }).click()
await page.waitForSelector('.verse .word')
await page.waitForTimeout(400)
const back = await page.evaluate(() => ({
  underlined: [...document.querySelectorAll('.verse .word')].filter(w => w.style.boxShadow).length,
  highlighted: [...document.querySelectorAll('.verse .word')].filter(w => w.style.background).length,
  panel: document.querySelector('.notescol')?.innerText || ''
}))
if (back.underlined !== 2) fail('underline lost on return: ' + back.underlined)
else ok('underlined words still marked after navigating away and back')
if (back.highlighted < 5) fail('highlight lost on return: ' + back.highlighted)
else ok('verse highlight still present after navigating away and back')
if (!back.panel.includes('Logos study')) fail('note lost from panel on return')
else ok('note still in the side panel after navigating away and back')

// 7. Survives a full app reload (fresh IndexedDB read, as on a later visit).
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.verse .word', { timeout: 10000 })
await page.waitForTimeout(600)
const afterReload = await page.evaluate(() => ({
  underlined: [...document.querySelectorAll('.verse .word')].filter(w => w.style.boxShadow).length,
  highlighted: [...document.querySelectorAll('.verse .word')].filter(w => w.style.background).length,
  panel: document.querySelector('.notescol')?.innerText || ''
}))
if (afterReload.underlined !== 2) fail('underline lost after reload: ' + afterReload.underlined)
else ok('marks survive a full app restart')
if (!afterReload.panel.includes('Logos study')) fail('note lost after reload')
else ok('notes survive a full app restart')

// 8. Erase clears a mark.
const r1 = page.locator('.verse').first()
await r1.locator('.vnum').click()
await page.waitForSelector('.actionbar')
await page.getByRole('button', { name: 'Erase' }).click()
await page.waitForTimeout(400)
const left = await page.evaluate(() =>
  [...document.querySelectorAll('.verse')][0].querySelectorAll('.word').length &&
  [...[...document.querySelectorAll('.verse')][0].querySelectorAll('.word')].filter(w => w.style.boxShadow).length)
if (left !== 0) fail('erase left marks behind: ' + left)
else ok('erase clears marks on the verse')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
