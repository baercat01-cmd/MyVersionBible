// Sermon notes: several passages as line items, notes and passage taking turns
// on a phone, points and original words captured off the text, then a study.
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
const fold = label => page.locator('.fold').filter({ hasText: label }).first()
const openFold = async label => {
  const f = fold(label)
  if (!(await f.evaluate(el => el.classList.contains('fold-open')))) await f.locator('.fold-head').click()
  return f
}

// A tagged translation, so the original-word lookup has something to find.
await tab('Versions')
await cardFile('Import a translation from a file').setInputFiles(
  new URL('./fixture-STRONGS.json', import.meta.url).pathname)
await page.waitForSelector('text=/FIXTURE-STRONGS/', { timeout: 15000 })

await tab('Sermon')
await page.locator('button', { hasText: '+ New sermon' }).first().click()
await page.waitForSelector('#sermon-ref')

await page.fill('input[placeholder="Sermon title"]', 'The Word became flesh')
await page.fill('input[placeholder="Preacher"]', 'Pastor Lee')

// --- passages as line items ---
await page.fill('#sermon-ref', 'John 1:1-3')
await page.waitForTimeout(600)
if (!/In the beginning was the Word/.test(await page.locator('.sermon-passage').textContent()))
  fail('the first passage did not open')
else ok('a typed reference opens the passage beside the notes')

await page.locator('button', { hasText: '+ Passage' }).first().click()
await page.locator('.sermon-refline input').nth(1).fill('Genesis 1:1')
await page.waitForTimeout(600)
const chips = await page.locator('.sermon-refline .tag').allTextContents()
if (chips.length !== 2 || !/John 1:1-3/.test(chips[0]) || !/Genesis 1:1/.test(chips[1]))
  fail('two passages should stand as separate line items, got ' + JSON.stringify(chips))
else ok('several passages can be added as line items')

const heads = await page.locator('.sermon-passage-head').allTextContents()
if (heads.length !== 2) fail('the passage panel should show both passages, got ' + JSON.stringify(heads))
else ok('the panel reads both passages: ' + heads.join(' / '))

// Removing one line takes its passage out again.
await page.locator('.sermon-refline button[aria-label="Remove passage"]').nth(1).click()
await page.waitForTimeout(400)
if ((await page.locator('.sermon-passage-head').count()) !== 1) fail('removing a line left its passage behind')
else ok('removing a line item drops that passage')

// Loose forms still parse; an unreadable one is marked rather than guessed at.
for (const [typed, expect] of [['1 Cor 13', /1 Corinthians 13$/], ['Jn 1.1', /John 1:1$/]]) {
  await page.fill('#sermon-ref', typed)
  await page.waitForTimeout(400)
  const chip = await page.locator('.sermon-refline .tag').first().textContent()
  if (!expect.test(chip)) fail(`"${typed}" resolved to ${chip}`)
  else ok(`"${typed}" reads as ${chip}`)
}
await page.fill('#sermon-ref', 'nonsense 99')
await page.waitForTimeout(500)
if (!(await page.locator('.sermon-refline input.bad').count())) fail('a bad reference was accepted silently')
else ok('an unreadable reference is marked, not guessed at')

await page.fill('#sermon-ref', 'John 1:1-3')
await page.waitForTimeout(600)

// --- no explanatory text cluttering the form ---
const formText = await page.locator('.sermon-notes').innerText()
for (const gone of ['Who, what, when', 'One per line', 'The one sentence', 'Tap a word']) {
  if (formText.includes(gone)) fail('description text is still in the form: ' + gone)
}
ok('the form carries labels and placeholders, not paragraphs')

// --- capture a point straight off the text ---
const words = page.locator('.sermon-passage .verse').first().locator('.word')
await words.nth(0).click()
await words.nth(3).click()
await page.waitForTimeout(200)
await page.locator('.sermon-selbar button', { hasText: '+ Point' }).first().click()
await page.waitForTimeout(200)
if (!/John 1:1/.test(await page.locator('.sermon-point-ref').first().inputValue()))
  fail('a captured point lost its reference')
else ok('a point captured from the text keeps the verse it came from')
if (!/In the beginning/.test(await page.locator('.sermon-point-text').first().inputValue()))
  fail('a captured point lost its words')
else ok('the selected words come across into the outline')

// --- the original word behind a word, into a folded section ---
await page.locator('.sermon-passage .word').filter({ hasText: /^God/ }).first().click()
await page.waitForTimeout(300)
const addWord = page.locator('.sermon-selbar button', { hasText: /^\+ [GH]\d/ })
if (!(await addWord.count())) fail('tapping a tagged word offered no original-word capture')
else {
  await addWord.first().click()
  await page.waitForTimeout(400)
  const badge = await fold('Words to look at').locator('.fold-badge').textContent()
  if (badge !== '1') fail('the folded section does not show what is inside it, badge=' + badge)
  else ok('a folded section says how much is in it without being opened')
  const wordsField = await (await openFold('Words to look at')).locator('textarea').inputValue()
  if (!/^[GH]\d+/.test(wordsField)) fail('the original word was not added: ' + wordsField)
  else ok('an original word drops into the notes with its meaning: ' + wordsField.split('\n')[0].slice(0, 50))
}

// --- questions, then a study made out of the sermon ---
await (await openFold('Questions to study later')).locator('textarea').fill('Why "the Word" and not "the Son" here?')
await page.locator('button', { hasText: 'Study deeper' }).first().click()
await page.waitForTimeout(700)
await page.locator('button', { hasText: 'Done' }).first().click()
await page.waitForTimeout(700)

const card = page.locator('.card').filter({ hasText: 'The Word became flesh' }).first()
const cardText = await card.innerText()
if (!/Pastor Lee/.test(cardText) || !/John 1:1-3/.test(cardText))
  fail('the list card lost the preacher or reference: ' + cardText)
else ok('the sermon is saved and lists who preached it and from where')

await tab('Study')
await page.waitForTimeout(400)
const study = page.locator('.card').filter({ hasText: 'Study: The Word became flesh' }).first()
if (!(await study.count())) fail('no study was made from the sermon')
else ok('the sermon carries into a study of your own')
await study.click()
await page.waitForTimeout(400)
const studyText = (await Promise.all(
  (await page.locator('.editor-section textarea').all()).map(t => t.inputValue()))).join('\n')
if (!/Why "the Word"/.test(studyText)) fail('the questions did not carry into the study')
else ok('the questions raised carry into the study')
if (!/Pastor Lee/.test(studyText)) fail('the study does not record where it came from')
else ok('the study records the sermon it came from')

// --- the tab bar is short, with the rest behind More ---
const tabCount = await page.locator('.tabbar button').count()
if (tabCount > 5) fail('the tab bar is back to ' + tabCount + ' buttons')
else ok(`the tab bar is down to ${tabCount} buttons`)
await page.locator('.tabbar button[aria-label="More"]').click()
await page.waitForTimeout(200)
const sheet = await page.locator('.sheet-item').allTextContents()
if (sheet.length !== 5) fail('More should hold the other five sections, got ' + JSON.stringify(sheet))
else ok('Story, Lists, Versions, Print and Sync sit behind More')
await page.locator('.sheet-scrim').click()

// --- on a phone: one screen, no side-by-side, and no sideways scrolling ---
await page.setViewportSize({ width: 390, height: 844 })
await tab('Sermon')
await page.locator('.card').filter({ hasText: 'The Word became flesh' }).first().click()
await page.waitForSelector('.segmented')
if (await page.locator('.sermon-passage').count()) fail('the passage should not share the phone screen with the notes')
else ok('on a phone the notes have the screen to themselves')
await page.locator('.segmented button', { hasText: 'Passage' }).click()
await page.waitForTimeout(400)
if (!(await page.locator('.sermon-passage').count())) fail('the Passage tab did not show the text')
else ok('one tap swaps to the passage instead of scrolling to it')
if (await page.locator('.sermon-notes').count()) fail('both panes are showing at phone width')
else ok('the two take turns rather than stacking')

const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth)
if (overflow > 1) fail('the page scrolls sideways on a phone by ' + overflow + 'px')
else ok('nothing overflows the width of a phone')

const tapTargets = await page.evaluate(() => {
  const small = []
  for (const el of document.querySelectorAll('.tabbar button, .segmented button, .fold-head, .btn')) {
    const r = el.getBoundingClientRect()
    if (r.height > 0 && r.height < 32) small.push((el.textContent || '').trim().slice(0, 18) + ' @' + Math.round(r.height))
  }
  return small
})
if (tapTargets.length) fail('tap targets under 32px tall: ' + JSON.stringify(tapTargets))
else ok('the controls are big enough to hit with a thumb')

await browser.close()
console.log(process.exitCode ? 'sermon: FAILURES' : 'sermon: all good')
