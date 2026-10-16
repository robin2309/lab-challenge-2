/**
 * Chorégraphie de l'apparition de la ligne (écran 2). Temps en secondes depuis l'arrivée sur l'écran.
 *  1. la ligne plate de l'écran 1 s'allonge (ses fondus de bout s'écartent)
 *  2. sur toute sa longueur à la fois, elle passe de droite à sinusoïdale : les pics montent (léger rebond)
 *  3. les ressources apparaissent ensuite une à une en fondu, de gauche à droite
 */
export const INTRO = {
  extendStart: 0.15,
  extendDur: 0.95,
  undStart: 0.9,
  undDur: 1.9,
  resStart: 2.1,   // première ressource
  resSpread: 1.6,  // durée sur laquelle les ressources visibles se succèdent
  end: 4.4,        // fin de la séquence (tout est en place)
}

/** y (maquette) du centre de la ligne plate de l'écran 1 : l'écran 2 en part pour onduler. */
export const FLAT_Y = 571
/** haut de la zone de timeline (sous la barre de navigation) */
export const TIMELINE_TOP = 91

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const smooth01 = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t) }
export const easeInOut = (v: number) => -(Math.cos(Math.PI * clamp01(v)) - 1) / 2
export const easeOutCubic = (v: number) => 1 - Math.pow(1 - clamp01(v), 3)

/** Facteur d'amplitude (0 = ligne plate, 1 = sinusoïde) : tous les pics montent ensemble, avec un léger rebond. */
export function amplitudeAt(t: number): number {
  const v = clamp01((t - INTRO.undStart) / INTRO.undDur)
  const c1 = 0.8, c3 = c1 + 1
  return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2) // easeOutBack
}

/** Instant où une ressource située en x apparaît : l'une après l'autre, de gauche à droite. */
export function appearAt(x: number, viewW: number): number {
  const p = clamp01((x - 400) / Math.max(1, viewW - 400))
  return INTRO.resStart + p * INTRO.resSpread
}
