export type ResourceType = 'texte' | 'video' | 'ludo' | 'rituel'
export type Origin = 'lls' | 'communaute' | 'mine'
export type AidKind = 'questionnaire' | 'definition' | 'correction'

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
  work?: { id: string; label: string } // œuvre étudiée par la ressource (sert à détecter les incohérences)
  rev?: number // ordre de dernière modification : la plus récente fait foi en cas de conflit
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
}

export const TYPE_SHORT: Record<ResourceType, string> = {
  texte: 'Texte et images',
  video: 'Vidéos',
  ludo: 'Ludopédagogie',
  rituel: 'Rituels',
}

export const ORIGIN_LABEL: Record<Origin, string> = { lls: 'LLS', communaute: 'Communauté', mine: 'Ma ressource' }
export const AID_LABEL: Record<AidKind, string> = { questionnaire: 'Questionnaire', definition: 'Définitions', correction: 'Correction' }
