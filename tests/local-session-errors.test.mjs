import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getRelaxSession, getRelaxSessionHistory } from '../src/lib/db/local/sessions.js'

test('local session read distinguishes an absent day from an unavailable service', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('', { status: 404 })
    assert.equal(await getRelaxSession('2026-11-03'), null)

    globalThis.fetch = async () => new Response('', { status: 503 })
    await assert.rejects(getRelaxSession('2026-11-03'), { status: 503 })

    globalThis.fetch = async () => { throw new TypeError('network unavailable') }
    await assert.rejects(getRelaxSession('2026-11-03'), /network unavailable/)

    globalThis.fetch = async () => Response.json({ ok: false })
    await assert.rejects(getRelaxSession('2026-11-03'), /Invalid session response/)

    globalThis.fetch = async () => Response.json({ ok: true, data: { items: [{ technique: 'Atmung' }] } })
    assert.deepEqual(await getRelaxSession('2026-11-03'), { items: [{ technique: 'Atmung' }] })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('strict history read reports failure while legacy callers retain their empty fallback', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('', { status: 503 })
    assert.deepEqual(await getRelaxSessionHistory(), [])
    await assert.rejects(getRelaxSessionHistory(365, null, { strict: true }), { status: 503 })
    globalThis.fetch = async () => Response.json({ ok: true })
    await assert.rejects(getRelaxSessionHistory(365, null, { strict: true }), /Invalid session history response/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
