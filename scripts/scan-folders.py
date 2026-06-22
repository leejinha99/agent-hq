#!/usr/bin/env python3
"""
에이전트 폴더 스캔 → Notion 에이전트 DB 상태 자동 업데이트.
Claude Stop 훅에서 자동 실행되거나 수동으로 실행 가능.
"""
import os
import re
import ssl
import sys
from pathlib import Path
from urllib import request, error
import json

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
