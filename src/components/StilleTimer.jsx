// StilleTimer — Stille-/Atem-Pause mit Vollbild-Visualisierung (Dauer + Modus wählbar, Zufall wiederholt nie den letzten).
import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import PauseViz, { VIZ } from './PauseViz.jsx'

const DURATIONS = [30, 60, 180, 300]
const KEY = 'relax:stille'

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
const write = (patch) => {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch })) } catch { /* Speicher gesperrt */ }
}
const label = (s) => (s < 60 ? `${s} s` : `${s / 60} min`)

export default function StilleTimer() {
  const saved = read()
  const [seconds, setSeconds] = useState(DURATIONS.includes(saved.seconds) ? saved.seconds : 30)
  const [pick, setPick] = useState(saved.pick === 'random' || VIZ.some(v => v.id === saved.pick) ? saved.pick : 'random')
  const [ring, setRing] = useState(saved.ring === true)
  const [left, setLeft] = useState(null)
  const [active, setActive] = useState('buddha')

  useEffect(() => {
    if (left == null) return undefined
    if (left <= 0) { setLeft(null); return undefined }
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  function start() {
    const last = read().last
    const pool = VIZ.filter(v => v.id !== last)
    const id = pick === 'random' ? pool[Math.floor(Math.random() * pool.length)].id : pick
    write({ last: id })
    setActive(id)
    setLeft(seconds)
  }

  const chip = (on) => ({
    background: on ? 'var(--accent)' : 'var(--card)',
    borderColor: on ? 'transparent' : 'var(--line)',
    color: on ? '#0b0f19' : 'var(--ink)',
  })
  const chipClass = 'px-3 py-1.5 rounded-xl border text-xs font-semibold'

  return (
    <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold">Stille</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Vollbild-Visualisierung, jedes Mal anders</div>
        </div>
        <button
          onClick={start}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold"
          style={{ background: 'var(--accent)', borderColor: 'transparent', color: '#0b0f19' }}
        >
          <Play size={16} /> Start
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Dauer">
        {DURATIONS.map(s => (
          <button key={s} className={chipClass} style={chip(seconds === s)} aria-pressed={seconds === s} onClick={() => { setSeconds(s); write({ seconds: s }) }}>{label(s)}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Visualisierung">
        {[{ id: 'random', label: 'Zufall' }, ...VIZ].map(v => (
          <button key={v.id} className={chipClass} style={chip(pick === v.id)} aria-pressed={pick === v.id} onClick={() => { setPick(v.id); write({ pick: v.id }) }}>{v.label}</button>
        ))}
        <button className={chipClass} style={chip(ring)} aria-pressed={ring} onClick={() => { setRing(!ring); write({ ring: !ring }) }}>Atemring</button>
      </div>
      {left != null && <PauseViz viz={active} ring={ring} seconds={seconds} left={left} onClose={() => setLeft(null)} />}
    </div>
  )
}
