import { LOG_DB, notionHeaders, parseLog } from './_notion.js'

const ONE_HOUR_MS = 60 * 60 * 1000

function extractFirstText(blocks) {
  for (const b of blocks) {
    const richText = b[b.type]?.rich_text
    if (richText?.length) {
      const text = richText.map(t => t.plain_text).join('').trim()
      if (text) return text
    }
  }
  return ''
}

function computeRunState(logs) {
  if (logs.length === 0) return 'idle'
  const latest = logs[0]
  if (latest.status?.includes('오류')) return 'error'
  if (Date.now() - new Date(latest.time) < ONE_HOUR_MS) return 'running'
  return 'idle'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { company, pageId } = req.query
  const logDbId = LOG_DB[company]
  if (!logDbId) return res.status(400).json({ error: 'Unknown company' })
  if (!pageId) return res.status(400).json({ error: 'Missing pageId' })

  const childrenRes = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
    { headers: notionHeaders() }
  )
  if (!childrenRes.ok) return res.status(502).json({ error: 'Notion API error' })
  const childrenData = await childrenRes.json()
  const childPages = childrenData.results.filter(b => b.type === 'child_page')

  const subAgents = await Promise.all(childPages.map(async (block) => {
    const name = block.child_page?.title ?? ''

    const [bodyRes, logRes] = await Promise.all([
      fetch(`https://api.notion.com/v1/blocks/${block.id}/children?page_size=20`, { headers: notionHeaders() }),
      fetch(`https://api.notion.com/v1/databases/${logDbId}/query`, {
        method: 'POST',
        headers: notionHeaders(),
        body: JSON.stringify({
          filter: { property: '에이전트명', title: { equals: name } },
          sorts: [{ property: '실행시간', direction: 'descending' }],
          page_size: 3,
        }),
      }),
    ])

    const desc = bodyRes.ok ? extractFirstText((await bodyRes.json()).results) : ''
    const logs = logRes.ok ? (await logRes.json()).results.map(parseLog) : []

    return { id: block.id, name, desc, runState: computeRunState(logs) }
  }))

  res.json(subAgents)
}
