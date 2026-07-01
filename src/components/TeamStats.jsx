function computeStats(agents, logs) {
  const total = agents.length
  const working = agents.filter(a => a.online).length
  const idle = agents.filter(a => a.status === '🟢활성' && !a.online).length

  const latestLogByAgent = {}
  logs.forEach(log => {
    if (!latestLogByAgent[log.agentName]) {
      latestLogByAgent[log.agentName] = log
    }
  })
  const blocked = agents.filter(a => latestLogByAgent[a.name]?.status === '❌실패').length

  const inProgress = logs.filter(l => l.status === '⏳진행중').length
  const done = logs.filter(l => l.status === '✅완료').length

  return { total, working, idle, blocked, inProgress, done }
}

function StatBox({ value, label, color }) {
  return (
    <div style={{
      background: '#0f0f14',
      border: '1px solid #2a2a3a',
      borderRadius: 10,
      padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? '#e2e8f0', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function TeamStats({ agents, logs }) {
  const s = computeStats(agents, logs)
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#e2e8f0' }}>팀 현황</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <StatBox value={s.total} label="총인원" />
        <StatBox value={s.working} label="작업중" color="#22c55e" />
        <StatBox value={s.blocked} label="막힘" color="#ef4444" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <StatBox value={s.idle} label="대기" color="#94a3b8" />
        <StatBox value={s.inProgress} label="진행 태스크" color="#eab308" />
        <StatBox value={s.done} label="완료 태스크" color="#3b82f6" />
      </div>
    </div>
  )
}
