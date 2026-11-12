// Store-/Produkt-Build (Play-Store-Closed-Test): Owner-Inhalte (Entspannungstrainer-Ausbildung,
// Physio-Simulation, Substanz-Katalog) sind dort ausgeblendet. Owner-Builds bleiben unverändert.
// Dieselbe Erkennung wie die Shell (NavigationItems.js STORE_BUILD).
const env = import.meta.env || {}

export const STORE = ['store', 'observe', 'operate'].includes(env.VITE_VOS_EDITION) || env.VITE_VOS_PRODUCT_BUILD === '1'

// Tabs, die ein frischer Nutzer im Store-Build bekommt (Reihenfolge = Anzeige).
export const STORE_TABS = ['dash', 'atem', 'session', 'journal', 'stats']
export const STORE_HIDDEN_TABS = ['ausbildung', 'physio', 'catalog']

export function isTabHidden(id, store = STORE) {
  return store && STORE_HIDDEN_TABS.includes(id)
}

// Tab-Beschriftung: im Store-Build deutsch.
export const STORE_LABELS = { stats: 'Statistik' }
export function tabLabel(id, label, store = STORE) {
  return (store && STORE_LABELS[id]) || label
}
