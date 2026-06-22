import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <span className="header-icon">🏢</span>
        <span className="header-title">Agent HQ</span>
      </div>
      <div className="header-ceo">
        <span className="ceo-avatar">👤</span>
        <span className="ceo-label">대표</span>
      </div>
    </header>
  )
}
