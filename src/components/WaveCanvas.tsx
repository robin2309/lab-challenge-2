import { useLayoutEffect, useRef } from 'react'
import { FLAT_Y, INTRO, TIMELINE_TOP, amplitudeAt, easeOutCubic } from '../intro'

/**
 * Trait de la ligne : un ruban d'épaisseur légèrement irrégulière (sans texture), rempli d'un dégradé
 * horizontal dont les couleurs viennent des types de ressources posés sur chaque emplacement
 * (gris tant qu'un emplacement est vide).
 */
const THICKNESS = 27   // épaisseur moyenne du trait (px de maquette)
const DENSITY = 2

export interface ColorStop { x: number; color: string }
export const LINE_GREY = '#d3c9b8'

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b)
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`
}

/** épaisseur et décalage vertical irréguliers (déterministes, indexés sur x : le trait ne « glisse » pas quand la ligne ondule) */
const wobble = (x: number) => 1 + 0.08 * Math.sin(x / 23 + 0.4) + 0.045 * Math.sin(x / 9.7 + 1.3) + 0.04 * Math.sin(x / 41 + 2.1)
const jitter = (x: number) => 0.8 * Math.sin(x / 17 + 2) + 0.4 * Math.sin(x / 6.3)
const grain = (x: number, k: number) => { const v = Math.sin(x * 12.9898 + k * 78.233) * 43758.5453; return (v - Math.floor(v) - 0.5) * 1.1 }

interface Spec {
  from: number; to: number            // fenêtre (en x « monde ») à dessiner
  xStart: number; xEnd: number        // étendue du trait
  startFade: number; endFade: number  // fondus aux deux bouts
  yAt: (x: number) => number          // y local du centre du trait
  height: number
  stops: ColorStop[]                  // couleurs le long de x
  gw: number                          // largeur logique de la zone de dessin (pour le dégradé)
  mix?: number                        // 0 = tout gris, 1 = couleurs finales (apparition progressive)
  step?: number
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
    const h = (THICKNESS * wobble(x)) / 2
    const cy = y0 + jitter(x)
    up.push([x - ux * (h + grain(x, 1)), cy - uy * (h + grain(x, 1))])
    down.push([x + ux * (h + grain(x, 2)), cy + uy * (h + grain(x, 2))])
    if (x >= b) break
  }
  ctx.beginPath()
  ctx.moveTo(up[0][0], up[0][1])
  for (const [x, y] of up) ctx.lineTo(x, y)
  for (let i = down.length - 1; i >= 0; i--) ctx.lineTo(down[i][0], down[i][1])
  ctx.closePath()
  const g = ctx.createLinearGradient(0, 0, s.gw, 0)
  const mix = s.mix ?? 1
  const stops = s.stops.length ? s.stops : [{ x: 0, color: LINE_GREY }]
  let last = -1
  for (const st of stops) {
    const p = Math.min(1, Math.max(last, st.x / s.gw)); last = p
    g.addColorStop(p, mix >= 1 ? st.color : mixHex(LINE_GREY, st.color, mix))
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
const BAND = 120

export function FlatLine({ busy }: { busy?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const cv = ref.current!
    const draw = () => {
      const w = cv.clientWidth
      if (!w) return
      cv.width = Math.round(w * DENSITY); cv.height = BAND * DENSITY
      const ctx = cv.getContext('2d')!
      ctx.setTransform(DENSITY, 0, 0, DENSITY, 0, 0)
      drawLine(ctx, {
        from: 0, to: w, xStart: 0, xEnd: w, startFade: FLAT_START_FADE, endFade: FLAT_END_FADE,
        yAt: () => BAND / 2, height: BAND, step: 1, stops: [{ x: 0, color: LINE_GREY }], gw: w,
      })
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(cv)
    return () => ro.disconnect()
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
