// Standalone: same-origin (Vite-Proxy :5904 → :9123). Embedded in der
// vitalos-Shell setzt der RelaxApp-Wrapper window.__RELAX_API_BASE__ = '/relax-api'.
const BASE = import.meta.env.VITE_API_BASE
  || (typeof window !== 'undefined' && window.__RELAX_API_BASE__)
  || ''

export const api = {
  async get(path) {
    const res = await fetch(BASE + path, { cache: 'no-store' })
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
    return res.json()
  },
  async post(path, data) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
    return res.json()
  }
}

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
