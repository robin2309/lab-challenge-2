import type { Course, Resource, ResourceType } from '../types'
import { emptySlot, llsResource, uid } from './catalog'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const r = (type: ResourceType, title: string): Resource => llsResource(type, title)
const e = (type: ResourceType): Resource => emptySlot(type, uid())

/**
 * Faux générateur : à remplacer par un appel API (LLM) plus tard.
 * Même signature que la future version : brief + classe -> plan de séances.
 */
export async function generateCourse(subject: string, classe: string): Promise<Course> {
  await wait(500)
  const s = subject.trim()
  const key = s.toLowerCase()
  const title = s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Nouveau chapitre'

  const moliere = /moli[eè]re|th[ée][aâ]tre|scapin|avare/.test(key)
  // Le catalogue ne couvre que le théâtre de Molière : pour tout autre sujet, on ne propose aucun faux contenu,
  // seulement les ressources génériques (rituels) et des emplacements vides à remplir.
  const sessions: Resource[][] = moliere
    ? [
        [r('rituel', 'Citation du jour'), r('video', 'Entrée de chapitre : Les Fourberies de Scapin'), r('texte', 'Il y a peu de choses qui me soient impossibles')],
        [r('rituel', 'Dictée flash'), r('langue', 'Leçon sur le vocabulaire au théâtre'), r('ludo', 'Jeu à imprimer : Je peux tout expliquer')],
        [r('video', 'Le théâtre au temps de Molière'), r('atelier', 'Bilan de lecture')],
      ]
    : [
        [r('rituel', 'Citation du jour'), e('video'), e('texte')],
        [r('rituel', 'Dictée flash'), e('langue'), e('ludo')],
        [e('atelier'), e('atelier')],
      ]

  return {
    title,
    classe,
    sessionMinutes: 55,
    sessions: sessions.map((resources) => ({ id: uid('s'), resources })),
  }
}
