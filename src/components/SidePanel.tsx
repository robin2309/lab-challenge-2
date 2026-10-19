import { useState } from 'react'
import { TYPE_COLOR, TYPE_ORDER, type Course, type ResourceType } from '../types'

const COLORS = TYPE_COLOR
const ORDER = TYPE_ORDER
const SHORT: Record<ResourceType, string> = { video: 'Vidéos', rituel: 'Rituels', texte: 'Texte et…', ludo: 'Ludopéda…', atelier: 'Ateliers', langue: 'Langue' }
const CX = 140, CY = 112, R = 96

interface Props {
  course: Course
  onAddLudo: () => void
  onJump: (resourceId: string) => void
  onJumpSession: (sessionId: string) => void
  onGenerate: () => void
  onMove: (resourceId: string, toSessionId: string, index: number) => void
  hoverId: string | null
  selectedId: string | null
  onHover: (id: string | null) => void
  className?: string
  style?: React.CSSProperties
}

export default function SidePanel({ course, onAddLudo, onJump, onJumpSession, onGenerate, onMove, hoverId, selectedId, onHover, className = '', style }: Props) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<{ sid: string; index: number } | null>(null)
  const endDrag = () => { setDragId(null); setOver(null) }
  const drop = () => { if (dragId && over) onMove(dragId, over.sid, over.index); endDrag() }
  const [tab, setTab] = useState<'brief' | 'sommaire'>('sommaire')

  const hoverType = course.sessions.flatMap((x) => x.resources).find((r) => r.id === (hoverId ?? selectedId))?.type
  const totals = ORDER.map((t) => ({
    t, v: course.sessions.flatMap((s) => s.resources).filter((r) => r.type === t && !r.empty).reduce((a, r) => a + r.duration, 0),
  }))
  const sum = totals.reduce((a, x) => a + x.v, 0)

  /* ligne éditoriale : déduite des ressources réellement posées sur la ligne */
  const placed = course.sessions.flatMap((x) => x.resources).filter((r) => !r.empty)
  const count = (f: (r: (typeof placed)[number]) => boolean) => placed.filter(f).length
  const formats = new Set(placed.map((r) => r.type)).size
  const nLudo = count((r) => r.type === 'ludo')
  const nOral = count((r) => r.type === 'atelier' && r.atelier === 'oral')
  const nEcrit = count((r) => r.type === 'atelier' && r.atelier === 'ecrit')
  const filled = course.sessions.filter((x) => x.resources.some((r) => !r.empty))
  const ritualStarts = filled.length >= 2 && filled.every((x) => x.resources.find((r) => !r.empty)?.type === 'rituel')

  let a0 = -Math.PI / 2
  const slices = totals.filter((x) => x.v > 0).map((x) => {
    const ang = (x.v / sum) * Math.PI * 2
    const a1 = a0 + ang
    const large = ang > Math.PI ? 1 : 0
    const d = `M${CX} ${CY} L${CX + R * Math.cos(a0)} ${CY + R * Math.sin(a0)} A${R} ${R} 0 ${large} 1 ${CX + R * Math.cos(a1)} ${CY + R * Math.sin(a1)} Z`
    const mid = (a0 + a1) / 2
    const out = { ...x, d, lx: CX + R * 0.92 * Math.cos(mid), ly: CY + R * 0.92 * Math.sin(mid) }
    a0 = a1
    return out
  })

  return (
    <div className={'panel-wrap ' + (tab === 'brief' ? 'second ' : '') + className} style={style}>
      <div className="panel-tabs">
        <button className={'panel-tab t1' + (tab === 'sommaire' ? ' on' : '')} onClick={() => setTab('sommaire')}>Sommaire</button>
        <button className={'panel-tab t2' + (tab === 'brief' ? ' on' : '')} onClick={() => setTab('brief')}>En bref</button>
      </div>
      <div className="panel-body">
        {tab === 'brief' ? (
          <>
            <h3>Ma composition</h3>
            <div className="pie-box">
              <svg viewBox="0 0 290 224">
                {slices.length === 0 && <circle cx={CX} cy={CY} r={R} fill="#f3e3c8" />}
                {slices.length === 1 && <circle cx={CX} cy={CY} r={R} fill={COLORS[slices[0].t]} />}
                {slices.length > 1 && slices.map((s) => <path key={s.t} d={s.d} fill={COLORS[s.t]} stroke="#f9e2c1" strokeWidth="2" style={{ opacity: hoverType && hoverType !== s.t ? 0.4 : 1, transition: 'opacity .15s' }} />)}
              </svg>
              {slices.map((s) => (
                <span key={s.t} title={`${Math.round((s.v / sum) * 100)} %`} className="pie-label" style={{ ...{ fontWeight: hoverType === s.t ? 700 : undefined }, left: `${(s.lx / 290) * 100}%`, top: `${(s.ly / 224) * 100}%` }}>
                  {SHORT[s.t]}
                </span>
              ))}
            </div>

            <h3>Ma ligne éditoriale</h3>
            <ul>
              {formats >= 4 && <li>Formats variés pour maintenir l’attention des élèves.</li>}
              {nOral >= 2 && <li>Part belle à l’oral, pour entraîner les élèves à s’exprimer.</li>}
              {nEcrit >= 2 && <li>Place importante de l’écrit, recommandée par les programmes.</li>}
              {ritualStarts && <li>Des moments ritualisés, pour structurer les séances et favoriser la mémorisation.</li>}
              {nLudo > 2 ? (
                <li>Ludopédagogie au cœur des apprentissages, pour favoriser la proactivité des élèves.</li>
              ) : (
                <li>Ludopédagogie un peu présente. <button className="link" onClick={onAddLudo}>En ajouter</button></li>
              )}
            </ul>
          </>
        ) : (
          <>
            {course.sessions.map((s, i) => (
              <div key={s.id} onDragOver={(e) => { if (!dragId) return; e.preventDefault(); setOver({ sid: s.id, index: s.resources.length }) }} onDrop={(e) => { e.preventDefault(); drop() }}>
                <button className="summary-session" onClick={() => onJumpSession(s.id)} title="Aller à cette séance">Séance {i + 1} <span>{s.resources.reduce((a, r) => a + r.duration, 0)} min.</span></button>
                {s.resources.length === 0 && <div className={'summary-empty' + (over?.sid === s.id ? ' drop' : '')}>{dragId ? 'Déposer ici' : 'Aucune ressource'}</div>}
                {s.resources.map((r, ri) => (
                  <button key={r.id} draggable onDragStart={(e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id) }} onDragEnd={endDrag}
                    onDragOver={(e) => { if (!dragId) return; e.preventDefault(); e.stopPropagation(); const b = e.currentTarget.getBoundingClientRect(); setOver({ sid: s.id, index: e.clientY < b.top + b.height / 2 ? ri : ri + 1 }) }}
                    className={'summary-item' + (dragId === r.id ? ' dragging' : '') + (over?.sid === s.id && dragId && over.index === ri ? ' drop-before' : '') + (over?.sid === s.id && dragId && over.index === ri + 1 && ri === s.resources.length - 1 ? ' drop-after' : '') + (hoverId === r.id ? ' hot' : '') + (selectedId === r.id ? ' sel' : '') + (r.empty ? ' empty' : '')}
                    onClick={() => onJump(r.id)} onMouseEnter={() => onHover(r.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(r.id)} onBlur={() => onHover(null)}>
                    <span className="grip" aria-hidden>⋮⋮</span><span className="si-title">{r.empty ? 'Emplacement vide' : r.title}</span><span>{r.empty ? '—' : `${r.duration} min.`}</span>
                  </button>
                ))}
              </div>
            ))}
            <div className="gen-sticky">
              <button className="gen-btn" onClick={onGenerate}>
                <span><em>Étape finale</em><b>Générer les supports</b></span>
                <i aria-hidden>→</i>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
