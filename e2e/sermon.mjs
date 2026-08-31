// Sermon notes: put in the reference being preached on, take structured notes
// beside the passage, then carry the whole thing into a study.
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
const tab = name => page.locator('.tabbar button').filter({ hasText: name }).first()

// A tagged translation, so the original-word lookup has something to find.
await tab('Versions').click()
await cardFile('Import a translation from a file').setInputFiles(
  new URL('./fixture-STRONGS.json', import.meta.url).pathname)
await page.waitForSelector('text=/FIXTURE-STRONGS/', { timeout: 15000 })

await tab('Sermon').click()
await page.locator('button', { hasText: '+ New sermon' }).first().click()
await page.waitForSelector('#sermon-ref')

await page.fill('input[placeholder="Sermon title"]', 'The Word became flesh')
await page.fill('input[placeholder="Preacher"]', 'Pastor Lee')

// --- the reference opens the passage ---
await page.fill('#sermon-ref', 'John 1:1-3')
await page.waitForTimeout(600)
const passage = await page.locator('.sermon-passage').textContent()
if (!/In the beginning was the Word/.test(passage)) fail('the passage did not open: ' + passage.slice(0, 120))
else ok('a typed reference opens the passage beside the notes')
if (!/Historical context/.test(passage)) fail('no context panel beside the passage')
else ok('the background of the book is one tap away')

// A full book name, an abbreviation and a bare chapter all have to parse.
for (const [typed, expect] of [['1 Cor 13', /^📖 1 Corinthians 13$/], ['Jn 1.1', /^📖 John 1:1$/], ['Genesis 1', /^📖 Genesis 1$/]]) {
  await page.fill('#sermon-ref', typed)
  await page.waitForTimeout(400)
  const chip = await page.locator('.tag', { hasText: '📖' }).first().innerText()
  if (!expect.test(chip)) fail(`"${typed}" resolved to ${chip}`)
  else ok(`"${typed}" reads as ${chip.replace('📖 ', '')}`)
}
await page.fill('#sermon-ref', 'nonsense 99')
await page.waitForTimeout(400)
if (!(await page.locator('.sermon-referror').count())) fail('a bad reference was accepted silently')
else ok('an unreadable reference says so instead of guessing')

await page.fill('#sermon-ref', 'John 1:1-3')
await page.waitForTimeout(600)

// --- capture a point straight off the text ---
const words = page.locator('.sermon-passage .verse').first().locator('.word')
await words.nth(0).click()
await words.nth(3).click()
await page.waitForTimeout(200)
await page.locator('.sermon-selbar button', { hasText: '+ Point' }).first().click()
await page.waitForTimeout(200)
const pointRef = await page.locator('.sermon-point-ref').first().inputValue()
const pointText = await page.locator('.sermon-point-text').first().inputValue()
if (!/John 1:1/.test(pointRef)) fail('a captured point lost its reference: ' + pointRef)
else ok('a point captured from the text keeps the verse it came from')
if (!/In the beginning/.test(pointText)) fail('a captured point lost its words: ' + pointText)
else ok('the selected words come across into the outline')

// --- the original word behind a word, in the notes ---
const godWord = page.locator('.sermon-passage .word').filter({ hasText: /^God/ }).first()
await godWord.click()
await page.waitForTimeout(300)
const addWord = page.locator('.sermon-selbar button', { hasText: /^\+ G|^\+ H/ })
if (!(await addWord.count())) fail('tapping a tagged word offered no original-word capture')
else {
  await addWord.first().click()
  await page.waitForTimeout(400)
  // Big idea, then the words field — the outline in between is made of inputs.
  const wordsField = await page.locator('.sermon-notes textarea').nth(1).inputValue()
  if (!/^[GH]\d+/.test(wordsField)) fail('the original word was not added to the notes: ' + wordsField)
  else ok('an original word drops into the notes with its meaning: ' + wordsField.split('\n')[0].slice(0, 60))
}

// --- questions, then a study made out of the sermon ---
await page.locator('.sermon-notes textarea').last().fill('Why "the Word" and not "the Son" here?')
await page.locator('button', { hasText: 'Study this deeper' }).first().click()
await page.waitForTimeout(600)
await page.locator('button', { hasText: 'Done' }).first().click()
await page.waitForTimeout(600)

const card = page.locator('.card').filter({ hasText: 'The Word became flesh' }).first()
if (!(await card.count())) fail('the sermon note is not in the list after saving')
else ok('the sermon is saved and listed')
const cardText = await card.innerText()
if (!/Pastor Lee/.test(cardText) || !/John 1:1-3/.test(cardText)) fail('list card lost the preacher or reference: ' + cardText)
else ok('the list shows who preached it and from where')

await tab('Study').click()
await page.waitForTimeout(400)
const study = page.locator('.card').filter({ hasText: 'Study: The Word became flesh' }).first()
if (!(await study.count())) fail('no study was made from the sermon')
else ok('the sermon carries into a study of your own')
await study.click()
await page.waitForTimeout(400)
const studyText = (await page.locator('.editor-section textarea').all())
  .length ? (await Promise.all((await page.locator('.editor-section textarea').all()).map(t => t.inputValue()))).join('\n') : ''
if (!/Why "the Word"/.test(studyText)) fail('the questions did not carry into the study')
else ok('the questions raised carry into the study')
if (!/Pastor Lee/.test(studyText)) fail('the study does not record where it came from')
else ok('the study records the sermon it came from')

// --- it survives a reload, and prints ---
await page.reload({ waitUntil: 'networkidle' })
await tab('Sermon').click()
await page.waitForTimeout(500)
if (!(await page.locator('.card').filter({ hasText: 'The Word became flesh' }).count()))
  fail('the sermon note did not survive a reload')
else ok('sermon notes are stored on the device')

await tab('Print').click()
await page.locator('button', { hasText: 'All sermon notes' }).first().click()
await page.waitForTimeout(200)
await page.locator('button', { hasText: 'Compile book' }).first().click()
await page.waitForTimeout(800)
const book = await page.locator('.book-preview').innerText()
if (!/Outline/.test(book) || !/Pastor Lee/.test(book))
  fail('sermon notes did not compile with their structure: ' + book.slice(0, 200))
else ok('sermon notes compile into the study book with their headings')

await browser.close()
console.log(process.exitCode ? 'sermon: FAILURES' : 'sermon: all good')
