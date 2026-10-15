import { useEffect, useState, type ReactNode } from 'react'

const W = 1920, H = 1080

/** Cadre basé sur la maquette 1920×1080, mis à l'échelle et étendu pour couvrir tout l'écran. */
export default function Stage({ children }: { children: ReactNode }) {
  const [dim, setDim] = useState({ s: 1, w: W, h: H })
  useEffect(() => {
    const f = () => {
      const vw = window.innerWidth, vh = window.innerHeight
      const s = Math.min(vw / W, vh / H)
      // le cadre prend tout l'écran : la maquette 1920×1080 sert de base, l'excédent est de la place en plus
      setDim({ s, w: vw / s, h: vh / s })
    }
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `scale(${dim.s})`, width: dim.w, height: dim.h }}>{children}</div>
    </div>
  )
}
