import { useEffect, useState } from 'react'
import Stage from './components/Stage'
import CreateScreen from './components/CreateScreen'
import TimelineScreen from './components/TimelineScreen'
import { preloadLine } from './components/WaveCanvas'
import { generateCourse } from './data/generate'
import type { Course } from './types'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function App() {
  const [course, setCourse] = useState<Course | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [run, setRun] = useState(0) // identifie chaque arrivée sur l'écran 2 (rejoue la séquence)

  useEffect(() => { void preloadLine() }, [])

  const create = async (subject: string, classe: string) => {
    // la carte disparaît tout de suite ; la ligne reste et « respire » le temps de la génération
    setLeaving(true)
    const [c] = await Promise.all([generateCourse(subject, classe), wait(650)])
    setCourse(c)
    setRun((n) => n + 1)
    setLeaving(false)
  }

  return (
    <Stage>
      {course ? (
        <TimelineScreen key={run} course={course} setCourse={setCourse} onHome={() => setCourse(null)} intro />
      ) : (
        <CreateScreen onSubmit={create} leaving={leaving} />
      )}
    </Stage>
  )
}
