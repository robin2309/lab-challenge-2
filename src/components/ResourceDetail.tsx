import { useState } from 'react'
import { AID_LABEL, ORIGIN_LABEL, TYPE_LABEL, type Resource } from '../types'
import { IconX, TypeIcon } from './Icons'
import { FakeThumb } from './ResourceCard'

interface Props {
  resource: Resource
  onClose: () => void
  onReplace: () => void
  onOwn: () => void
}

export default function ResourceDetail({ resource: r, onClose, onReplace, onOwn }: Props) {
  const [corr, setCorr] = useState(false)
  const aids = r.aids.filter((a) => corr || a.kind !== 'correction')
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="detail" role="dialog" aria-label={r.title}>
        <button className="detail-x" onClick={onClose} aria-label="Fermer" title="Fermer (Échap)"><IconX size={18} /></button>
        <div className="detail-main">
          <div className="detail-kind"><span className="lib-ico" style={{ background: 'var(--navy)', color: '#fff' }}><TypeIcon type={r.type} /></span>{TYPE_LABEL[r.type]}</div>
          <h2>{r.title}</h2>
          <div className="detail-meta">
            <span>{r.duration} min.</span>
            <span className={'origin-pill ' + r.origin} style={{ position: 'static' }}>{ORIGIN_LABEL[r.origin]}</span>
            {r.origin !== 'mine' && <span>{r.uses} utilisations</span>}
          </div>
          <div className="detail-preview">{r.thumb ? <img src={r.thumb} alt="" /> : <FakeThumb type={r.type} title={r.title} />}</div>
          {r.desc && <p className="detail-desc">{r.desc}</p>}
          <div className="detail-actions">
            <button className="btn primary" onClick={onReplace}>Remplacer cette ressource</button>
            <button className="btn ghost" onClick={onOwn}>+ Ajouter ma propre ressource</button>
          </div>
        </div>
        <div className="detail-aids">
          <div className="detail-aids-head">
            <h3>Appareils pédagogiques <small>({r.aids.length})</small></h3>
            {r.aids.some((a) => a.kind === 'correction') && (
              <button className={'chip-toggle' + (corr ? ' on' : '')} onClick={() => setCorr(!corr)} aria-pressed={corr}>{corr ? 'Masquer' : 'Afficher'} les corrections</button>
            )}
          </div>
          {aids.length === 0 && <p className="detail-desc">Aucun appareil pédagogique lié à cette ressource.</p>}
          {aids.map((a) => (
            <section key={a.id} className={'aid-card k-' + a.kind}>
              <header><span>{AID_LABEL[a.kind]}</span><b>{a.title}</b></header>
              <ol>
                {a.items.map((it, i) => (
                  <li key={i}><span className="aq">{it.q}</span>{it.a && <span className="aa">{it.a}</span>}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
