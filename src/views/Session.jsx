import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Download, Plus, Save, Trash2 } from 'lucide-react'
import { getRelaxSession, saveRelaxSession, getRelaxTechniques, exportRelaxCsv } from '@db'
import { localToday, downloadText } from '../lib/db/shared/utils.js'

const MOOD = [
  { v: 1, label: '😞', name: 'sehr unruhig' },
  { v: 2, label: '😕', name: 'eher unruhig' },
  { v: 3, label: '😐', name: 'neutral' },
  { v: 4, label: '🙂', name: 'eher ruhig' },
  { v: 5, label: '😄', name: 'sehr ruhig' },
]

const FIELD = 'mt-1 w-full rounded-xl border px-3 py-2 text-sm'
const fieldStyle = { background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function makeItem() {
  return {
    id: crypto.randomUUID?.() || String(Date.now()),
    technique: '',
    minutes: 0,
    arrival_minutes: '',
    practice_minutes: '',
    return_minutes: '',
    mood_before: 3,
    mood_after: 3,
    focus: '',
    setting: '',
    reflection: '',
    transfer: '',
    note: '',
  }
}

export default function Session({ onNavigate }) {
  const today = localToday()
  const [techniques, setTechniques] = useState([])
  const [date, setDate] = useState(today)
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getRelaxTechniques().then(list => setTechniques(list || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    getRelaxSession(date).then(data => {
      if (active) setItems(data?.items || [])
    }).catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [date])

  const totalMinutes = useMemo(() => items.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0), [items])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 2200)
  }

  function updateItem(id, patch) {
    setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  async function save() {
    setSaving(true)
    try {
      const sanitized = items.map(item => ({
        ...item,
        technique: String(item.technique || '').trim(),
        minutes: clamp(Number(item.minutes) || 0, 0, 240),
        arrival_minutes: item.arrival_minutes === '' || item.arrival_minutes == null ? '' : clamp(Number(item.arrival_minutes) || 0, 0, 240),
        practice_minutes: item.practice_minutes === '' || item.practice_minutes == null ? '' : clamp(Number(item.practice_minutes) || 0, 0, 240),
        return_minutes: item.return_minutes === '' || item.return_minutes == null ? '' : clamp(Number(item.return_minutes) || 0, 0, 240),
        mood_before: clamp(Number(item.mood_before) || 3, 1, 5),
        mood_after: clamp(Number(item.mood_after) || 3, 1, 5),
        focus: String(item.focus || '').slice(0, 500),
        setting: String(item.setting || '').slice(0, 500),
        reflection: String(item.reflection || '').slice(0, 2000),
        transfer: String(item.transfer || '').slice(0, 1000),
        note: String(item.note || '').slice(0, 2000),
      })).filter(item => item.technique || item.minutes > 0 || item.note || item.reflection || item.focus)
      await saveRelaxSession(date, sanitized)
      setItems(sanitized)
      showToast('Praxisprotokoll gespeichert')
    } catch {
      showToast('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function exportCsv(days) {
    try {
      const data = await exportRelaxCsv(days)
      downloadText(data.filename, data.csv, 'text/csv;charset=utf-8')
    } catch {
      showToast('Export fehlgeschlagen')
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl p-2.5" style={{ color: 'var(--accent)', background: 'var(--accent-glow)' }}><BookOpen size={21} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Eigene Praxis</div>
            <h1 className="mt-1 text-xl font-black tracking-tight">Entspannungs-Session</h1>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Halte Methode, Ablauf und dein Erleben fest. Das Protokoll unterstützt deine Selbsterfahrung und ersetzt keine Ausbildungsbestätigung.
            </p>
            <button onClick={() => onNavigate?.('ausbildung')} className="mt-3 rounded-lg text-sm font-bold underline underline-offset-2" style={{ color: 'var(--accent)' }}>
              Stundenplanung &amp; 30-Einheiten-Nachweis öffnen
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-end justify-between gap-3 rounded-2xl border p-3" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}>
        <label className="min-w-0 text-xs" style={{ color: 'var(--muted)' }}>
          Datum
          <input type="date" value={date} onChange={event => setDate(event.target.value)} className={FIELD} style={fieldStyle} />
        </label>
        <div className="pb-1 text-right">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Praxiszeit</div>
          <div className="text-2xl font-black tracking-tight">{totalMinutes}<span className="ml-1 text-sm font-semibold">Min.</span></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setItems(current => [...current, makeItem()])} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <Plus size={16} /> Session hinzufügen
        </button>
        <button onClick={save} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold" style={{ background: saving ? 'var(--bg2)' : 'var(--accent)', color: saving ? 'var(--muted)' : '#0b0f19' }}>
          <Save size={16} /> {saving ? 'Speichert …' : 'Protokoll speichern'}
        </button>
        <div className="flex-1" />
        <button onClick={() => exportCsv(30)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ background: 'var(--card)', borderColor: 'var(--line)' }} title="CSV-Export der letzten 30 Tage">
          <Download size={16} /> Export
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="font-bold">Noch keine Praxis dokumentiert</div>
          <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: 'var(--muted)' }}>Starte mit einer Methode, die du kennst. Notiere auch Anpassungen und Pausen; nichts muss erzwungen werden.</p>
          <button onClick={() => setItems([makeItem()])} className="mt-4 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: 'var(--accent)', color: '#0b0f19' }}>Erste Session anlegen</button>
        </div>
      ) : items.map((item, index) => {
        const custom = item.customTechnique === true || (item.customTechnique !== false && item.technique && !techniques.some(technique => technique.name === item.technique))
        const phaseSum = ['arrival_minutes', 'practice_minutes', 'return_minutes'].reduce((sum, key) => sum + (Number(item[key]) || 0), 0)
        const hasPhaseTime = ['arrival_minutes', 'practice_minutes', 'return_minutes'].some(key => item[key] !== '' && item[key] != null)
        return (
          <article key={item.id || `${date}-${index}`} className="overflow-hidden rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Praxis {String(index + 1).padStart(2, '0')}</div>
                <div className="mt-0.5 font-bold">{item.technique || 'Methode auswählen'}</div>
              </div>
              <button onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Praxis ${index + 1} entfernen`} className="rounded-xl border p-2" style={{ borderColor: 'var(--line)', background: 'transparent', color: 'var(--dim)' }}><Trash2 size={17} /></button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Methode
                  {custom ? (
                    <div className="mt-1 flex gap-2">
                      <input autoFocus value={item.technique || ''} onChange={event => updateItem(item.id, { technique: event.target.value })} placeholder="Methode benennen" className={`${FIELD} mt-0`} style={fieldStyle} />
                      <button onClick={() => updateItem(item.id, { customTechnique: false, technique: '' })} className="rounded-xl border px-3 text-sm" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Liste</button>
                    </div>
                  ) : (
                    <select value={item.technique || ''} onChange={event => updateItem(item.id, event.target.value === '__custom__' ? { customTechnique: true, technique: '' } : { technique: event.target.value })} className={FIELD} style={fieldStyle}>
                      <option value="">Methode wählen …</option>
                      {techniques.map(technique => <option key={technique.id} value={technique.name}>{technique.name}</option>)}
                      <option value="__custom__">Eigene Methode …</option>
                    </select>
                  )}
                </label>
                <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Gesamtdauer · Min.
                  <input type="number" inputMode="numeric" min={0} max={240} value={item.minutes ?? ''} onChange={event => updateItem(item.id, { minutes: event.target.value })} className={FIELD} style={fieldStyle} />
                </label>
              </div>

              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Ziel oder Aufmerksamkeitsfokus <span className="font-normal">· optional</span>
                <input value={item.focus || ''} onChange={event => updateItem(item.id, { focus: event.target.value })} placeholder="Was möchtest du wahrnehmen oder üben?" className={FIELD} style={fieldStyle} />
              </label>

              <div>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Ablauf der Einheit</div>
                  <div className="text-[11px]" style={{ color: 'var(--dim)' }}>{hasPhaseTime ? `Phasen: ${phaseSum} Min. · Gesamt: ${Number(item.minutes) || 0} Min.` : 'Phasenzeiten optional festhalten'}</div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    ['arrival_minutes', 'Ankommen & Einschulung'],
                    ['practice_minutes', 'Entspannungsmethode'],
                    ['return_minutes', 'Nachspüren & Rücknahme'],
                  ].map(([key, label]) => <label key={key} className="rounded-xl border p-3 text-xs font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>{label}<div className="mt-2 flex items-center gap-2"><input type="number" inputMode="numeric" min={0} max={240} value={item[key] ?? ''} onChange={event => updateItem(item.id, { [key]: event.target.value })} className="w-20 rounded-lg border px-2 py-1.5 text-sm" style={fieldStyle} /><span>Minuten</span></div></label>)}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Ein Kursabschnitt kann etwa mit Begrüßung und Befinden beginnen, die Übung einschulen, genügend Zeit zum Nachspüren und eine passende Rücknahme einplanen. Passe den Ablauf an Methode und Person an.</p>
              </div>

              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Rahmenbedingungen <span className="font-normal">· optional</span>
                <input value={item.setting || ''} onChange={event => updateItem(item.id, { setting: event.target.value })} placeholder="Position, Raum, Hilfsmittel oder Musik" className={FIELD} style={fieldStyle} />
              </label>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: 'var(--bg2)' }}>
                <div className="mb-2 text-xs font-bold" style={{ color: 'var(--ink)' }}>Befinden wahrnehmen <span className="font-normal" style={{ color: 'var(--dim)' }}>· persönliche Einschätzung</span></div>
                {[['mood_before', 'Vorher'], ['mood_after', 'Nachher']].map(([key, label]) => <div key={key} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5"><span className="w-16 text-xs" style={{ color: 'var(--muted)' }}>{label}</span>{MOOD.map(mood => <button key={mood.v} type="button" onClick={() => updateItem(item.id, { [key]: mood.v })} aria-label={`${label}: ${mood.name}`} aria-pressed={Number(item[key] || 3) === mood.v} className="h-9 w-9 rounded-full border text-base transition-colors" style={{ borderColor: Number(item[key] || 3) === mood.v ? 'var(--accent)' : 'var(--line)', background: Number(item[key] || 3) === mood.v ? 'var(--accent-glow)' : 'transparent' }}>{mood.label}</button>)}</div>)}
              </div>

              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Beobachtung &amp; Reflexion <span className="font-normal">· optional</span>
                <textarea value={item.reflection ?? item.note ?? ''} onChange={event => updateItem(item.id, { reflection: event.target.value, note: event.target.value })} rows={3} placeholder="Was hast du körperlich oder gedanklich wahrgenommen? Was war angenehm oder herausfordernd?" className={FIELD} style={{ ...fieldStyle, resize: 'vertical' }} />
              </label>
              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Nächster Schritt / Transfer <span className="font-normal">· optional</span>
                <input value={item.transfer || ''} onChange={event => updateItem(item.id, { transfer: event.target.value })} placeholder="Was möchtest du wiederholen oder anpassen?" className={FIELD} style={fieldStyle} />
              </label>
            </div>
          </article>
        )
      })}

      <p className="px-1 text-xs leading-relaxed" style={{ color: 'var(--dim)' }}>Die Stimmungsskala beschreibt nur dein eigenes Erleben. Sie ist weder Messung noch Diagnose. Der offizielle Praxisnachweis wird separat im Ausbildungsmodul bestätigt.</p>

      {toast && <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-xl" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>{toast}</div>}
    </div>
  )
}
