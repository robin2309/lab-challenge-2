import type { Aid, Origin, Resource, ResourceType } from '../types'

let n = 0
export const uid = (p = 'r') => `${p}${Date.now().toString(36)}${(n++).toString(36)}`

export interface CatalogItem {
  type: ResourceType
  title: string // `{s}` = sujet du chapitre
  duration: number
  origin: Origin
  uses: number
  thumb?: string
  tags?: string[]
  work?: string // id d’œuvre
  file?: string // ressource importée depuis l’ordinateur du prof (« Mes ressources »)
}

const T = '/assets/thumb-text.jpg'
const V = '/assets/thumb-video.jpg'
const it = (type: ResourceType, title: string, duration: number, origin: Origin, uses: number, thumb?: string, tags?: string[], work?: string): CatalogItem =>
  ({ type, title, duration, origin, uses, thumb, tags, work })

export const WORKS: Record<string, string> = { scapin: 'Les Fourberies de Scapin', malade: 'Le Malade imaginaire', avare: 'L’Avare' }
const workOf = (id?: string) => (id ? { id, label: WORKS[id] } : undefined)

/** Ressources disponibles pour remplacer / compléter une séance (données de démonstration, ≤ 10 par type). */
export const CATALOG: Record<ResourceType, CatalogItem[]> = {
  texte: [
    it('texte', 'Lecture de texte', 30, 'lls', 412, T, ['lecture']),
    it('texte', 'Lecture : extrait de {s}', 25, 'lls', 238, undefined, ['lecture']),
    it('texte', 'Texte et images', 20, 'lls', 187),
    it('texte', 'Étude de la langue', 25, 'lls', 356, undefined, ['langue']),
    it('texte', 'Écriture courte', 20, 'communaute', 143, undefined, ['écriture']),
    it('texte', 'Bilan express', 10, 'lls', 301, undefined, ['bilan']),
    it('texte', 'Lecture comparée de deux extraits', 30, 'communaute', 96, undefined, ['lecture']),
    it('texte', 'Carte mentale de {s}', 15, 'communaute', 121, undefined, ['bilan']),
    it('texte', 'Vocabulaire en contexte', 15, 'lls', 204, undefined, ['langue']),
    it('texte', 'Lecture d’image : le portrait', 20, 'communaute', 64, undefined, ['image']),
    it('texte', 'Lecture : Les Fourberies de Scapin, acte II', 25, 'lls', 264, undefined, ['théâtre', 'molière'], 'scapin'),
    it('texte', 'Lecture : Le Malade imaginaire, acte I', 25, 'lls', 198, undefined, ['théâtre', 'molière'], 'malade'),
    it('texte', 'Lecture : L’Avare, la cassette', 20, 'communaute', 112, undefined, ['théâtre', 'molière'], 'avare'),
  ],
  video: [
    it('video', 'Courte vidéo', 10, 'lls', 389, V),
    it('video', 'Captation de mise en scène', 15, 'lls', 267, undefined, ['théâtre', 'molière', 'scène']),
    it('video', 'Interview d’un comédien', 8, 'communaute', 154, undefined, ['théâtre', 'comédien']),
    it('video', 'Extrait de film', 12, 'lls', 198, undefined, ['film', 'théâtre']),
    it('video', '{s} en 6 minutes', 6, 'communaute', 322),
    it('video', 'Visite virtuelle d’un lieu', 10, 'lls', 112),
    it('video', 'Lecture théâtralisée filmée', 10, 'communaute', 87, undefined, ['théâtre']),
    it('video', 'Animation : l’histoire en 2 minutes', 6, 'lls', 176),
    it('video', 'Entretien avec un spécialiste', 12, 'communaute', 58),
    it('video', 'Extrait d’archive', 8, 'lls', 73),
    it('video', 'Les Fourberies de Scapin : extrait filmé', 12, 'lls', 287, undefined, ['théâtre', 'molière'], 'scapin'),
    it('video', 'Le Malade imaginaire : extrait filmé', 12, 'lls', 241, undefined, ['théâtre', 'molière'], 'malade'),
    it('video', 'L’Avare : extrait filmé', 10, 'communaute', 133, undefined, ['théâtre', 'molière'], 'avare'),
  ],
  ludo: [
    it('ludo', 'Jeu de société', 15, 'lls', 245),
    it('ludo', 'Quiz par équipes', 10, 'lls', 331),
    it('ludo', 'Escape game littéraire', 25, 'lls', 168, undefined, ['lecture']),
    it('ludo', 'Jeu de rôle', 20, 'communaute', 129, undefined, ['théâtre', 'scène']),
    it('ludo', 'Memory des personnages', 10, 'communaute', 97, undefined, ['théâtre', 'personnages']),
    it('ludo', 'Débat mouvant', 15, 'communaute', 83),
    it('ludo', 'Chasse aux indices', 20, 'lls', 61),
    it('ludo', 'Bataille de vocabulaire', 10, 'communaute', 142, undefined, ['langue']),
  ],
  rituel: [
    it('rituel', 'Mot du jour', 5, 'lls', 504),
    it('rituel', 'Dictée flash', 10, 'lls', 377, undefined, ['langue']),
    it('rituel', 'Rappel de la séance précédente', 5, 'lls', 421),
    it('rituel', 'Lecture à voix haute', 8, 'communaute', 189, undefined, ['lecture', 'théâtre']),
    it('rituel', 'Citation du jour', 5, 'communaute', 133),
    it('rituel', 'Question flash', 5, 'lls', 215),
    it('rituel', 'Respiration et recentrage', 3, 'communaute', 78),
    it('rituel', 'Défi d’orthographe', 7, 'communaute', 102, undefined, ['langue']),
  ],
}

const short = (s: string) => (s.length > 32 ? s.slice(0, 30).trimEnd() + '…' : s)
const fill = (t: string, subject: string) => t.replace('{s}', short(subject || 'le chapitre'))

/** Appareils pédagogiques liés (questionnaire, fiche de définitions, correction), générés pour la démo. */
export function makeAids(type: ResourceType, title: string): Aid[] {
  const a = (kind: Aid['kind'], t: string, items: Aid['items']): Aid => ({ id: uid('a'), kind, title: t, items })
  const q = (x: string) => ({ q: x })
  switch (type) {
    case 'texte':
      return [
        a('questionnaire', 'Questionnaire élève', [
          q('Qui parle, et à qui ?'), q('Quel est le sujet de l’extrait ?'),
          q('Relevez deux mots qui montrent l’émotion du personnage.'), q('Comment ce passage fait-il avancer l’histoire ?'),
        ]),
        a('definition', 'Fiche de définitions', [
          { q: 'Registre', a: 'Ton dominant d’un texte : comique, tragique, lyrique…' },
          { q: 'Champ lexical', a: 'Ensemble de mots qui se rapportent à une même idée.' },
          { q: 'Quiproquo', a: 'Malentendu qui fait prendre une chose ou une personne pour une autre.' },
        ]),
        a('correction', 'Correction', [
          { q: 'Qui parle, et à qui ?', a: 'Le personnage principal s’adresse à son valet.' },
          { q: 'Quel est le sujet ?', a: 'Une dispute au sujet d’une somme d’argent.' },
          { q: 'Deux mots d’émotion', a: '« Colère », « désespoir » (champ lexical des sentiments).' },
          { q: 'Fait avancer l’histoire', a: 'Il déclenche le nœud de l’intrigue.' },
        ]),
      ]
    case 'video':
      return [
        a('questionnaire', 'Questionnaire de visionnage', [
          q('Que voit-on dans les premières secondes ?'), q('Quel détail de mise en scène vous a marqué ?'), q('Résumez la séquence en une phrase.'),
        ]),
        a('correction', 'Correction', [
          { q: 'Premières secondes', a: 'Plan large sur le décor, puis entrée du personnage.' },
          { q: 'Mise en scène', a: 'Les costumes et la lumière marquent le contraste entre les personnages.' },
          { q: 'Résumé', a: 'Réponse libre — vérifier l’ordre des événements.' },
        ]),
      ]
    case 'ludo':
      return [
        a('definition', 'Règle du jeu', [
          { q: 'Mise en place', a: 'Former des équipes de 4 ; distribuer une fiche par équipe.' },
          { q: 'Déroulement', a: 'Chaque équipe répond à tour de rôle ; 1 point par bonne réponse.' },
          { q: 'Fin de partie', a: 'L’équipe totalisant le plus de points gagne.' },
        ]),
        a('correction', 'Corrigé', [
          { q: 'Question 1', a: 'Réponse attendue : la ruse du valet.' }, { q: 'Question 2', a: 'Réponse attendue : l’avarice.' },
        ]),
      ]
    case 'rituel':
      return [
        a('questionnaire', 'Fiche élève', [q('Je note le mot du jour :'), q('Je l’emploie dans une phrase :')]),
        a('correction', 'Correction', [{ q: 'Phrase modèle', a: 'Le mot est employé avec son sens exact et accordé correctement.' }]),
      ]
  }
}

export function makeResource(item: CatalogItem, subject = ''): Resource {
  const title = fill(item.title, subject)
  if (item.origin === 'mine') {
    return { id: uid(), type: item.type, title, duration: item.duration, thumb: item.thumb, origin: 'mine', uses: 0, aids: [], desc: item.file ? `Fichier importé : ${item.file}` : 'Ressource ajoutée par vous.' }
  }
  return {
    id: uid(), type: item.type, title, duration: item.duration, thumb: item.thumb, origin: item.origin, uses: item.uses, work: workOf(item.work),
    aids: makeAids(item.type, title),
    desc: item.origin === 'lls' ? 'Ressource éditée par Le Livre Scolaire.' : 'Partagée par un collègue de la communauté.',
  }
}

/** Ressource LLS construite à la volée (génération mockée). */
export function llsResource(type: ResourceType, title: string, duration: number, thumb?: string, work?: string): Resource {
  const found = CATALOG[type].find((c) => c.title === title)
  return makeResource({ type, title, duration, origin: 'lls', uses: found?.uses ?? 80 + ((title.length * 37) % 220), thumb, work }, '')
}

export const emptySlot = (type: ResourceType, id: string): Resource => ({
  id, type, title: 'Emplacement vide', duration: 0, origin: 'lls', uses: 0, aids: [], empty: true,
})

export const ownResource = (type: ResourceType, title: string, duration: number, note: string): Resource => ({
  id: uid(), type, title, duration, origin: 'mine', uses: 0, aids: [], desc: note || 'Ressource ajoutée par vous.',
})

/**
 * Alternatives proposées pour une séance : même type, hors ressources déjà dans le cours,
 * classées par proximité avec le sujet puis par nombre d’utilisations. Dix au plus.
 */
export function alternativesFor(type: ResourceType, subject: string, taken: Set<string>, currentTitle?: string): CatalogItem[] {
  const words = subject.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿœ]+/).filter((w) => w.length > 3)
  const score = (c: CatalogItem) => {
    const hay = (fill(c.title, subject) + ' ' + (c.tags ?? []).join(' ')).toLowerCase()
    const theatre = /moli[eè]re|th[ée][aâ]tre|scapin|avare/.test(subject.toLowerCase()) && (c.tags ?? []).includes('théâtre') ? 1 : 0
    return (words.filter((w) => hay.includes(w)).length + theatre) * 1000 + c.uses
  }
  return CATALOG[type]
    .filter((c) => { const t = fill(c.title, subject); return t !== currentTitle && !taken.has(t) })
    .sort((x, y) => score(y) - score(x))
    .slice(0, 10)
}
export const resolveTitle = fill

/** Proposition cohérente pour remplacer une ressource devenue incohérente : même type, même œuvre que la ressource de référence. */
export function coherentFor(type: ResourceType, workId: string, taken: Set<string>): CatalogItem | null {
  return CATALOG[type].filter((c) => c.work === workId && !taken.has(c.title)).sort((a, b) => b.uses - a.uses)[0] ?? null
}
