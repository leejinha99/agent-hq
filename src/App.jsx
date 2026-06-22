import { useState } from 'react'
import Header from './components/Header'
import CompanyTabs from './components/CompanyTabs'
import OfficeFloor from './components/OfficeFloor'
import TeamPanel from './components/TeamPanel'
import LogBar from './components/LogBar'
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
        <TeamPanel agents={agents} logs={logs} selectedAgent={selectedAgent} />
      </div>
      <LogBar logs={logs} secondsUntilRefresh={secondsUntilRefresh} company={company} />
    </div>
  )
}
