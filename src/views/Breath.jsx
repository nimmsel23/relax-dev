import { useEffect, useMemo, useRef, useState } from 'react'
import { Wind, Moon, Target, Zap, LifeBuoy, Play, Vibrate, TriangleAlert, Check, Download } from 'lucide-react'
import { getRelaxSession, saveRelaxSession } from '@db'
import { downloadText, localToday } from '../lib/db/shared/utils.js'
import { CATEGORIES, PATTERNS, patternsByCategory, getPattern, cycleSeconds, roundsFor } from '../lib/breath/patterns.js'
import BreathPlayer, { KIND_COLOR } from '../components/breath/BreathPlayer.jsx'
import { loadPrefs, savePrefs } from '../lib/breath/prefs.js'
import { isBreathTechnique } from '../lib/breath/stats.js'

const ICONS = { Wind, Moon, Target, Zap, LifeBuoy }
const DURATIONS = [1, 3, 5, 10]
const MOOD = ['😞', '😕', '😐', '🙂', '😄']
const TEACHING_SCRIPT_KEY = 'relax-breath-teaching-script-v1'
function PhaseBar({ pattern }) {
  return (
    <div className="flex gap-0.5 h-1.5 w-full" aria-hidden="true">
      {pattern.phases.map((ph, i) => (
        <div key={i} className="rounded-full" style={{ flex: ph.s, background: KIND_COLOR[ph.kind], opacity: 0.8 }} />
      ))}
    </div>
  )
}

function MoodPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {MOOD.map((m, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          aria-label={`Stimmung ${i + 1}`}
          aria-pressed={value === i + 1}
          className="flex-1 py-2 rounded-xl border text-lg transition-all"
          style={{
            background: value === i + 1 ? 'color-mix(in srgb, var(--accent) 22%, var(--bg2))' : 'var(--bg2)',
            borderColor: value === i + 1 ? 'var(--accent)' : 'var(--line)',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export default function Breath() {
  const prefs = useMemo(loadPrefs, [])
  const [catId, setCatId] = useState(CATEGORIES.some((c) => c.id === prefs.cat) ? prefs.cat : 'calm')
  const [patId, setPatId] = useState(getPattern(prefs.pattern) ? prefs.pattern : null)
  const [minutes, setMinutes] = useState(null) // null = Default des Musters
  const [vibrate, setVibrate] = useState(!!prefs.vibrate)
  const [moodBefore, setMoodBefore] = useState(3)

  const [running, setRunning] = useState(null) // { pattern, rounds, moodBefore }
  const [result, setResult] = useState(null) // { pattern, seconds, rounds, completed }
  const [moodAfter, setMoodAfter] = useState(4)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [todayMin, setTodayMin] = useState(0)
  const [teachingScript, setTeachingScript] = useState(() => {
    try { return localStorage.getItem(TEACHING_SCRIPT_KEY) || '' } catch { return '' }
  })
  const chipsRef = useRef(null)

  const category = CATEGORIES.find((c) => c.id === catId)
  const patterns = patternsByCategory(catId)
  const pattern = patId ? getPattern(patId) : null
  const effMinutes = minutes ?? pattern?.minutes ?? 3
  const rounds = pattern ? roundsFor(pattern, effMinutes) : 0

  function refreshToday() {
    getRelaxSession(localToday()).then((d) => {
      const sum = (d?.items || [])
        .filter((it) => isBreathTechnique(it.technique))
        .reduce((a, it) => a + (Number(it.minutes) || 0), 0)
      setTodayMin(sum)
    }).catch(() => {})
  }
  useEffect(refreshToday, [])
  useEffect(() => {
    try { localStorage.setItem(TEACHING_SCRIPT_KEY, teachingScript) } catch {}
  }, [teachingScript])

  // Gemerkte Kategorie in der Chip-Leiste ins Bild holen.
  useEffect(() => {
    chipsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [catId])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function pickCategory(id) {
    setCatId(id)
    savePrefs({ cat: id })
    if (pattern && pattern.category !== id) setPatId(null)
  }

  function pickPattern(id) {
    const next = patId === id ? null : id
    setPatId(next)
    setMinutes(null)
    if (next) savePrefs({ pattern: next })
  }

  function start() {
    if (!pattern) return
    savePrefs({ vibrate })
    setResult(null)
    setRunning({ pattern, rounds, moodBefore })
  }

  function onFinish(r) {
    const p = running.pattern
    setRunning(null)
    // Unter 20 s ist es kein Durchlauf, der ins Log gehört.
    if (r.seconds < 20) return
    setMoodAfter(Math.min(5, running.moodBefore + 1))
    setResult({ pattern: p, ...r, moodBefore: running.moodBefore })
  }

  async function saveResult() {
    if (!result) return
    setSaving(true)
    try {
      const date = localToday()
      const existing = await getRelaxSession(date)
      const item = {
        id: crypto.randomUUID?.() || String(Date.now()),
        technique: result.pattern.technique,
        minutes: Math.max(1, Math.round(result.seconds / 60)),
        mood_before: result.moodBefore,
        mood_after: moodAfter,
        note: `Atem-Visualizer · ${result.rounds} Runden${result.completed ? '' : ' (vorzeitig beendet)'}`,
      }
      await saveRelaxSession(date, [...(existing?.items || []), item])
      setResult(null)
      refreshToday()
      showToast('Im Session-Log gespeichert')
    } catch {
      showToast('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (running) {
    return <BreathPlayer pattern={running.pattern} rounds={running.rounds} vibrate={vibrate} onFinish={onFinish} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Atmen</div>
          <div className="text-lg font-black tracking-tight">Wähle eine Technik</div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Heute geatmet</div>
          <div className="text-2xl font-black tracking-tight">{todayMin} <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>min</span></div>
        </div>
      </div>

      <section className="rounded-2xl border p-4 space-y-2" style={{ background: 'var(--card)', borderColor: 'var(--line)' }} aria-label="Atemschulung aus der Ausbildung">
        <div className="text-sm font-bold">Atemschulung · Kursbezug</div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Das Skript leitet dazu an, die Hände auf den Bauch zu legen und Ein- und Ausatmung wahrzunehmen; außerdem soll ein eigener Anleitungstext zur Bauchatmung vorbereitet werden. Es gibt dafür keine feste Übungsdauer oder Häufigkeit vor.
        </p>
        <p className="text-xs" style={{ color: 'var(--dim)' }}>
          Quelle zur Übung: FlexyFit Academy, „Atemschulung“, S. 48. Eine separate lokale Kursnotiz nennt für Atemschulung 15–20 Minuten („00_Entspannungs-Protokoll-MINIMAL.md“); das ist ein Richtwert, keine Dosierung aus dem PDF. Timer-Dauern bleiben frei wählbare App-Einstellungen. Bei Unwohlsein zur natürlichen Atmung zurückkehren.
        </p>
        <p className="text-xs" style={{ color: 'var(--dim)' }}>
          Kursübungen aus „Atemschulung“: Bauchatmung wahrnehmen (S. 48), Bhramari und Sama Vritti (S. 38). Die übrigen geführten Atemrhythmen sind ergänzende App-Übungen, keine Vorgaben des Ausbildungsskripts.
        </p>
        <p className="rounded-xl p-3 text-sm" style={{ background: 'var(--bg2)', color: 'var(--muted)' }}>
          Kursfrage aus der Gruppenarbeit, S. 4: <strong>Was hat der Atem mit Entspannung zu tun?</strong>
        </p>
        <details className="rounded-xl border p-3" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}>
          <summary className="cursor-pointer text-sm font-semibold">Atemmechanik im Kursskript · S. 9–14</summary>
          <div className="mt-3 space-y-3 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            <p><strong>Einatmung · S. 9:</strong> Das Skript beschreibt Zwischenrippenmuskeln und Zwerchfell als beteiligte Atemmuskeln. Bei der Einatmung kontrahiert das Zwerchfell und flacht ab; so vergrößert sich der Brustraum.</p>
            <p><strong>Brustatmung · S. 10–13:</strong> Die äußeren Zwischenrippenmuskeln heben und erweitern den Brustkorb. Nach größerer Anstrengung können laut Skript weitere Atemhilfsmuskeln unterstützen.</p>
            <p><strong>Bauchatmung · S. 14:</strong> Bei der Zwerchfellatmung senkt sich das kontrahierende Zwerchfell und dehnt die Lungenflügel nach unten.</p>
            <p className="text-[11px]" style={{ color: 'var(--dim)' }}>Kursinhalt zur Atemmechanik, keine Anleitung zur Diagnose oder Behandlung von Atembeschwerden.</p>
          </div>
        </details>
        <p className="text-xs" style={{ color: 'var(--dim)' }}>
          Ein Timer gibt nur einen Rhythmus vor und misst keine Körperreaktionen. Atemtiefe und Pausen bleiben freiwillig; wenn etwas unangenehm ist, wieder natürlich atmen oder die Übung beenden.
        </p>
        <div className="space-y-2 pt-2">
          <label htmlFor="breath-teaching-script" className="block text-sm font-semibold">Mein Anleitungstext für die Bauchatmung</label>
          <textarea
            id="breath-teaching-script"
            value={teachingScript}
            onChange={(event) => setTeachingScript(event.target.value)}
            rows={5}
            placeholder="Formuliere hier deine persönliche Anleitung zur Bauchatmung …"
            className="w-full rounded-xl border p-3 text-sm"
            style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--dim)' }}>Lokal auf diesem Gerät gespeichert · Kursaufgabe: Atemschulung, S. 48</span>
            <button
              type="button"
              onClick={() => downloadText(`bauchatmung-anleitung-${localToday()}.md`, `# Mein Anleitungstext für die Bauchatmung\n\n${teachingScript || '(Noch kein Text)' }\n\nQuelle der Schreibaufgabe: FlexyFit Academy, Atemschulung, S. 48.`, 'text/markdown;charset=utf-8')}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
              style={{ background: 'transparent', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Download size={14} /> Markdown exportieren
            </button>
          </div>
        </div>
      </section>

      {result && (
        <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--card)', borderColor: 'var(--accent)' }}>
          <div className="flex items-center gap-2 font-bold">
            <Check size={18} style={{ color: 'var(--green)' }} />
            {result.completed ? 'Geschafft' : 'Beendet'} · {result.pattern.name}
          </div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            {Math.max(1, Math.round(result.seconds / 60))} min, {result.rounds} Runden. Wie fühlst du dich jetzt?
          </div>
          <MoodPicker value={moodAfter} onChange={setMoodAfter} />
          <div className="flex gap-2">
            <button
              onClick={saveResult}
              disabled={saving}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: saving ? 'var(--bg2)' : 'var(--accent)', color: saving ? 'var(--muted)' : '#0b0f19', border: 'none' }}
            >
              {saving ? '...' : 'Im Log speichern'}
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-3 py-2.5 rounded-xl border text-sm font-semibold"
              style={{ background: 'transparent', borderColor: 'var(--line)', color: 'var(--muted)' }}
            >
              Verwerfen
            </button>
          </div>
        </div>
      )}

      {/* Kategorien */}
      <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" role="tablist" aria-label="Kategorien">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.icon]
          const active = c.id === catId
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              onClick={() => pickCategory(c.id)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all"
              style={{
                background: active ? 'color-mix(in srgb, var(--accent) 20%, var(--card))' : 'var(--card)',
                borderColor: active ? 'var(--accent)' : 'var(--line)',
                color: active ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              <Icon size={16} /> {c.label}
            </button>
          )
        })}
      </div>
      <div className="text-sm -mt-1" style={{ color: 'var(--muted)' }}>{category.blurb}</div>

      {/* Muster */}
      <div className="space-y-3">
        {patterns.map((p) => {
          const open = p.id === patId
          return (
            <div
              key={p.id}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'var(--card)', borderColor: open ? 'var(--accent)' : 'var(--line)' }}
            >
              <button
                onClick={() => pickPattern(p.id)}
                aria-expanded={open}
                className="w-full text-left p-4 space-y-2.5"
                style={{ background: 'none', border: 'none', color: 'var(--ink)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs font-semibold tabular-nums" style={{ color: 'var(--muted)' }}>{p.ratio}</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: p.courseReference ? 'var(--accent)' : 'var(--dim)' }}>{p.courseReference ? `Kursübung · ${p.courseReference}` : 'Zusatzübung · nicht als Kursvorgabe aufgeführt'}</div>
                <PhaseBar pattern={p} />
                {!open && <div className="text-sm" style={{ color: 'var(--muted)' }}>{p.desc}</div>}
              </button>

              {open && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>{p.desc}</div>
                  <div className="text-sm"><span className="font-semibold">So geht’s: </span><span style={{ color: 'var(--muted)' }}>{p.how}</span></div>

                  {p.caution && (
                    <div className="flex gap-2 p-3 rounded-xl text-sm" style={{ background: 'color-mix(in srgb, var(--orange) 14%, var(--bg2))', color: 'var(--ink)' }}>
                      <TriangleAlert size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--orange)' }} />
                      {p.caution}
                    </div>
                  )}

                  <div>
                    <div className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Dauer</div>
                    <div className="flex gap-1.5">
                      {DURATIONS.map((d) => {
                        const active = effMinutes === d
                        return (
                          <button
                            key={d}
                            onClick={() => setMinutes(d)}
                            className="flex-1 py-2 rounded-xl border text-sm font-semibold"
                            style={{
                              background: active ? 'color-mix(in srgb, var(--accent) 22%, var(--bg2))' : 'var(--bg2)',
                              borderColor: active ? 'var(--accent)' : 'var(--line)',
                              color: 'var(--ink)',
                            }}
                          >
                            {d} min
                          </button>
                        )
                      })}
                    </div>
                    <div className="text-xs mt-1.5" style={{ color: 'var(--dim)' }}>
                      {rounds} Runden · {cycleSeconds(p) % 1 === 0 ? cycleSeconds(p) : cycleSeconds(p).toFixed(1)} s pro Zyklus
                    </div>
                  </div>

                  <div>
                    <div className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Wie fühlst du dich jetzt?</div>
                    <MoodPicker value={moodBefore} onChange={setMoodBefore} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVibrate((v) => !v)}
                      aria-pressed={vibrate}
                      title="Haptisches Signal bei Phasenwechsel (nur Mobilgeräte)"
                      className="p-3 rounded-xl border"
                      style={{
                        background: vibrate ? 'color-mix(in srgb, var(--accent) 22%, var(--bg2))' : 'var(--bg2)',
                        borderColor: vibrate ? 'var(--accent)' : 'var(--line)',
                        color: vibrate ? 'var(--accent)' : 'var(--dim)',
                      }}
                    >
                      <Vibrate size={18} />
                    </button>
                    <button
                      onClick={start}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold"
                      style={{ background: 'var(--accent)', color: '#0b0f19', border: 'none' }}
                    >
                      <Play size={16} /> Start
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-xs text-center pt-1" style={{ color: 'var(--dim)' }}>
        {PATTERNS.length} Techniken · Keine Medizinberatung. Bei Schwindel oder Unwohlsein die Übung abbrechen und normal atmen.
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
