import type { Aid, AidKind, AtelierMode, Origin, Resource, ResourceType } from '../types'

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
  mode?: AtelierMode // ateliers : oral ou écrit
  source?: string // référence de l'extrait
  url?: string // lien externe
  kit?: AidKind[] // documents fournis avec la ressource (ex. escape game)
  pos?: number  // position imposée dans la liste (0 = première)
  used?: boolean // déjà présente dans la ligne
  kitThumbs?: Partial<Record<AidKind, string>> // visuels des documents fournis
  file?: string // ressource importée depuis l’ordinateur du prof (« Mes ressources »)
}

const IMG = '/assets/ressources/'

export const WORKS: Record<string, string> = {
  scapin: 'Les Fourberies de Scapin',
  medecin: 'Le Médecin malgré lui',
  malade: 'Le Malade imaginaire',
}
const workOf = (id?: string) => (id ? { id, label: WORKS[id] } : undefined)

interface Extra { work?: string; source?: string; url?: string; kit?: AidKind[]; kitThumbs?: CatalogItem['kitThumbs']; mode?: AtelierMode; pos?: number; thumb?: string; tags?: string[] }
/** Les durées sont provisoires (non fournies) : à confirmer avec l'équipe éditoriale. */
const it = (type: ResourceType, title: string, duration: number, x: Extra = {}): CatalogItem =>
  ({ type, title, duration, origin: 'lls', uses: fakeUses(type, title), pos: x.pos, thumb: x.thumb, tags: x.tags, work: x.work, mode: x.mode, source: x.source, url: x.url, kit: x.kit, kitThumbs: x.kitThumbs })
const th = ['théâtre', 'molière']
const src = (work: string, act: string) => `Molière, ${WORKS[work]}, ${act}`

/** Ressources proposées par type (liste fournie par l'équipe produit : aucun contenu inventé). */
/** Nombre d’enseignants ayant utilisé la ressource (valeur fictive, stable d’un rendu à l’autre). */
function fakeUses(type: string, title: string): number {
  let h = 7
  for (const ch of type + title) h = (h * 31 + ch.charCodeAt(0)) % 100003
  return 120 + (h % 2300)
}
export const usesLabel = (n: number): string | null =>
  n > 0 ? `Utilisée par ${n.toLocaleString('fr-FR')} enseignant${n > 1 ? 's' : ''}` : null

export const CATALOG: Record<ResourceType, CatalogItem[]> = {
  texte: [
    it('texte', 'Il y a peu de choses qui me soient impossibles', 25, { work: 'scapin', source: src('scapin', 'Acte 1, scène 2'), tags: th, thumb: '/assets/thumb-text.jpg' }),
    it('texte', 'Vous ne le romprez point', 25, { work: 'scapin', source: src('scapin', 'Acte 1, scène 4'), tags: th }),
    it('texte', 'Je vous ai fait quelque chose, monsieur ?', 25, { work: 'scapin', source: src('scapin', 'Acte 2, scène 3'), tags: th }),
    it('texte', 'Que diable allait-il faire dans cette galère ?', 25, { work: 'scapin', source: src('scapin', 'Acte 2, scène 7'), tags: th }),
    // en tête de liste (démo) : remplacer le texte de la séance 1 par celui-ci crée un conflit avec l'entrée de chapitre sur Scapin
    it('texte', 'La comédie de Martine', 25, { work: 'medecin', source: src('medecin', 'Acte 1, scène 4'), tags: th, pos: 0 }),
    it('texte', 'Sganarelle, médecin malgré lui', 25, { work: 'medecin', source: src('medecin', 'Acte 1, scène 5'), tags: th }),
    it('texte', 'L’imposture en action', 25, { work: 'medecin', source: src('medecin', 'Acte 2, scène 4'), tags: th }),
  ],
  video: [
    it('video', 'Entrée de chapitre : Les Fourberies de Scapin', 5, { work: 'scapin', pos: 1, thumb: IMG + 'entree-scapin.jpg', tags: th }),
    it('video', 'Entrée de chapitre : Le Malade imaginaire', 5, { work: 'malade', thumb: IMG + 'entree-malade-imaginaire.jpg', tags: th }),
    it('video', 'Le théâtre au temps de Molière', 8, { tags: th, thumb: IMG + 'theatre-temps-moliere.webp' }),
    it('video', 'Présentation de Molière', 6, { tags: th, thumb: IMG + 'presentation-moliere.png' }),
    it('video', 'Mise en scène du Médecin malgré lui - Acte 1 scène 1', 10, { work: 'medecin', tags: th, thumb: IMG + 'mise-en-scene-medecin-malgre-lui.webp' }),
    it('video', 'Le Monde : Pourquoi Molière est devenu aussi célèbre', 8, { url: 'https://www.youtube.com/watch?v=NeFjybzGbzc', source: 'Le Monde (YouTube)', tags: th, thumb: IMG + 'le-monde-moliere-celebre.webp' }),
  ],
  ludo: [
    it('ludo', 'Jeu à imprimer : Je peux tout expliquer', 20, { thumb: IMG + 'jeu-imprimer-je-peux-tout-expliquer.jpg' }),
    it('ludo', 'Escape game', 30, { kit: ['projection', 'imprime', 'notice'], thumb: IMG + 'escape-support-projeter.jpg' }),
    it('ludo', 'Jeu de carte sur le genre littéraire du théâtre', 15, { tags: ['théâtre'], thumb: IMG + 'carte-genre-theatre.png' }),
    it('ludo', 'Jeu de carte : Champ de bataille lexicale', 15, { thumb: IMG + 'carte-champ-bataille-lexicale.png' }),
    it('ludo', 'Jeu de carte : Notions grammaticales', 15, { thumb: IMG + 'carte-notions-grammaticales.png' }),
  ],
  rituel: [
    it('rituel', 'Dés d’expression', 5, { thumb: IMG + 'des-expression.jpg' }),
    it('rituel', 'Citation du jour', 5, { thumb: IMG + 'citation-du-jour.png' }),
    it('rituel', 'Dictée flash', 10, { thumb: IMG + 'dictee-flash.png' }),
    it('rituel', 'Analyse de phrase', 5),
    it('rituel', 'La figure de style du jour', 5),
  ],
  atelier: [
    it('atelier', 'Atelier oral : mettre en scène un extrait', 25, { mode: 'oral', tags: ['théâtre'] }),
    it('atelier', 'Bilan de lecture', 15),
    it('atelier', 'Atelier d’écriture guidée : écrire une scène de théâtre', 25, { mode: 'ecrit', tags: ['théâtre'] }),
    it('atelier', 'Atelier d’écriture guidée : écrire une tirade', 25, { mode: 'ecrit', tags: ['théâtre'] }),
    it('atelier', 'Atelier oral : Lecture expressive', 15, { mode: 'oral' }),
    it('atelier', 'Atelier oral : Improviser à partir d’une scène', 20, { mode: 'oral', tags: ['théâtre'] }),
    it('atelier', 'Bilan de chapitre : carte mentale', 15),
    it('atelier', 'Bilan de chapitre : Synthèse collective', 15),
  ],
  langue: [
    it('langue', 'Jeu de carte : Champ de bataille lexicale', 15, {}),
    it('langue', 'Jeu de carte : Notions grammaticales', 15, {}),
    it('langue', 'Leçon sur le vocabulaire au théâtre', 20, { tags: ['théâtre'] }),
    it('langue', 'Dictée sur le théâtre', 15, { tags: ['théâtre'] }),
  ],
}

const short = (s: string) => (s.length > 32 ? s.slice(0, 30).trimEnd() + '…' : s)
const fill = (t: string, subject: string) => t.replace('{s}', short(subject || 'le chapitre'))

/** Documents fournis avec une ressource (seuls ceux réellement annoncés : aucun contenu inventé). */
const KIT_TITLE: Partial<Record<AidKind, string>> = { projection: 'Support à projeter', imprime: 'Support imprimé', notice: 'Notice enseignant' }
export function makeAids(type: ResourceType, kit: AidKind[] = [], thumbs: CatalogItem['kitThumbs'] = {}): Aid[] {
  if (kit.length) return kit.map((kind) => ({ id: uid('a'), kind, title: KIT_TITLE[kind] ?? kind, items: [], thumb: thumbs[kind] }))
  return demoAids(type)
}

/** Appareils pédagogiques de démonstration (questionnaire, définitions, correction) pour les ressources sans documents fournis. */
function demoAids(type: ResourceType): Aid[] {
  const a = (kind: AidKind, t: string, items: Aid['items']): Aid => ({ id: uid('a'), kind, title: t, items })
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
    default:
      return []
  }
}

export function makeResource(item: CatalogItem, subject = ''): Resource {
  const title = fill(item.title, subject)
  if (item.origin === 'mine') {
    return { id: uid(), type: item.type, title, duration: item.duration, thumb: item.thumb, origin: 'mine', uses: 0, aids: [], desc: item.file ? `Fichier importé : ${item.file}` : 'Ressource ajoutée par vous.' }
  }
  return {
    id: uid(), type: item.type, title, duration: item.duration, thumb: item.thumb, origin: item.origin, uses: item.uses, work: workOf(item.work), atelier: item.mode,
    aids: makeAids(item.type, item.kit, item.kitThumbs), source: item.source, url: item.url,
    desc: 'Ressource éditée par Le Livre Scolaire.',
  }
}

/** Ressource LLS issue du catalogue (génération mockée). */
export function llsResource(type: ResourceType, title: string): Resource {
  const found = CATALOG[type].find((c) => c.title === title)
  if (!found) throw new Error(`Ressource inconnue du catalogue : ${type} / ${title}`)
  return makeResource(found, '')
}

export const emptySlot = (type: ResourceType, id: string): Resource => ({
  id, type, title: 'Emplacement vide', duration: 0, origin: 'lls', uses: 0, aids: [], empty: true,
})

export const ownResource = (type: ResourceType, title: string, duration: number, note: string): Resource => ({
  id: uid(), type, title, duration, origin: 'mine', uses: 0, aids: [], desc: note || 'Ressource ajoutée par vous.',
})

/**
 * Alternatives proposées pour une séance : même type, dont celles déjà dans la ligne (signalées, placées en fin),
 * classées par proximité avec le sujet.
 */
/** Replace les ressources à position imposée (pos) à leur rang dans la liste. */
function pinned(list: CatalogItem[]): CatalogItem[] {
  const out = list.filter((c) => c.pos === undefined)
  list.filter((c) => c.pos !== undefined).sort((a, b) => a.pos! - b.pos!).forEach((c) => out.splice(Math.min(c.pos!, out.length), 0, c))
  return out
}
export function alternativesFor(type: ResourceType, subject: string, taken: Set<string>, currentTitle?: string): CatalogItem[] {
  const words = subject.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿœ]+/).filter((w) => w.length > 3)
  const score = (c: CatalogItem) => {
    const hay = (fill(c.title, subject) + ' ' + (c.tags ?? []).join(' ')).toLowerCase()
    const theatre = /moli[eè]re|th[ée][aâ]tre|scapin|avare/.test(subject.toLowerCase()) && (c.tags ?? []).includes('théâtre') ? 1 : 0
    return (words.filter((w) => hay.includes(w)).length + theatre) * 1000
  }
  const list = CATALOG[type]
    .filter((c) => fill(c.title, subject) !== currentTitle)
    .map((c) => (taken.has(fill(c.title, subject)) ? { ...c, used: true } : c))
    .sort((x, y) => Number(!!x.used) - Number(!!y.used) || score(y) - score(x))
  return pinned(list)
}
export const resolveTitle = fill

/** Proposition cohérente pour remplacer une ressource devenue incohérente : même type, même œuvre que la ressource de référence. */
export function coherentFor(type: ResourceType, workId: string, taken: Set<string>): CatalogItem | null {
  return CATALOG[type].filter((c) => c.work === workId && !taken.has(c.title)).sort((a, b) => b.uses - a.uses)[0] ?? null
}
