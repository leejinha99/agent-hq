import { describe, it, expect } from 'vitest'
import { parseAgent, AGENT_DB } from '../_notion.js'

describe('parseAgent', () => {
  it('extracts all fields from Notion page', () => {
    const page = {
      id: 'abc-123',
      properties: {
        '에이전트명': { title: [{ plain_text: 'safer_app_backend' }] },
        '부서': { select: { name: '앱관리' } },
        '상태': { select: { name: '🟢활성' } },
        '온라인여부': { checkbox: true },
        '아이콘': { rich_text: [{ plain_text: '🤖' }] },
        '설명': { rich_text: [{ plain_text: '백엔드 담당' }] },
        '담당업무': { rich_text: [{ plain_text: '백엔드 개발' }] },
        '마지막실행시간': { date: { start: '2026-06-22T09:00:00.000Z' } },
        'PC': { select: { name: '맥미니' } },
        '저장파일': { select: { name: '아이클라우드' } },
        '자동화/에이전트': { multi_select: [{ name: 'VS코드' }] },
      },
    }
    const result = parseAgent(page)
    expect(result).toEqual({
      id: 'abc-123',
      name: 'safer_app_backend',
      department: '앱관리',
      status: '🟢활성',
      online: true,
      icon: '🤖',
      description: '백엔드 담당',
      task: '백엔드 개발',
      lastRun: '2026-06-22T09:00:00.000Z',
      pc: '맥미니',
      storage: '아이클라우드',
      type: ['VS코드'],
    })
  })

  it('returns safe defaults when properties are missing', () => {
    const page = { id: 'xyz', properties: {} }
    const result = parseAgent(page)
    expect(result.name).toBe('')
    expect(result.online).toBe(false)
    expect(result.lastRun).toBeNull()
  })
})

describe('AGENT_DB', () => {
  it('has entries for all three companies', () => {
    expect(AGENT_DB['씻다']).toBeTruthy()
    expect(AGENT_DB['세이퍼']).toBeTruthy()
    expect(AGENT_DB['웰라수']).toBeTruthy()
  })
})
