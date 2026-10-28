// Merkt sich Kategorie/Muster/Vibration des Atem-Tabs (nur per-Gerät-Komfort, Storage kann gesperrt sein).

const LS_KEY = 'relax.breath.v1'

export function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {}
  } catch {
    return {}
  }
}

export function savePrefs(patch) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...loadPrefs(), ...patch }))
  } catch { /* Storage evtl. gesperrt */ }
}
