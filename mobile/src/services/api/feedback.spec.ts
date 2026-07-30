import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getMenuFeedback,
  updateMenuFeedback,
} from './feedback'
import type { UserMenuFeedback } from '@/types/domain'

const feedback: UserMenuFeedback = {
  userId: 'user-1',
  menuId: 'menu/1',
  liked: true,
  disliked: false,
  consumed: true,
  updatedAt: '2026-07-28T10:00:00.000Z',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('menu feedback API', () => {
  it('loads and updates an encoded menu identifier', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ data: { feedback } }),
            { status: 200 },
          ),
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getMenuFeedback('access-token', 'menu/1'),
    ).resolves.toEqual(feedback)
    await expect(
      updateMenuFeedback('access-token', 'menu/1', {
        disliked: true,
      }),
    ).resolves.toEqual(feedback)

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/feedback/menu%2F1')

    const [, options] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ]
    expect(options.method).toBe('PUT')
    expect(options.body).toBe(JSON.stringify({ disliked: true }))
    expect(new Headers(options.headers).get('authorization')).toBe(
      'Bearer access-token',
    )
  })
})
