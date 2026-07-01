import { useState, useEffect } from 'react'
import './LogModal.css'

const STATUS_FILTERS = ['전체', '✅완료', '❌실패', '⏳진행중']

function formatDateTime(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function LogModal({ company, onClose }) {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState(null)

  async function fetchLogs(nextCursor = null) {
    setLoading(true)
    const url = `/api/logs?company=${encodeURIComponent(company)}&limit=100${nextCursor ? `&cursor=${nextCursor}` : ''}`
    const res = await fetch(url)
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setLogs(prev => nextCursor ? [...prev, ...data.logs] : data.logs)
    setHasMore(data.hasMore)
    setCursor(data.nextCursor)
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [company])

  const filtered = filter === '전체' ? logs : logs.filter(l => l.status === filter)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">실행 로그 전체 — {company}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-filters">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>
        <div className="modal-body">
          {loading && <div className="modal-loading">불러오는 중...</div>}
          {filtered.map(log => (
            <div key={log.id} className="modal-log-row">
              <span className="ml-status">{log.status}</span>
              <span className="ml-time">{formatDateTime(log.time)}</span>
              <span className="ml-agent">{log.agentName}</span>
              <span className="ml-task">{log.task}</span>
              {log.result && <span className="ml-result">{log.result}</span>}
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="modal-loading">로그가 없어요</div>
          )}
          {hasMore && (
            <button className="load-more-btn" onClick={() => fetchLogs(cursor)}>
              더 불러오기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
