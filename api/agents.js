import { AGENT_DB, notionHeaders, parseAgent } from './_notion.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { company } = req.query
  const dbId = AGENT_DB[company]
  if (!dbId) return res.status(400).json({ error: 'Unknown company' })

  const response = await fetch(
    `https://api.notion.com/v1/databases/${dbId}/query`,
    { method: 'POST', headers: notionHeaders(), body: JSON.stringify({ page_size: 100 }) }
  )
  if (!response.ok) return res.status(502).json({ error: 'Notion API error' })

  const data = await response.json()
  res.json(data.results.map(parseAgent))
}
