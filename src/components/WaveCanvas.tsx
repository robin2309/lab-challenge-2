import { useLayoutEffect, useRef } from 'react'
import { FLAT_Y, INTRO, TIMELINE_TOP, amplitudeAt, easeInOut, easeOutCubic, reducedMotion } from '../intro'
import { TYPE_COLOR } from '../types'

/**
 * Trait de la ligne : un ruban lisse d'épaisseur constante (sans texture), rempli d'un dégradé
 * horizontal dont les couleurs viennent des types de ressources posés sur chaque emplacement
 * (blanc tant qu'un emplacement est vide).
 */
const THICKNESS = 27   // épaisseur du trait (px de maquette)
const DENSITY = 2

export interface ColorStop { x: number; color: string }
export const LINE_EMPTY = '#ffffff' // emplacement ou séance sans ressource (et base de la ligne de l'écran 1)

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b)
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`
}

interface Spec {
  from: number; to: number            // fenêtre (en x « monde ») à dessiner
  xStart: number; xEnd: number        // étendue du trait
  startFade: number; endFade: number  // fondus aux deux bouts
  yAt: (x: number) => number          // y local du centre du trait
  height: number
  stops: ColorStop[]                  // couleurs le long de x
  gw: number                          // largeur logique de la zone de dessin (pour le dégradé)
  mix?: number                        // 0 = tout blanc, 1 = couleurs finales (apparition progressive)
  step?: number
  half?: (x: number) => number        // demi-épaisseur du trait en x (défaut : constante)
}

function drawLine(ctx: CanvasRenderingContext2D, s: Spec) {
  const a = Math.max(s.from - 6, s.xStart)
  const b = Math.min(s.to + 6, s.xEnd)
  if (b <= a) return
  const step = s.step ?? 1
  const up: [number, number][] = [], down: [number, number][] = []
  for (let x = a; ; x = Math.min(x + step, b)) {
    const y0 = s.yAt(x), y1 = s.yAt(x + 0.5)
    const nx = -(y1 - y0), ny = 0.5, nl = Math.hypot(nx, ny)
    const ux = nx / nl, uy = ny / nl // normale (vers le bas)
    const h = s.half ? s.half(x) : THICKNESS / 2
    up.push([x - ux * h, y0 - uy * h])
    down.push([x + ux * h, y0 + uy * h])
    if (x >= b) break
  }
  ctx.beginPath()
  ctx.moveTo(up[0][0], up[0][1])
  for (const [x, y] of up) ctx.lineTo(x, y)
  for (let i = down.length - 1; i >= 0; i--) ctx.lineTo(down[i][0], down[i][1])
  ctx.closePath()
  const g = ctx.createLinearGradient(0, 0, s.gw, 0)
  const mix = s.mix ?? 1
  const stops = s.stops.length ? s.stops : [{ x: 0, color: LINE_EMPTY }]
  let last = -1
  for (const st of stops) {
    const p = Math.min(1, Math.max(last, st.x / s.gw)); last = p
    g.addColorStop(p, mix >= 1 ? st.color : mixHex(LINE_EMPTY, st.color, mix))
  }
  ctx.fillStyle = g
  ctx.fill()

  ctx.globalCompositeOperation = 'destination-out'
  if (s.startFade > 0) {
    const f = ctx.createLinearGradient(s.xStart, 0, s.xStart + s.startFade, 0)
    f.addColorStop(0, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = f
    ctx.fillRect(s.xStart - 8, 0, s.startFade + 8, s.height)
  }
  if (s.endFade > 0) {
    const f = ctx.createLinearGradient(s.xEnd - s.endFade, 0, s.xEnd, 0)
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = f
    ctx.fillRect(s.xEnd - s.endFade, 0, s.endFade + 8, s.height)
  }
  ctx.globalCompositeOperation = 'source-over'
}

/** conservé pour l'API existante : plus rien à précharger (la ligne n'utilise plus de texture) */
export const preloadLine = () => Promise.resolve()

/* ------------------------------------------------------------------ */
/* Écran 1 : la ligne plate, pleine largeur                            */
/* ------------------------------------------------------------------ */
export const FLAT_START_FADE = 160
export const FLAT_END_FADE = 200
const BAND = 180 // hauteur du canvas : laisse la place à l’onde et au halo de l’impulsion

/* Au repos, la ligne est blanche et plate. Régulièrement, une impulsion la traverse de gauche à droite :
   sur son passage, la ligne s'anime en forme d'onde (front raide, traîne qui s'amortit), s'épaissit,
   prend les couleurs des types de ressources (orange → jaune → vert → turquoise → bleu → violet) et
   s'entoure d'un halo. Pendant la génération (busy), l'impulsion s'éteint : la ligne arrive blanche et plate,
   état de départ de l'apparition de l'écran 2. */
const PULSE_EVERY = 3.8     // s entre deux départs d'impulsion
const PULSE_TRAVEL = 2.6    // s pour traverser la ligne
const PULSE_FRONT = 160     // px : front raide…
const PULSE_TAIL = 420      // px : … et traîne longue
const WAVE_AMP = 26         // px : amplitude maximale de l'onde
const WAVE_LEN = 170        // px : longueur d'onde (reste assez grande pour que le ruban ne se replie pas)
const WAVE_SPEED = 2.4      // oscillations par seconde sous l'enveloppe
const SWELL = 0.4           // épaississement maximal du trait au cœur de l'impulsion
const SETTLE = 600          // ms : extinction de l'impulsion quand la génération démarre
const PULSE_COLORS = [TYPE_COLOR.texte, TYPE_COLOR.video, TYPE_COLOR.langue, TYPE_COLOR.rituel, TYPE_COLOR.atelier, TYPE_COLOR.ludo].map(hex)

/** position du cœur de l'impulsion (null entre deux passages) ; vitesse un peu plus vive au milieu */
function pulseCenter(t: number, w: number): number | null {
  const p = (t % PULSE_EVERY) / PULSE_TRAVEL
  if (p > 1) return null
  const e = 0.55 * p + 0.45 * easeInOut(p)
  return -3 * PULSE_FRONT + (w + 3 * PULSE_TAIL + 3 * PULSE_FRONT) * e
}
/** enveloppe de l'impulsion en x (0 → 1), asymétrique */
const envelope = (x: number, c: number | null) => {
  if (c === null) return 0
  const d = x - c, sg = d > 0 ? PULSE_FRONT : PULSE_TAIL
  return Math.exp(-(d * d) / (2 * sg * sg))
}
/** couleur du dégradé de l'impulsion en x : orange en queue, violet en tête */
function pulseRGB(x: number, c: number): number[] {
  const u = Math.min(1, Math.max(0, (x - (c - 2.4 * PULSE_TAIL)) / (2.4 * PULSE_TAIL + 1.6 * PULSE_FRONT))) * (PULSE_COLORS.length - 1)
  const i = Math.min(PULSE_COLORS.length - 2, Math.floor(u)), f = u - i
  return PULSE_COLORS[i].map((v, j) => v + (PULSE_COLORS[i + 1][j] - v) * f)
}
const WHITE = [255, 255, 255]
const lerpRGB = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/** halo coloré autour de l'impulsion : quelques traits larges et translucides superposés */
function drawHalo(ctx: CanvasRenderingContext2D, w: number, c: number, k: number, yAt: (x: number) => number) {
  const a = Math.max(0, c - 2.6 * PULSE_TAIL), b = Math.min(w, c + 2.6 * PULSE_FRONT)
  if (b <= a) return
  ctx.beginPath()
  for (let x = a; x <= b; x += 2) x === a ? ctx.moveTo(x, yAt(x)) : ctx.lineTo(x, yAt(x))
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const [width, alpha] of [[3.2, 0.06], [2.3, 0.09], [1.6, 0.13]]) {
    const g = ctx.createLinearGradient(a, 0, b, 0)
    for (let x = a; ; x = Math.min(x + 24, b)) {
      const [r, gg, bb] = pulseRGB(x, c)
      g.addColorStop((x - a) / (b - a), `rgba(${r | 0},${gg | 0},${bb | 0},${(alpha * envelope(x, c) * k).toFixed(3)})`)
      if (x >= b) break
    }
    ctx.strokeStyle = g
    ctx.lineWidth = THICKNESS * width
    ctx.stroke()
  }
}

export function FlatLine({ busy }: { busy?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const busySince = useRef<number | null>(null)
  if (busy && busySince.current === null) busySince.current = performance.now()
  if (!busy) busySince.current = null

  useLayoutEffect(() => {
    const cv = ref.current!
    let raf = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      const w = cv.clientWidth
      if (!w) return
      if (cv.width !== Math.round(w * DENSITY)) { cv.width = Math.round(w * DENSITY); cv.height = BAND * DENSITY }
      const t = (now - t0) / 1000
      const k = busySince.current === null ? 1 : 1 - easeInOut((now - busySince.current) / SETTLE)
      const c = pulseCenter(t, w)
      const env = (x: number) => envelope(x, c) * k
      const yAt = (x: number) => BAND / 2 + WAVE_AMP * env(x) * Math.sin(2 * Math.PI * (x / WAVE_LEN - t * WAVE_SPEED))
      const stops: ColorStop[] = []
      for (let x = 0; ; x = Math.min(x + 12, w)) {
        const e = env(x)
        stops.push({ x, color: c === null || e < 0.004 ? LINE_EMPTY : `rgb(${lerpRGB(WHITE, pulseRGB(x, c), Math.pow(e, 0.6)).join(',')})` })
        if (x >= w) break
      }
      const ctx = cv.getContext('2d')!
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.setTransform(DENSITY, 0, 0, DENSITY, 0, 0)
      if (c !== null && k > 0) drawHalo(ctx, w, c, k, yAt)
      drawLine(ctx, {
        from: 0, to: w, xStart: 0, xEnd: w, startFade: FLAT_START_FADE, endFade: FLAT_END_FADE,
        yAt, height: BAND, step: 1, stops, gw: w, half: (x) => (THICKNESS / 2) * (1 + SWELL * env(x)),
      })
    }
    if (reducedMotion()) {
      draw(t0)
      const ro = new ResizeObserver(() => draw(t0))
      ro.observe(cv)
      return () => ro.disconnect()
    }
    const frame = (now: number) => { draw(now); raf = requestAnimationFrame(frame) }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <canvas
      ref={ref} className={'abs' + (busy ? ' line-busy' : '')}
      style={{ left: 0, top: FLAT_Y - BAND / 2, width: '100%', height: BAND, pointerEvents: 'none' }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Écran 2 : la ligne ondulée de la timeline                           */
/* ------------------------------------------------------------------ */
interface Props {
  width: number          // largeur totale de la timeline
  viewW: number          // largeur visible
  height: number
  cy: number; amp: number; firstX: number; spacing: number
  intro: boolean
  stops: ColorStop[]
}

export default function WaveCanvas({ width, viewW, height, cy, amp, firstX, spacing, intro, stops }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const cv = ref.current!
    const k = width > 4500 ? 1 : DENSITY
    let raf = 0
    let cancelled = false
    const base = FLAT_Y - TIMELINE_TOP // niveau de la ligne plate de l'écran 1, dans le repère de la timeline
    const waveAt = (x: number) => cy + amp * Math.cos((Math.PI * (x - firstX)) / spacing)
    const START_X = 56 // le trait démarre franchement sous le panneau latéral (qui commence à x = 32)

    const finalDraw = () => {
      cv.width = Math.round(width * k); cv.height = Math.round(height * k)
      const ctx = cv.getContext('2d')!
      ctx.setTransform(k, 0, 0, k, 0, 0)
      drawLine(ctx, { from: 0, to: width, xStart: START_X, xEnd: width, startFade: 0, endFade: 220, yAt: waveAt, height, stops, gw: width })
    }

    {
      if (!intro) { finalDraw(); return }

      cv.width = Math.round(width * k); cv.height = Math.round(height * k)
      const ctx = cv.getContext('2d')!
      const slab = Math.min(width, viewW + 12)
      const t0 = performance.now()
      const frame = () => {
        if (cancelled) return
        const t = (performance.now() - t0) / 1000
        if (t >= INTRO.end) { finalDraw(); return }
        const ext = easeOutCubic((t - INTRO.extendStart) / INTRO.extendDur)
        const amt = amplitudeAt(t)
        const yAt = (x: number) => base + amt * (waveAt(x) - base)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, slab * k, height * k)
        ctx.setTransform(k, 0, 0, k, 0, 0)
        drawLine(ctx, {
          stops, gw: width, mix: Math.min(1, Math.max(0, amt)),
          from: 0, to: slab,
          xStart: START_X * ext,
          xEnd: viewW + (width - viewW) * ext,
          startFade: FLAT_START_FADE * (1 - ext),
          endFade: FLAT_END_FADE + (220 - FLAT_END_FADE) * ext,
          yAt, height, step: 1,
        })
        raf = requestAnimationFrame(frame)
      }
      frame()
    }
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [width, viewW, height, cy, amp, firstX, spacing, intro, stops])

  return <canvas ref={ref} style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none' }} />
}
