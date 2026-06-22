import { LOG_DB, notionHeaders, parseLog } from './_notion.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { company, limit = '10', cursor } = req.query
  const dbId = LOG_DB[company]
  if (!dbId) return res.status(400).json({ error: 'Unknown company' })

  const body = {
    page_size: Math.min(parseInt(limit), 100),
    sorts: [{ property: '실행시간', direction: 'descending' }],
  }
  if (cursor) body.start_cursor = cursor

  const response = await fetch(
    `https://api.notion.com/v1/databases/${dbId}/query`,
    { method: 'POST', headers: notionHeaders(), body: JSON.stringify(body) }
  )
  if (!response.ok) return res.status(502).json({ error: 'Notion API error' })

  const data = await response.json()
  res.json({
    logs: data.results.map(parseLog),
    hasMore: data.has_more,
    nextCursor: data.next_cursor ?? null,
  })
}
