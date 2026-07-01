import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNotion, computeStatus } from './useNotion'

const mockAgents = [{ id: '1', name: 'safer_app_backend', department: '앱관리', status: '🟢활성' }]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(mockAgents) })
  ))
})

describe('useNotion', () => {
  it('fetches agents on mount and attaches computedStatus', async () => {
    const { result } = renderHook(() => useNotion('세이퍼'))
    await waitFor(() => expect(result.current.agents.length).toBe(1))
    expect(result.current.agents[0].name).toBe('safer_app_backend')
    expect(result.current.agents[0].computedStatus).toBe('active')
  })

  it('starts countdown at 300', async () => {
    const { result } = renderHook(() => useNotion('씻다'))
    await waitFor(() => expect(result.current.agents).toBeDefined())
    expect(result.current.secondsUntilRefresh).toBe(300)
  })
})

describe('computeStatus', () => {
  it('maps 🟢활성 to active', () => {
    expect(computeStatus({ status: '🟢활성' })).toBe('active')
  })

  it('maps 🟡개발중 to developing', () => {
    expect(computeStatus({ status: '🟡개발중' })).toBe('developing')
  })

  it('maps 🟡쉬는 중 to active', () => {
    expect(computeStatus({ status: '🟡쉬는 중' })).toBe('active')
  })

  it('maps 🔴비활성 to inactive', () => {
    expect(computeStatus({ status: '🔴비활성' })).toBe('inactive')
  })

  it('defaults unknown status to inactive', () => {
    expect(computeStatus({ status: '' })).toBe('inactive')
  })
})
