import { useState } from 'react'
import { TYPE_LABEL, type ResourceType } from '../types'

interface Props {
  type: ResourceType
  heading: string
  initial?: { title: string; type: ResourceType; file?: string }
  onSave: (v: { type: ResourceType; title: string; duration: number; note: string }) => void
  onClose: () => void
}

export default function OwnResourceModal({ type: t0, heading, initial, onSave, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [duration, setDuration] = useState('15')
  const [type, setType] = useState<ResourceType>(initial?.type ?? t0)
  const [note, setNote] = useState('')
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="modal" onSubmit={(e) => { e.preventDefault(); onSave({ type, title: title.trim() || 'Ma ressource', duration: Math.max(1, Math.min(120, parseInt(duration, 10) || 15)), note: note.trim() }) }}>
        <h2>Ajouter ma ressource</h2>
        <p style={{ margin: '-10px 0 6px', fontSize: 18, color: '#6d5f48' }}>{heading}</p>
        {initial?.file && <p className="file-chip">Fichier : {initial.file}</p>}
        <label>Titre</label>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Mon texte d’ouverture" />
        <div className="row">
          <div>
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
              {(Object.keys(TYPE_LABEL) as ResourceType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div style={{ maxWidth: 150 }}>
            <label>Durée (min.)</label>
            <input type="number" min={1} max={120} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>
        {!initial?.file && <><label>Lien ou description</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lien vers votre document, ou quelques mots" /></>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>Annuler</button>
          <button type="submit" className="btn primary">Ajouter</button>
        </div>
      </form>
    </div>
  )
}
