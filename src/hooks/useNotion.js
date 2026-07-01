import { useState, useEffect, useCallback, useRef } from 'react'

const STATUS_MAP = {
  '🟢활성': 'active',
  '🟡개발중': 'developing',
  '🟡쉬는 중': 'active',
  '🔴비활성': 'inactive',
}

export function computeStatus(agent) {
  return STATUS_MAP[agent.status] ?? 'inactive'
}

const POLL_INTERVAL = 300

export function useNotion(company) {
  const [agents, setAgents] = useState([])
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(POLL_INTERVAL)
  const [fetchError, setFetchError] = useState(null)
  const countdownRef = useRef(null)

  const fetchData = useCallback(async () => {
    if (!company) return
    setFetchError(null)
    try {
      const res = await fetch(`/api/agents?company=${encodeURIComponent(company)}`)

      if (!res.ok) {
        const txt = await res.text().catch(() => res.status)
        setFetchError(`agents API ${res.status}: ${txt}`)
        setSecondsUntilRefresh(POLL_INTERVAL)
        return
      }

      const agentsData = await res.json()
      setAgents(agentsData.map(a => ({ ...a, computedStatus: computeStatus(a) })))
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

  return { agents, secondsUntilRefresh, fetchError, refresh: fetchData }
}
