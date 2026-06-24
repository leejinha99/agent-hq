import { useState } from 'react'
import LogModal from './LogModal'
import './LogBar.css'

const STATUS_ICON = {
  '✅완료': { icon: '✅', color: '#22c55e' },
  '❌실패': { icon: '❌', color: '#ef4444' },
  '⏳진행중': { icon: '⏳', color: '#eab308' },
}

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function LogBar({ logs, secondsUntilRefresh, company }) {
  const [modalOpen, setModalOpen] = useState(false)
  const visible = logs.slice(0, 10)

  return (
    <>
      <div className="log-bar">
        <div className="log-bar-header">
          <span className="log-bar-label">실행 로그</span>
          <div className="log-bar-actions">
            <button className="log-btn" onClick={() => setModalOpen(true)}>전체 보기 →</button>
            <span className="log-refresh">🔄 {secondsUntilRefresh}초</span>
          </div>
        </div>
        <div className="log-bar-list">
          {visible.length === 0 && (
            <span className="log-empty">아직 로그가 없어요</span>
          )}
          {visible.map(log => {
            const st = STATUS_ICON[log.status] ?? { icon: '●', color: '#94a3b8' }
            return (
              <div key={log.id} className="log-item">
                <span style={{ color: st.color }}>{st.icon}</span>
                <span className="log-time">{formatTime(log.time)}</span>
                <span className="log-agent">{log.agentName.split('_').slice(-1)[0]}</span>
                <span className="log-task">· {log.task}</span>
              </div>
            )
          })}
        </div>
      </div>
      {modalOpen && <LogModal company={company} onClose={() => setModalOpen(false)} />}
    </>
  )
}
