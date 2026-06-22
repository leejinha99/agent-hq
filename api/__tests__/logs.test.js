import { describe, it, expect } from 'vitest'
import { parseLog, LOG_DB } from '../_notion.js'

describe('parseLog', () => {
  it('extracts all fields from Notion page', () => {
    const page = {
      id: 'log-123',
      properties: {
        '에이전트명': { title: [{ plain_text: 'safer_app_backend' }] },
        '업무': { rich_text: [{ plain_text: '백엔드 배포' }] },
        '실행시간': { date: { start: '2026-06-22T09:00:00.000Z' } },
        '상태': { select: { name: '✅완료' } },
        '결과': { rich_text: [{ plain_text: '배포 성공' }] },
        '상세정보': { rich_text: [{ plain_text: '서버 재시작 완료' }] },
      },
    }
    const result = parseLog(page)
    expect(result).toEqual({
      id: 'log-123',
      agentName: 'safer_app_backend',
      task: '백엔드 배포',
      time: '2026-06-22T09:00:00.000Z',
      status: '✅완료',
      result: '배포 성공',
      detail: '서버 재시작 완료',
    })
  })

  it('returns safe defaults when properties are missing', () => {
    const page = { id: 'xyz', properties: {} }
    const result = parseLog(page)
    expect(result.agentName).toBe('')
    expect(result.time).toBeNull()
    expect(result.status).toBe('')
  })
})

describe('LOG_DB', () => {
  it('has entries for all three companies', () => {
    expect(LOG_DB['씻다']).toBeTruthy()
    expect(LOG_DB['세이퍼']).toBeTruthy()
    expect(LOG_DB['웰라수']).toBeTruthy()
  })
})
