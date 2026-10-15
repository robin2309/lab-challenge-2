import { useEffect, useState } from 'react'
import { IconCheck, IconX } from './Icons'

const FILES = [
  { name: '1-Guide-accompagnement-prof.pdf', title: 'Guide d’accompagnement', desc: 'Le déroulé séance par séance, avec le matériel à préparer.', kind: 'PDF', size: '4 Ko' },
  { name: '2-Support-de-projection.pptx', title: 'Support de projection', desc: 'Les vidéos sont intégrées : aucun autre fichier à ouvrir pendant le cours.', kind: 'PowerPoint', size: '56 Ko' },
  { name: '3-Fiches-eleves.pdf', title: 'Fichiers pour les élèves', desc: 'Prêts à imprimer, une fiche par séance.', kind: 'PDF', size: '4 Ko' },
]

export default function GenerateModal({ title, onClose }: { title: string; onClose: () => void }) {
  const [done, setDone] = useState(0) // nombre de fichiers prêts
  useEffect(() => {
    if (done >= FILES.length) return
    const id = window.setTimeout(() => setDone((d) => d + 1), 750)
    return () => window.clearTimeout(id)
  }, [done])
  const ready = done >= FILES.length

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="gen" role="dialog" aria-label="Génération des supports">
        <button className="detail-x" onClick={onClose} aria-label="Fermer"><IconX size={18} /></button>
        <h2>{ready ? 'Votre dossier est prêt' : 'Préparation de votre dossier…'}</h2>
        <p className="gen-sub">{title} — tout ce qu’il faut pour faire cours.</p>
        <ul className="gen-files">
          {FILES.map((f, i) => (
            <li key={f.name} className={i < done ? 'ok' : i === done ? 'busy' : ''}>
              <span className="gen-state">{i < done ? <IconCheck /> : i === done ? <i className="spin" /> : null}</span>
              <div className="gen-info"><b>{f.title}</b><span>{f.desc}</span></div>
              {i < done
                ? <a className="gen-dl" href={`/exemples/${f.name}`} download>Télécharger <small>{f.kind} · {f.size}</small></a>
                : <span className="gen-wait">{i === done ? 'En cours…' : 'En attente'}</span>}
            </li>
          ))}
        </ul>
        <div className="gen-foot">
          <a className={'btn primary big' + (ready ? '' : ' disabled')} href="/exemples/Dossier-Moliere-et-le-theatre.zip" download aria-disabled={!ready}>Télécharger le dossier complet (.zip)</a>
          <small>Fichiers d’exemple pour la démonstration.</small>
        </div>
      </div>
    </div>
  )
}
