import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  STORAGE_KEY, CASE_STORAGE_KEY, STRESS_REFLECTION_KEY, DELIVERY_STORAGE_KEY,
  METHOD_REFLECTION_KEY, LEARNING_CHECK_KEY, MODULE_BACKUP_FORMAT, MODULE_BACKUP_KEYS,
  csvCell, normalizeModuleBackup, restoreDelivery,
} from '../src/lib/training/moduleBackup.js'
import { TEACHING_SCRIPT_KEY, PRANAYAMA_ASSIGNMENT_KEY } from '../src/lib/training/storage.js'

const LEARNING_CHECK_LENGTH = 5

function validData() {
  return {
    [STORAGE_KEY]: { title: 'Ruhig ankommen', focus: '', blocks: [{ name: 'Ankommen', minutes: 5 }] },
    [CASE_STORAGE_KEY]: { weeks: [{}, {}, {}, {}], dayCycle: {} },
    [DELIVERY_STORAGE_KEY]: null,
    [STRESS_REFLECTION_KEY]: { stressors: '' },
    [METHOD_REFLECTION_KEY]: {},
    [LEARNING_CHECK_KEY]: { index: 0, answer: null, score: 0 },
    [TEACHING_SCRIPT_KEY]: '',
    [PRANAYAMA_ASSIGNMENT_KEY]: null,
  }
}

test('csvCell: quotet, verdoppelt Anführungszeichen, null/undefined werden leer', () => {
  assert.equal(csvCell('Text'), '"Text"')
  assert.equal(csvCell('Er "sagte" nichts'), '"Er ""sagte"" nichts"')
  assert.equal(csvCell('a;b\nc'), '"a;b\nc"')
  assert.equal(csvCell(null), '""')
  assert.equal(csvCell(undefined), '""')
  assert.equal(csvCell(0), '"0"')
  assert.equal(csvCell(false), '"false"')
  assert.equal(csvCell(''), '""')
})

test('normalizeModuleBackup: gueltiges v2Backup bleibt v2 und unverändert', () => {
  const backup = { format: MODULE_BACKUP_FORMAT, version: 2, exportedAt: '2026-11-07T00:00:00.000Z', data: validData() }
  const result = normalizeModuleBackup(backup, LEARNING_CHECK_LENGTH)
  assert.deepEqual(result, backup)
  assert.equal(result, backup)
})

test('normalizeModuleBackup: v1-Migration ergänzt Atem/Pranayama und hebt Version auf 2', () => {
  const { [TEACHING_SCRIPT_KEY]: _script, [PRANAYAMA_ASSIGNMENT_KEY]: _pranayama, ...v1Data } = validData()
  const v1 = { format: MODULE_BACKUP_FORMAT, version: 1, exportedAt: '2026-10-01T00:00:00.000Z', data: v1Data }
  const result = normalizeModuleBackup(v1, LEARNING_CHECK_LENGTH)
  assert.ok(result, 'v1 wird akzeptiert')
  assert.equal(result.version, 2)
  assert.equal(result.data[TEACHING_SCRIPT_KEY], '')
  assert.equal(result.data[PRANAYAMA_ASSIGNMENT_KEY], null)
  assert.equal(v1.version, 1, 'Eingabe wird nicht mutiert')
  assert.ok(!(TEACHING_SCRIPT_KEY in v1.data))
  assert.deepEqual(Object.keys(result.data).sort(), MODULE_BACKUP_KEYS.slice().sort())
})

test('normalizeModuleBackup: v1 mit falschem Schlüsselsatz wird abgelehnt', () => {
  const { [TEACHING_SCRIPT_KEY]: _a, [PRANAYAMA_ASSIGNMENT_KEY]: _b, [METHOD_REFLECTION_KEY]: _c, ...incomplete } = validData()
  const v1 = { format: MODULE_BACKUP_FORMAT, version: 1, data: incomplete }
  assert.equal(normalizeModuleBackup(v1, LEARNING_CHECK_LENGTH), null, 'ein origineller Schlüssel fehlt')
})

test('normalizeModuleBackup: lehnt kaputte Formate ab', () => {
  const data = validData()
  const make = overrides => ({ format: MODULE_BACKUP_FORMAT, version: 2, data: { ...data, ...overrides } })
  assert.equal(normalizeModuleBackup(null, LEARNING_CHECK_LENGTH), null, 'null')
  assert.equal(normalizeModuleBackup({}, LEARNING_CHECK_LENGTH), null, 'leeres Objekt')
  assert.equal(normalizeModuleBackup({ format: 'fremd', version: 2, data }, LEARNING_CHECK_LENGTH), null, 'fremdes Format')
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: null }, LEARNING_CHECK_LENGTH), null, 'data null')
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: [] }, LEARNING_CHECK_LENGTH), null, 'data Array')
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 3, data }, LEARNING_CHECK_LENGTH), null, 'unbekannte Version')
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: { ...data, extra: 1 } }, LEARNING_CHECK_LENGTH), null, 'zusaetzlicher Schluessel')
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: { ...data, [LEARNING_CHECK_KEY]: undefined } }, LEARNING_CHECK_LENGTH), null, 'fehlender Schluessel')
})

test('normalizeModuleBackup: lehnt inhaltlich ungueltige Daten ab', () => {
  const data = validData()
  const make = planOverrides => {
    const next = { ...data, [STORAGE_KEY]: { ...data[STORAGE_KEY], ...planOverrides } }
    return { format: MODULE_BACKUP_FORMAT, version: 2, data: next }
  }
  assert.equal(normalizeModuleBackup(make({ title: 42 }), LEARNING_CHECK_LENGTH), null, 'plantitle keine Zeichenkette')
  assert.equal(normalizeModuleBackup(make({ blocks: 'kein Array' }), LEARNING_CHECK_LENGTH), null, 'blocks kein Array')

  const casePlanBroken = { ...data, [CASE_STORAGE_KEY]: { weeks: [{}, {}], dayCycle: {} } }
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: casePlanBroken }, LEARNING_CHECK_LENGTH), null, 'fallplan weniger als 4 Wochen')

  const learningBroken = { ...data, [LEARNING_CHECK_KEY]: { index: LEARNING_CHECK_LENGTH + 1, score: 0 } }
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: learningBroken }, LEARNING_CHECK_LENGTH), null, 'lerncheck-Index zu hoch')

  const scriptBroken = { ...data, [TEACHING_SCRIPT_KEY]: 7 }
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: scriptBroken }, LEARNING_CHECK_LENGTH), null, 'atemschreiben keine Zeichenkette')

  const pranayamaBroken = { ...data, [PRANAYAMA_ASSIGNMENT_KEY]: { technique: '', script: '', rehearsal: '', groupPractice: '', feedback: 1 } }
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: pranayamaBroken }, LEARNING_CHECK_LENGTH), null, 'pranayama-Feld falscher Typ')

  const deliveryBroken = { ...data, [DELIVERY_STORAGE_KEY]: { blocks: [{ name: 'Block', minutes: 2 }], index: 1, remaining: 30, running: false } }
  assert.equal(normalizeModuleBackup({ format: MODULE_BACKUP_FORMAT, version: 2, data: deliveryBroken }, LEARNING_CHECK_LENGTH), null, 'timer-Index ausserhalb der Bloecke')
})

test('restoreDelivery: laufender Timer mit Zukunftsziel bleibt laufen mit Restzeit', () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  }
  try {
    const saved = { blocks: [{ name: 'Ankommen', minutes: 10 }], index: 0, remaining: 600, running: true, endsAt: Date.now() + 3200 }
    store.set(DELIVERY_STORAGE_KEY, JSON.stringify(saved))
    const result = restoreDelivery()
    assert.ok(result.running)
    assert.equal(result.endsAt, saved.endsAt)
    assert.ok(result.remaining === 4 || result.remaining === 3)

    store.set(DELIVERY_STORAGE_KEY, JSON.stringify({ blocks: [{ name: 'Ankommen', minutes: 10 }], index: 0, remaining: 600, running: true, endsAt: Date.now() - 5000 }))
    const expired = restoreDelivery()
    assert.equal(expired.running, false)
    assert.equal(expired.remaining, 0)
    assert.equal(expired.endsAt, null)
  } finally {
    delete globalThis.localStorage
  }
})

test('restoreDelivery: pausierter Timer ohne Endezeit, Muell und nichts gespeichert', () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  }
  try {
    store.set(DELIVERY_STORAGE_KEY, JSON.stringify({ blocks: [{ name: 'Ankommen', minutes: 5 }], index: 0, remaining: 43, running: false, endsAt: 123 }))
    const paused = restoreDelivery()
    assert.deepEqual(paused, { blocks: [{ name: 'Ankommen', minutes: 5 }], index: 0, remaining: 43, running: false, endsAt: null })

    store.set(DELIVERY_STORAGE_KEY, JSON.stringify({ blocks: [], index: 0, remaining: 1, running: false }))
    assert.equal(restoreDelivery(), null, 'leere Bloecke')

    store.set(DELIVERY_STORAGE_KEY, '{kein json')
    assert.equal(restoreDelivery(), null, 'kaputtes JSON')

    store.delete(DELIVERY_STORAGE_KEY)
    assert.equal(restoreDelivery(), null, 'nichts gespeichert')
  } finally {
    delete globalThis.localStorage
  }
})
