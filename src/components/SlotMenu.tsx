import { useEffect, useMemo, useRef, useState } from 'react'
import { TYPE_LABEL, ORIGIN_LABEL, type ResourceType } from '../types'
import { resolveTitle, type CatalogItem } from '../data/catalog'
import { IconDoc, IconPlay, IconStar, IconSun, IconX } from './Icons'
import { FakeThumb } from './ResourceCard'

const TABS: { type: ResourceType; icon: React.ReactElement; color: string }[] = [
  { type: 'texte', icon: <IconDoc />, color: '#efdc5c' },
  { type: 'video', icon: <IconPlay />, color: '#affacd' },
  { type: 'ludo', icon: <IconStar />, color: '#adf3ee' },
  { type: 'rituel', icon: <IconSun />, color: '#f2e7a3' },
]

export type SlotMode = 'replace' | 'fill' | 'append'

interface Props {
  mode: SlotMode
  type: ResourceType
  subject: string
  heading: string          // ex. « Remplacer Lecture de texte »
  sessionLabel: string     // ex. « séance 2 »
  alternatives: (t: ResourceType) => CatalogItem[]
  /** minutes restantes dans la séance hors ressource remplacée */
  room: number
  onPick: (it: CatalogItem) => void
  onOwn: (t: ResourceType) => void
  onFile: (f: File) => void
  onClose: () => void
  className?: string
  style?: React.CSSProperties
}

const VISIBLE = 4

export default function SlotMenu({ mode, type: t0, subject, heading, sessionLabel, alternatives, room, onPick, onOwn, onFile, onClose, className = '', style }: Props) {
  const [type, setType] = useState(t0)
  const [more, setMore] = useState(false)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { setType(t0); setMore(false) }, [t0, heading])
  const items = useMemo(() => alternatives(type), [alternatives, type])
  const shown = more ? items : items.slice(0, VISIBLE)
  const hidden = items.length - VISIBLE

  return (
    <div className={'slotmenu ' + className + (drag ? ' dragging' : '')} style={style} role="dialog" aria-label={heading}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false) }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}>
      {drag && <div className="sm-drop">Déposez votre fichier pour l’ajouter ici</div>}
      {mode !== 'replace' && (
        <div className="sm-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.type} role="tab" aria-selected={type === t.type} className={'sm-tab' + (type === t.type ? ' on' : '')} onClick={() => { setType(t.type); setMore(false) }}>
              <span className="lib-ico" style={{ background: t.color }}>{t.icon}</span>{TYPE_LABEL[t.type]}
            </button>
          ))}
        </div>
      )}
      <div className="sm-body">
        <div className="sm-head">
          <div className="sm-title">
            <h3>{heading}</h3>
            <p>{mode === 'replace' ? `Autres ${TYPE_LABEL[type].toLowerCase()} adaptés à la ${sessionLabel}` : `${TYPE_LABEL[type]} adaptés à la ${sessionLabel}`}</p>
          </div>
          <input ref={input} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
          <button className="sm-own" onClick={() => input.current?.click()} title="Choisir un fichier sur votre ordinateur (ou le glisser ici)"><span>+</span> Importer ma ressource</button>
          <button className="sm-link" onClick={() => onOwn(type)}>Sans fichier</button>
          <button className="lib-close" onClick={onClose} aria-label="Fermer" title="Fermer (Échap)"><IconX size={16} /></button>
        </div>

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
                  <span className="add-overlay">{mode === 'replace' ? 'Remplacer par celle-ci' : 'Placer ici'}</span>
                </div>
                <div className="t">{title}</div>
                <div className="d"><span title="Nombre d’utilisations">{it.origin === 'mine' ? 'Mes ressources' : `${it.uses} utilisations`}</span>{over && <span className="warn"> · dépasse la séance</span>}</div>
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
        {more && <button className="sm-less" onClick={() => setMore(false)}>Voir moins</button>}
      </div>
    </div>
  )
}
