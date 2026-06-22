import AgentProfile from './AgentProfile'
import TeamStats from './TeamStats'
import './TeamPanel.css'

export default function TeamPanel({ agents, logs, selectedAgent }) {
  return (
    <aside className="team-panel">
      {selectedAgent ? (
        <>
          <div className="panel-section-title">에이전트 프로필</div>
          <AgentProfile agent={selectedAgent} />
          <div className="panel-divider" />
        </>
      ) : (
        <div className="panel-hint">에이전트를 클릭하면<br />프로필을 확인할 수 있어요</div>
      )}
      <TeamStats agents={agents} logs={logs} />
    </aside>
  )
}
