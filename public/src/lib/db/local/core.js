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

export function isLocalMode() { return true }
export function getUid() { return 'local' }

export function watchAuth(callback) {
  callback?.({ displayName: 'Local Host', email: 'localhost', photoURL: null })
  return () => {}
}
