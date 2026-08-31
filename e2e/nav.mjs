// Moving between tabs, now that the ones set up once and left alone live
// behind More rather than on the bar.
const BEHIND_MORE = ['Story', 'Lists', 'Versions', 'Print', 'Sync']

export function navTo(page) {
  return async function goTab(name) {
    if (BEHIND_MORE.includes(name)) {
      await page.locator('.tabbar button[aria-label="More"]').click()
      await page.locator('.sheet-item').filter({ hasText: name }).first().click()
    } else {
      await page.locator('.tabbar button').filter({ hasText: name }).first().click()
    }
    await page.waitForTimeout(150)
  }
}
