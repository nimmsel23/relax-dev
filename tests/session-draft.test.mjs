import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readSessionDraft, writeSessionDraft, removeSessionDraft } from '../src/lib/training/sessionDraft.js'

function storage() {
  const entries = new Map()
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) }
}

test('practice drafts survive a view change and are scoped to a day', () => {
  const store = storage()
  const saved = [{ id: 'one', technique: 'PMR' }]
  const draft = [{ ...saved[0], reflection: 'Meine Notiz' }]
  writeSessionDraft(store, '2026-11-03', JSON.stringify(saved), draft)
  assert.deepEqual(readSessionDraft(store, '2026-11-03', saved), { status: 'restore', items: draft })
  assert.deepEqual(readSessionDraft(store, '2026-11-04', []), { status: 'none' })
  assert.deepEqual(readSessionDraft(store, '2026-11-03', [...saved, { id: 'two' }]), { status: 'conflict', items: draft })
  removeSessionDraft(store, '2026-11-03')
  assert.deepEqual(readSessionDraft(store, '2026-11-03', saved), { status: 'none' })
})

test('damaged drafts are not restored as session items', () => {
  const store = storage()
  store.setItem('relax-practice-draft-v1:2026-11-03', '{broken')
  assert.deepEqual(readSessionDraft(store, '2026-11-03', []), { status: 'invalid' })
  store.setItem('relax-practice-draft-v1:2026-11-03', JSON.stringify({ version: 1, base: '[]', items: [null] }))
  assert.deepEqual(readSessionDraft(store, '2026-11-03', []), { status: 'invalid' })
})
