import AgentChar from './AgentChar'
import './DeskCard.css'

const COMPANY_COLOR = {
  '씻다': '#3b82f6',
  '세이퍼': '#22c55e',
  '웰라수': '#f97316',
}

const STATUS_CONFIG = {
  inactive: { label: '비활성', color: '#6b7280', badge: '—' },
  resting:  { label: '쉬는 중', color: '#eab308', badge: '💤' },
  working:  { label: '작업중',  color: '#22c55e', badge: '●' },
  blocked:  { label: '막힌',   color: '#ef4444', badge: '!' },
}

export default function DeskCard({ agent, selected, onClick, company }) {
  const status = agent.computedStatus ?? 'inactive'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  const borderColor = selected ? COMPANY_COLOR[company] : 'transparent'
  const shortName = agent.name.split('_').slice(-1)[0]

  return (
    <button
      className={`desk-card desk-card--${status} ${selected ? 'selected' : ''}`}
      style={{ '--border-color': borderColor }}
      onClick={onClick}
      title={agent.task}
    >
      <div className={`desk-monitor ${status === 'working' ? 'monitor--on' : ''}`}>🖥</div>
      <div className="desk-char">
        <AgentChar department={agent.department} online={status === 'working'} size={40} />
      </div>
      <div className="desk-info">
        <span className="desk-name">{shortName}</span>
        <span className="desk-status" style={{ color: cfg.color }}>
          <span className={status === 'working' ? 'pulse-dot' : ''}>{cfg.badge}</span>
          {' '}{cfg.label}
        </span>
      </div>
    </button>
  )
}
