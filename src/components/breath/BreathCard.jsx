import { useEffect, useMemo, useState } from 'react'
import { Wind, Flame, Play } from 'lucide-react'
import { getRelaxSessionHistory } from '@db'
import { localToday } from '../../lib/db/shared/utils.js'
import { getPattern } from '../../lib/breath/patterns.js'
import { savePrefs } from '../../lib/breath/prefs.js'
import { breathByDate, currentStreak, longestStreak, lastDays, suggestionForHour } from '../../lib/breath/stats.js'

const DAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const HISTORY_DAYS = 60
const BAR_MAX_MIN = 10 // ab hier voller Balken

/**
 * Dashboard-Karte: Atem-Serie, letzte 7 Tage und Tageszeit-Vorschlag.
 * onNavigate(tabId) kommt aus App; ohne Handler bleibt der Start-Button aus.
 */
export default function BreathCard({ onNavigate }) {
  const [sessions, setSessions] = useState([])
  const today = localToday()

  useEffect(() => {
    let alive = true
    Promise.resolve()
      .then(() => getRelaxSessionHistory(HISTORY_DAYS))
      .then((s) => { if (alive) setSessions(s || []) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const byDate = useMemo(() => breathByDate(sessions), [sessions])
  const streak = currentStreak(byDate, today)
  const best = longestStreak(byDate)
  const week = useMemo(() => lastDays(byDate, today, 7), [byDate, today])
  const todayMin = byDate[today] || 0

  const suggestion = suggestionForHour(new Date().getHours())
  const pattern = getPattern(suggestion.patternId)

  function startSuggestion() {
    if (!pattern || !onNavigate) return
    savePrefs({ cat: pattern.category, pattern: pattern.id })
    onNavigate('atem')
  }

  return (
    <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Wind size={15} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Atmen</span>
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{todayMin} min heute</div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <Flame size={20} style={{ color: streak > 0 ? 'var(--orange)' : 'var(--dim)' }} />
            <span className="text-3xl font-black tracking-tight tabular-nums">{streak}</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>{streak === 1 ? 'Tag' : 'Tage'}</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>
            {streak === 0 ? 'Serie startet mit der nächsten Übung' : `Rekord ${Math.max(best, streak)}`}
          </div>
        </div>

        <div className="flex items-end gap-1.5 h-12" aria-label="Atemminuten der letzten 7 Tage">
          {week.map((d) => {
            const h = d.minutes > 0 ? Math.max(0.2, Math.min(1, d.minutes / BAR_MAX_MIN)) : 0.08
            const isToday = d.date === today
            return (
              <div key={d.date} className="flex flex-col items-center gap-1" title={`${d.date}: ${d.minutes} min`}>
                <div
                  className="w-3.5 rounded-sm"
                  style={{
                    height: `${Math.round(h * 32)}px`,
                    background: d.minutes > 0 ? 'var(--accent)' : 'var(--line)',
                    outline: isToday ? '1.5px solid var(--accent)' : 'none',
                    outlineOffset: 1,
                  }}
                />
                <span className="text-[9px] font-semibold" style={{ color: isToday ? 'var(--accent)' : 'var(--dim)' }}>
                  {DAY[new Date(`${d.date}T12:00:00`).getDay()]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {pattern && onNavigate && (
        <button
          onClick={startSuggestion}
          className="mt-4 w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left"
          style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold truncate">{pattern.name}</span>
            <span className="block text-xs truncate" style={{ color: 'var(--muted)' }}>{suggestion.reason}</span>
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--accent)' }}>
            <Play size={14} /> Öffnen
          </span>
        </button>
      )}
    </div>
  )
}
