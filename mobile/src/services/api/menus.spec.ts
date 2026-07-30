import { afterEach, describe, expect, it, vi } from 'vitest'

import { getMenuDetail } from './menus'
import type { MenuDetail } from '@/types/domain'

const menu = {
  id: 'menu/with space',
  slug: 'menu-with-space',
  name: 'Menu Uji',
  description: 'Menu untuk pengujian.',
  mealType: 'breakfast',
  servingSizeG: 250,
  servingDescription: '1 porsi (250 g)',
  tags: ['sarapan'],
  allergens: [],
  ingredients: [],
  nutrition: {},
  nutritionSource: 'Tabel Komposisi Pangan Indonesia 2017',
  calculationVersion: 'tkpi-weighted-v1',
} as unknown as MenuDetail

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('menu detail API', () => {
  it('encodes the identifier and returns the menu payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { menu } }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getMenuDetail('menu/with space', 'access-token'),
    ).resolves.toEqual(menu)

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/menus/menu%2Fwith%20space')
    expect(new Headers(options.headers).get('authorization')).toBe(
      'Bearer access-token',
    )
  })
})
