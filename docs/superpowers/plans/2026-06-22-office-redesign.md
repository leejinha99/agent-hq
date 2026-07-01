# Office Redesign + Auto Status Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아이소메트릭 오피스 레이아웃으로 리디자인하고, 폴더 스캔 + 로그 기반으로 에이전트 상태를 자동 감지한다.

**Architecture:** 프론트엔드는 Notion에서 기본 상태(`🔴비활성` / `🟡쉬는 중`)를 읽고, 로그 타임스탬프로 작업중/막힌 세부 상태를 계산한다. 로컬 `scan-folders.py` 스크립트가 Mac 폴더를 스캔해 Notion 상태를 업데이트하며, Claude Stop 훅에 연결돼 자동 실행된다.

**Tech Stack:** React 19, Vite 8, Vitest 4, CSS (no CSS-in-JS), Python 3, Notion API

## Global Constraints

- 배경색: `#0f0f14`, surface: `#1a1a24`, surface2: `#22223a`
- 씻다=`#3b82f6`, 세이퍼=`#22c55e`, 웰라수=`#f97316`
- 상태 4종: `inactive`(회색), `resting`(노랑), `working`(초록 pulse), `blocked`(빨강)
- 모든 에이전트는 항상 책상에 표시 — 상태만 다름
- Vitest `npm test` 가 항상 통과해야 함

---

## File Map

### 수정
- `src/hooks/useNotion.js` — `computeStatus` 헬퍼 추가, enriched agents 반환
- `src/hooks/useNotion.test.js` — computeStatus 테스트 추가
- `src/components/DeskCard.jsx` — 4종 상태 prop 수신 및 렌더
- `src/components/DeskCard.css` — 상태별 스타일 (비활성 흐릿, pulse 애니메이션)
- `src/components/OfficeFloor.jsx` — 가로 그리드 레이아웃, 아이소메트릭 시각
- `src/components/OfficeFloor.css` — 팀 구역 가로 배치, 바닥 느낌 배경
- `src/App.jsx` — CeoDesk 삽입, grid-template-rows 업데이트
- `src/App.css` — CEO 행 높이 추가
- `scripts/log-to-notion.py` — 버그 수정: LOG_DB ID 업데이트

### 신규 생성
- `src/components/CeoDesk.jsx` — 사장실 컴포넌트
- `src/components/CeoDesk.css`
- `scripts/scan-folders.py` — 폴더 스캔 + Notion 상태 업데이트

---

## Task 1: log-to-notion.py LOG_DB ID 버그 수정

**Files:**
- Modify: `scripts/log-to-notion.py`

**Interfaces:**
- Produces: 올바른 LOG_DB ID로 로그 기록 가능

- [ ] **Step 1: 기존 LOG_DB 값 확인**

`scripts/log-to-notion.py` 상단의 LOG_DB 딕셔너리를 확인한다. 현재 값:
```python
LOG_DB = {
    '씻다':  '097a01d3-ded2-49e7-8c4a-7fba055a5560',  # 잘못됨
    '세이퍼': '7d5894c4-b787-49ff-a3e8-07058023d779',  # 잘못됨
    '웰라수': 'f7119b72-471c-4925-b28c-dd8776b5523c',  # 잘못됨
}
```

- [ ] **Step 2: 올바른 ID로 교체**

`scripts/log-to-notion.py`에서 LOG_DB를 아래 값으로 교체:
```python
LOG_DB = {
    '씻다':  '904a4040-625c-4867-8757-dfcfc16ec4a8',
    '세이퍼': '1510dd10-a28f-4e8c-ab76-fadf17bd188c',
    '웰라수': 'fcc6a033-a825-4c74-804a-e2cabca186a9',
}
```

- [ ] **Step 3: 테스트 — Notion API 직접 확인**

```bash
curl -s -X POST "https://api.notion.com/v1/databases/904a4040-625c-4867-8757-dfcfc16ec4a8/query" \
  -H "Authorization: Bearer $(grep NOTION_API_KEY .env | cut -d= -f2)" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"page_size": 1}' | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if d.get('object')=='list' else d)"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add scripts/log-to-notion.py
git commit -m "fix: correct LOG_DB Notion IDs in log-to-notion.py"
```

---

## Task 2: computeStatus 로직 + 테스트

**Files:**
- Modify: `src/hooks/useNotion.js`
- Modify: `src/hooks/useNotion.test.js`

**Interfaces:**
- Produces: `computeStatus(agent, logs) → 'inactive' | 'resting' | 'working' | 'blocked'`
- Produces: `useNotion(company)` 반환값에 `agents` 각 항목이 `computedStatus` 필드를 가짐

- [ ] **Step 1: 실패하는 테스트 작성**

`src/hooks/useNotion.test.js` 파일 하단에 추가:

```js
import { computeStatus } from './useNotion'

describe('computeStatus', () => {
  const baseAgent = { name: 'seatda_marketing', status: '🟡쉬는 중' }

  it('returns inactive when agent status is 🔴비활성', () => {
    const agent = { ...baseAgent, status: '🔴비활성' }
    expect(computeStatus(agent, [])).toBe('inactive')
  })

  it('returns resting when active but no logs', () => {
    expect(computeStatus(baseAgent, [])).toBe('resting')
  })

  it('returns working when latest log is within 1 hour', () => {
    const recentLog = {
      agentName: 'seatda_marketing',
      time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10분 전
      status: '✅완료',
    }
    expect(computeStatus(baseAgent, [recentLog])).toBe('working')
  })

  it('returns resting when latest log is older than 1 hour', () => {
    const oldLog = {
      agentName: 'seatda_marketing',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
      status: '✅완료',
    }
    expect(computeStatus(baseAgent, [oldLog])).toBe('resting')
  })

  it('returns blocked when latest log status is 오류', () => {
    const errorLog = {
      agentName: 'seatda_marketing',
      time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
      status: '❌오류',
    }
    expect(computeStatus(baseAgent, [errorLog])).toBe('blocked')
  })

  it('ignores logs from other agents', () => {
    const otherLog = {
      agentName: 'other_agent',
      time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: '✅완료',
    }
    expect(computeStatus(baseAgent, [otherLog])).toBe('resting')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: `computeStatus is not a function` 에러

- [ ] **Step 3: computeStatus 구현 + export**

`src/hooks/useNotion.js` 상단 (import 바로 아래)에 추가:

```js
const ONE_HOUR_MS = 60 * 60 * 1000

export function computeStatus(agent, logs) {
  if (agent.status === '🔴비활성') return 'inactive'
  const agentLogs = logs.filter(l => l.agentName === agent.name)
  if (agentLogs.length === 0) return 'resting'
  const latest = agentLogs.sort((a, b) => new Date(b.time) - new Date(a.time))[0]
  if (latest.status?.includes('오류')) return 'blocked'
  if (Date.now() - new Date(latest.time) < ONE_HOUR_MS) return 'working'
  return 'resting'
}
```

그리고 `useNotion` hook의 `setAgents` 부분을 수정해 enriched agents를 반환:

```js
// fetchData 함수 내부, setAgents 부분을 아래로 교체
if (agentsRes.ok && logsRes.ok) {
  const agentsData = await agentsRes.json()
  const logsData = await logsRes.json()
  const logsArr = logsData.logs ?? []
  setLogs(logsArr)
  setAgents(agentsData.map(a => ({ ...a, computedStatus: computeStatus(a, logsArr) })))
} else {
  if (agentsRes.ok) setAgents(await agentsRes.json())
  if (logsRes.ok) {
    const data = await logsRes.json()
    setLogs(data.logs ?? [])
  }
}
```

주의: 기존의 개별 `if (agentsRes.ok)` / `if (logsRes.ok)` 블록을 위 블록으로 교체.

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: 모든 테스트 PASS (기존 2개 + 신규 6개 = 8개)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNotion.js src/hooks/useNotion.test.js
git commit -m "feat: add computeStatus logic with 4-state derivation"
```

---

## Task 3: DeskCard 4종 상태 시각

**Files:**
- Modify: `src/components/DeskCard.jsx`
- Modify: `src/components/DeskCard.css`

**Interfaces:**
- Consumes: `agent.computedStatus: 'inactive' | 'resting' | 'working' | 'blocked'`
- Consumes: `agent.status` (Notion 원본, 폴백용)

- [ ] **Step 1: DeskCard.jsx 업데이트**

`src/components/DeskCard.jsx` 전체를 아래로 교체:

```jsx
import AgentChar from './AgentChar'
import './DeskCard.css'

const COMPANY_COLOR = {
  '씻다': '#3b82f6',
  '세이퍼': '#22c55e',
  '웰라수': '#f97316',
}

const STATUS_CONFIG = {
  inactive: { label: '비활성', color: '#6b7280', badge: '—' },
  resting:  { label: '쉬는 중', color: '#eab308', badge: '💤' },
  working:  { label: '작업중',  color: '#22c55e', badge: '●' },
  blocked:  { label: '막힌',   color: '#ef4444', badge: '!' },
}

export default function DeskCard({ agent, selected, onClick, company }) {
  const status = agent.computedStatus ?? 'inactive'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  const borderColor = selected ? COMPANY_COLOR[company] : 'transparent'
  const shortName = agent.name.split('_').slice(-1)[0]

  return (
    <button
      className={`desk-card desk-card--${status} ${selected ? 'selected' : ''}`}
      style={{ '--border-color': borderColor }}
      onClick={onClick}
      title={agent.task}
    >
      <div className={`desk-monitor ${status === 'working' ? 'monitor--on' : ''}`}>🖥</div>
      <div className="desk-char">
        <AgentChar department={agent.department} online={status === 'working'} size={40} />
      </div>
      <div className="desk-info">
        <span className="desk-name">{shortName}</span>
        <span className="desk-status" style={{ color: cfg.color }}>
          <span className={status === 'working' ? 'pulse-dot' : ''}>{cfg.badge}</span>
          {' '}{cfg.label}
        </span>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: DeskCard.css 업데이트**

`src/components/DeskCard.css` 전체를 아래로 교체:

```css
.desk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 90px;
  text-align: center;
  position: relative;
}

/* 비활성: 흐릿하게 */
.desk-card--inactive {
  opacity: 0.4;
  filter: grayscale(1);
  cursor: default;
}

.desk-card--inactive:hover { transform: none; }

.desk-card:not(.desk-card--inactive):hover {
  border-color: #4a4a6a;
  transform: translateY(-2px);
}

.desk-card.selected {
  border-color: var(--border-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--border-color) 30%, transparent);
}

/* 모니터 아이콘 */
.desk-monitor {
  font-size: 18px;
  line-height: 1;
  filter: grayscale(1) brightness(0.5);
  transition: filter 0.3s;
}
.monitor--on { filter: none; }

.desk-char { flex-shrink: 0; }

.desk-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.desk-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 85px;
}

.desk-status {
  font-size: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
}

/* 작업중 pulse 애니메이션 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.pulse-dot {
  display: inline-block;
  animation: pulse 1.5s ease-in-out infinite;
}
```

- [ ] **Step 3: 시각 확인 (dev 서버)**

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 열어 에이전트 카드 상태 배지 확인.  
현재 로그가 없으므로 폴더 있는 에이전트는 `쉬는 중`(노랑), 없는 건 `비활성`(회색/흐릿) 예상.

- [ ] **Step 4: Commit**

```bash
git add src/components/DeskCard.jsx src/components/DeskCard.css
git commit -m "feat: DeskCard 4-state visual (inactive/resting/working/blocked)"
```

---

## Task 4: CeoDesk 사장실 컴포넌트

**Files:**
- Create: `src/components/CeoDesk.jsx`
- Create: `src/components/CeoDesk.css`

**Interfaces:**
- Consumes: `company: '씻다' | '세이퍼' | '웰라수'` (회사 색상용)
- Produces: `<CeoDesk company={company} />` — 독립 배치 가능한 컴포넌트

- [ ] **Step 1: CeoDesk.jsx 생성**

```jsx
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
```

- [ ] **Step 2: CeoDesk.css 생성**

```css
.ceo-desk {
  background: var(--surface);
  border: 1.5px solid var(--company-color, #6b7280);
  border-radius: 12px;
  padding: 10px 20px;
  margin: 12px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--company-color) 15%, transparent);
}

.ceo-room-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--company-color);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ceo-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ceo-avatar {
  font-size: 28px;
  width: 44px;
  height: 44px;
  background: var(--surface2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--company-color);
}

.ceo-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ceo-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.ceo-title {
  font-size: 11px;
  color: var(--text-muted);
}

.ceo-desk-items {
  margin-left: auto;
  display: flex;
  gap: 8px;
  font-size: 20px;
  opacity: 0.7;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CeoDesk.jsx src/components/CeoDesk.css
git commit -m "feat: add CeoDesk CEO office section component"
```

---

## Task 5: OfficeFloor 가로 그리드 + 아이소메트릭 시각

**Files:**
- Modify: `src/components/OfficeFloor.jsx`
- Modify: `src/components/OfficeFloor.css`

**Interfaces:**
- Consumes: `agents` (각 항목에 `computedStatus` 포함)
- Consumes: `company`, `selectedAgent`, `onSelectAgent` (기존과 동일)

- [ ] **Step 1: OfficeFloor.jsx 업데이트**

`src/components/OfficeFloor.jsx` 전체를 아래로 교체:

```jsx
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
```

- [ ] **Step 2: OfficeFloor.css 업데이트**

`src/components/OfficeFloor.css` 전체를 아래로 교체:

```css
.office-floor {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
}

/* 아이소메트릭 바닥 느낌: 대각선 격자 배경 */
.office-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: center center;
  padding: 16px;
  border-radius: 12px;
  min-height: 100%;
}

.dept-zone {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  /* 아이소메트릭 느낌: 하단 그림자로 깊이 표현 */
  box-shadow: 0 4px 0 #111118, 0 6px 12px rgba(0,0,0,0.4);
  min-width: 140px;
}

.dept-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

.desk-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.office-empty {
  color: var(--text-muted);
  text-align: center;
  padding: 40px;
  width: 100%;
}
```

- [ ] **Step 3: dev 서버에서 레이아웃 확인**

```bash
npm run dev
```

- 팀 구역이 가로로 나란히 배치되는지 확인
- 각 팀 구역에 그림자로 깊이감이 생겼는지 확인
- 비활성 에이전트가 흐릿하게 표시되는지 확인

- [ ] **Step 4: Commit**

```bash
git add src/components/OfficeFloor.jsx src/components/OfficeFloor.css
git commit -m "feat: OfficeFloor horizontal grid with isometric depth shadows"
```

---

## Task 6: App.jsx에 CeoDesk 연결 + grid 업데이트

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `CeoDesk` (Task 4), `company` state

- [ ] **Step 1: App.jsx 업데이트**

`src/App.jsx` 전체를 아래로 교체:

```jsx
import { useState } from 'react'
import Header from './components/Header'
import CompanyTabs from './components/CompanyTabs'
import CeoDesk from './components/CeoDesk'
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
      <CeoDesk company={company} />
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
```

- [ ] **Step 2: App.css grid-template-rows 업데이트**

`src/App.css`의 `.app` 규칙을 아래로 교체:

```css
.app {
  display: grid;
  grid-template-rows: 56px 54px 88px 1fr 52px;
  height: 100vh;
  overflow: hidden;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  overflow: hidden;
  border-top: 1px solid var(--border);
}
```

(88px = CeoDesk 높이. 실제 렌더 후 필요시 조정)

- [ ] **Step 3: dev 서버에서 전체 레이아웃 확인**

```bash
npm run dev
```

확인 사항:
- Header → CompanyTabs → 사장실 → 팀 오피스 + TeamPanel → LogBar 순서
- 사장실 배경이 회사 탭 변경 시 색상 함께 변경되는지
- 전체 높이가 100vh를 넘지 않는지

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: 모든 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: wire CeoDesk into App layout above office floor"
```

---

## Task 7: scan-folders.py — 폴더 스캔 + Notion 업데이트

**Files:**
- Create: `scripts/scan-folders.py`

**Interfaces:**
- Produces: `scan-folders.py` 실행 → Notion 에이전트 DB `상태` 필드 자동 업데이트
- 폴더 있고 .md 있음 → `🟡쉬는 중`
- 폴더 없거나 .md 없음 → `🔴비활성`

- [ ] **Step 1: scan-folders.py 생성**

`scripts/scan-folders.py` 파일 생성:

```python
#!/usr/bin/env python3
"""
에이전트 폴더 스캔 → Notion 에이전트 DB 상태 자동 업데이트.
Claude Stop 훅에서 자동 실행되거나 수동으로 실행 가능.
"""
import os
import re
import sys
from pathlib import Path
from urllib import request, error
import json

# ── 설정 ────────────────────────────────────────────────────────────────────

VAULT_BASE = Path("/Users/mainpc/Desktop/업무 자동화(맥미니)/Obsidian_맥미니")

COMPANY_FOLDERS = {
    '씻다':  VAULT_BASE / '◈Obsidian_씻다◈',
    '세이퍼': VAULT_BASE / '◈Obsidian_세이퍼◈',
    '웰라수': VAULT_BASE / '◈Obsidian_웰라수◈',
}

# 폴더명(일부) → Notion department 필드 값
DEPT_MAP = {
    '마케팅':    '마케팅',
    '유튜브':    '마케팅',
    '디자인':    '디자인',
    '정부지원사업': '지원사업',
    '재무회계':  '재무회계',
    '유지보수':  '유지관리',
    '앱관리':    '앱관리',
    'CS':       'CS',
}

AGENT_DB = {
    '씻다':  '38711ccd-aa0d-80bb-ba45-ed23022c72ac',
    '세이퍼': '38711ccd-aa0d-8055-b6a3-ce867c2f53c4',
    '웰라수': '38711ccd-aa0d-8074-b834-c8c0c16bc09e',
}

# ── Notion API 키 로드 ───────────────────────────────────────────────────────

def load_api_key() -> str:
    key = os.environ.get('NOTION_API_KEY', '')
    if key:
        return key
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            if line.startswith('NOTION_API_KEY='):
                return line.split('=', 1)[1].strip()
    return ''

API_KEY = load_api_key()
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
}

# ── 폴더 스캔 ───────────────────────────────────────────────────────────────

def scan_active_depts() -> dict[str, set[str]]:
    """회사별로 .md 파일이 존재하는 부서 집합을 반환."""
    result: dict[str, set[str]] = {}
    for company, folder in COMPANY_FOLDERS.items():
        result[company] = set()
        if not folder.exists():
            continue
        for subfolder in folder.iterdir():
            if not subfolder.is_dir():
                continue
            # 폴더명에서 부서명 추출: "1. Obsidian_씻다_마케팅" → "마케팅"
            match = re.search(r'Obsidian_\S+_(.+)$', subfolder.name)
            if not match:
                continue
            raw_dept = match.group(1).strip()
            notion_dept = DEPT_MAP.get(raw_dept)
            if notion_dept is None:
                continue
            has_md = any(subfolder.glob('*.md'))
            if has_md:
                result[company].add(notion_dept)
    return result

# ── Notion 쿼리 / 업데이트 ──────────────────────────────────────────────────

def notion_request(method: str, path: str, body: dict | None = None) -> dict:
    url = f'https://api.notion.com/v1{path}'
    data = json.dumps(body).encode() if body else None
    req = request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with request.urlopen(req) as resp:
            return json.loads(resp.read())
    except error.HTTPError as e:
        print(f'[scan-folders] Notion {method} {path} → {e.code}: {e.read().decode()}', file=sys.stderr)
        return {}

def get_all_agents(db_id: str) -> list[dict]:
    agents = []
    cursor = None
    while True:
        body: dict = {'page_size': 100}
        if cursor:
            body['start_cursor'] = cursor
        data = notion_request('POST', f'/databases/{db_id}/query', body)
        agents.extend(data.get('results', []))
        if not data.get('has_more'):
            break
        cursor = data.get('next_cursor')
    return agents

def update_agent_status(page_id: str, status_value: str) -> None:
    notion_request('PATCH', f'/pages/{page_id}', {
        'properties': {
            '상태': {'select': {'name': status_value}}
        }
    })

# ── 메인 ────────────────────────────────────────────────────────────────────

def main():
    if not API_KEY:
        print('[scan-folders] NOTION_API_KEY 없음 — 종료', file=sys.stderr)
        sys.exit(1)

    active_depts = scan_active_depts()
    print(f'[scan-folders] 활성 부서: { {c: list(d) for c, d in active_depts.items()} }')

    for company, db_id in AGENT_DB.items():
        agents = get_all_agents(db_id)
        for agent in agents:
            props = agent.get('properties', {})
            dept_raw = props.get('부서', {}).get('select', {})
            dept = dept_raw.get('name', '') if dept_raw else ''
            current_status = (props.get('상태', {}).get('select') or {}).get('name', '')

            if dept in active_depts.get(company, set()):
                new_status = '🟡쉬는 중'
            else:
                new_status = '🔴비활성'

            if current_status != new_status:
                update_agent_status(agent['id'], new_status)
                name = (props.get('에이전트명', {}).get('title') or [{}])[0].get('plain_text', '?')
                print(f'[scan-folders] {company} / {name}: {current_status} → {new_status}')

    print('[scan-folders] 완료')

if __name__ == '__main__':
    main()
```

- [ ] **Step 2: 스크립트 실행 테스트**

```bash
python3 scripts/scan-folders.py
```

Expected 출력 예시:
```
[scan-folders] 활성 부서: {'씻다': ['마케팅', '디자인', '지원사업'], ...}
[scan-folders] 씻다 / seatda_marketing_sns: 🟢활성 → 🟡쉬는 중
...
[scan-folders] 완료
```

- [ ] **Step 3: Notion에서 상태 필드 변경 확인**

Notion에서 씻다 에이전트 DB 열어 `상태` 필드가 `🟡쉬는 중` 또는 `🔴비활성`으로 업데이트됐는지 확인.

- [ ] **Step 4: Commit**

```bash
git add scripts/scan-folders.py
git commit -m "feat: scan-folders.py auto-updates Notion agent status from local folders"
```

---

## Task 8: Claude Stop 훅에 scan-folders 연결

**Files:**
- Modify: `~/.claude/settings.json`

**Interfaces:**
- Consumes: `scripts/scan-folders.py` (Task 7)
- Produces: Claude 세션 종료 시 자동으로 폴더 스캔 실행

- [ ] **Step 1: 현재 Stop 훅 확인**

```bash
cat ~/.claude/settings.json | python3 -m json.tool
```

현재 `hooks.Stop` 배열에 `log-to-notion.py` 항목이 있는지 확인.

- [ ] **Step 2: scan-folders 훅 추가**

`~/.claude/settings.json`의 `hooks.Stop` 배열에 아래 항목 추가:

```json
{
  "matcher": "",
  "hooks": [
    {
      "type": "command",
      "command": "python3 /Users/mainpc/Desktop/업무 자동화(맥미니)/Obsidian_맥미니/AI\\ 에이전트\\ 회사팀\\ 사이트/scripts/scan-folders.py"
    }
  ]
}
```

주의: 기존 Stop 훅 항목을 지우지 말고 배열에 추가.

- [ ] **Step 3: 훅 동작 확인**

새 Claude 세션을 시작하고 `/exit` 또는 세션 종료 후 터미널에서:
```bash
# scan-folders가 실행됐는지 로그 확인
# (훅은 stderr로 출력하므로 Claude UI에서 보임)
```

- [ ] **Step 4: Vercel 재배포**

```bash
cd "/Users/mainpc/Desktop/업무 자동화(맥미니)/Obsidian_맥미니/AI 에이전트 회사팀 사이트/"
git push
npx vercel deploy --prod --yes --scope leejinha99s-projects --token=<VERCEL_TOKEN>
```

- [ ] **Step 5: 라이브 URL 최종 확인**

`https://agent-hq-brown.vercel.app` 에서:
- 사장실 섹션이 탭 아래 표시되는지
- 팀 구역이 가로로 배치되는지
- 상태 배지가 올바르게 표시되는지

---

## 완료 기준 체크리스트

- [ ] `npm test` 전체 통과 (8개 이상)
- [ ] 사장실 섹션 — 탭 아래 독립 구역, 회사 변경 시 색상 변경
- [ ] 에이전트 4종 상태 — 비활성 흐릿, 쉬는 중 노랑, 작업중 초록 pulse, 막힌 빨강
- [ ] `scan-folders.py` 실행 시 Notion 상태 자동 업데이트
- [ ] Claude 세션 종료 시 자동 스캔 실행
- [ ] Vercel 라이브 URL에서 전체 동작 확인
