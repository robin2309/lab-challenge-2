import type { ResourceType } from '../types'

export const IconPlay = () => (<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>)
export const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h9l4 4v14H6z" /><path d="M9 11h7M9 14h7M9 17h5" />
  </svg>
)
export const IconStar = () => (<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.6 5.9 21.1l1.4-6.8L2.2 9.6l6.9-.8z" fill="currentColor" /></svg>)
export const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" fill="currentColor" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </svg>
)
export const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
)
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
export const IconEdit = () => (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>)
export const IconTrash = () => (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>)
export const IconArrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
)
export const IconSwap = () => (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" /></svg>)
export const IconCheck = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...stroke} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7" /></svg>)
export const IconSearch = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...stroke}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>)
export const IconUser = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="17" cy="11" r="5.5" /><path d="M5 29c0-6 5-9.5 12-9.5S29 23 29 29z" />
  </svg>
)

export const TypeIcon = ({ type }: { type: ResourceType }) => {
  switch (type) {
    case 'video': return <IconPlay />
    case 'texte': return <IconDoc />
    case 'ludo': return <IconStar />
    case 'rituel': return <IconSun />
  }
}
