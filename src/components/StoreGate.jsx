import { STORE } from '../lib/edition.js'

/**
 * Store-Build: Owner-Bereiche (Ausbildungsmodul, Physio-Simulation, Katalog) sind nicht Teil
 * des Nutzerprodukts. Falls die Shell-Subnav noch darauf zeigt, erscheint statt des Inhalts
 * ein freundlicher Rückweg. Owner-Builds rendern die View unverändert.
 */
export function storeGated(View) {
  if (!STORE) return View
  return function Gated({ onNavigate }) {
    return (
      <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="font-bold">Dieser Bereich ist in dieser Version nicht verfügbar</div>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Starte stattdessen mit einer kurzen Atemübung.</p>
        <button
          onClick={() => onNavigate?.('atem')}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: 'var(--accent)', color: '#0b0f19' }}
        >
          Zu den Atemübungen
        </button>
      </div>
    )
  }
}
