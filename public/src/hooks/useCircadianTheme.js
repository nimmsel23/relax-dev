import { useState, useEffect } from 'react'
import { api } from '../api'

const CIRCADIAN_SCHEDULE = [
  { start: 6, end: 12, theme: 'latte', name: '🌅 Morning' },
  { start: 12, end: 17, theme: 'frappe', name: '☀️ Afternoon' },
  { start: 17, end: 21, theme: 'macchiato', name: '🌆 Evening' },
  { start: 21, end: 6, theme: 'mocha', name: '🌙 Night' }
]

function getCircadianTheme() {
  const hour = new Date().getHours()
  const schedule = CIRCADIAN_SCHEDULE.find(s => {
    if (s.start < s.end) {
      return hour >= s.start && hour < s.end
    } else {
      // Wraps around midnight (21-6)
      return hour >= s.start || hour < s.end
    }
  })
  return schedule?.theme || 'mocha'
}

export function useCircadianTheme() {
  const [theme, setTheme] = useState(getCircadianTheme())
  const [manualOverride, setManualOverride] = useState(false)

  // Load saved preference on mount
  useEffect(() => {
    api.get('/theme').then(d => {
      if (d?.manual_theme) {
        setTheme(d.manual_theme)
        setManualOverride(true)
      }
    }).catch(() => {})
  }, [])

  // Auto-update theme every minute (if no manual override)
  useEffect(() => {
    if (manualOverride) return

    const checkTheme = () => {
      const newTheme = getCircadianTheme()
      setTheme(newTheme)
    }

    const interval = setInterval(checkTheme, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [manualOverride])

  const setManualTheme = (newTheme) => {
    setTheme(newTheme)
    setManualOverride(true)
    api.post('/theme', { theme: newTheme, manual_theme: newTheme }).catch(() => {})
  }

  const resetToCircadian = () => {
    setManualOverride(false)
    const circadianTheme = getCircadianTheme()
    setTheme(circadianTheme)
    api.post('/theme', { theme: circadianTheme, manual_theme: null }).catch(() => {})
  }

  const getCurrentSchedule = () => {
    const hour = new Date().getHours()
    return CIRCADIAN_SCHEDULE.find(s => {
      if (s.start < s.end) {
        return hour >= s.start && hour < s.end
      } else {
        return hour >= s.start || hour < s.end
      }
    })
  }

  return {
    theme,
    setManualTheme,
    resetToCircadian,
    manualOverride,
    currentSchedule: getCurrentSchedule(),
    allThemes: CIRCADIAN_SCHEDULE
  }
}
