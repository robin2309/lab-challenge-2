import type { Course, Resource, ResourceType } from '../types'
import { llsResource, uid } from './catalog'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Sujet du chapitre de démonstration (le seul couvert par le catalogue). */
export const DEMO_SUBJECT = 'Le théâtre de Molière'

const r = (type: ResourceType, title: string): Resource => llsResource(type, title)

/**
 * Faux générateur : à remplacer par un appel API (LLM) plus tard.
 * Même signature que la future version : brief + classe -> plan de séances.
 */
export async function generateCourse(_subject: string, classe: string): Promise<Course> {
  await wait(500)
  // Démo partagée : le catalogue ne couvre que le théâtre de Molière, donc quel que soit le sujet saisi,
  // tout le monde obtient ce chapitre (l'écran 1 le signale sous le champ « sujet »).
  const sessions: Resource[][] = [
    [r('rituel', 'Citation du jour'), r('video', 'Entrée de chapitre : Les Fourberies de Scapin'), r('texte', 'Il y a peu de choses qui me soient impossibles')],
    [r('rituel', 'Dictée flash'), r('langue', 'Leçon sur le vocabulaire au théâtre'), r('ludo', 'Jeu à imprimer : Je peux tout expliquer')],
    [r('video', 'Le théâtre au temps de Molière'), r('atelier', 'Bilan de lecture')],
  ]

  return {
    title: DEMO_SUBJECT,
    classe,
    sessionMinutes: 55,
    sessions: sessions.map((resources) => ({ id: uid('s'), resources })),
  }
}
