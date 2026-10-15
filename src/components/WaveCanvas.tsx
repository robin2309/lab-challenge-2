import { useLayoutEffect, useRef } from 'react'
import { FLAT_Y, INTRO, TIMELINE_TOP, easeOutCubic, frontAt, smooth01 } from '../intro'

/**
 * Trait de la ligne : on réutilise la vraie texture du trait de la maquette (assets/wave-flat.png,
 * bande horizontale extraite du PSD) et on la déroule le long de la courbe, tranche par tranche.
 * Le même moteur dessine la ligne plate de l'écran 1 et la ligne ondulée de l'écran 2,
 * ce qui garantit une continuité parfaite entre les deux écrans.
 */
const SRC_X0 = 300     // zone pleine opacité de la bande (hors fondus de début/fin)
const SRC_X1 = 1600
const SRC_H = 29
const THICKNESS = 27   // épaisseur du trait (px de maquette)
const STRETCH = 1.6    // étirement le long du trait : le dégradé turquoise → vert s'étale comme dans la maquette
const TILE = SRC_X1 - SRC_X0
const SCALE = THICKNESS / SRC_H
const DENSITY = 2

let cachedImg: HTMLImageElement | null = null
let imgPromise: Promise<HTMLImageElement> | null = null
export const preloadLine = () =>
  (imgPromise ??= new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => { cachedImg = i; res(i) }
    i.onerror = rej
    i.src = '/assets/wave-flat.png'
  }))
const withImg = (cb: (i: HTMLImageElement) => void) => (cachedImg ? cb(cachedImg) : void preloadLine().then(cb))

interface Spec {
  from: number; to: number            // fenêtre (en x « monde ») à dessiner
  xStart: number; xEnd: number        // étendue du trait
  startFade: number; endFade: number  // fondus aux deux bouts
  yAt: (x: number) => number          // y local du centre du trait
  height: number
  step?: number
}

function drawLine(ctx: CanvasRenderingContext2D, img: HTMLImageElement, s: Spec) {
  const a = Math.max(s.from - 6, s.xStart)
  const b = Math.min(s.to + 6, s.xEnd)
  if (b <= a) return
  const step = s.step ?? 0.5
  let px = a, py = s.yAt(a)
  while (px < b) {
    const x = Math.min(px + step, b)
    const y = s.yAt(x)
    const dx = x - px, dy = y - py
    const ds = Math.hypot(dx, dy)
    // la texture est indexée sur x (et non sur la longueur de courbe) : elle ne « glisse » pas quand la ligne ondule
    let u = (x / (SCALE * STRETCH)) % (TILE * 2)
    if (u > TILE) u = TILE * 2 - u
    const sx = Math.min(SRC_X1 - 1, SRC_X0 + Math.floor(u))
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(Math.atan2(dy, dx))
    ctx.drawImage(img, sx, 0, 1, SRC_H, 0, -THICKNESS / 2, ds * 1.35 + 0.2, THICKNESS)
    ctx.restore()
    px = x; py = y
  }
  ctx.globalCompositeOperation = 'destination-out'
  if (s.startFade > 0) {
    const g = ctx.createLinearGradient(s.xStart, 0, s.xStart + s.startFade, 0)
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(s.xStart - 8, 0, s.startFade + 8, s.height)
  }
  if (s.endFade > 0) {
    const g = ctx.createLinearGradient(s.xEnd - s.endFade, 0, s.xEnd, 0)
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = g
    ctx.fillRect(s.xEnd - s.endFade, 0, s.endFade + 8, s.height)
  }
  ctx.globalCompositeOperation = 'source-over'
}

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
      withImg((img) => {
        cv.width = Math.round(w * DENSITY); cv.height = BAND * DENSITY
        const ctx = cv.getContext('2d')!
        ctx.setTransform(DENSITY, 0, 0, DENSITY, 0, 0)
        drawLine(ctx, img, {
          from: 0, to: w, xStart: 0, xEnd: w, startFade: FLAT_START_FADE, endFade: FLAT_END_FADE,
          yAt: () => BAND / 2, height: BAND, step: 1,
        })
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
}

export default function WaveCanvas({ width, viewW, height, cy, amp, firstX, spacing, intro }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const cv = ref.current!
    const k = width > 4500 ? 1 : DENSITY
    let raf = 0
    let cancelled = false
    const base = FLAT_Y - TIMELINE_TOP // niveau de la ligne plate de l'écran 1, dans le repère de la timeline
    const waveAt = (x: number) => cy + amp * Math.cos((Math.PI * (x - firstX)) / spacing)
    const START_X = 56 // le trait démarre franchement sous le panneau latéral (qui commence à x = 32)

    const finalDraw = (img: HTMLImageElement) => {
      cv.width = Math.round(width * k); cv.height = Math.round(height * k)
      const ctx = cv.getContext('2d')!
      ctx.setTransform(k, 0, 0, k, 0, 0)
      drawLine(ctx, img, { from: 0, to: width, xStart: START_X, xEnd: width, startFade: 0, endFade: 220, yAt: waveAt, height })
    }

    withImg((img) => {
      if (cancelled) return
      if (!intro) { finalDraw(img); return }

      cv.width = Math.round(width * k); cv.height = Math.round(height * k)
      const ctx = cv.getContext('2d')!
      const slab = Math.min(width, viewW + 12)
      const t0 = performance.now()
      const frame = () => {
        if (cancelled) return
        const t = (performance.now() - t0) / 1000
        if (t >= INTRO.end) { finalDraw(img); return }
        const ext = easeOutCubic((t - INTRO.extendStart) / INTRO.extendDur)
        const front = frontAt(t, viewW)
        const yAt = (x: number) => base + smooth01((front - x) / INTRO.ramp) * (waveAt(x) - base)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, slab * k, height * k)
        ctx.setTransform(k, 0, 0, k, 0, 0)
        drawLine(ctx, img, {
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
    })
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [width, viewW, height, cy, amp, firstX, spacing, intro])

  return <canvas ref={ref} style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none' }} />
}
