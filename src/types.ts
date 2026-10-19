export type ResourceType = 'texte' | 'video' | 'ludo' | 'rituel' | 'atelier' | 'langue'
export type AtelierMode = 'oral' | 'ecrit'
export type Origin = 'lls' | 'communaute' | 'mine'
export type AidKind = 'questionnaire' | 'definition' | 'correction' | 'projection' | 'imprime' | 'notice'

export interface AidItem { q: string; a?: string }
/** Appareil pédagogique lié à une ressource phare. */
export interface Aid { id: string; kind: AidKind; title: string; items: AidItem[] }

export interface Resource {
  id: string
  type: ResourceType
  title: string
  duration: number // minutes
  thumb?: string
  origin: Origin
  uses: number
  aids: Aid[]
  desc?: string
  source?: string // référence de l'extrait (auteur, œuvre, acte, scène)
  url?: string // lien externe (ex. vidéo en ligne)
  work?: { id: string; label: string } // œuvre étudiée par la ressource (sert à détecter les incohérences)
  rev?: number // ordre de dernière modification : la plus récente fait foi en cas de conflit
  atelier?: AtelierMode // pour les ateliers : oral ou écrit (alimente la ligne éditoriale)
  empty?: boolean // emplacement vidé : la place reste dans la séance
}

export interface Session {
  id: string
  resources: Resource[]
}

export interface Course {
  title: string
  classe: string
  sessionMinutes: number
  sessions: Session[]
}

export const TYPE_LABEL: Record<ResourceType, string> = {
  texte: 'Textes et Images',
  video: 'Vidéos',
  ludo: 'Ludopédagogie',
  rituel: 'Rituels',
  atelier: 'Ateliers',
  langue: 'Langue',
}

export const TYPE_SHORT: Record<ResourceType, string> = {
  texte: 'Texte et images',
  video: 'Vidéos',
  ludo: 'Ludopédagogie',
  rituel: 'Rituels',
  atelier: 'Ateliers',
  langue: 'Langue',
}

/** Couleur de chaque type (légèrement désaturée par rapport à la charte). Sert à la ligne, au graphique, aux onglets et aux ombres. */
export const TYPE_COLOR: Record<ResourceType, string> = {
  texte: '#F9A154',
  video: '#F7D14A',
  ludo: '#9474EE',
  rituel: '#77C6C1',
  atelier: '#6F8FEF',
  langue: '#A3D283',
}
/** Ordre d'affichage des types (onglets, graphique). */
export const TYPE_ORDER: ResourceType[] = ['texte', 'video', 'ludo', 'rituel', 'atelier', 'langue']
/** Gris de la ligne pour un emplacement vide. */
export const EMPTY_COLOR = '#d3c9b8'

export const ORIGIN_LABEL: Record<Origin, string> = { lls: 'LLS', communaute: 'Communauté', mine: 'Ma ressource' }
export const AID_LABEL: Record<AidKind, string> = {
  questionnaire: 'Questionnaire', definition: 'Définitions', correction: 'Correction',
  projection: 'Support à projeter', imprime: 'Support imprimé', notice: 'Notice enseignant',
}
