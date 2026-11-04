export async function loadPracticeHistory(getPage) {
  const rows = []
  let before = null
  while (true) {
    const page = await getPage(365, before, { strict: true })
    if (!Array.isArray(page) || page.some(day => !day || typeof day.date !== 'string' || !Array.isArray(day.items))) {
      throw new Error('Invalid practice history')
    }
    rows.push(...page)
    if (page.length < 365) return rows
    const nextBefore = page[page.length - 1].date
    if (!nextBefore || (before !== null && nextBefore >= before)) throw new Error('Invalid practice history cursor')
    before = nextBefore
  }
}
