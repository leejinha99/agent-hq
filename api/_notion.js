export const AGENT_DB = {
  '씻다': '38711ccd-aa0d-8068-b847-000bc4c98724',
  '세이퍼': 'e7d11ccd-aa0d-8204-b52b-07675c8e5926',
  '웰라수': '38711ccd-aa0d-80bc-ba7f-000b512f34ee',
}

export const LOG_DB = {
  '씻다': '097a01d3-ded2-49e7-8c4a-7fba055a5560',
  '세이퍼': '7d5894c4-b787-49ff-a3e8-07058023d779',
  '웰라수': 'f7119b72-471c-4925-b28c-dd8776b5523c',
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
