import { lazy, Suspense, useState, useEffect } from 'react'
import { Activity, BookOpen, MoonStar, BarChart3, Zap, Beaker, Clock, Settings2, Wind, GraduationCap, MoreHorizontal } from 'lucide-react'
import { useCircadianTheme } from './hooks/useCircadianTheme.js'

const Dashboard = lazy(() => import('./views/Dashboard.jsx'))
const Session = lazy(() => import('./views/Session.jsx'))
const Breath = lazy(() => import('./views/Breath.jsx'))
const Journal = lazy(() => import('./views/Journal.jsx'))
const Stats = lazy(() => import('./views/Stats.jsx'))
const PhysioTimeline = lazy(() => import('./views/PhysioTimeline.jsx'))
const SubstanceCatalog = lazy(() => import('./views/SubstanceCatalog.jsx'))
const Settings = lazy(() => import('./views/Settings.jsx'))
const Ausbildung = lazy(() => import('./views/Ausbildung.jsx'))

const PRIMARY_TABS = [
  { id: 'dash', label: 'Heute', Icon: Activity },
  { id: 'ausbildung', label: 'Modul', Icon: GraduationCap },
  { id: 'session', label: 'Praxis', Icon: MoonStar },
  { id: 'atem', label: 'Atem', Icon: Wind },
]

const MORE_TABS = [
  { id: 'journal', label: 'Journal', Icon: BookOpen },
  { id: 'stats', label: 'Stats', Icon: BarChart3 },
  { id: 'physio', label: 'Physio', Icon: Zap },
  { id: 'catalog', label: 'Catalog', Icon: Beaker },
  { id: 'settings', label: 'Einstellungen', Icon: Settings2 },
]
const TAB_IDS = [...PRIMARY_TABS, ...MORE_TABS].map(item => item.id)
const VIEWS = { dash: Dashboard, session: Session, atem: Breath, ausbildung: Ausbildung, journal: Journal, stats: Stats, physio: PhysioTimeline, catalog: SubstanceCatalog, settings: Settings }
function tabFromHash() {
  const routeTab = window.location.hash.replace(/^#/, '').split('/')[0]
  return TAB_IDS.includes(routeTab) ? routeTab : null
}

export default function App() {
  const [tab, setTab] = useState(() => {
    const hashTab = tabFromHash()
    if (hashTab) return hashTab
    return window.location.port === '9124' ? 'catalog' : 'ausbildung'
  })
  const [moreOpen, setMoreOpen] = useState(false)
  const { theme, setManualTheme, resetToCircadian, manualOverride, currentSchedule } = useCircadianTheme()

  useEffect(() => {
    const onHashChange = () => {
      setTab(tabFromHash() || (window.location.port === '9124' ? 'catalog' : 'ausbildung'))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  function toggleTheme() {
    if (manualOverride) resetToCircadian()
    else {
      const themes = ['mocha', 'macchiato', 'frappe', 'latte']
      setManualTheme(themes[(themes.indexOf(theme) + 1) % themes.length])
    }
  }

  function navigate(nextTab) {
    setTab(nextTab)
    setMoreOpen(false)
    if (window.location.hash !== `#${nextTab}`) window.location.hash = nextTab
  }

  const View = VIEWS[tab]
  const secondaryActive = MORE_TABS.some(item => item.id === tab)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <header style={{ background: 'var(--glass)', borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }} className="flex items-center justify-between px-4 py-2.5 z-20 shrink-0">
        <div className="flex items-center gap-2 font-extrabold text-sm tracking-tight sm:text-base"><MoonStar size={22} style={{ color: 'var(--accent)' }} />Entspannungstrainer</div>
        <button onClick={toggleTheme} title={manualOverride ? 'Manual override active (click to reset)' : `Circadian mode: ${currentSchedule?.name || theme}`} className="text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5" style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          {manualOverride ? <><Clock size={14} />{theme.slice(0, 3).toUpperCase()}</> : currentSchedule?.name || '🌓'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={tab === 'physio' || tab === 'catalog' ? 'h-full flex flex-col' : 'max-w-2xl mx-auto px-4 py-4 pb-28'}>
          <Suspense fallback={<div role="status" className="rounded-2xl border p-4 text-sm" style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--muted)' }}>Bereich wird geladen …</div>}><View onNavigate={navigate} /></Suspense>
        </div>
      </main>

      {moreOpen && <>
        <button aria-label="Mehr-Menü schließen" onClick={() => setMoreOpen(false)} className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.18)' }} />
        <div className="fixed inset-x-3 z-40 grid grid-cols-2 gap-2 rounded-2xl border p-3 shadow-2xl" style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))', background: 'var(--glass)', borderColor: 'var(--line)', backdropFilter: 'blur(20px)' }}>
          {MORE_TABS.map(({ id, label, Icon }) => <button key={id} onClick={() => navigate(id)} className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold" style={{ background: tab === id ? 'var(--accent-glow)' : 'var(--card)', borderColor: tab === id ? 'var(--accent)' : 'var(--line)', color: tab === id ? 'var(--accent)' : 'var(--ink)' }}><Icon size={18} />{label}</button>)}
        </div>
      </>}

      <nav aria-label="Hauptnavigation" style={{ background: 'var(--glass)', borderTop: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }} className="flex shrink-0 px-2 pb-safe z-50">
        {PRIMARY_TABS.map(({ id, label, Icon }) => {
          const isActive = tab === id
          return <button key={id} onClick={() => navigate(id)} aria-current={isActive ? 'page' : undefined} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold tracking-wide transition-all" style={{ color: isActive ? 'var(--accent)' : 'var(--dim)', background: 'none', border: 'none' }}>
            <span className="flex items-center justify-center rounded-full transition-all" style={{ width: 34, height: 26, background: isActive ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent' }}><Icon size={20} /></span>{label}
          </button>
        })}
        <button onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold tracking-wide transition-all" style={{ color: moreOpen || secondaryActive ? 'var(--accent)' : 'var(--dim)', background: 'none', border: 'none' }}>
          <span className="flex items-center justify-center rounded-full" style={{ width: 34, height: 26, background: moreOpen || secondaryActive ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent' }}><MoreHorizontal size={20} /></span>Mehr
        </button>
      </nav>
    </div>
  )
}
