import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { phaseAt } from '../../lib/breath/patterns.js'

export const KIND_COLOR = {
  in: 'var(--accent)',
  hold: 'var(--orange)',
  out: 'var(--green)',
  holdOut: 'var(--dim)',
}

const PREP_MS = 3000
const R_MAX = 118
const R_MIN = 44
const RING_R = 146
const RING_C = 2 * Math.PI * RING_R

/**
 * Immersiver Atem-Visualizer. Der Orb folgt dem Füllstand aus phaseAt(),
 * gezeichnet per rAF direkt ins SVG (kein React-Render pro Frame).
 * React-State ändert sich nur bei Phasen-/Sekunden-/Rundenwechsel.
 *
 * onFinish({ seconds, rounds, completed }) – seconds = aktive Atemzeit ohne Vorlauf/Pausen.
 */
export default function BreathPlayer({ pattern, rounds, vibrate, onFinish }) {
  const [paused, setPaused] = useState(false)
  const [disp, setDisp] = useState({ prep: true, idx: 0, sec: PREP_MS / 1000, round: 1 })

  const orbRef = useRef(null)
  const glowRef = useRef(null)
  const ringRef = useRef(null)
  const startRef = useRef(null)
  const pausedAtRef = useRef(null)
  const lastRef = useRef({ prep: true, idx: -1, sec: -1, round: -1 })
  const elapsedRef = useRef(0)
  const finishedRef = useRef(false)

  const finish = (completed) => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinish({ seconds: Math.round(elapsedRef.current / 1000), rounds: lastRef.current.round, completed })
  }

  // Bildschirm wach halten (Mobile). Fehler/Unsupported ignorieren.
  useEffect(() => {
    let lock = null
    let cancelled = false
    try {
      navigator.wakeLock?.request('screen').then((l) => {
        if (cancelled) l.release().catch(() => {})
        else lock = l
      }).catch(() => {})
    } catch { /* ignore */ }
    return () => {
      cancelled = true
      lock?.release().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (paused) {
      pausedAtRef.current = performance.now()
      return undefined
    }
    const now0 = performance.now()
    if (startRef.current == null) startRef.current = now0 + PREP_MS
    else if (pausedAtRef.current != null) startRef.current += now0 - pausedAtRef.current
    pausedAtRef.current = null

    let raf
    const tick = (now) => {
      const t = now - startRef.current
      let fill = 0
      let progress = 0
      let next

      if (t < 0) {
        next = { prep: true, idx: 0, sec: Math.ceil(-t / 1000), round: 1 }
      } else {
        const st = phaseAt(pattern, t, rounds)
        elapsedRef.current = t
        fill = st.fill
        progress = st.progress
        next = { prep: false, idx: st.phaseIndex, sec: st.secondsLeft, round: st.round }
        if (st.done) {
          paint(fill, 1)
          finish(true)
          return
        }
      }

      paint(fill, progress)

      const last = lastRef.current
      if (next.prep !== last.prep || next.idx !== last.idx || next.sec !== last.sec || next.round !== last.round) {
        if (vibrate && !next.prep && (next.idx !== last.idx || next.round !== last.round)) {
          try { navigator.vibrate?.(pattern.phases[next.idx].kind === 'in' ? 40 : 18) } catch { /* ignore */ }
        }
        lastRef.current = next
        setDisp(next)
      }
      raf = requestAnimationFrame(tick)
    }

    function paint(fillValue, prog) {
      const r = R_MIN + (R_MAX - R_MIN) * fillValue
      orbRef.current?.setAttribute('r', r.toFixed(2))
      glowRef.current?.setAttribute('r', (r + 16 + 10 * fillValue).toFixed(2))
      ringRef.current?.setAttribute('stroke-dashoffset', (RING_C * (1 - prog)).toFixed(2))
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  const phase = disp.prep ? null : pattern.phases[disp.idx]
  const color = phase ? KIND_COLOR[phase.kind] : 'var(--muted)'
  const label = disp.prep ? 'Mach dich bereit' : phase.label

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-between px-6 select-none"
      style={{ background: 'var(--bg)', color: 'var(--ink)', paddingTop: 'max(1.25rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <div className="w-full max-w-md text-center">
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{pattern.name}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--dim)' }}>
          {disp.prep ? `${rounds} Runden · ${pattern.ratio}` : `Runde ${disp.round} / ${rounds} · ${pattern.ratio}`}
        </div>
      </div>

      <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
        <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <radialGradient id="breath-orb" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor={color} stopOpacity="0.95" style={{ transition: 'stop-color 0.6s' }} />
              <stop offset="100%" stopColor={color} stopOpacity="0.45" style={{ transition: 'stop-color 0.6s' }} />
            </radialGradient>
          </defs>
          <circle cx="160" cy="160" r={RING_R} fill="none" stroke="var(--line)" strokeWidth="2" opacity="0.6" />
          <circle
            ref={ringRef}
            cx="160" cy="160" r={RING_R}
            fill="none" strokeWidth="3" strokeLinecap="round"
            stroke={color}
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C}
            transform="rotate(-90 160 160)"
            style={{ transition: 'stroke 0.6s' }}
          />
          <circle ref={glowRef} cx="160" cy="160" r={R_MIN + 16} fill={color} opacity="0.14" style={{ transition: 'fill 0.6s' }} />
          <circle ref={orbRef} cx="160" cy="160" r={R_MIN} fill="url(#breath-orb)" />
        </svg>

        <div className="relative text-4xl font-black tabular-nums pointer-events-none" style={{ color: '#0b0f19' }}>
          {disp.sec}
        </div>
      </div>

      <div className="w-full max-w-md text-center text-2xl font-extrabold -mt-2 mb-2" style={{ color }} role="status" aria-live="polite">
        {label}
      </div>

      <div className="w-full max-w-md">
        <div className="flex gap-1 mb-5" aria-hidden="true">
          {pattern.phases.map((ph, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-opacity"
              style={{
                flex: ph.s,
                background: KIND_COLOR[ph.kind],
                opacity: !disp.prep && i === disp.idx ? 1 : 0.25,
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => finish(false)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold"
            style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
          >
            <Square size={16} /> Beenden
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#0b0f19', border: 'none' }}
          >
            {paused ? <><Play size={16} /> Weiter</> : <><Pause size={16} /> Pause</>}
          </button>
        </div>
      </div>
    </div>
  )
}
