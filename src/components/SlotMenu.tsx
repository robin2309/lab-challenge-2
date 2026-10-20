import { useEffect, useMemo, useRef, useState } from 'react'
import { TYPE_LABEL, TYPE_COLOR, ORIGIN_LABEL, type ResourceType } from '../types'
import { resolveTitle, type CatalogItem } from '../data/catalog'
import { IconDoc, IconFeather, IconHeart, IconPerson, IconPlay, IconStar, IconSun } from './Icons'
import { FakeThumb } from './ResourceCard'

const TABS: { type: ResourceType; icon: React.ReactElement; color: string }[] = [
  { type: 'texte', icon: <IconDoc />, color: TYPE_COLOR.texte },
  { type: 'video', icon: <IconPlay />, color: TYPE_COLOR.video },
  { type: 'ludo', icon: <IconStar />, color: TYPE_COLOR.ludo },
  { type: 'rituel', icon: <IconSun />, color: TYPE_COLOR.rituel },
  { type: 'atelier', icon: <IconPerson />, color: TYPE_COLOR.atelier },
  { type: 'langue', icon: <IconFeather />, color: TYPE_COLOR.langue },
]

export type SlotMode = 'replace' | 'fill' | 'append'

interface Props {
  mode: SlotMode
  type: ResourceType
  subject: string
  heading: string          // ex. « Remplacer Lecture de texte »
  alternatives: (t: ResourceType) => CatalogItem[]
  /** minutes restantes dans la séance hors ressource remplacée */
  room: number
  onPick: (it: CatalogItem) => void
  onFile: (f: File) => void
  onClose: () => void       // clic en dehors du menu
  className?: string
  style?: React.CSSProperties
}

const VISIBLE = 5

export default function SlotMenu({ mode, type: t0, subject, heading, alternatives, room, onPick, onFile, onClose, className = '', style }: Props) {
  const [type, setType] = useState(t0)
  const [more, setMore] = useState(false)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const root = useRef<HTMLDivElement>(null)
  // fermeture par un clic en dehors du menu. Ne ferment pas : les fenêtres modales ouvertes par-dessus, et les
  // éléments de la ligne qui pilotent eux-mêmes le menu (sinon la ligne se redimensionne sous le curseur et le clic est perdu)
  useEffect(() => {
    const h = (e: PointerEvent) => {
      const el = e.target as Element
      if (root.current?.contains(el) || el.closest?.('.overlay, .rcard, .line-plus, .conflict-bubble, .add-session')) return
      onClose()
    }
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [onClose])
  useEffect(() => { setType(t0); setMore(false) }, [t0, heading])
  const items = useMemo(() => alternatives(type), [alternatives, type])
  const shown = more ? items : items.slice(0, VISIBLE)
  const hidden = items.length - VISIBLE

  return (
    <div ref={root} className={'slotmenu ' + className + (drag ? ' dragging' : '')} style={style} role="dialog" aria-label={heading}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false) }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}>
      {drag && <div className="sm-drop">Déposez votre fichier pour l’ajouter ici</div>}
      {(
        <div className="sm-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.type} role="tab" aria-selected={type === t.type} className={'sm-tab' + (type === t.type ? ' on' : '')} onClick={() => { setType(t.type); setMore(false) }}>
              <span className="lib-ico" style={{ background: t.color }}>{t.icon}</span>{TYPE_LABEL[t.type]}
            </button>
          ))}
        </div>
      )}
      <div className="sm-body">
        <input ref={input} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
        <div className="sm-row">
        <div className={'sm-grid' + (more ? ' more' : '')}>
          {shown.map((it) => {
            const title = resolveTitle(it.title, subject)
            const over = it.duration > room
            return (
              <button key={it.type + it.title} className="sm-card" onClick={() => onPick(it)}>
                <div className="thumb">
                  {it.thumb ? <img src={it.thumb} alt="" /> : <FakeThumb type={it.type} title={title} />}
                  <span className="dur-pill">{it.duration} min.</span>
                  <span className={'origin-pill ' + it.origin}>{ORIGIN_LABEL[it.origin]}</span>
                  {it.origin !== 'mine' && it.uses > 0 && (
                    <span className="uses-pill" title={`Utilisée par ${it.uses.toLocaleString('fr-FR')} enseignants`}><IconHeart />{it.uses.toLocaleString('fr-FR')}</span>
                  )}
                  <span className="add-overlay">{mode === 'replace' ? 'Remplacer par celle-ci' : 'Placer ici'}</span>
                </div>
                <div className="t">{title}</div>
                {/* une seule ligne d'infos : mentions d'abord, puis la source (hauteur identique pour toutes les cartes) */}
                <div className="d">
                  {it.used && <span>Déjà utilisée</span>}
                  {over && <span className="warn">Dépasse la séance</span>}
                  <span>{it.origin === 'mine' ? 'Mes ressources' : (it.source ?? '\u00a0')}</span>
                </div>
              </button>
            )
          })}
          {!more && hidden > 0 && (
            <button className="sm-card more-tile" onClick={() => setMore(true)}>
              <div className="thumb"><span>+{hidden}</span></div>
              <div className="t">Voir plus</div>
              <div className="d">jusqu’à {items.length} ressources</div>
            </button>
          )}
          {items.length === 0 && <div className="lib-empty">Aucune autre ressource de ce type pour cette séance. Ajoutez la vôtre.</div>}
        </div>
        <button className="sm-card sm-import" onClick={() => input.current?.click()} title="Choisir un fichier sur votre ordinateur (ou le glisser sur ce menu)">
          <div className="thumb"><span className="plus" aria-hidden>+</span></div>
          <div className="t">Importer ma ressource</div>
          <div className="d"><span>ou glissez un fichier ici</span></div>
        </button>
        </div>
        {more && <button className="sm-less" onClick={() => setMore(false)}>Voir moins</button>}
      </div>
    </div>
  )
}
