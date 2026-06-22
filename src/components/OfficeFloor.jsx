import DeskCard from './DeskCard'
import './OfficeFloor.css'

const DEPT_ORDER = {
  '씻다':  ['마케팅', '디자인', '지원사업', '재무회계', 'CS'],
  '세이퍼': ['마케팅', '디자인', '지원사업', '재무회계', '앱관리', 'CS'],
  '웰라수': ['마케팅', '디자인', '재무회계', '유지관리', 'CS'],
}

const COMPANY_COLOR = {
  '씻다': '#3b82f6',
  '세이퍼': '#22c55e',
  '웰라수': '#f97316',
}

function groupByDept(agents, company) {
  const order = DEPT_ORDER[company] ?? []
  return order.reduce((acc, dept) => {
    const deptAgents = agents.filter(a => a.department === dept)
    if (deptAgents.length > 0) acc[dept] = deptAgents
    return acc
  }, {})
}

export default function OfficeFloor({ agents, company, selectedAgent, onSelectAgent, fetchError }) {
  const grouped = groupByDept(agents, company)
  const color = COMPANY_COLOR[company] ?? '#6b7280'

  return (
    <div className="office-floor">
      <div className="floor-plan">

        {/* 대표 책상 — 맨 위 가운데 */}
        <div className="ceo-area">
          <div className="ceo-floor-desk" style={{ '--company-color': color }}>
            <span className="ceo-floor-title">대표</span>
            <div className="ceo-floor-icon">👤</div>
            <span className="ceo-floor-name">이진하</span>
          </div>
        </div>

        {/* 팀 책상들 */}
        <div className="team-desks-area">
          {Object.entries(grouped).map(([dept, deptAgents]) => {
            const cols = deptAgents.length <= 2 ? deptAgents.length : 2
            return (
              <div key={dept} className="team-desk">
                <div className="team-desk-label">{dept}</div>
                <div className="team-desk-seats" style={{ '--cols': cols }}>
                  {deptAgents.map(agent => (
                    <DeskCard
                      key={agent.id}
                      agent={agent}
                      selected={selectedAgent?.id === agent.id}
                      onClick={() => {
                        if (agent.computedStatus === 'inactive') return
                        onSelectAgent(selectedAgent?.id === agent.id ? null : agent)
                      }}
                      companyColor={color}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {fetchError && (
          <div className="office-empty office-error">⚠ {fetchError}</div>
        )}
        {!fetchError && agents.length === 0 && (
          <div className="office-empty">에이전트 데이터를 불러오는 중...</div>
        )}
      </div>
    </div>
  )
}
