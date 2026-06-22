import AgentChar from './AgentChar'
import './DeskCard.css'

const STATUS_LABEL = {
  '🟢활성': { label: '활성', color: '#22c55e' },
  '🟡개발중': { label: '개발중', color: '#eab308' },
  '🔴비활성': { label: '비활성', color: '#ef4444' },
}

const COMPANY_COLOR = {
  '씻다': '#3b82f6',
  '세이퍼': '#22c55e',
  '웰라수': '#f97316',
}

export default function DeskCard({ agent, selected, onClick, company }) {
  const st = STATUS_LABEL[agent.status] ?? { label: agent.status, color: '#6b7280' }
  const borderColor = selected ? COMPANY_COLOR[company] : 'transparent'

  return (
    <button
      className={`desk-card ${selected ? 'selected' : ''}`}
      style={{ '--border-color': borderColor }}
      onClick={onClick}
      title={agent.task}
    >
      <div className="desk-char">
        <AgentChar department={agent.department} online={agent.online} size={48} />
      </div>
      <div className="desk-info">
        <span className="desk-name">{agent.name.split('_').slice(-1)[0]}</span>
        <span className="desk-task">{agent.task}</span>
        <span className="desk-status" style={{ color: st.color }}>
          ● {st.label}
        </span>
      </div>
    </button>
  )
}
