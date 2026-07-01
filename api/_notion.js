export const AGENT_DB = {
  '씻다': '64911ccd-aa0d-8319-b60e-8138d6f778ed',
  '세이퍼': '49511ccd-aa0d-83e0-8d7b-81a4b519c3f4',
  '웰라수': '7f611ccd-aa0d-82ca-b5ff-0120ec952fea',
}

export const LOG_DB = {
  '씻다': 'ca011ccd-aa0d-8252-9a6e-01cb9b746942',
  '세이퍼': '3e611ccd-aa0d-8393-8c25-0104069acd40',
  '웰라수': '95b11ccd-aa0d-83cf-9f7d-0154271b76cb',
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
    pc: p['PC']?.select?.name ?? '',
    storage: p['저장파일']?.select?.name ?? '',
    type: (p['자동화/에이전트']?.multi_select ?? []).map(t => t.name),
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
