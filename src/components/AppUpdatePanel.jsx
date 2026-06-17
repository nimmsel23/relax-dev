import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function AppUpdatePanel() {
  const [version, setVersion] = useState(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const sw = navigator.serviceWorker
    const onMsg = (e) => { if (e.data?.type === 'VERSION') setVersion(e.data.version) }
    sw.addEventListener('message', onMsg)
    if (sw.controller) sw.controller.postMessage({ type: 'GET_VERSION' })
    const reg = window.__swRegistration
    if (reg?.waiting) setUpdateReady(true)
    const onUpdate = () => setUpdateReady(true)
    window.addEventListener('sw-update-available', onUpdate)
    return () => {
      sw.removeEventListener('message', onMsg)
      window.removeEventListener('sw-update-available', onUpdate)
    }
  }, [])

  async function check() {
    setChecking(true)
    try {
      const reg = window.__swRegistration || await navigator.serviceWorker?.getRegistration()
      if (reg) await reg.update()
      if (reg?.waiting) setUpdateReady(true)
    } catch {}
    setTimeout(() => setChecking(false), 600)
  }

  function apply() {
    const reg = window.__swRegistration
    if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    else window.location.reload()
  }

  return (
    <section
      className="rounded-2xl p-4 grid gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
    >
      <header className="flex items-center gap-2">
        <RefreshCw size={16} className={checking ? 'animate-spin' : ''} style={{ color: 'var(--accent)' }} />
        <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>App Version</h3>
      </header>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--dim)' }}>Installiert</span>
        <code className="font-mono" style={{ color: 'var(--accent)' }}>{version || '—'}</code>
      </div>
      {updateReady && (
        <div
          className="text-[10px] font-bold uppercase tracking-widest text-center px-3 py-2 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'rgb(252,211,77)' }}
        >
          Update bereit
        </div>
      )}
      {updateReady ? (
        <button
          onClick={apply}
          className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          Jetzt aktualisieren & neu laden
        </button>
      ) : (
        <button
          onClick={check}
          disabled={checking}
          className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-colors"
          style={{ background: 'var(--glass)', border: '1px solid var(--line)', color: 'var(--muted)' }}
        >
          {checking ? 'Suche Update…' : 'Auf Update prüfen'}
        </button>
      )}
    </section>
  )
}
