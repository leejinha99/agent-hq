import AgentChar from './AgentChar'
import './DeskCard.css'

const STATUS_CONFIG = {
  inactive: { label: '비활성', color: '#6b7280', badge: '—' },
  resting:  { label: '쉬는 중', color: '#eab308', badge: '💤' },
  working:  { label: '작업중',  color: '#22c55e', badge: '●' },
  blocked:  { label: '막힌',   color: '#ef4444', badge: '!' },
}

export default function DeskCard({ agent, selected, onClick, companyColor }) {
  const status = agent.computedStatus ?? 'inactive'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  const shortName = agent.name.split('_').slice(-1)[0]

  return (
    <button
      className={`desk-seat desk-seat--${status} ${selected ? 'selected' : ''}`}
      style={{ '--seat-color': companyColor ?? '#4a4a8a' }}
      onClick={onClick}
      title={`${shortName} · ${cfg.label}${agent.task ? '\n' + agent.task : ''}`}
    >
      <div className="seat-person">
        <AgentChar department={agent.department} online={status === 'working'} size={36} />
      </div>
      <div className="seat-name">{shortName}</div>
      <div className="seat-status" style={{ color: cfg.color }}>
        <span className={status === 'working' ? 'pulse-dot' : ''}>{cfg.badge}</span>
      </div>
    </button>
  )
}
