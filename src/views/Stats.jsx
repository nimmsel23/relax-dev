import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Sparkles, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { getRelaxStatsSummary, getRelaxStatsTrends } from '@db'

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10
}

function shortDate(iso) {
  const [, m, d] = String(iso).split('-')
  return m ? `${m}.${d}.` : iso
}

function corrLabel(r) {
  const a = Math.abs(r)
  if (a >= 0.7) return 'starke Korrelation'
  if (a >= 0.4) return 'mittlere Korrelation'
  if (a >= 0.2) return 'schwache Korrelation'
  return 'kaum Zusammenhang'
}

export default function Stats() {
  const [days, setDays] = useState(14)
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState(null)

  useEffect(() => {
    getRelaxStatsSummary(days).then(s => setSummary(s || null)).catch(() => setSummary(null))
    getRelaxStatsTrends(days).then(t => setTrends(t || null)).catch(() => setTrends(null))
  }, [days])

  const techniques = useMemo(() => {
    const by = summary?.by_technique || {}
    return Object.entries(by)
      .map(([name, minutes]) => ({ name, minutes: Number(minutes) || 0 }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [summary])

  const trendChart = useMemo(() => {
    if (!trends?.per_day) return []
    const rolling = new Map((trends.rolling_7d_minutes || []).map(w => [w.date, w.avg_minutes_7d]))
    return trends.per_day.map(d => ({
      date: shortDate(d.date),
      minuten: d.minutes,
      trend_7d: rolling.get(d.date) ?? null,
      mood_delta: d.avg_mood_delta,
    }))
  }, [trends])

  const ranking = useMemo(() => trends?.technique_ranking || [], [trends])

  const corr = trends?.correlation_minutes_vs_mood_delta
  const hasCorr = Number.isFinite(corr) && (trends?.per_day || []).some(d => d.avg_mood_delta !== null)

  const tooltipStyle = {
    background: 'var(--bg2, #1e1e2e)',
    border: '1px solid var(--line, #45475a)',
    borderRadius: 12,
    fontSize: 12,
    color: 'var(--ink, #cdd6f4)',
  }

  const axisStyle = { fontSize: 11, fill: 'var(--muted, #9399b2)' }

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
            <option value={90}>90 Tage</option>
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

          {trends && trendChart.length > 0 && (
            <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Trend — Minuten & Ø 7 Tage</div>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendChart} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.4} />
                    <XAxis dataKey="date" tick={axisStyle} tickLine={false} interval="preserveStartEnd" />
                    <YAxis yAxisId="m" tick={axisStyle} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="d" orientation="right" domain={[-4, 4]} tick={axisStyle} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--bg2)', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="m" dataKey="minuten" name="Minuten/Tag" fill="var(--accent)" fillOpacity={0.45} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="m" type="monotone" dataKey="trend_7d" name="Ø 7 Tage" stroke="var(--accent)" strokeWidth={2} dot={false} />
                    <Line yAxisId="d" type="monotone" dataKey="mood_delta" name="Mood Δ" stroke="var(--muted)" strokeWidth={1.5} dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {hasCorr && (
                <div className="text-xs mt-2 text-center" style={{ color: 'var(--muted)' }}>
                  Korrelation Minuten ↔ Mood Δ: <span className="font-bold" style={{ color: 'var(--ink)' }}>{corr}</span> ({corrLabel(corr)})
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Techniken</div>
            </div>
            {techniques.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>Noch keine Technik-Namen erfasst.</div>
            ) : (
              <div className="space-y-2">
                {techniques.slice(0, 12).map(t => {
                  const rank = ranking.find(x => x.technique === t.name)
                  return (
                    <div key={t.name} className="flex items-center gap-3">
                      <div className="flex-1 text-sm font-semibold truncate">{t.name}</div>
                      {rank?.avg_mood_delta != null && (
                        <div
                          className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border"
                          style={{
                            color: rank.avg_mood_delta >= 0 ? 'var(--accent)' : 'var(--muted)',
                            borderColor: 'var(--line)',
                          }}
                        >
                          Δ {rank.avg_mood_delta > 0 ? '+' : ''}{rank.avg_mood_delta}
                        </div>
                      )}
                      <div className="text-xs font-semibold tabular-nums" style={{ color: 'var(--muted)' }}>{t.minutes} min</div>
                      <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--line)' }}>
                        <div className="h-full" style={{ width: `${Math.min(100, (t.minutes / Math.max(1, techniques[0].minutes)) * 100)}%`, background: 'var(--accent)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
