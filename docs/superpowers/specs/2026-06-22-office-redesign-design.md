# Agent HQ 오피스 리디자인 + 자동 상태 감지 설계

**날짜:** 2026-06-22  
**대상:** Agent HQ 대시보드 (https://agent-hq-brown.vercel.app)

---

## 1. 목표

1. 현재 카드 뉴스형 레이아웃 → 아이소메트릭 오피스 레이아웃으로 교체
2. 모든 에이전트를 책상에 배치하되, 폴더/로그 기반으로 상태를 자동 감지

---

## 2. UI 설계

### 2-1. 전체 레이아웃

```
┌────────────────────────────────────────────────────┐
│                   Header                           │
├────────────────────────────────────────────────────┤
│              CompanyTabs (씻다/세이퍼/웰라수)         │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │  🏢 사장실                                    │  │
│  │  👤 이진하 대표 — 관리자 책상 (독립 구역)       │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 마케팅 팀 │ │ 디자인 팀 │ │ 지원사업팀│  ...      │
│  │ 🖥 🖥 🖥 │ │ 🖥 🖥   │ │ 🖥 🖥 🖥 │           │
│  └──────────┘ └──────────┘ └──────────┘           │
├────────────────────────────────────────────────────┤
│                  LogBar                            │
└────────────────────────────────────────────────────┘
```

### 2-2. CEO 섹션 (`CeoDesk` 컴포넌트)

- 회사 탭 바로 아래, 팀 구역 위에 독립 배치
- 내용: 캐릭터 아이콘 + "이진하 대표" + "관리자" 배지 + 현재 회사 색상 테두리
- 배경색: `#1a1a24` (팀 구역과 구분)
- 아이소메트릭 책상 스타일 적용

### 2-3. 팀 구역 (`OfficeFloor` 개편)

- 팀별 구역을 CSS Grid로 가로 배치 (현재 세로 목록 → 가로 그리드)
- 각 팀 구역에 팀 이름 라벨 + 책상들 배치
- 에이전트가 없는 팀도 "빈 책상" 플레이스홀더 표시

**회사별 팀 구성:**

| 씻다 | 세이퍼 | 웰라수 |
|---|---|---|
| 마케팅 | 마케팅 | 마케팅 |
| 디자인 | 디자인 | 디자인 |
| 지원사업 | 지원사업 | 재무회계 |
| 재무회계 | 재무회계 | 유지관리 |
| CS | 앱관리 | CS |
| | CS | |

### 2-4. 에이전트 책상 (`DeskCard`) — 4종 상태

모든 에이전트는 항상 책상에 표시됨. 상태만 다름.

| 상태 | 색 | 시각 처리 | 조건 |
|---|---|---|---|
| 비활성 | 회색 `#374151` | 책상 흐릿, 캐릭터 투명도 40% | 폴더 없음 |
| 쉬는 중 | 노랑 `#eab308` | 정상 표시, 노란 배지 | 폴더 있음 + 로그 없거나 1시간 초과 |
| 작업중 | 초록 `#22c55e` | pulse 애니메이션, 초록 배지 | 폴더 있음 + 1시간 내 로그 |
| 막힌 | 빨강 `#ef4444` | 빨간 배지, 캐릭터 정지 | 폴더 있음 + 최근 로그 상태 = 오류 |

### 2-5. 아이소메트릭 스타일

- CSS `transform: rotateX(30deg) rotateZ(-45deg)` 로 책상에 기울기 적용
- 팀 구역 카드는 평면 유지, 책상 아이콘만 3D 기울기
- 다크 배경 `#0f0f14` 유지

---

## 3. 자동 상태 감지 설계

### 3-1. 상태 판단 로직

```
if 해당 부서 폴더 존재 AND .md 파일 있음:
    if 최근 1시간 내 로그 AND 로그 상태 ≠ 오류:
        → 작업중
    elif 최근 로그 상태 == 오류:
        → 막힌
    else:
        → 쉬는 중
else:
    → 비활성
```

### 3-2. 폴더 스캔 스크립트 (`scripts/scan-folders.py`)

**스캔 경로:**
```
/Users/ijinha/옵시디언(업무)/Obsidian_macbook_local/◈Obsidian_{회사}◈/{번호}. Obsidian_{회사}_{부서}/
```

**부서명 매핑 (폴더명 → Notion `department` 필드):**
```python
DEPT_MAP = {
    '마케팅': '마케팅',
    '유튜브': '마케팅',
    '디자인': '디자인',
    '정부지원사업': '지원사업',
    '재무회계': '재무회계',
    '유지보수': '유지관리',
    '앱관리': '앱관리',
    'CS': 'CS',
}
```

**동작 순서:**
1. 3개 회사 폴더 순회
2. 각 부서 하위 폴더 내 `.md` 파일 존재 확인
3. `active_depts[company] = set(dept_names)` 구성
4. Notion 에이전트 DB 조회
5. 에이전트의 `company + department`가 `active_depts`에 있으면 `상태` → `🟡쉬는 중`
6. 없으면 → `🔴비활성`
7. 로그 기반 작업중/막힌 판단은 프론트엔드에서 처리

**실행 방식:**
- Claude Stop 훅 (`~/.claude/settings.json`)에 추가하여 Claude 세션 종료 시 자동 실행
- 수동 실행도 가능: `python3 scripts/scan-folders.py`

### 3-3. Notion 상태 필드 값 표준

| 값 | 의미 |
|---|---|
| `🔴비활성` | 폴더 없음 (에이전트 미생성) |
| `🟡쉬는 중` | 폴더 있음, 최근 활동 없음 |
| `🟢활성` | 폴더 있음 (로그 기반 세부 상태는 프론트에서 계산) |

### 3-4. 프론트엔드 상태 계산 (`useNotion.js` 확장)

```js
function computeStatus(agent, logs) {
  if (agent.status === '🔴비활성') return 'inactive'
  const agentLogs = logs.filter(l => l.agentName === agent.name)
  if (agentLogs.length === 0) return 'resting'
  const latest = agentLogs.sort((a, b) => new Date(b.time) - new Date(a.time))[0]
  if (latest.status === '오류') return 'blocked'
  const diffMs = Date.now() - new Date(latest.time)
  if (diffMs < 60 * 60 * 1000) return 'working'
  return 'resting'
}
```

---

## 4. 변경 파일 목록

### 신규 생성
- `src/components/CeoDesk.jsx` — 사장실 섹션
- `src/components/CeoDesk.css`
- `scripts/scan-folders.py` — 폴더 스캔 + Notion 상태 업데이트

### 수정
- `src/components/OfficeFloor.jsx` — 가로 그리드 레이아웃으로 변경
- `src/components/OfficeFloor.css` — 아이소메트릭 스타일
- `src/components/DeskCard.jsx` — 4종 상태 배지 추가
- `src/components/DeskCard.css` — 상태별 시각 스타일
- `src/hooks/useNotion.js` — `computeStatus` 로직 추가
- `src/App.jsx` — CeoDesk 컴포넌트 삽입
- `~/.claude/settings.json` — Stop 훅에 scan-folders 추가

---

## 5. 완료 기준

- [ ] 사장실 섹션이 팀 구역 위에 독립적으로 표시됨
- [ ] 모든 에이전트가 팀 책상에 배치되고 4종 상태가 시각적으로 구분됨
- [ ] `scan-folders.py` 실행 시 Notion 상태 필드가 자동 업데이트됨
- [ ] Claude 세션 종료 시 자동으로 폴더 스캔 실행됨
- [ ] 로그 1시간 기준으로 작업중/쉬는 중 자동 전환
