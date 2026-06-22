#!/usr/bin/env python3
"""
Claude Code stop hook: 작업 완료 시 Notion 로그 DB에 자동 기록
전역 훅으로 설치: ~/.claude/settings.json 의 stop hooks에 등록
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib import request, error

def _load_api_key() -> str:
    key = os.environ.get('NOTION_API_KEY', '')
    if key:
        return key
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            if line.startswith('NOTION_API_KEY='):
                return line.split('=', 1)[1].strip()
    return ''

NOTION_API_KEY = _load_api_key()

LOG_DB = {
    '씻다':  '904a4040-625c-4867-8757-dfcfc16ec4a8',
    '세이퍼': '1510dd10-a28f-4e8c-ab76-fadf17bd188c',
    '웰라수': 'fcc6a033-a825-4c74-804a-e2cabca186a9',
}

def get_company(agent_name: str) -> str | None:
    if agent_name.startswith('seatda_'):  return '씻다'
    if agent_name.startswith('safer_'):   return '세이퍼'
    if agent_name.startswith('wellasu_'): return '웰라수'
    return None

def find_claude_md(cwd: str) -> Path | None:
    path = Path(cwd)
    for parent in [path, *path.parents]:
        candidate = parent / 'CLAUDE.md'
        if candidate.exists():
            return candidate
    return None

def parse_agent(claude_md: Path) -> str | None:
    try:
        content = claude_md.read_text(encoding='utf-8')
        match = re.search(r'^agent:\s*(.+)$', content, re.MULTILINE)
        return match.group(1).strip() if match else None
    except Exception:
        return None

def get_task_desc(transcript_path: str) -> str:
    if not transcript_path or not os.path.exists(transcript_path):
        return '작업 완료'
    try:
        with open(transcript_path, encoding='utf-8') as f:
            lines = f.readlines()
        for line in reversed(lines):
            try:
                msg = json.loads(line.strip())
                if msg.get('role') == 'user':
                    content = msg.get('content', '')
                    if isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict) and block.get('type') == 'text':
                                return block['text'][:200].strip()
                    return str(content)[:200].strip()
            except Exception:
                continue
    except Exception:
        pass
    return '작업 완료'

def post_to_notion(company: str, agent_name: str, task_desc: str) -> None:
    db_id = LOG_DB[company]
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    payload = {
        'parent': {'database_id': db_id},
        'properties': {
            '에이전트명': {'title': [{'text': {'content': agent_name}}]},
            '업무': {'rich_text': [{'text': {'content': task_desc}}]},
            '실행시간': {'date': {'start': now}},
            '상태': {'select': {'name': '✅완료'}},
            '결과': {'rich_text': [{'text': {'content': '작업 완료'}}]},
        }
    }
    body = json.dumps(payload).encode('utf-8')
    req = request.Request(
        'https://api.notion.com/v1/pages',
        data=body,
        headers={
            'Authorization': f'Bearer {NOTION_API_KEY}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    with request.urlopen(req) as resp:
        if resp.status not in (200, 201):
            raise RuntimeError(f'Notion API error: {resp.status}')

def main() -> None:
    if not NOTION_API_KEY:
        sys.exit(0)

    try:
        hook_data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    cwd = hook_data.get('cwd', os.getcwd())
    transcript_path = hook_data.get('transcript_path', '')

    claude_md = find_claude_md(cwd)
    if not claude_md:
        sys.exit(0)

    agent_name = parse_agent(claude_md)
    if not agent_name:
        sys.exit(0)

    company = get_company(agent_name)
    if not company:
        sys.exit(0)

    task_desc = get_task_desc(transcript_path)

    try:
        post_to_notion(company, agent_name, task_desc)
    except Exception as e:
        sys.stderr.write(f'[agent-hq hook] Notion post failed: {e}\n')
        sys.exit(0)

if __name__ == '__main__':
    main()
