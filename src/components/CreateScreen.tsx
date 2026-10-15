import { useState } from 'react'
import Navbar from './Navbar'
import { Circle, Star, Triangle } from './Decor'
import { FlatLine } from './WaveCanvas'
import Stepper from './Stepper'

interface Props { onSubmit: (subject: string, classe: string) => void; leaving?: boolean }

export default function CreateScreen({ onSubmit, leaving = false }: Props) {
  const [classes, setClasses] = useState(['3eme B', '5eme A', '5eme B'])
  const [classe, setClasse] = useState('')
  const [adding, setAdding] = useState(false)
  const [newClass, setNewClass] = useState('')
  const [subject, setSubject] = useState('')

  const ready = classe !== '' && subject.trim().length > 2

  const addClass = () => {
    const v = newClass.trim()
    if (v && !classes.includes(v)) { setClasses([...classes, v]); setClasse(v) }
    setNewClass(''); setAdding(false)
  }

  return (
    <>
      <Star className={leaving ? 'leaving' : ''} style={{ left: -60, top: 130, width: 372, height: 396, opacity: .55, filter: 'saturate(.9)' }} color="#a8e8c8" />
      <Triangle className={leaving ? 'leaving' : ''} style={{ right: 113, top: 220, width: 240, height: 197, opacity: .8, transform: 'rotate(-10deg)' }} />
      <Circle className={leaving ? 'leaving' : ''} style={{ left: 'calc(50% + 112px)', bottom: -108, width: 270, height: 270 }} color="#9ce9e0" />
      <FlatLine busy={leaving} />

      <Navbar logo="full" onHome={() => {}} active="create" />
      <Stepper step={1} className={leaving ? 'leaving' : ''} />

      <h1 className={'create-title' + (leaving ? ' leaving' : '')}>Créez un chapitre de Français</h1>

      <form className={'create-card' + (leaving ? ' leaving' : '')} onSubmit={(e) => { e.preventDefault(); if (ready && !leaving) onSubmit(subject, classe) }}>
        <label className="lbl">Sélectionnez la classe</label>
        <div className="chips">
          {classes.map((c) => (
            <button type="button" key={c} className={'chip' + (classe === c ? ' on' : '')} onClick={() => setClasse(c)}>{c}</button>
          ))}
          {adding ? (
            <input
              className="chip-input" autoFocus placeholder="ex. 4eme C" value={newClass}
              onChange={(e) => setNewClass(e.target.value)} onBlur={addClass}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addClass() } if (e.key === 'Escape') setAdding(false) }}
            />
          ) : (
            <button type="button" className="chip add" onClick={() => setAdding(true)}>+ ajouter</button>
          )}
        </div>

        <label className="lbl">Indiquez le sujet</label>
        <textarea
          className="subject" value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="Exemple : La poésie moderne, le théâtre de Molière, la figure de la sorcière…"
        />
        <button type="submit" className="btn-primary" disabled={!ready}>Créer les séances</button>
      </form>
    </>
  )
}
