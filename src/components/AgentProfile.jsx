import AgentChar from './AgentChar'

const STATUS_MAP = {
  '🟢활성': { label: '활성 중', color: '#22c55e' },
  '🟡개발중': { label: '개발 중', color: '#eab308' },
  '🔴비활성': { label: '비활성', color: '#ef4444' },
}

export default function AgentProfile({ agent }) {
  if (!agent) return null
  const st = STATUS_MAP[agent.status] ?? { label: agent.status, color: '#6b7280' }
  const onlineLabel = agent.online ? '진행 중' : '쉬고 있음'
  const onlineColor = agent.online ? '#22c55e' : '#94a3b8'

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <AgentChar department={agent.department} online={agent.online} size={52} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 12, color: onlineColor, marginBottom: 2 }}>
            ● {onlineLabel}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {agent.department} · {agent.task}
          </div>
        </div>
      </div>
      {agent.description && (
        <div style={{
          fontSize: 12,
          color: '#94a3b8',
          background: '#0f0f14',
          borderRadius: 8,
          padding: '8px 12px',
          lineHeight: 1.6,
        }}>
          {agent.description}
        </div>
      )}
    </div>
  )
}
