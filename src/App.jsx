import { useState } from 'react'
import Header from './components/Header'
import CompanyTabs from './components/CompanyTabs'
import OfficeFloor from './components/OfficeFloor'
import { useNotion } from './hooks/useNotion'
import './App.css'

const COMPANIES = ['씻다', '세이퍼', '웰라수']

export default function App() {
  const [company, setCompany] = useState('씻다')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const { agents, logs, secondsUntilRefresh } = useNotion(company)

  return (
    <div className="app">
      <Header />
      <CompanyTabs
        companies={COMPANIES}
        active={company}
        onChange={c => { setCompany(c); setSelectedAgent(null) }}
      />
      <div className="main-grid">
        <OfficeFloor
          agents={agents}
          company={company}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />
        <div style={{ color: 'var(--text-muted)', padding: 20, borderLeft: '1px solid var(--border)' }}>
          팀 패널 — {logs.length}개 로그
        </div>
      </div>
      <div style={{ background: 'var(--surface)', padding: '0 20px', display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        🔄 {secondsUntilRefresh}초 후 새로고침
      </div>
    </div>
  )
}
