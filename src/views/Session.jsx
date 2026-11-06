import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Download, Plus, Save, Trash2 } from 'lucide-react'
import { getRelaxSession, saveRelaxSession, getRelaxTechniques, exportRelaxCsv } from '@db'
import { localToday, downloadText } from '../lib/db/shared/utils.js'
import { readSessionDraft, writeSessionDraft, removeSessionDraft } from '../lib/training/sessionDraft.js'

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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [reload, setReload] = useState(0)
  const [loadedDate, setLoadedDate] = useState(null)
  const [base, setBase] = useState('[]')
  const [draftConflict, setDraftConflict] = useState(null)
  const [draftError, setDraftError] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getRelaxTechniques().then(list => setTechniques(list || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(false)
    setLoadedDate(null)
    getRelaxSession(date).then(data => {
      if (active) {
        const saved = data?.items || []
        let draft = { status: 'none' }
        try { draft = readSessionDraft(sessionStorage, date, saved); setDraftError(draft.status === 'invalid') }
        catch { setDraftError(true) }
        setBase(JSON.stringify(saved))
        setItems(draft.status === 'restore' ? draft.items : saved)
        setDirty(draft.status === 'restore')
        setDraftConflict(draft.status === 'conflict' ? draft.items : null)
        setLoadedDate(date)
      }
    }).catch(() => { if (active) setLoadError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [date, reload])

  useEffect(() => {
    if (!dirty || loadedDate !== date || draftConflict) return
    try { writeSessionDraft(sessionStorage, date, base, items); setDraftError(false) }
    catch { setDraftError(true) }
  }, [dirty, date, loadedDate, base, items, draftConflict])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const totalMinutes = useMemo(() => items.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0), [items])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 2200)
  }

  function updateItem(index, patch) {
    setDirty(true)
    setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function changeDate(nextDate) {
    if (!nextDate || nextDate === date) return
    let unableToSave = draftError
    if (dirty) {
      try { writeSessionDraft(sessionStorage, date, base, items); unableToSave = false }
      catch { unableToSave = true; setDraftError(true) }
    }
    if ((dirty || draftConflict) && unableToSave && !window.confirm('Der Entwurf konnte nicht im Browser gesichert werden. Ungespeicherte Änderungen verwerfen?')) return
    setLoadedDate(null)
    setDirty(false)
    setDraftConflict(null)
    setDate(nextDate)
  }

  async function save() {
    if (loading || loadError || saving || draftConflict) return
    setSaving(true)
    try {
      const latestItems = (await getRelaxSession(date))?.items || []
      const latestBase = JSON.stringify(latestItems)
      if (latestBase !== base) {
        setDraftConflict(items)
        setItems(latestItems)
        setBase(latestBase)
        setDirty(false)
        return
      }
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
      })).filter(item => item.technique || item.minutes > 0 || item.note || item.reflection || item.focus || item.setting || item.transfer || ['arrival_minutes', 'practice_minutes', 'return_minutes'].some(key => item[key] !== ''))
      await saveRelaxSession(date, sanitized)
      try { removeSessionDraft(sessionStorage, date); setDraftError(false) } catch { setDraftError(true) }
      setItems(sanitized)
      setBase(JSON.stringify(sanitized))
      setDirty(false)
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
    <div className="space-y-5 xl:grid xl:grid-cols-[minmax(0,1.8fr)_minmax(19rem,0.78fr)] xl:items-start xl:gap-8 xl:space-y-0 2xl:gap-12">
      <main className="min-w-0 space-y-5">
      <section className="rounded-2xl border p-5 sm:p-7 xl:px-8 xl:py-9" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="flex items-start gap-3">
          <div className="hidden rounded-2xl p-4 sm:block" style={{ color: 'var(--accent)', background: 'var(--accent-glow)' }}><BookOpen size={28} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Eigene Praxis</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl xl:text-4xl">Praxisjournal</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--muted)' }}>
              Halte Methode, Ablauf und dein Erleben fest. Das Protokoll unterstützt deine Selbsterfahrung und ersetzt keine Ausbildungsbestätigung.
            </p>
          </div>
        </div>
      </section>

      {draftError && <p role="alert" className="rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--orange)' }}>Der Entwurf konnte im Browser nicht gesichert oder gelesen werden. Bitte speichere deinen Eintrag, bevor du den Bereich verlässt.</p>}
      {draftConflict && !loading && !loadError && <div role="alert" className="rounded-xl border p-4 text-sm space-y-3" style={{ borderColor: 'var(--orange)', background: 'var(--card)' }}><p>Für diesen Tag gibt es einen ungespeicherten Entwurf, aber der gespeicherte Stand hat sich seitdem verändert. Wähle, welchen Stand du bearbeiten möchtest. Beim Speichern ersetzt der gewählte Entwurf den aktuellen Tagesstand.</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setItems(draftConflict); setDirty(true); setDraftConflict(null) }} className="rounded-lg border px-3 py-2 font-bold" style={{ borderColor: 'var(--line)' }}>Entwurf bearbeiten</button><button type="button" onClick={() => { try { removeSessionDraft(sessionStorage, date); setDraftError(false); setDraftConflict(null) } catch { setDraftError(true) } }} className="rounded-lg border px-3 py-2 font-bold" style={{ borderColor: 'var(--line)' }}>Gespeicherten Stand behalten</button></div></div>}
      {dirty && !draftError && <p role="status" className="text-xs" style={{ color: 'var(--muted)' }}>Ungespeicherter Entwurf in diesem Browser-Tab gesichert. Zum dauerhaften Speichern „Protokoll speichern“ wählen.</p>}
      <fieldset disabled={saving || !!draftConflict} className="min-w-0 space-y-5">
      {loading ? <p role="status">Praxistag wird geladen …</p> : loadError ? (
        <div role="alert" className="rounded-2xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--orange)' }}>
          Der Praxistag konnte nicht geladen werden. Bitte prüfe die Verbindung und öffne den Tag erneut; Speichern ist bis dahin gesperrt.
          <button type="button" onClick={() => setReload(value => value + 1)} className="ml-2 font-bold" style={{ color: 'var(--accent)' }}>Erneut laden</button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border px-6 py-10 sm:px-10 sm:py-14" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="max-w-xl">
            <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Dein nächster Eintrag</div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Noch keine Praxis dokumentiert</h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Starte mit einer Methode, die du kennst. Notiere auch Anpassungen und Pausen; nichts muss erzwungen werden.</p>
            <button onClick={() => { setDirty(true); setItems([makeItem()]) }} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: 'var(--accent)', color: '#0b0f19' }}><Plus size={17} />Erste Session anlegen</button>
          </div>
        </div>
      ) : items.map((item, index) => {
        const custom = item.customTechnique === true || (item.customTechnique !== false && item.technique && !techniques.some(technique => technique.name === item.technique))
        const phaseSum = ['arrival_minutes', 'practice_minutes', 'return_minutes'].reduce((sum, key) => sum + (Number(item[key]) || 0), 0)
        const hasPhaseTime = ['arrival_minutes', 'practice_minutes', 'return_minutes'].some(key => item[key] !== '' && item[key] != null)
        return (
          <article key={item.id || `${date}-${index}`} className="overflow-hidden rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Praxis {index + 1}</div>
                <div className="mt-0.5 font-bold">{item.technique || 'Methode auswählen'}</div>
              </div>
              <button onClick={() => { setDirty(true); setItems(current => current.filter((_, itemIndex) => itemIndex !== index)) }} aria-label={`Praxis ${index + 1} entfernen`} className="rounded-xl border p-2 relative after:absolute after:-inset-2.5 after:content-['']" style={{ borderColor: 'var(--line)', background: 'transparent', color: 'var(--dim)' }}><Trash2 size={17} /></button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Methode
                  {custom ? (
                    <div className="mt-1 flex gap-2">
                      <input autoFocus value={item.technique || ''} onChange={event => updateItem(index, { technique: event.target.value })} placeholder="Methode benennen" className={`${FIELD} mt-0`} style={fieldStyle} />
                      <button onClick={() => updateItem(index, { customTechnique: false, technique: '' })} className="rounded-xl border px-3 text-sm" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Liste</button>
                    </div>
                  ) : (
                    <select value={item.technique || ''} onChange={event => updateItem(index, event.target.value === '__custom__' ? { customTechnique: true, technique: '' } : { technique: event.target.value })} className={FIELD} style={fieldStyle}>
                      <option value="">Methode wählen …</option>
                      {techniques.map(technique => <option key={technique.id} value={technique.name}>{technique.name}</option>)}
                      <option value="__custom__">Eigene Methode …</option>
                    </select>
                  )}
                </label>
                <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Gesamtdauer · Min.
                  <input type="number" inputMode="numeric" min={0} max={240} value={item.minutes ?? ''} onChange={event => updateItem(index, { minutes: event.target.value })} className={FIELD} style={fieldStyle} />
                </label>
              </div>

              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Ziel oder Aufmerksamkeitsfokus <span className="font-normal">· optional</span>
                <input value={item.focus || ''} onChange={event => updateItem(index, { focus: event.target.value })} placeholder="Was möchtest du wahrnehmen oder üben?" className={FIELD} style={fieldStyle} />
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
                  ].map(([key, label]) => <label key={key} className="rounded-xl border p-3 text-xs font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>{label}<div className="mt-2 flex items-center gap-2"><input type="number" inputMode="numeric" min={0} max={240} value={item[key] ?? ''} onChange={event => updateItem(index, { [key]: event.target.value })} className="w-20 rounded-lg border px-2 py-1.5 text-sm" style={fieldStyle} /><span>Minuten</span></div></label>)}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Ein Kursabschnitt kann etwa mit Begrüßung und Befinden beginnen, die Übung einschulen, genügend Zeit zum Nachspüren und eine passende Rücknahme einplanen. Passe den Ablauf an Methode und Person an.</p>
              </div>

              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Rahmenbedingungen <span className="font-normal">· optional</span>
                <input value={item.setting || ''} onChange={event => updateItem(index, { setting: event.target.value })} placeholder="Position, Raum, Hilfsmittel oder Musik" className={FIELD} style={fieldStyle} />
              </label>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: 'var(--bg2)' }}>
                <div className="mb-2 text-xs font-bold" style={{ color: 'var(--ink)' }}>Befinden wahrnehmen <span className="font-normal" style={{ color: 'var(--dim)' }}>· persönliche Einschätzung</span></div>
                {[['mood_before', 'Vorher'], ['mood_after', 'Nachher']].map(([key, label]) => <div key={key} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5"><span className="w-16 text-xs" style={{ color: 'var(--muted)' }}>{label}</span>{MOOD.map(mood => <button key={mood.v} type="button" onClick={() => updateItem(index, { [key]: mood.v })} aria-label={`${label}: ${mood.name}`} aria-pressed={Number(item[key] || 3) === mood.v} className="h-9 w-9 rounded-full border text-base transition-colors" style={{ borderColor: Number(item[key] || 3) === mood.v ? 'var(--accent)' : 'var(--line)', background: Number(item[key] || 3) === mood.v ? 'var(--accent-glow)' : 'transparent' }}>{mood.label}</button>)}</div>)}
              </div>

              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Beobachtung &amp; Reflexion <span className="font-normal">· optional</span>
                <textarea value={item.reflection ?? item.note ?? ''} onChange={event => updateItem(index, { reflection: event.target.value, note: event.target.value })} rows={3} placeholder="Was hast du körperlich oder gedanklich wahrgenommen? Was war angenehm oder herausfordernd?" className={FIELD} style={{ ...fieldStyle, resize: 'vertical' }} />
              </label>
              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Nächster Schritt / Transfer <span className="font-normal">· optional</span>
                <input value={item.transfer || ''} onChange={event => updateItem(index, { transfer: event.target.value })} placeholder="Was möchtest du wiederholen oder anpassen?" className={FIELD} style={fieldStyle} />
              </label>
            </div>
          </article>
        )
      })}

      </fieldset>
      <p className="px-1 text-xs leading-relaxed" style={{ color: 'var(--dim)' }}>Die Stimmungsskala beschreibt nur dein eigenes Erleben. Sie ist weder Messung noch Diagnose. Der offizielle Praxisnachweis wird separat im Ausbildungsmodul bestätigt.</p>
      </main>

      <aside className="min-w-0 space-y-4 xl:sticky xl:top-5">
        <section className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}>
          <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            Praxistag
            <input type="date" value={date} onChange={event => changeDate(event.target.value)} disabled={saving} className={`${FIELD} mt-2`} style={fieldStyle} />
          </label>
          <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>Gesamte Praxiszeit</div>
            <div className="mt-1 flex items-baseline gap-2"><span className="text-4xl font-black tracking-tight">{totalMinutes}</span><span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Minuten</span></div>
            <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'} an diesem Tag</div>
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border p-3" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <button onClick={() => { setDirty(true); setItems(current => [...current, makeItem()]) }} disabled={loading || loadError || saving || !!draftConflict} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}><Plus size={17} />Session hinzufügen</button>
          <button onClick={save} disabled={loading || loadError || saving || !!draftConflict} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold disabled:opacity-50" style={{ background: saving ? 'var(--line)' : 'var(--accent)', color: saving ? 'var(--muted)' : '#0b0f19' }}><Save size={17} />{saving ? 'Speichert …' : 'Protokoll speichern'}</button>
          <button onClick={() => exportCsv(30)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ background: 'transparent', borderColor: 'var(--line)' }} title="CSV-Export der letzten 30 Tage"><Download size={16} />30-Tage-Export</button>
        </section>

        <section className="rounded-2xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <h2 className="font-bold">Ein guter Ablauf</h2>
          <ol className="mt-3 space-y-3 text-sm">
            {[
              ['Ankommen', 'Befinden erfragen, Ziel und Rahmen klären.'],
              ['Einschulung & Übung', 'Methode erklären, passend anleiten und wiederholen.'],
              ['Nachspüren & Rücknahme', 'Zeit geben, ruhig orientieren und gemeinsam abschließen.'],
            ].map(([title, description], index) => <li key={title} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ color: 'var(--accent)', background: 'var(--accent-glow)' }}>{index + 1}</span><div><div className="font-semibold">{title}</div><p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{description}</p></div></li>)}
          </ol>
          <p className="mt-4 border-t pt-3 text-xs leading-relaxed" style={{ borderColor: 'var(--line)', color: 'var(--dim)' }}>Ablauf und Dauer richten sich nach Methode, Gruppe und Person. Augen schließen und Musik bleiben freiwillig.</p>
        </section>

        <button onClick={() => onNavigate?.('ausbildung')} className="w-full rounded-2xl border p-4 text-left" style={{ background: 'var(--accent-glow)', borderColor: 'color-mix(in srgb, var(--accent) 38%, var(--line))' }}>
          <span className="block text-sm font-bold" style={{ color: 'var(--accent)' }}>Ausbildung weiterführen</span>
          <span className="mt-1 block text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Stundenplanung, Methodenkarten und bestätigten 30-Einheiten-Nachweis öffnen.</span>
        </button>
      </aside>

      {toast && <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-xl" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>{toast}</div>}
    </div>
  )
}
