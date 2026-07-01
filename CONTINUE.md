# Agent HQ Dashboard — 핸드오프 노트 (2026-06-22)

## 현재 상태
Task 1~9 구현 완료. **Task 10 (Vercel 배포)만 남음.**

## 완료된 작업
- React+Vite 스캐폴드, Vercel 설정
- `/api/agents`, `/api/logs` 서버리스 함수
- `useNotion` 30초 폴링 훅
- Header, CompanyTabs, OfficeFloor, DeskCard, AgentChar
- TeamPanel (AgentProfile + TeamStats)
- LogBar + LogModal
- Claude Stop 훅 스크립트 (`scripts/log-to-notion.py`) + `~/.claude/settings.json` 등록 완료
- 테스트: 3 파일, 8개 전체 통과
- git: 10개 커밋 (main 브랜치)

## 남은 작업 (Task 10)
1. GitHub 레포 생성 → `git remote add origin <URL> && git push -u origin main`
2. Vercel 대시보드 → Environment Variables → `NOTION_API_KEY` 등록
3. `npx vercel --prod` 배포
4. 배포 후 기능 체크리스트 확인 (플랜 Task 10 Step 4 참조)
