import { useState } from 'react'
import type { Resource, ResourceType } from '../types'
import { AID_LABEL } from '../types'
import { IconEdit, IconSwap, IconTrash, IconX, TypeIcon } from './Icons'

export const FakeThumb = ({ type, title }: { type: ResourceType; title?: string }) => (
  <div className={'fake-thumb ' + type}>
    {type === 'texte' ? (
      <>
        <b className="sheet-title">{title}</b>
        <i className="sheet-line" style={{ width: '82%' }} /><i className="sheet-line" style={{ width: '70%' }} />
        <i className="sheet-line" style={{ width: '78%' }} /><i className="sheet-line" style={{ width: '52%' }} />
      </>
    ) : (
      <>
        <TypeIcon type={type} />
        {title && <span>{title}</span>}
      </>
    )}
  </div>
)

interface Props {
  resource: Resource
  left: number
  top: number
  hot: boolean
  selected: boolean
  onHover: (on: boolean) => void
  onSelect: () => void
  onConsult: () => void
  onReplace: () => void
  onClear: () => void
  onRemove: () => void
  conflict?: boolean
  onDropFile: (f: File) => void
}

export default function ResourceCard({ resource: r, left, top, hot, selected, onHover, onSelect, onConsult, onReplace, onClear, onRemove, onDropFile, conflict }: Props) {
  const [over, setOver] = useState(false)
  const fan = r.aids.slice(0, 3)
  return (
    <div
      className={'rcard' + (conflict ? ' conflict' : '') + (over ? ' dropping' : '') + (hot ? ' hot' : '') + (selected ? ' selected' : '') + (r.empty ? ' empty' : '')}
      data-rid={r.id} style={{ left, top }}
      onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)} onBlur={() => onHover(false)}
      {...(r.empty ? { onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true) }, onDragLeave: () => setOver(false), onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onDropFile(f) } } : {})}
    >
      {!r.empty && (
        <div className="fan" aria-hidden>
          {fan.map((a, i) => (
            <div key={a.id} className={'aid-sheet k-' + a.kind} style={{ ['--i' as string]: i, ['--n' as string]: fan.length }}>
              <b>{AID_LABEL[a.kind]}</b>
              <i /><i style={{ width: '70%' }} /><i style={{ width: '82%' }} />
            </div>
          ))}
        </div>
      )}
      <button className="thumb" onClick={onSelect} aria-pressed={selected} aria-haspopup={r.empty ? undefined : 'menu'} title={r.empty ? 'Choisir une ressource' : 'Sélectionner la ressource'}>
        {r.empty
          ? <div className="empty-slot"><span className="plus-big">+</span><span>Placez ou créez une ressource</span></div>
          : r.thumb ? <img src={r.thumb} alt="" /> : <FakeThumb type={r.type} title={r.title} />}
      </button>
      {conflict && <span className="conflict-badge">⚠ Incohérent</span>}
      {selected && !r.empty && (
        <div className="cmenu" role="menu" aria-label={`Actions pour ${r.title}`}>
          <button role="menuitem" autoFocus onClick={onConsult}><IconEdit /> Consulter</button>
          <button role="menuitem" onClick={onReplace}><IconSwap /> Remplacer</button>
          <button role="menuitem" className="danger" onClick={onClear}><IconTrash /> Vider l’emplacement</button>
        </div>
      )}
      {r.empty
        ? <button className="x" onClick={onRemove} aria-label="Retirer cet emplacement" title="Retirer cet emplacement"><IconX size={20} /></button>
        : <><div className="name">{r.title}</div><div className="dur">{r.duration} min.</div></>}
    </div>
  )
}
