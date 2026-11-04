import { test } from 'node:test'
import assert from 'node:assert/strict'
import { confirmPracticeCandidate, practiceCandidateKey } from '../src/lib/training/practiceConfirmation.js'

test('only the selected item is confirmed, including empty and duplicate IDs', () => {
  const items = [{ id: '', technique: 'PMR' }, { id: '', technique: 'Atmung' }, { id: 'same' }, { id: 'same' }]
  const candidate = { date: '2026-11-03', _sessionItemIndex: 1, _sessionDaySnapshot: JSON.stringify(items) }
  const updated = confirmPracticeCandidate(items, candidate)
  assert.equal(practiceCandidateKey(candidate), '2026-11-03:index:1')
  assert.equal(updated[1].trainingUnit, true)
  assert.equal(updated[1].signed, true)
  assert.deepEqual(updated[0], items[0])
  assert.deepEqual(updated.slice(2), items.slice(2))
  assert.equal(confirmPracticeCandidate(items, { ...candidate, _sessionItemIndex: 3 })[2].signed, undefined)
})

test('a changed, missing, invalid or already confirmed day cannot be confirmed silently', () => {
  const items = [{ id: '', technique: 'PMR' }, { id: '', technique: 'Atmung' }]
  const candidate = { _sessionItemIndex: 1, _sessionDaySnapshot: JSON.stringify(items) }
  assert.equal(confirmPracticeCandidate([items[1]], candidate), null)
  assert.equal(confirmPracticeCandidate([...items].reverse(), candidate), null)
  assert.equal(confirmPracticeCandidate(null, candidate), null)
  assert.equal(confirmPracticeCandidate(items, { ...candidate, _sessionItemIndex: 9 }), null)
  const confirmed = [{ trainingUnit: true, signed: true }]
  assert.equal(confirmPracticeCandidate(confirmed, { _sessionItemIndex: 0, _sessionDaySnapshot: JSON.stringify(confirmed) }), null)
})
