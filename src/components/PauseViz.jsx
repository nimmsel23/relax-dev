// PauseViz — Vollbild-Visualisierung für den Stille-Timer.
// Sechs Modi (Buddhabrot, Mandelbrot, Julia, Flow, Mandelbrot-Baum, Atemkreis) plus optionaler Atemring.
// Bei jedem Start würfelt jeder Modus neue Parameter (Zoomziel, Winkel, Farben, Seed), nichts sieht gleich aus.
// Alles Canvas, kein Netzwerk. Fraktale rendern klein und werden per CSS skaliert. Tippen schließt.
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export const VIZ = [
  { id: 'buddha', label: 'Buddhabrot' },
  { id: 'mandelbrot', label: 'Mandelbrot' },
  { id: 'julia', label: 'Julia' },
  { id: 'flow', label: 'Flow' },
  { id: 'tree', label: 'Baum' },
  { id: 'breath', label: 'Atemkreis' },
]

const RES = 140
const TAU = Math.PI * 2
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const ease = (x) => x * x * (3 - 2 * x)
const rr = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ---- Pixel-Fraktale (kurze Seite = RES px) ----------------------------------------------------
function put(d, o, i, maxIter, x, y, phase) {
  if (i === maxIter) {
    d[o] = d[o + 1] = d[o + 2] = 0
  } else {
    const a = phase + TAU * ((i + 1 - Math.log2(Math.log2(x * x + y * y + 1) / 2 + 1)) / 40)
    d[o] = 70 + 70 * Math.sin(a)
    d[o + 1] = 60 + 70 * Math.sin(a + 2.1)
    d[o + 2] = 130 + 110 * Math.sin(a + 4.2)
  }
  d[o + 3] = 255
}

// bekannte, bildschöne Randpunkte der Mandelbrot-Menge
const TARGETS = [
  [-0.743643887037151, 0.13182590420533], // Seepferdchental
  [0.2925755, -0.0149], // Elefantental
  [-0.761574, -0.0847596], // Spirale
  [-0.088, 0.654], // dreifache Spirale
  [-1.75487766624669, 0.0], // Mini-Mandelbrot (Periode 3) auf der Antenne
  [-0.1011, 0.9563], // Seepferdchen-Schweif
]

const mandelbrot = {
  init: () => {
    const [cx, cy] = pick(TARGETS)
    return { cx, cy, end: rr(0.0004, 0.002), phase: rr(0, TAU) }
  },
  draw: (p, w, h, d, o) => {
    const scale = 3 * Math.pow(o.end / 3, p)
    const maxIter = Math.round(60 + 100 * p)
    const unit = scale / Math.min(w, h)
    for (let py = 0; py < h; py++) {
      const y0 = o.cy + (py - h / 2) * unit
      for (let px = 0; px < w; px++) {
        const x0 = o.cx + (px - w / 2) * unit
        let x = 0, y = 0, i = 0
        while (i < maxIter && x * x + y * y <= 4) { const xt = x * x - y * y + x0; y = 2 * x * y + y0; x = xt; i++ }
        put(d, (py * w + px) * 4, i, maxIter, x, y, o.phase)
      }
    }
  },
}

// Julia-Menge, der Parameter wandert ein Stück um einen zufälligen Kreis |c| ~ 0.75
const julia = {
  init: () => ({ a0: rr(0, TAU), dir: pick([-1, 1]), r: rr(0.7, 0.8), sweep: rr(0.6, 1) * TAU, phase: rr(0, TAU) }),
  draw: (p, w, h, d, o) => {
    const a = o.a0 + o.dir * o.sweep * p
    const cx = o.r * Math.cos(a), cy = o.r * Math.sin(a)
    const maxIter = 70
    const unit = 3.2 / Math.min(w, h)
    for (let py = 0; py < h; py++) {
      const y0 = (py - h / 2) * unit
      for (let px = 0; px < w; px++) {
        let x = (px - w / 2) * unit, y = y0, i = 0
        while (i < maxIter && x * x + y * y <= 4) { const xt = x * x - y * y + cx; y = 2 * x * y + cy; x = xt; i++ }
        put(d, (py * w + px) * 4, i, maxIter, x, y, o.phase)
      }
    }
  },
}

function lowRes(viz) {
  return (canvas, vw, vh) => {
    const k = RES / Math.min(vw, vh)
    const w = Math.max(2, Math.round(vw * k)), h = Math.max(2, Math.round(vh * k))
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(w, h)
    const o = viz.init()
    return { interval: 80, frame: (p) => { viz.draw(p, w, h, img.data, o); ctx.putImageData(img, 0, 0) } }
  }
}

// ---- Vollauflösung ----------------------------------------------------------------------------
function fullRes(canvas, vw, vh) {
  let dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (vw * vh * dpr * dpr > 2.5e6) dpr = Math.sqrt(2.5e6 / (vw * vh))
  const w = Math.round(vw * dpr), h = Math.round(vh * dpr)
  canvas.width = w
  canvas.height = h
  return { ctx: canvas.getContext('2d'), w, h, u: Math.min(w, h) / 400 }
}

// Atemring: Box Breathing 4-4-4-4
const PHASES = ['Einatmen', 'Halten', 'Ausatmen', 'Halten']
function drawRing(ctx, w, h, t, hue = 205) {
  const ph = Math.floor(t / 4) % 4, f = (t % 4) / 4
  const e = ph === 0 ? ease(f) : ph === 1 ? 1 : ph === 2 ? 1 - ease(f) : 0
  const m = Math.min(w, h), r = m * (0.1 + 0.22 * e)
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.2, w / 2, h / 2, r * 1.8)
  g.addColorStop(0, 'rgba(255,255,255,0.35)')
  g.addColorStop(0.55, `hsla(${hue},80%,75%,0.18)`)
  g.addColorStop(1, `hsla(${hue},80%,75%,0)`)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(w / 2, h / 2, r * 1.8, 0, TAU); ctx.fill()
  ctx.lineWidth = Math.max(2, m * 0.008)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, TAU); ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = m * 0.02
  ctx.font = `600 ${Math.round(m * 0.045)}px system-ui, sans-serif`
  ctx.fillText(PHASES[ph], w / 2, h / 2 - m * 0.012)
  ctx.font = `400 ${Math.round(m * 0.03)}px system-ui, sans-serif`
  ctx.fillText(String(4 - Math.floor(f * 4)), w / 2, h / 2 + m * 0.03)
  ctx.shadowBlur = 0
}

function setupBreath(canvas, vw, vh) {
  const { ctx, w, h } = fullRes(canvas, vw, vh)
  const hue0 = rr(0, 360), drift = rr(0.08, 0.2)
  return {
    interval: 33,
    frame: (p, t) => {
      const hue = hue0 + 40 * Math.sin(t * drift)
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, `hsl(${hue},45%,12%)`)
      g.addColorStop(1, `hsl(${hue + 30},50%,22%)`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      drawRing(ctx, w, h, t, hue)
    },
  }
}

// Flow Field: Partikel treiben durch ein sich langsam änderndes Strömungsfeld
function setupFlow(canvas, vw, vh) {
  const { ctx, w, h, u } = fullRes(canvas, vw, vh)
  const N = 900
  const hue0 = rr(0, 360), span = rr(60, 150) * pick([-1, 1])
  const freq = rr(0.7, 1.4), ph = [rr(0, TAU), rr(0, TAU), rr(0, TAU)], speed = rr(0.7, 1.4)
  const px = new Float32Array(N), py = new Float32Array(N)
  for (let i = 0; i < N; i++) { px[i] = Math.random() * w; py[i] = Math.random() * h }
  ctx.fillStyle = '#070a14'
  ctx.fillRect(0, 0, w, h)
  return {
    interval: 33,
    frame: (p, t) => {
      ctx.fillStyle = 'rgba(7,10,20,0.07)'
      ctx.fillRect(0, 0, w, h)
      ctx.lineWidth = Math.max(1, 1.2 * u)
      ctx.strokeStyle = `hsla(${hue0 + span * p},75%,68%,0.55)`
      ctx.beginPath()
      const f = freq / (150 * u), s = speed
      for (let i = 0; i < N; i++) {
        const x = px[i], y = py[i]
        const a = (Math.sin(x * f + t * 0.3 * s + ph[0]) + Math.cos(y * f * 1.3 - t * 0.2 * s + ph[1]) + Math.sin((x + y) * f * 0.6 + t * 0.1 * s + ph[2])) * 1.4
        const nx = x + Math.cos(a) * 2 * u, ny = y + Math.sin(a) * 2 * u
        ctx.moveTo(x, y)
        ctx.lineTo(nx, ny)
        if (nx < 0 || nx > w || ny < 0 || ny > h) { px[i] = Math.random() * w; py[i] = Math.random() * h } else { px[i] = nx; py[i] = ny }
      }
      ctx.stroke()
    },
  }
}

// Mandelbrot-Baum (Benoît Mandelbrot, "Fractal Geometry of Nature"): jede Gabelung hat links und rechts
// eigenen Winkel und eigenes Streckenverhältnis -> schief, luftig, windgeformt. Wächst über die Dauer.
// Winkel, Verhältnisse, Spiegelung, Blütenfarbe und Zufallsjitter werden pro Start gewürfelt.
const rnd = (s) => { const v = Math.sin(s * 12.9898) * 43758.5453; return v - Math.floor(v) }
function setupTree(canvas, vw, vh) {
  const { ctx, w, h, u } = fullRes(canvas, vw, vh)
  const DEPTH = 12
  const flip = pick([-1, 1])
  const L = { ang: -rr(0.45, 0.75) * flip, ratio: rr(0.58, 0.68) }
  const R = { ang: rr(0.08, 0.3) * flip, ratio: rr(0.76, 0.82) }
  const bloom = rr(0, 360), jit = rr(0, 1000)
  return {
    interval: 33,
    frame: (p, t) => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#0b1226')
      g.addColorStop(1, '#1d2a3f')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.lineCap = 'round'
      const grow = clamp(p * 1.1) * (DEPTH + 1)
      const branch = (x, y, len, ang, depth, seed) => {
        const lv = clamp(grow - depth)
        if (lv <= 0) return
        const sway = Math.sin(t * 0.7 + depth * 0.5 + seed) * 0.02 * (depth / DEPTH)
        const a = ang + sway, l = len * lv
        const x2 = x + Math.sin(a) * l, y2 = y - Math.cos(a) * l
        const k = depth / DEPTH
        ctx.strokeStyle = `rgb(${Math.round(150 - 70 * k)},${Math.round(105 + 85 * k)},${Math.round(75 + 10 * k)})`
        ctx.lineWidth = Math.max(0.8 * u, (DEPTH - depth) * 1.1 * u)
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke()
        if (depth >= DEPTH || len * L.ratio < 1.2 * u) {
          if (lv >= 1) {
            ctx.fillStyle = `hsla(${bloom + 25 * rnd(seed)},70%,75%,0.7)`
            ctx.beginPath(); ctx.arc(x2, y2, 2.2 * u, 0, TAU); ctx.fill()
          }
          return
        }
        const j = (n) => (rnd(seed + jit + n) - 0.5) * 0.12
        branch(x2, y2, len * L.ratio, a + L.ang + j(1), depth + 1, seed * 2 + 1)
        branch(x2, y2, len * R.ratio, a + R.ang + j(2), depth + 1, seed * 2 + 2)
      }
      branch(w * (flip > 0 ? 0.55 : 0.45), h - 10 * u, Math.min(h * 0.2, w * 0.25), 0, 0, 1)
    },
  }
}

// Buddhabrot (Nebulabrot): statt "entkommt ein Punkt?" werden die Bahnen aller entkommenden Punkte c
// aufsummiert. Um 90° gedreht sitzt eine meditierende Buddha-Figur im Bild und baut sich aus dem Rauschen
// auf. Zufällig pro Start: Sampling-Seed (immer), Fluchtzeit-Grenzen je Farbkanal und Kanal-Zuordnung (Palette).
function setupBuddha(canvas, vw, vh) {
  const k = 260 / Math.min(vw, vh)
  const w = Math.max(2, Math.round(vw * k)), h = Math.max(2, Math.round(vh * k))
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, h)
  const N = w * h
  const chans = [new Uint32Array(N), new Uint32Array(N), new Uint32Array(N)]
  const [L0, L1, MAX] = pick([[20, 100, 400], [30, 120, 480], [40, 160, 600]])
  const MIN = 10 // Schnellflüchter tragen nur Dunst bei
  const perm = [0, 1, 2].sort(() => Math.random() - 0.5) // welcher Zähler in welchen Farbkanal geht
  const ox = new Float32Array(MAX), oy = new Float32Array(MAX)
  const inv = Math.min(w, h) / 2.9
  let seed = (Math.random() * 4294967295) >>> 0 || 1
  const rand = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 }
  const [R, G, B] = chans
  const sample = () => {
    const cx = -2.1 + 2.8 * rand(), cy = 1.3 * rand()
    const q = (cx - 0.25) * (cx - 0.25) + cy * cy
    if (q * (q + cx - 0.25) <= 0.25 * cy * cy) return // Hauptkardioide: entkommt nie
    if ((cx + 1) * (cx + 1) + cy * cy <= 0.0625) return // Periode-2-Knospe
    let x = 0, y = 0, n = 0
    while (n < MAX) {
      const xt = x * x - y * y + cx
      y = 2 * x * y + cy
      x = xt
      ox[n] = x
      oy[n] = y
      n++
      if (x * x + y * y > 4) break
    }
    if (n < MIN || x * x + y * y <= 4) return
    for (let i = 0; i < n; i++) {
      const py = Math.round(h / 2 + (ox[i] + 0.5) * inv)
      if (py < 0 || py >= h) continue
      const dx = oy[i] * inv
      for (const px of [Math.round(w / 2 + dx), Math.round(w / 2 - dx)]) {
        if (px < 0 || px >= w) continue
        const j = py * w + px
        if (n <= L0) R[j]++
        if (n <= L1) G[j]++
        B[j]++
      }
    }
  }
  const d = img.data
  return {
    interval: 33,
    frame: () => {
      const t1 = performance.now() + 14
      do { for (let i = 0; i < 200; i++) sample() } while (performance.now() < t1)
      const m = chans.map((c) => { let v = 1; for (let i = 0; i < N; i++) if (c[i] > v) v = c[i]; return v })
      const s = m.map((v) => 1 / (v * 0.45))
      const b = m.map((v) => v * 0.03) // Schwarzpunkt gegen den Dunst
      for (let i = 0, o = 0; i < N; i++, o += 4) {
        for (let c = 0; c < 3; c++) {
          const src = perm[c]
          d[o + c] = 255 * Math.sqrt(Math.min(1, Math.max(0, chans[src][i] - b[src]) * s[src]))
        }
        d[o + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    },
  }
}

const SETUP = { buddha: setupBuddha, mandelbrot: lowRes(mandelbrot), julia: lowRes(julia), flow: setupFlow, tree: setupTree, breath: setupBreath }

export default function PauseViz({ viz = 'buddha', ring = false, seconds, left, onClose }) {
  const ref = useRef(null)
  const ringRef = useRef(null)
  const showRing = ring && viz !== 'breath'

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !canvas.getContext) return undefined
    const vw = window.innerWidth || 1, vh = window.innerHeight || 1
    const v = (SETUP[viz] || SETUP.buddha)(canvas, vw, vh)
    let rc = null, rw = 0, rh = 0
    const ringHue = rr(0, 360)
    if (showRing && ringRef.current) { const r = fullRes(ringRef.current, vw, vh); rc = r.ctx; rw = r.w; rh = r.h }
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    let raf = 0, last = -1e9
    const draw = (t) => {
      v.frame(clamp(t / seconds), t)
      if (rc) { rc.clearRect(0, 0, rw, rh); drawRing(rc, rw, rh, t, ringHue) }
    }
    if (still) {
      // Standbild: Flow/Buddhabrot bekommen vorab ein paar Schritte, damit etwas zu sehen ist
      for (let i = 0; i < (viz === 'flow' ? 120 : viz === 'buddha' ? 40 : 1); i++) draw(0.8 * seconds + i / 30)
      return undefined
    }
    const loop = (now) => {
      if (now - last >= v.interval) { last = now; draw((now - t0) / 1000) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [viz, showRing, seconds])

  return (
    <div className="pauseviz" role="dialog" aria-label="Stille-Timer" onClick={onClose}>
      <canvas ref={ref} />
      {showRing && <canvas ref={ringRef} className="pauseviz-ring" />}
      <div className="pauseviz-t" aria-live="off">{fmt(left)}</div>
      <button type="button" className="pauseviz-x" aria-label="Schließen" onClick={onClose}><X size={20} /></button>
    </div>
  )
}

function fmt(s) {
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s} s`
}
