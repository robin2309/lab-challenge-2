/**
 * Chorégraphie de l'apparition de la ligne (écran 2). Temps en secondes depuis l'arrivée sur l'écran.
 *  1. la ligne plate de l'écran 1 s'allonge (ses fondus de bout s'écartent)
 *  2. elle se met à onduler : une vague d'amplitude progresse de gauche à droite
 *  3. chaque ressource apparaît en fondu quand l'ondulation l'a atteinte
 */
export const INTRO = {
  extendStart: 0.15,
  extendDur: 0.95,
  undStart: 1.0,
  undDur: 2.5,
  ramp: 300,       // largeur (px) sur laquelle l'amplitude monte progressivement
  frontFrom: -150, // position de départ du front d'ondulation (hors écran à gauche : l'onde entre par la gauche)
  end: 4.3,        // fin de la séquence (tout est en place)
}

/** y (maquette) du centre de la ligne plate de l'écran 1 : l'écran 2 en part pour onduler. */
export const FLAT_Y = 571
/** haut de la zone de timeline (sous la barre de navigation) */
export const TIMELINE_TOP = 91

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const smooth01 = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t) }
export const easeOutCubic = (v: number) => 1 - Math.pow(1 - clamp01(v), 3)
const easeInOutSine = (v: number) => -(Math.cos(Math.PI * clamp01(v)) - 1) / 2

/** Position du front d'ondulation à l'instant t. */
export const frontAt = (t: number, viewW: number) =>
  INTRO.frontFrom + easeInOutSine((t - INTRO.undStart) / INTRO.undDur) * (viewW + INTRO.ramp + 100 - INTRO.frontFrom)

/** Instant où une ressource située en x doit apparaître (le front l'a dépassée aux 2/3 de la rampe). */
export function appearAt(x: number, viewW: number): number {
  const target = x + INTRO.ramp * 0.66
  const tMax = INTRO.undStart + INTRO.undDur
  if (frontAt(tMax, viewW) < target) return tMax - 0.2
  let lo = INTRO.undStart, hi = tMax
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (frontAt(mid, viewW) >= target) hi = mid; else lo = mid
  }
  return hi
}
