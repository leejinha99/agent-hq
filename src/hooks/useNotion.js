import { useState, useEffect, useCallback, useRef } from 'react'

const POLL_INTERVAL = 30

export function useNotion(company) {
  const [agents, setAgents] = useState([])
  const [logs, setLogs] = useState([])
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(POLL_INTERVAL)
  const countdownRef = useRef(null)

  const fetchData = useCallback(async () => {
    if (!company) return
    try {
      const [agentsRes, logsRes] = await Promise.all([
        fetch(`/api/agents?company=${encodeURIComponent(company)}`),
        fetch(`/api/logs?company=${encodeURIComponent(company)}&limit=10`),
      ])
      if (agentsRes.ok) setAgents(await agentsRes.json())
      if (logsRes.ok) {
        const data = await logsRes.json()
        setLogs(data.logs ?? [])
      }
    } catch (e) {
      console.error('Notion fetch failed:', e)
    }
    setSecondsUntilRefresh(POLL_INTERVAL)
  }, [company])

  useEffect(() => {
    fetchData()
    const pollTimer = setInterval(fetchData, POLL_INTERVAL * 1000)
    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh(s => Math.max(0, s - 1))
    }, 1000)
    return () => {
      clearInterval(pollTimer)
      clearInterval(countdownRef.current)
    }
  }, [fetchData])

  return { agents, logs, secondsUntilRefresh, refresh: fetchData }
}
