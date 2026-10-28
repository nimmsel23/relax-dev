// Atem-Statistik aus dem normalen Session-Log (Items mit technique/minutes).
// Rein funktional, ohne React/DOM → tests/breath-stats.test.mjs.

const BREATH_RE = /atem|box breathing/i

export function isBreathTechnique(name) {
  return BREATH_RE.test(name || '')
}

/** [{date, items}] → { 'YYYY-MM-DD': Minuten } (nur Atem-Items, nur Tage > 0). */
export function breathByDate(sessions) {
  const out = {}
  for (const s of sessions || []) {
    const min = (s?.items || [])
      .filter((it) => isBreathTechnique(it.technique))
      .reduce((a, it) => a + (Number(it.minutes) || 0), 0)
    if (s?.date && min > 0) out[s.date] = (out[s.date] || 0) + min
  }
  return out
}

function shiftDate(date, days) {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Aktuelle Serie aufeinanderfolgender Atem-Tage. Ist heute noch nichts geloggt,
 * zählt die Serie ab gestern weiter (sie ist erst gerissen, wenn auch gestern fehlt).
 */
export function currentStreak(byDate, today) {
  let day = byDate[today] > 0 ? today : shiftDate(today, -1)
  let n = 0
  while (byDate[day] > 0) {
    n += 1
    day = shiftDate(day, -1)
  }
  return n
}

/** Längste Serie innerhalb der übergebenen Tage. */
export function longestStreak(byDate) {
  const days = Object.keys(byDate).filter((d) => byDate[d] > 0).sort()
  let best = 0
  let run = 0
  let prev = null
  for (const d of days) {
    run = prev && shiftDate(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

/** Minuten der letzten n Tage, ältester zuerst (für Mini-Balken). */
export function lastDays(byDate, today, n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const date = shiftDate(today, i - (n - 1))
    return { date, minutes: byDate[date] || 0 }
  })
}

/** Tageszeit-Empfehlung in Anlehnung an das zirkadiane Theme (VISION.md). */
export function suggestionForHour(hour) {
  if (hour >= 5 && hour < 11) return { patternId: 'activate', reason: 'Morgens: kurz wach werden, ohne Kaffee' }
  if (hour >= 11 && hour < 17) return { patternId: 'box', reason: 'Tagsüber: ruhiger Fokus' }
  if (hour >= 17 && hour < 21) return { patternId: 'long-exhale', reason: 'Abends: Parasympathikus anschalten' }
  return { patternId: '478', reason: 'Nachts: runterfahren zum Einschlafen' }
}
