import './CompanyTabs.css'

const COMPANY_COLORS = {
  '씻다': '#3b82f6',
  '세이퍼': '#22c55e',
  '웰라수': '#f97316',
}

export default function CompanyTabs({ companies, active, onChange }) {
  return (
    <nav className="company-tabs">
      {companies.map(company => (
        <button
          key={company}
          className={`tab-btn ${active === company ? 'active' : ''}`}
          style={{ '--tab-color': COMPANY_COLORS[company] }}
          onClick={() => onChange(company)}
        >
          {active === company && <span className="tab-dot" />}
          {company}
        </button>
      ))}
    </nav>
  )
}
