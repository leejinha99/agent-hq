import DeskCard from './DeskCard'
import './OfficeFloor.css'

const DEPT_ORDER = {
  '씻다':  ['마케팅', '디자인', '지원사업', '재무회계', 'CS'],
  '세이퍼': ['마케팅', '디자인', '지원사업', '재무회계', '앱관리', 'CS'],
  '웰라수': ['마케팅', '디자인', '재무회계', '유지관리', 'CS'],
}

function groupByDept(agents, company) {
  const order = DEPT_ORDER[company] ?? []
  return order.reduce((acc, dept) => {
    const deptAgents = agents.filter(a => a.department === dept)
    if (deptAgents.length > 0) acc[dept] = deptAgents
    return acc
  }, {})
}

export default function OfficeFloor({ agents, company, selectedAgent, onSelectAgent }) {
  const grouped = groupByDept(agents, company)

  return (
    <div className="office-floor">
      <div className="office-grid">
        {Object.entries(grouped).map(([dept, deptAgents]) => (
          <div key={dept} className="dept-zone">
            <h3 className="dept-label">{dept}</h3>
            <div className="desk-row">
              {deptAgents.map(agent => (
                <DeskCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedAgent?.id === agent.id}
                  onClick={() => {
                    if (agent.computedStatus === 'inactive') return
                    onSelectAgent(selectedAgent?.id === agent.id ? null : agent)
                  }}
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
    </div>
  )
}
