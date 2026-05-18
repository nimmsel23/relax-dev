import { useState, useEffect } from 'react'
import { Activity, BookOpen, MoonStar, BarChart3, Zap, Beaker, Clock } from 'lucide-react'
import Dashboard from './views/Dashboard.jsx'
import Session from './views/Session.jsx'
import Journal from './views/Journal.jsx'
import Stats from './views/Stats.jsx'
import PhysioTimeline from './views/PhysioTimeline.jsx'
import SubstanceCatalog from './views/SubstanceCatalog.jsx'
import { useCircadianTheme } from './hooks/useCircadianTheme.js'

const TABS = [
  { id: 'dash',    label: 'Heute',    Icon: Activity },
  { id: 'session', label: 'Session',  Icon: MoonStar },
  { id: 'journal', label: 'Journal',  Icon: BookOpen },
  { id: 'stats',   label: 'Stats',    Icon: BarChart3 },
  { id: 'physio',  label: 'Physio',   Icon: Zap },
  { id: 'catalog', label: 'Catalog',  Icon: Beaker },
]

export default function App() {
  const [tab, setTab] = useState('dash')
  const { theme, setManualTheme, resetToCircadian, manualOverride, currentSchedule } = useCircadianTheme()

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    if (manualOverride) {
      resetToCircadian()
    } else {
      const themes = ['mocha', 'macchiato', 'frappe', 'latte']
      const currentIdx = themes.indexOf(theme)
      const nextIdx = (currentIdx + 1) % themes.length
      setManualTheme(themes[nextIdx])
    }
  }

  const View = { dash: Dashboard, session: Session, journal: Journal, stats: Stats, physio: PhysioTimeline, catalog: SubstanceCatalog }[tab]

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* Topbar */}
      <header style={{ background: 'var(--glass)', borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}
        className="flex items-center justify-between px-4 py-2.5 z-20 shrink-0">
        <div className="flex items-center gap-2 font-extrabold text-base tracking-tight">
          <MoonStar size={22} style={{ color: 'var(--accent)' }} />
          Relax
        </div>
        <button
          onClick={toggleTheme}
          title={manualOverride ? 'Manual override active (click to reset)' : `Circadian mode: ${currentSchedule?.name || theme}`}
          className="text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5"
          style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--muted)' }}
        >
          {manualOverride ? (
            <>
              <Clock size={14} />
              {theme.slice(0, 3).toUpperCase()}
            </>
          ) : (
            currentSchedule?.name || '🌓'
          )}
        </button>
      </header>

      {/* View */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={tab === 'physio' || tab === 'catalog' ? 'h-full flex flex-col' : 'max-w-2xl mx-auto px-4 py-4 pb-28'}>
          <View />
        </div>
      </main>

      {/* Bottom nav */}
      <nav style={{ background: 'var(--glass)', borderTop: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}
        className="flex shrink-0 px-2 pb-safe z-20">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold tracking-wide transition-all"
            style={{ color: tab === id ? 'var(--accent)' : 'var(--dim)', background: 'none', border: 'none' }}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
