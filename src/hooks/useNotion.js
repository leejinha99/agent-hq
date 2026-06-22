import { useState, useEffect, useCallback, useRef } from 'react'

const ONE_HOUR_MS = 60 * 60 * 1000

export function computeStatus(agent, logs) {
  if (agent.status === '🔴비활성') return 'inactive'
  const agentLogs = logs.filter(l => l.agentName === agent.name)
  if (agentLogs.length === 0) return 'resting'
  const latest = agentLogs.sort((a, b) => new Date(b.time) - new Date(a.time))[0]
  if (latest.status?.includes('오류')) return 'blocked'
  if (Date.now() - new Date(latest.time) < ONE_HOUR_MS) return 'working'
  return 'resting'
}

const POLL_INTERVAL = 30

export function useNotion(company) {
  const [agents, setAgents] = useState([])
  const [logs, setLogs] = useState([])
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(POLL_INTERVAL)
  const [fetchError, setFetchError] = useState(null)
  const countdownRef = useRef(null)

  const fetchData = useCallback(async () => {
    if (!company) return
    setFetchError(null)
    try {
      const [agentsRes, logsRes] = await Promise.all([
        fetch(`/api/agents?company=${encodeURIComponent(company)}`),
        fetch(`/api/logs?company=${encodeURIComponent(company)}&limit=10`),
      ])

      if (!agentsRes.ok) {
        const txt = await agentsRes.text().catch(() => agentsRes.status)
        setFetchError(`agents API ${agentsRes.status}: ${txt}`)
        setSecondsUntilRefresh(POLL_INTERVAL)
        return
      }

      const agentsData = await agentsRes.json()
      let logsArr = []
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        logsArr = logsData.logs ?? []
      }
      setLogs(logsArr)
      setAgents(agentsData.map(a => ({ ...a, computedStatus: computeStatus(a, logsArr) })))
    } catch (e) {
      console.error('Notion fetch failed:', e)
      setFetchError(`네트워크 오류: ${e.message}`)
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

  return { agents, logs, secondsUntilRefresh, fetchError, refresh: fetchData }
}
