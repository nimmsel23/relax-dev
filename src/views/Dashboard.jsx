import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Download, Flame, MoonStar } from 'lucide-react'
import { getRelaxSession, getRelaxStatsSummary, exportRelaxCsv } from '@db'
import { localToday, getWeekDates, downloadText } from '../lib/db/shared/utils.js'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function sumMinutes(session) {
  return (session?.items || []).reduce((a, it) => a + (Number(it.minutes) || 0), 0)
}

export default function Dashboard() {
  const today = localToday()
  const [week, setWeek] = useState([])
  const [summary7, setSummary7] = useState(null)

  useEffect(() => {
    const dates = getWeekDates()
    Promise.all(
      dates.map(date =>
        getRelaxSession(date).then(d => ({ date, minutes: sumMinutes(d) })).catch(() => ({ date, minutes: 0 })),
      ),
    ).then(setWeek)

    getRelaxStatsSummary(7).then(s => {
      if (s) setSummary7(s)
    }).catch(() => {})
  }, [])

  const weekTotal = useMemo(() => week.reduce((a, d) => a + (d.minutes || 0), 0), [week])
  const todayMinutes = useMemo(() => (week.find(d => d.date === today)?.minutes || 0), [week, today])

  async function exportCsv(days) {
    try {
      const d = await exportRelaxCsv(days)
      downloadText(d.filename, d.csv, 'text/csv;charset=utf-8')
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Heute</div>
            <div className="mt-1 text-3xl font-black tracking-tight">{todayMinutes} min</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Ziel: täglicher Reset (5–20 Minuten) für Ausbildung/Prüfung.
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border"
            style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}>
            <MoonStar size={26} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Diese Woche</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{weekTotal} min</div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {getWeekDates().map((date, i) => {
            const item = week.find(w => w.date === date)
            const minutes = item?.minutes || 0
            const done = minutes > 0
            const isToday = date === today
            const alpha = Math.min(0.7, minutes / 30)
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div
                  className="w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                  style={{
                    background: done ? `color-mix(in oklab, var(--accent) ${Math.round(alpha * 100)}%, var(--bg2))` : 'var(--bg2)',
                    border: isToday ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                    color: done ? '#0b0f19' : 'var(--dim)',
                  }}
                  title={`${date}: ${minutes} min`}
                >
                  {done ? minutes : '·'}
                </div>
                <span className="text-[9px] font-semibold" style={{ color: isToday ? 'var(--accent)' : 'var(--dim)' }}>
                  {DAY_LABELS[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {summary7 && (
        <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>7 Tage</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Streak</div>
              <div className="text-xl font-black">{summary7.streak_days || 0}</div>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Mood Δ</div>
              <div className="text-xl font-black">{(summary7.avg_mood_delta ?? 0).toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Days</div>
              <div className="text-xl font-black">{summary7.days_with_sessions || 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays size={15} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Exports</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCsv(7)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold"
            style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}
          >
            <Download size={16} /> 7 Tage CSV
          </button>
          <button
            onClick={() => exportCsv(14)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold"
            style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }}
          >
            <Download size={16} /> 14 Tage CSV
          </button>
        </div>
      </div>
    </div>
  )
}

