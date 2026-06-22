import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNotion } from './useNotion'

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
