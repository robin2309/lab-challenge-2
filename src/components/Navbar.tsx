import { IconUser } from './Icons'

interface Props { logo: 'full' | 'short'; onHome: () => void; active?: 'create' | 'sessions' }

export default function Navbar({ logo, onHome, active }: Props) {
  return (
    <header className="navbar">
      <img className="logo" src={logo === 'full' ? '/assets/logo-full.png' : '/assets/logo.png'} alt="La ligne scolaire" />
      <nav>
        <button className={active === 'sessions' ? 'active' : ''}>Mes séances</button>
        <button className={active === 'create' ? 'active' : ''} onClick={onHome}>Créer un nouveau cours</button>
      </nav>
      <div className="user-pill"><IconUser />Mme. Zerwig</div>
    </header>
  )
}
