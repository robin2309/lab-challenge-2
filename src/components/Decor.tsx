/** Formes décoratives de la maquette (étoile, triangle, cercle). */
interface P { color?: string; style?: React.CSSProperties; className?: string }
const cls = (c?: string) => 'abs' + (c ? ' ' + c : '')

export const Star = ({ color = 'var(--mint)', style, className }: P) => {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 24 - Math.PI / 2
    const rad = i % 2 ? 36 : 50
    return `${50 + rad * Math.cos(a)},${50 + rad * Math.sin(a)}`
  }).join(' ')
  return (
    <svg className={cls(className)} viewBox="0 0 100 100" style={style}><polygon points={pts} fill={color} /></svg>
  )
}
export const Triangle = ({ color = 'var(--yellow)', style, className }: P) => (
  <svg className={cls(className)} viewBox="0 0 100 100" style={style}><polygon points="0,0 100,48 8,100" fill={color} /></svg>
)
export const Circle = ({ color = 'var(--teal)', style, className }: P) => (
  <svg className={cls(className)} viewBox="0 0 100 100" style={style}><circle cx="50" cy="50" r="50" fill={color} /></svg>
)
