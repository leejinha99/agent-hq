import './AgentChar.css'

const DEPT_COLORS = {
  '마케팅':  { body: '#f97316', shirt: '#ea580c' },
  '디자인':  { body: '#ec4899', shirt: '#db2777' },
  'CS':      { body: '#06b6d4', shirt: '#0891b2' },
  '재무회계':{ body: '#8b5cf6', shirt: '#7c3aed' },
  '유지관리':{ body: '#eab308', shirt: '#ca8a04' },
  '지원사업':{ body: '#3b82f6', shirt: '#2563eb' },
  '앱관리':  { body: '#6b7280', shirt: '#4b5563' },
}

export default function AgentChar({ department, online = false, size = 56 }) {
  const colors = DEPT_COLORS[department] ?? { body: '#6b7280', shirt: '#4b5563' }
  const h = size * 1.4

  return (
    <svg
      className="agent-char"
      width={size}
      height={h}
      viewBox="0 0 56 78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head */}
      <circle cx="28" cy="16" r="13" fill="#fcd9b6" />
      {/* Eyes */}
      <circle cx="22" cy="14" r="2" fill="#1e293b" />
      <circle cx="34" cy="14" r="2" fill="#1e293b" />
      {/* Mouth */}
      <path d="M23 20 Q28 24 33 20" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Neck */}
      <rect x="23" y="27" width="10" height="6" fill="#fcd9b6" />
      {/* Body / shirt */}
      <rect x="12" y="32" width="32" height="26" rx="5" fill={colors.body} />
      {/* Shirt detail */}
      <rect x="24" y="32" width="8" height="26" rx="2" fill={colors.shirt} opacity="0.5" />
      {/* Left arm */}
      <rect x="2" y="34" width="10" height="18" rx="4" fill={colors.body} />
      {/* Right arm */}
      <rect x="44" y="34" width="10" height="18" rx="4" fill={colors.body} />
      {/* Hands */}
      <circle cx="7" cy="53" r="4" fill="#fcd9b6" />
      <circle cx="49" cy="53" r="4" fill="#fcd9b6" />
      {/* Left leg */}
      <rect x="14" y="57" width="12" height="16" rx="4" fill={colors.shirt} />
      {/* Right leg */}
      <rect x="30" y="57" width="12" height="16" rx="4" fill={colors.shirt} />
      {/* Online indicator */}
      {online && (
        <circle
          className="online-pulse"
          cx="48"
          cy="6"
          r="5"
          fill="#22c55e"
        />
      )}
    </svg>
  )
}
