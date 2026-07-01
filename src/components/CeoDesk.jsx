import './CeoDesk.css'

const COMPANY_COLOR = {
  '씻다': '#3b82f6',
  '세이퍼': '#22c55e',
  '웰라수': '#f97316',
}

const COMPANY_LABEL = {
  '씻다': '씻다 대표실',
  '세이퍼': '세이퍼 대표실',
  '웰라수': '웰라수 대표실',
}

export default function CeoDesk({ company }) {
  const color = COMPANY_COLOR[company] ?? '#6b7280'

  return (
    <div className="ceo-desk" style={{ '--company-color': color }}>
      <div className="ceo-room-label">{COMPANY_LABEL[company] ?? '대표실'}</div>
      <div className="ceo-content">
        <div className="ceo-avatar">👤</div>
        <div className="ceo-info">
          <span className="ceo-name">이진하</span>
          <span className="ceo-title">대표 · 관리자</span>
        </div>
        <div className="ceo-desk-items">
          <span title="모니터">🖥</span>
          <span title="서류">📋</span>
          <span title="커피">☕</span>
        </div>
      </div>
    </div>
  )
}
