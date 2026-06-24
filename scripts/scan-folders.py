#!/usr/bin/env python3
"""
에이전트 폴더 스캔 → Notion 에이전트 DB 상태 자동 업데이트.
- 파일 없는 폴더 → 비활성
- 파일 있는 폴더 → 쉬는 중
- 1시간 이내 수정 파일 감지 → Notion 로그 자동 기록 (computeStatus가 업무중으로 표시)
Claude Stop 훅 + launchd 5분 주기에서 자동 실행.
"""
import json
import os
import re
import ssl
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib import request, error

try:
    import certifi
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL_CTX = ssl.create_default_context()

# ── 설정 ────────────────────────────────────────────────────────────────────

VAULT_BASE = Path("/Users/ijinha/옵시디언(업무)/Obsidian_macbook_local")

COMPANY_FOLDERS = {
    '씻다':  VAULT_BASE / '◈Obsidian_씻다◈',
    '세이퍼': VAULT_BASE / '◈Obsidian_세이퍼◈',
    '웰라수': VAULT_BASE / '◈Obsidian_웰라수◈',
}

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

LOG_DB = {
    '씻다':  '904a4040-625c-4867-8757-dfcfc16ec4a8',
    '세이퍼': '1510dd10-a28f-4e8c-ab76-fadf17bd188c',
    '웰라수': 'fcc6a033-a825-4c74-804a-e2cabca186a9',
}

EXCLUDE_DIRS = {'node_modules', '.git', '__pycache__', '.obsidian', 'dist', '.vite'}
ONE_HOUR = 3600
STATE_FILE = Path(__file__).parent / '.scan_state.json'

# ── API 키 로드 ──────────────────────────────────────────────────────────────

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

# ── 파일 스캔 ────────────────────────────────────────────────────────────────

def iter_files(folder: Path):
    """node_modules 등 제외하고 폴더 내 모든 파일 순회."""
    for dirpath, dirnames, filenames in os.walk(folder):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith('.')]
        for fname in filenames:
            if not fname.startswith('.'):
                yield Path(dirpath) / fname

def get_recent_mtime(folder: Path) -> tuple[float, str]:
    """가장 최근 수정된 파일의 (mtime, 파일명) 반환. 파일 없으면 (0, '')."""
    latest_mtime = 0.0
    latest_name = ''
    for f in iter_files(folder):
        try:
            mtime = f.stat().st_mtime
            if mtime > latest_mtime:
                latest_mtime = mtime
                latest_name = f.name
        except OSError:
            pass
    return latest_mtime, latest_name

def has_any_file(folder: Path) -> bool:
    return next(iter_files(folder), None) is not None

# ── 상태 파일 (중복 로그 방지) ────────────────────────────────────────────────

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding='utf-8'))
        except Exception:
            pass
    return {}

def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')

# ── Notion API ───────────────────────────────────────────────────────────────

def notion_request(method: str, path: str, body: dict | None = None) -> dict:
    url = f'https://api.notion.com/v1{path}'
    data = json.dumps(body).encode() if body else None
    req = request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with request.urlopen(req, context=_SSL_CTX) as resp:
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
        'properties': {'상태': {'select': {'name': status_value}}}
    })

def write_activity_log(company: str, agent_name: str, recent_file: str) -> None:
    db_id = LOG_DB[company]
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    payload = {
        'parent': {'database_id': db_id},
        'properties': {
            '에이전트명': {'title': [{'text': {'content': agent_name}}]},
            '업무': {'rich_text': [{'text': {'content': f'자동 감지 — {recent_file}'}}]},
            '실행시간': {'date': {'start': now}},
            '상태': {'select': {'name': '🔵작업 중'}},
            '결과': {'rich_text': [{'text': {'content': '자동화 작업 진행 중'}}]},
        }
    }
    body = json.dumps(payload).encode('utf-8')
    req = request.Request(
        'https://api.notion.com/v1/pages',
        data=body,
        headers=HEADERS,
        method='POST',
    )
    try:
        with request.urlopen(req, context=_SSL_CTX, timeout=10) as resp:
            resp.read()
        print(f'[scan-folders] 로그 기록: {company} / {agent_name} ({recent_file})')
    except Exception as e:
        print(f'[scan-folders] 로그 기록 실패: {e}', file=sys.stderr)

# ── 폴더 스캔 ────────────────────────────────────────────────────────────────

def scan_active_folders() -> tuple[dict[str, set[str]], dict[str, set[str]]]:
    """
    회사별 활성 부서/에이전트 집합 반환.
    파일 존재 여부로 활성 판단 (.md 불필요).
    """
    active_depts: dict[str, set[str]] = {}
    active_names: dict[str, set[str]] = {}

    for company, folder in COMPANY_FOLDERS.items():
        active_depts[company] = set()
        active_names[company] = set()
        if not folder.exists():
            continue
        for subfolder in folder.iterdir():
            if not subfolder.is_dir() or subfolder.name.startswith('.'):
                continue
            if not has_any_file(subfolder):
                continue  # 파일 없음 → 비활성

            match = re.search(r'Obsidian_\S+_(.+)$', subfolder.name)
            if match:
                raw_dept = unicodedata.normalize('NFC', match.group(1).strip())
                notion_dept = DEPT_MAP.get(raw_dept)
                if notion_dept:
                    active_depts[company].add(notion_dept)
            else:
                agent_name = unicodedata.normalize('NFC', subfolder.name.strip())
                active_names[company].add(agent_name)

    return active_depts, active_names

# ── 메인 ────────────────────────────────────────────────────────────────────

def main():
    if not API_KEY:
        print('[scan-folders] NOTION_API_KEY 없음 — 종료', file=sys.stderr)
        sys.exit(1)

    now = time.time()
    state = load_state()
    state_changed = False

    active_depts, active_names = scan_active_folders()
    print(f'[scan-folders] 활성 부서: { {c: list(d) for c, d in active_depts.items()} }')
    print(f'[scan-folders] 활성 에이전트(신형): { {c: list(n) for c, n in active_names.items()} }')

    # 신형 에이전트: 파일 mtime 체크 → 최근 활동 시 Notion 로그 자동 기록
    for company, folder in COMPANY_FOLDERS.items():
        if not folder.exists():
            continue
        for subfolder in folder.iterdir():
            if not subfolder.is_dir() or subfolder.name.startswith('.'):
                continue
            if re.search(r'Obsidian_\S+_(.+)$', subfolder.name):
                continue  # 구형 폴더는 로그 자동 기록 제외

            agent_name = unicodedata.normalize('NFC', subfolder.name.strip())
            recent_mtime, recent_file = get_recent_mtime(subfolder)

            if recent_mtime == 0:
                continue  # 파일 없음

            if now - recent_mtime < ONE_HOUR:
                last_mtime = state.get(agent_name, {}).get('last_mtime', 0)
                if recent_mtime > last_mtime:
                    write_activity_log(company, agent_name, recent_file)
                    state[agent_name] = {'last_mtime': recent_mtime}
                    state_changed = True

    if state_changed:
        save_state(state)

    # Notion 에이전트 상태 업데이트 (쉬는 중 / 비활성)
    for company, db_id in AGENT_DB.items():
        agents = get_all_agents(db_id)
        for agent in agents:
            props = agent.get('properties', {})
            dept_raw = props.get('부서', {}).get('select', {})
            dept = dept_raw.get('name', '') if dept_raw else ''
            name = (props.get('에이전트명', {}).get('title') or [{}])[0].get('plain_text', '?')
            current_status = (props.get('상태', {}).get('select') or {}).get('name', '')

            dept_active = dept in active_depts.get(company, set())
            name_active = name in active_names.get(company, set())

            if dept_active or name_active:
                new_status = '🟡쉬는 중'
            else:
                new_status = '🔴비활성'

            if current_status != new_status:
                update_agent_status(agent['id'], new_status)
                print(f'[scan-folders] {company} / {name}: {current_status} → {new_status}')

    print('[scan-folders] 완료')

if __name__ == '__main__':
    main()
