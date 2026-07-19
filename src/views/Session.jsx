import { useEffect, useMemo, useState } from 'react'
import { Save, Download, Plus, Trash2 } from 'lucide-react'
import { getRelaxSession, saveRelaxSession, getRelaxTechniques, exportRelaxCsv } from '@db'
import { localToday, downloadText } from '../lib/db/shared/utils.js'

const MOOD = [
  { v: 1, label: '😞' },
  { v: 2, label: '😕' },
  { v: 3, label: '😐' },
  { v: 4, label: '🙂' },
  { v: 5, label: '😄' },
]

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export default function Session() {
  const today = localToday()

  const [techniques, setTechniques] = useState([])
  const [date, setDate] = useState(today)
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getRelaxTechniques().then(t => setTechniques(t || [])).catch(() => {})
  }, [])

  useEffect(() => {
    getRelaxSession(date).then(d => {
      setItems(d?.items || [])
    }).catch(() => setItems([]))
  }, [date])

  const totalMinutes = useMemo(() => items.reduce((a, it) => a + (Number(it.minutes) || 0), 0), [items])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }

  function addItem() {
    setItems(prev => ([
      ...prev,
      {
        id: crypto.randomUUID?.() || String(Date.now()),
        technique: '',
        minutes: 10,
        mood_before: 3,
        mood_after: 4,
        note: '',
      }
    ]))
  }

  function updateItem(id, patch) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  async function save() {
    setSaving(true)
    try {
      const sanitized = items.map(it => ({
        ...it,
        technique: String(it.technique || '').trim(),
        minutes: clamp(Number(it.minutes) || 0, 0, 240),
        mood_before: clamp(Number(it.mood_before) || 3, 1, 5),
        mood_after: clamp(Number(it.mood_after) || 3, 1, 5),
        note: String(it.note || '').slice(0, 2000),
      })).filter(it => it.technique || it.minutes > 0 || it.note)
      await saveRelaxSession(date, sanitized)
      showToast('Gespeichert')
    } catch {
      showToast('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function exportCsv(days) {
    try {
      const d = await exportRelaxCsv(days)
      downloadText(d.filename, d.csv, 'text/csv;charset=utf-8')
    } catch {
      showToast('Export fehlgeschlagen')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Datum</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="mt-1 px-3 py-2 rounded-xl border text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Minuten</div>
          <div className="text-2xl font-black tracking-tight">{totalMinutes}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={addItem}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold"
          style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
        >
          <Plus size={16} /> Session-Item
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold"
          style={{ background: saving ? 'var(--bg2)' : 'var(--accent)', borderColor: 'transparent', color: saving ? 'var(--muted)' : '#0b0f19' }}
        >
          <Save size={16} /> {saving ? '...' : 'Speichern'}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => exportCsv(14)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold"
          style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
          title="CSV Export (14 Tage)"
        >
          <Download size={16} /> 14d
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
            <div className="font-bold">Keine Einträge</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Für die Prüfung: täglich kurze Entspannungs-Session loggen (Technik + Minuten + Stimmung).
            </div>
          </div>
        ) : items.map((it) => (
          <div key={it.id} className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold">Session</div>
              <button
                onClick={() => removeItem(it.id)}
                className="p-2 rounded-xl border"
                style={{ borderColor: 'var(--line)', background: 'transparent', color: 'var(--dim)' }}
                title="Entfernen"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Technik</div>
                <input
                  list="techniques"
                  value={it.technique}
                  onChange={e => updateItem(it.id, { technique: e.target.value })}
                  placeholder="z.B. Atemübung (4-7-8), PMR, Bodyscan ..."
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
                <datalist id="techniques">
                  {techniques.map(t => <option key={t.id} value={t.name} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Minuten</div>
                  <input
                    type="number"
                    min={0}
                    max={240}
                    value={it.minutes}
                    onChange={e => updateItem(it.id, { minutes: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Vorher</div>
                  <select
                    value={it.mood_before}
                    onChange={e => updateItem(it.id, { mood_before: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    {MOOD.map(m => <option key={m.v} value={m.v}>{m.label} {m.v}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Nachher</div>
                  <select
                    value={it.mood_after}
                    onChange={e => updateItem(it.id, { mood_after: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    {MOOD.map(m => <option key={m.v} value={m.v}>{m.label} {m.v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Notiz (optional)</div>
                <textarea
                  value={it.note}
                  onChange={e => updateItem(it.id, { note: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl border text-sm font-semibold"
          style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

