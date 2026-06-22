export const AGENT_DB = {
  '씻다': '38711ccd-aa0d-80bb-ba45-ed23022c72ac',
  '세이퍼': '38711ccd-aa0d-8055-b6a3-ce867c2f53c4',
  '웰라수': '38711ccd-aa0d-8074-b834-c8c0c16bc09e',
}

export const LOG_DB = {
  '씻다': '904a4040-625c-4867-8757-dfcfc16ec4a8',
  '세이퍼': '1510dd10-a28f-4e8c-ab76-fadf17bd188c',
  '웰라수': 'fcc6a033-a825-4c74-804a-e2cabca186a9',
}

export function notionHeaders() {
  return {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }
}

export function parseAgent(page) {
  const p = page.properties
  return {
    id: page.id,
    name: p['에이전트명']?.title?.[0]?.plain_text ?? '',
    department: p['부서']?.select?.name ?? '',
    status: p['상태']?.select?.name ?? '',
    online: p['온라인여부']?.checkbox ?? false,
    icon: p['아이콘']?.rich_text?.[0]?.plain_text ?? '',
    description: p['설명']?.rich_text?.[0]?.plain_text ?? '',
    task: p['담당업무']?.rich_text?.[0]?.plain_text ?? '',
    lastRun: p['마지막실행시간']?.date?.start ?? null,
  }
}

export function parseLog(page) {
  const p = page.properties
  return {
    id: page.id,
    agentName: p['에이전트명']?.title?.[0]?.plain_text ?? '',
    task: p['업무']?.rich_text?.[0]?.plain_text ?? '',
    time: p['실행시간']?.date?.start ?? null,
    status: p['상태']?.select?.name ?? '',
    result: p['결과']?.rich_text?.[0]?.plain_text ?? '',
    detail: p['상세정보']?.rich_text?.[0]?.plain_text ?? '',
  }
}
