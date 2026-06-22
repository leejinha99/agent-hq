import { useState } from 'react'
import Header from './components/Header'
import CompanyTabs from './components/CompanyTabs'
import { useNotion } from './hooks/useNotion'
import './App.css'

const COMPANIES = ['씻다', '세이퍼', '웰라수']

export default function App() {
  const [company, setCompany] = useState('씻다')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const { agents, logs, secondsUntilRefresh, refresh } = useNotion(company)

  return (
    <div className="app">
      <Header />
      <CompanyTabs
        companies={COMPANIES}
        active={company}
        onChange={c => { setCompany(c); setSelectedAgent(null) }}
      />
      <div className="main-grid">
        <div style={{ color: 'var(--text-muted)', padding: 20 }}>
          오피스 플로어 — {agents.length}명 로드됨
        </div>
        <div style={{ color: 'var(--text-muted)', padding: 20 }}>
          팀 패널 — {logs.length}개 로그
        </div>
      </div>
      <div style={{ background: 'var(--surface)', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        하단 로그 바 — 🔄 {secondsUntilRefresh}초 후 새로고침
      </div>
    </div>
  )
}
