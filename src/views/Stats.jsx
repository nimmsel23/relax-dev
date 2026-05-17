import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Sparkles } from 'lucide-react'
import { api } from '../api.js'

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10
}

export default function Stats() {
  const [days, setDays] = useState(14)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    api.get(`/stats/summary?days=${days}`).then(d => {
      if (d?.ok) setSummary(d.summary)
      else setSummary(null)
    }).catch(() => setSummary(null))
  }, [days])

  const techniques = useMemo(() => {
    const by = summary?.by_technique || {}
    return Object.entries(by)
      .map(([name, minutes]) => ({ name, minutes: Number(minutes) || 0 }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [summary])

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
            <div className="font-extrabold tracking-tight">Stats</div>
          </div>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border text-sm font-semibold"
            style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <option value={7}>7 Tage</option>
            <option value={14}>14 Tage</option>
            <option value={30}>30 Tage</option>
          </select>
        </div>
      </div>

      {!summary ? (
        <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="font-bold">Keine Daten</div>
          <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Logge Sessions im Tab „Session“, dann erscheinen hier Auswertungen.
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Total</div>
              <div className="text-2xl font-black">{summary.total_minutes || 0} min</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{summary.days_with_sessions || 0} / {summary.days || days} Tage</div>
            </div>
            <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Mood Δ</div>
              <div className="text-2xl font-black">{round1(summary.avg_mood_delta)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Ø Verbesserung pro Item</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Techniken</div>
            </div>
            {techniques.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>Noch keine Technik-Namen erfasst.</div>
            ) : (
              <div className="space-y-2">
                {techniques.slice(0, 12).map(t => (
                  <div key={t.name} className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-semibold truncate">{t.name}</div>
                    <div className="text-xs font-semibold tabular-nums" style={{ color: 'var(--muted)' }}>{t.minutes} min</div>
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--line)' }}>
                      <div className="h-full" style={{ width: `${Math.min(100, (t.minutes / Math.max(1, techniques[0].minutes)) * 100)}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

