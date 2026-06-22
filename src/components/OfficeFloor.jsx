import DeskCard from './DeskCard'
import './OfficeFloor.css'

const DEPT_ORDER = ['마케팅', '디자인', '앱관리', '지원사업', 'CS', '재무회계', '유지관리']

function groupByDept(agents) {
  return DEPT_ORDER.reduce((acc, dept) => {
    const deptAgents = agents.filter(a => a.department === dept)
    if (deptAgents.length > 0) acc[dept] = deptAgents
    return acc
  }, {})
}

export default function OfficeFloor({ agents, company, selectedAgent, onSelectAgent }) {
  const grouped = groupByDept(agents)

  return (
    <div className="office-floor">
      {Object.entries(grouped).map(([dept, deptAgents]) => (
        <div key={dept} className="dept-zone">
          <h3 className="dept-label">{dept} 팀</h3>
          <div className="desk-grid">
            {deptAgents.map(agent => (
              <DeskCard
                key={agent.id}
                agent={agent}
                selected={selectedAgent?.id === agent.id}
                onClick={() => onSelectAgent(selectedAgent?.id === agent.id ? null : agent)}
                company={company}
              />
            ))}
          </div>
        </div>
      ))}
      {agents.length === 0 && (
        <div className="office-empty">에이전트 데이터를 불러오는 중...</div>
      )}
    </div>
  )
}
