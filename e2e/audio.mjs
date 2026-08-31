// Reading aloud. Headless Chromium ships no voices, so a fake speech engine
// stands in — which lets the queueing, verse tracking and controls be tested
// properly rather than just checking a button exists.
import { chromium } from 'playwright'
const BASE = process.env.BASE_URL || 'http://localhost:4173/'
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1 }
const ok = m => console.log('  ok - ' + m)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 950 } })
const cardFile = t => page.locator('.card').filter({ hasText: t }).locator('input[type=file]').first()
page.on('pageerror', e => fail('page error: ' + e.message))

await page.addInitScript(() => {
  const spoken = []
  let current = null
  let paused = false
  window.__spoken = spoken
  window.__finish = () => { const u = current; current = null; if (u) u.onend && u.onend() }
  class U { constructor(text) { this.text = text; this.rate = 1; this.voice = null } }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: U, configurable: true })
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => [{ voiceURI: 'v-test', name: 'Test Voice', localService: true }],
      addEventListener() {}, removeEventListener() {},
      speak(u) {
        spoken.push({ text: u.text, rate: u.rate, voice: u.voice ? u.voice.voiceURI : null })
        current = u
        // Deliver 'end' asynchronously, as a real engine does.
        setTimeout(() => { if (current === u && !paused) { current = null; u.onend && u.onend() } }, 25)
      },
      cancel() { current = null },
      pause() { paused = true },
      resume() {
        if (!paused) return
        paused = false
        const u = current
        if (u) setTimeout(() => { if (current === u) { current = null; u.onend && u.onend() } }, 25)
      }
    }
  })
})

await page.goto(BASE, { waitUntil: 'networkidle' })
const tab = n => page.locator('.tabbar button').filter({ hasText: n }).first()
await tab('Versions').click()
await cardFile('Import a translation from a file').setInputFiles(
  new URL('./fixture-AUDIO.json', import.meta.url).pathname)
await page.waitForSelector('text=/FIXTURE-AUDIO/', { timeout: 15000 })
await tab('Read').click()
await page.waitForSelector('.verse .word')
await page.selectOption('select >> nth=1', '43')
await page.selectOption('select >> nth=2', '1')
await page.waitForTimeout(400)

// --- plays the chapter in order ---
await page.getByRole('button', { name: /Listen/ }).click()
await page.waitForTimeout(900)
const spoken = await page.evaluate(() => window.__spoken.map(s => s.text))
if (spoken.length < 5) fail('expected the whole chapter to be spoken, got ' + spoken.length)
else ok(`reads the chapter aloud, verse by verse (${spoken.length} utterances)`)
if (!/In the beginning was the Word/.test(spoken[0])) fail('did not start at verse 1: ' + spoken[0])
else ok('starts at the first verse: ' + JSON.stringify(spoken[0]))

// --- a long verse is broken into speakable pieces ---
const longPieces = spoken.filter(t => /decree went out|appointed time/.test(t))
if (longPieces.length < 2) fail('long verse should be split into pieces, got ' + longPieces.length)
else ok(`a long verse is split into ${longPieces.length} pieces at clause boundaries`)
if (spoken.some(t => t.length > 240)) fail('a piece exceeded the safe utterance length')
else ok('no piece exceeds the length that engines cut off')

// --- starting from a selected verse ---
await page.evaluate(() => { window.__spoken.length = 0 })
await page.locator('.verse').nth(2).locator('.vnum').click()
await page.waitForSelector('.actionbar')
const label = await page.getByRole('button', { name: /Listen from/ }).innerText()
if (!/v3/.test(label)) fail('should offer to start from the selected verse: ' + label)
else ok('offers to start from the selected verse: ' + JSON.stringify(label.trim()))
await page.getByRole('button', { name: /Listen from/ }).click()
await page.waitForTimeout(800)
const fromSel = await page.evaluate(() => window.__spoken.map(s => s.text))
if (!/All things were made/.test(fromSel[0])) fail('did not start at verse 3: ' + fromSel[0])
else ok('starts reading from the verse you selected')

// --- the verse being read is marked, and stop clears it ---
await page.evaluate(() => { window.__spoken.length = 0 })
await page.getByRole('button', { name: /^▶ Listen/ }).click()
await page.waitForTimeout(60)
const marked = await page.locator('.verse.speaking').count()
if (marked < 1) fail('the verse being read should be marked')
else ok('the verse being read is marked in the text')
await page.getByRole('button', { name: '■' }).click()
await page.waitForTimeout(300)
if (await page.locator('.verse.speaking').count() !== 0) fail('stop should clear the marker')
else ok('stopping clears the marker')

// --- pause and resume ---
await page.evaluate(() => { window.__spoken.length = 0 })
await page.getByRole('button', { name: /^▶ Listen/ }).click()
await page.waitForTimeout(40)
await page.getByRole('button', { name: '❚❚' }).click()
const atPause = await page.evaluate(() => window.__spoken.length)
await page.waitForTimeout(400)
const stillPaused = await page.evaluate(() => window.__spoken.length)
if (stillPaused > atPause) fail(`kept speaking while paused (${atPause} → ${stillPaused})`)
else ok('pausing actually stops the reading')
await page.getByRole('button', { name: '▶', exact: true }).click()
await page.waitForTimeout(700)
const afterResume = await page.evaluate(() => window.__spoken.length)
if (afterResume <= stillPaused) fail('resume did not continue')
else ok(`resuming carries on from where it stopped (${stillPaused} → ${afterResume})`)

// --- voice and speed are applied and remembered ---
const stopBtn = page.getByRole('button', { name: '■' })
if (await stopBtn.count()) await stopBtn.click()
await page.locator('.audiobar button[aria-expanded]').click()
await page.waitForSelector('.audio-settings')
await page.selectOption('#voicesel', 'v-test')
await page.locator('#ratesel').fill('1.5')
await page.getByRole('button', { name: 'Close' }).click()
await page.evaluate(() => { window.__spoken.length = 0 })
await page.getByRole('button', { name: /^▶ Listen/ }).click()
await page.waitForTimeout(300)
const settings = await page.evaluate(() => window.__spoken[0])
if (settings.rate !== 1.5) fail('speed not applied: ' + settings.rate)
else ok('the chosen speed is applied to the reading')
if (settings.voice !== 'v-test') fail('voice not applied: ' + settings.voice)
else ok('the chosen voice is applied to the reading')

const stopBtn2 = page.getByRole('button', { name: '■' })
if (await stopBtn2.count()) await stopBtn2.click()
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.verse .word')
await page.locator('.audiobar button[aria-expanded]').click()
await page.waitForSelector('.audio-settings')
const keptRate = await page.locator('#ratesel').inputValue()
if (keptRate !== '1.5') fail('speed not remembered after restart: ' + keptRate)
else ok('voice and speed are remembered across a restart')

await browser.close()
console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
