import type { Course, Resource, ResourceType } from '../types'
import { llsResource, uid } from './catalog'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const r = (type: ResourceType, title: string, duration: number, thumb?: string, work?: string): Resource => llsResource(type, title, duration, thumb, work)

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
  const sessions = moliere
    ? [
        [
          r('rituel', 'Mot du jour', 5),
          r('video', 'Courte vidéo', 10, '/assets/thumb-video.jpg', 'scapin'),
          r('texte', 'Lecture de texte', 30, '/assets/thumb-text.jpg', 'scapin'),
        ],
        [
          r('rituel', 'Rappel de la séance précédente', 5),
          r('texte', 'Étude de la langue', 25),
          r('ludo', 'Jeu de société', 15),
        ],
        [
          r('video', 'Captation de mise en scène', 15, undefined, 'scapin'),
          r('texte', 'Bilan express', 10),
        ],
      ]
    : [
        [
          r('rituel', 'Mot du jour', 5),
          r('video', 'Courte vidéo d’ouverture', 10, '/assets/thumb-video.jpg'),
          r('texte', `Lecture : ${title}`, 30, '/assets/thumb-text.jpg'),
        ],
        [
          r('rituel', 'Rappel de la séance précédente', 5),
          r('texte', 'Étude de la langue', 25),
          r('ludo', 'Quiz par équipes', 10),
        ],
        [
          r('texte', 'Écriture courte', 20),
          r('texte', 'Bilan express', 10),
        ],
      ]

  return {
    title,
    classe,
    sessionMinutes: 55,
    sessions: sessions.map((resources) => ({ id: uid('s'), resources })),
  }
}
