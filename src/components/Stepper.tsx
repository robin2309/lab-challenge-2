const STEPS = ['Votre brief', 'Votre ligne', 'Vos supports']

/** Parcours en 3 étapes : la ligne est une étape intermédiaire, la finalité est le dossier de supports. */
export default function Stepper({ step, className = '', style }: { step: 1 | 2 | 3; className?: string; style?: React.CSSProperties }) {
  return (
    <ol className={'stepper ' + className} style={style} aria-label="Étapes du parcours">
      {STEPS.map((l, i) => {
        const n = i + 1
        const st = n < step ? 'done' : n === step ? 'now' : 'next'
        return (
          <li key={l} className={st + (n === 3 ? ' final' : '')} aria-current={n === step ? 'step' : undefined}>
            <span className="dot">{st === 'done' ? '✓' : n}</span>{l}
          </li>
        )
      })}
    </ol>
  )
}
