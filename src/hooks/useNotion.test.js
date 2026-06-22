import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNotion, computeStatus } from './useNotion'

const mockAgents = [{ id: '1', name: 'safer_app_backend', department: '앱관리' }]
const mockLogs = { logs: [{ id: '2', agentName: 'safer_app_backend', status: '✅완료' }], hasMore: false, nextCursor: null }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url.includes('/api/agents')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAgents) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLogs) })
  }))
})

describe('useNotion', () => {
  it('fetches agents and logs on mount', async () => {
    const { result } = renderHook(() => useNotion('세이퍼'))
    await waitFor(() => expect(result.current.agents.length).toBe(1))
    expect(result.current.agents[0].name).toBe('safer_app_backend')
    expect(result.current.logs.length).toBe(1)
  })

  it('starts countdown at 30', async () => {
    const { result } = renderHook(() => useNotion('씻다'))
    await waitFor(() => expect(result.current.agents).toBeDefined())
    expect(result.current.secondsUntilRefresh).toBe(30)
  })
})

describe('computeStatus', () => {
  const baseAgent = { name: 'seatda_marketing', status: '🟡쉬는 중' }

  it('returns inactive when agent status is 🔴비활성', () => {
    const agent = { ...baseAgent, status: '🔴비활성' }
    expect(computeStatus(agent, [])).toBe('inactive')
  })

  it('returns resting when active but no logs', () => {
    expect(computeStatus(baseAgent, [])).toBe('resting')
  })

  it('returns working when latest log is within 1 hour', () => {
    const recentLog = {
      agentName: 'seatda_marketing',
      time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: '✅완료',
    }
    expect(computeStatus(baseAgent, [recentLog])).toBe('working')
  })

  it('returns resting when latest log is older than 1 hour', () => {
    const oldLog = {
      agentName: 'seatda_marketing',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: '✅완료',
    }
    expect(computeStatus(baseAgent, [oldLog])).toBe('resting')
  })

  it('returns blocked when latest log status is 오류', () => {
    const errorLog = {
      agentName: 'seatda_marketing',
      time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: '❌오류',
    }
    expect(computeStatus(baseAgent, [errorLog])).toBe('blocked')
  })

  it('ignores logs from other agents', () => {
    const otherLog = {
      agentName: 'other_agent',
      time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: '✅완료',
    }
    expect(computeStatus(baseAgent, [otherLog])).toBe('resting')
  })
})
