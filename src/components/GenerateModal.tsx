import { IconX } from './Icons'

const FILES = [
  { name: '1-Livre-du-prof.pdf', title: 'Livre du prof', desc: 'Le déroulé séance par séance, avec le matériel à préparer.', kind: 'PDF', size: '4 Ko', art: 'guide' },
  { name: '2-Support-de-projection.pptx', title: 'Support de projection', desc: 'Les vidéos sont intégrées : aucun autre fichier à ouvrir pendant le cours.', kind: 'PowerPoint', size: '56 Ko', art: 'slides' },
  { name: '3-Fiches-eleves.pdf', title: 'Fichiers pour les élèves', desc: 'Prêts à imprimer, une fiche par séance.', kind: 'PDF', size: '4 Ko', art: 'fiches' },
]

/** Petites illustrations dessinées en CSS pour donner un aperçu de chaque support. */
const Art = ({ k }: { k: string }) => (
  <div className={'gen-art ' + k} aria-hidden>
    {k === 'guide' && <><b /><i /><i style={{ width: '70%' }} /><i /><u /><i style={{ width: '82%' }} /><i style={{ width: '60%' }} /></>}
    {k === 'slides' && <><div className="sl"><b /><i /></div><div className="sl play"><span>▶</span></div><div className="sl"><i /><i style={{ width: '60%' }} /></div></>}
    {k === 'fiches' && <><div className="fi"><b /><i /><i /><i /></div><div className="fi"><b /><i /><i /></div></>}
  </div>
)

export default function GenerateModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="gen" role="dialog" aria-label="Vos supports">
        <button className="detail-x" onClick={onClose} aria-label="Fermer"><IconX size={18} /></button>
        <h2>Votre dossier est prêt</h2>
        <p className="gen-sub">{title} — tout ce qu’il faut pour faire cours.</p>
        <div className="gen-cards">
          {FILES.map((f, i) => (
            <a key={f.name} className="gen-card" href={`/exemples/${f.name}`} download style={{ animationDelay: `${i * 0.12}s` }}>
              <Art k={f.art} />
              <b>{f.title}</b>
              <span>{f.desc}</span>
              <em>↓ Télécharger <small>{f.kind} · {f.size}</small></em>
            </a>
          ))}
        </div>
        <div className="gen-foot">
          <a className="btn primary big" href="/exemples/Dossier-Moliere-et-le-theatre.zip" download>Tout télécharger (.zip)</a>
          <small>Fichiers d’exemple pour la démonstration.</small>
        </div>
      </div>
    </div>
  )
}
