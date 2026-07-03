// relax-dev Service Worker
// v1: static cache + network-first navigations + auto-update flow

const CACHE = 'relax-v2'

const STATIC = [
  '/',
  '/index.html',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('message', e => {
  if (!e.data) return
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting()
  if (e.data.type === 'GET_VERSION' && e.source) {
    e.source.postMessage({ type: 'VERSION', version: CACHE })
  }
})

self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (req.method !== 'GET') return

  // Navigations → network-first, app-shell fallback
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r.ok) {
            const copy = r.clone()
            caches.open(CACHE).then(c => c.put('/index.html', copy))
          }
          return r
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Hashed assets → cache-first, runtime fill
  e.respondWith((async () => {
    const cached = await caches.match(req)
    if (cached) return cached
    try {
      const fresh = await fetch(req)
      if (fresh.ok) {
        const copy = fresh.clone()
        caches.open(CACHE).then(c => c.put(req, copy))
      }
      return fresh
    } catch {
      return caches.match('/index.html')
    }
  })())
})
