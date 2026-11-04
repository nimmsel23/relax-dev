import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadPracticeHistory } from '../src/lib/training/practiceHistory.js'

test('history loads all pages and fails instead of silently returning a partial record', async () => {
  const first = Array.from({ length: 365 }, (_, index) => ({ date: `2026-${String(365 - index).padStart(3, '0')}`, items: [] }))
  const calls = []
  const rows = await loadPracticeHistory(async (limit, before, options) => {
    calls.push({ limit, before, options })
    return before === null ? first : [{ date: '2025-12-31', items: [] }]
  })
  assert.equal(rows.length, 366)
  assert.deepEqual(calls[1], { limit: 365, before: first.at(-1).date, options: { strict: true } })
  await assert.rejects(loadPracticeHistory(async (_limit, before) => {
    if (before === null) return first
    throw new Error('offline')
  }), /offline/)
})

test('invalid history and a non-advancing cursor are rejected', async () => {
  await assert.rejects(loadPracticeHistory(async () => [{ date: '2026-11-03' }]), /Invalid practice history/)
  const page = Array.from({ length: 365 }, () => ({ date: '2026-01-01', items: [] }))
  await assert.rejects(loadPracticeHistory(async () => page), /cursor/)
})
