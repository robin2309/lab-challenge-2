/**
 * Chorégraphie de l'apparition de la ligne (écran 2). Temps en secondes depuis l'arrivée sur l'écran.
 *  1. la ligne ondulée, dans ses couleurs, se trace de gauche à droite sur la largeur de l'écran
 *  2. les ressources apparaissent ensuite une à une en fondu, de gauche à droite
 */
export const INTRO = {
  drawStart: 0.1,  // début du tracé
  drawDur: 1.5,    // durée du tracé, de gauche à droite de l'écran
  resStart: 1.5,   // première ressource (le tracé finit de traverser l'écran)
  resSpread: 1.6,  // durée sur laquelle les ressources visibles se succèdent
  end: 3.8,        // fin de la séquence (tout est en place)
}

/** y (maquette) du centre de la ligne plate de l'écran 1. */
export const FLAT_Y = 571

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const smooth01 = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t) }
export const easeInOut = (v: number) => -(Math.cos(Math.PI * clamp01(v)) - 1) / 2
export const easeOutCubic = (v: number) => 1 - Math.pow(1 - clamp01(v), 3)

/** Instant où une ressource située en x apparaît : l'une après l'autre, de gauche à droite. */
export function appearAt(x: number, viewW: number): number {
  const p = clamp01((x - 400) / Math.max(1, viewW - 400))
  return INTRO.resStart + p * INTRO.resSpread
}
