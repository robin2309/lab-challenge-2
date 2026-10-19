import { useEffect, useState } from 'react'
import type { Resource, ResourceType } from '../types'
import { AID_LABEL, TYPE_COLOR } from '../types'
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

const domCache = new Map<string, string>()

/* couleur dominante (moyenne pondérée par la saturation) d'une image locale */
function useDominant(src: string | undefined, fallback: string) {
  const [c, setC] = useState(() => (src && domCache.get(src)) || fallback)
  useEffect(() => {
    if (!src) { setC(fallback); return }
    const hit = domCache.get(src); if (hit) { setC(hit); return }
    let dead = false
    const img = new Image()
    img.onload = () => {
      try {
        const cv = document.createElement('canvas'); cv.width = cv.height = 24
        const ctx = cv.getContext('2d'); if (!ctx) return
        ctx.drawImage(img, 0, 0, 24, 24)
        const d = ctx.getImageData(0, 0, 24, 24).data
        let r = 0, g = 0, b = 0, w = 0
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2])
          const sat = (mx - mn) / (mx || 1), wt = sat * sat + 0.02
          r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt
        }
        const col = `rgb(${Math.round(r / w)},${Math.round(g / w)},${Math.round(b / w)})`
        domCache.set(src, col); if (!dead) setC(col)
      } catch { /* image non lisible : on garde la couleur par défaut */ }
    }
    img.src = src
    return () => { dead = true }
  }, [src, fallback])
  return c
}

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
  pulse?: boolean
  onDropFile: (f: File) => void
}

export default function ResourceCard({ resource: r, left, top, hot, selected, onHover, onSelect, onConsult, onReplace, onClear, onRemove, onDropFile, conflict, pulse }: Props) {
  const [over, setOver] = useState(false)
  const fan = r.aids.slice(0, 3)
  const grain = useDominant(r.empty ? undefined : r.thumb, TYPE_COLOR[r.type])
  return (
    <div
      className={'rcard' + (pulse ? ' gen-pulse' : '') + (conflict ? ' conflict' : '') + (over ? ' dropping' : '') + (hot ? ' hot' : '') + (selected ? ' selected' : '') + (r.empty ? ' empty' : '')}
      data-rid={r.id} style={{ left, top }}
      onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)} onBlur={() => onHover(false)}
      {...(r.empty ? { onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true) }, onDragLeave: () => setOver(false), onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onDropFile(f) } } : {})}
    >
      {!r.empty && <div className="grain-shadow" aria-hidden style={{ color: grain }} />}
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
          <button role="menuitem" ref={(el) => el?.focus({ preventScroll: true })} onClick={onConsult}><IconEdit /> Consulter</button>
          <button role="menuitem" onClick={onReplace}><IconSwap /> Remplacer</button>
          <button role="menuitem" className="danger" onClick={onClear}><IconTrash /> Vider l’emplacement</button>
        </div>
      )}
      {r.empty
        ? <button className="x" onClick={onRemove} aria-label="Retirer cet emplacement" title="Retirer cet emplacement"><IconX size={20} /></button>
        : <><div className="name" style={r.title.length > 30 ? { fontSize: 26 } : undefined}>{r.title}</div><div className="dur">{r.duration} min.</div></>}
    </div>
  )
}
