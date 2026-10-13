export function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function getWeekDates() {
  const today = localToday()
  const d = new Date(today + 'T12:00:00')
  const off = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - off)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`
  })
}

export function lastDates(days) {
  const base = new Date(localToday() + 'T12:00:00')
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
}

export function sumMinutes(session) {
  return (session?.items || []).reduce((a, it) => a + (Number(it.minutes) || 0), 0)
}

export const TECHNIQUES = [
  { id: 'breath-4-7-8', name: 'Atemübung 4-7-8' },
  { id: 'box-breath',   name: 'Box Breathing (4-4-4-4)' },
  { id: 'nsdr',         name: 'NSDR / Yoga Nidra' },
  { id: 'bodyscan',     name: 'Body Scan' },
  { id: 'pmr',          name: 'Progressive Muskelrelaxation (PMR)' },
  { id: 'meditation',   name: 'Meditation (Achtsamkeit)' },
  { id: 'stretch',      name: 'Stretching / Mobility' },
  { id: 'walk',         name: 'Spaziergang (low stress)' },
  { id: 'music',        name: 'Musik + Atmung' },
]

export function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function computeSummary(sessionsByDate, days) {
  const dates = lastDates(days)
  const byTechnique = {}
  const perDay = []
  let moodDeltaSum = 0, moodDeltaCount = 0, daysWithSessions = 0

  for (const date of dates) {
    const sess = sessionsByDate[date] || null
    const minutes = sumMinutes(sess)
    if (minutes > 0) daysWithSessions++
    perDay.push({ date, minutes })

    for (const it of (sess?.items || [])) {
      const technique = String(it.technique || '').trim() || '—'
      byTechnique[technique] = (byTechnique[technique] || 0) + (Number(it.minutes) || 0)
      const before = Number(it.mood_before), after = Number(it.mood_after)
      if (Number.isFinite(before) && Number.isFinite(after)) { moodDeltaSum += after - before; moodDeltaCount++ }
    }
  }

  let streak = 0
  for (const { minutes } of perDay) { if (minutes > 0) streak++; else break }

  return {
    days,
    total_minutes: perDay.reduce((a, d) => a + (d.minutes || 0), 0),
    days_with_sessions: daysWithSessions,
    streak_days: streak,
    avg_mood_delta: moodDeltaCount ? (moodDeltaSum / moodDeltaCount) : 0,
    by_technique: byTechnique,
    per_day: perDay,
  }
}
