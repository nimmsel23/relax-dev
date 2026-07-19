import { api } from './core.js'
import { localToday } from '../shared/utils.js'

// Namensraum "Relax*" ist Absicht: relax-dev embeddet in die vitalos-Shell
// über den globalen '@db'-Alias, dessen Barrel bereits generische Namen wie
// getSession/saveSession/exportCsv als fitness-dev-SSOT vergeben hat.

export async function getRelaxSession(date = localToday()) {
  try {
    const d = await api.get(`/session?date=${date}`)
    return d?.ok && d?.data ? d.data : null
  } catch {
    return null
  }
}

export async function saveRelaxSession(date = localToday(), items = []) {
  await api.post(`/session?date=${date}`, { items })
  return { ok: true }
}

export async function getRelaxTechniques() {
  try {
    const d = await api.get('/techniques')
    return d?.techniques || []
  } catch {
    return []
  }
}

export async function getRelaxStatsSummary(days = 14) {
  try {
    const d = await api.get(`/stats/summary?days=${days}`)
    return d?.summary || null
  } catch {
    return null
  }
}

export async function exportRelaxCsv(days = 14) {
  const d = await api.get(`/export/csv?days=${days}`)
  if (!d?.csv) throw new Error('no csv')
  return { filename: d.filename || `relax-${days}d.csv`, csv: d.csv }
}
