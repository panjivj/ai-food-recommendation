import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiRequest, ApiError } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('API client', () => {
  it('sends JSON and a Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/profile', {
      method: 'PUT',
      body: { name: 'Alya' },
      token: 'access-token',
    })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(options.headers)
    expect(headers.get('authorization')).toBe('Bearer access-token')
    expect(headers.get('content-type')).toBe('application/json')
    expect(options.body).toBe(JSON.stringify({ name: 'Alya' }))
  })

  it('maps backend errors into ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'Profile not found',
              requestId: 'request-1',
            },
          }),
          { status: 404 },
        ),
      ),
    )

    await expect(apiRequest('/profile')).rejects.toMatchObject({
      status: 404,
      code: 'PROFILE_NOT_FOUND',
      requestId: 'request-1',
    } satisfies Partial<ApiError>)
  })

  it('reports network failures consistently', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(apiRequest('/health')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    } satisfies Partial<ApiError>)
  })
})
