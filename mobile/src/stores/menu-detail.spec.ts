import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { ApiError } from '@/services/api/client'
import { getMenuDetail } from '@/services/api/menus'
import { generateRecommendationAiExplanation } from '@/services/api/recommendations'
import { useAuthStore } from '@/stores/auth'
import { useMenuDetailStore } from '@/stores/menu-detail'
import type { MenuDetail } from '@/types/domain'

vi.mock('@/services/api/menus', () => ({
  getMenuDetail: vi.fn(),
}))
vi.mock('@/services/api/recommendations', () => ({
  generateRecommendationAiExplanation: vi.fn(),
}))

const menu = {
  id: 'menu-1',
  name: 'Menu Uji',
  ingredients: [],
  allergens: [],
  tags: [],
  nutrition: {},
} as unknown as MenuDetail

describe('menu detail store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().accessToken = 'access-token'
  })

  it('loads a menu detail with the active session', async () => {
    vi.mocked(getMenuDetail).mockResolvedValue(menu)
    const store = useMenuDetailStore()

    await store.fetch('menu-1')

    expect(getMenuDetail).toHaveBeenCalledWith('menu-1', 'access-token')
    expect(store.menu).toEqual(menu)
    expect(store.loading).toBe(false)
  })

  it('maps MENU_NOT_FOUND without retaining stale menu data', async () => {
    vi.mocked(getMenuDetail).mockRejectedValue(
      new ApiError(404, 'MENU_NOT_FOUND', 'Menu not found'),
    )
    const store = useMenuDetailStore()
    store.menu = menu

    await store.fetch('missing-menu')

    expect(store.menu).toBeNull()
    expect(store.errorCode).toBe('MENU_NOT_FOUND')
    expect(store.errorMessage).toContain('tidak ditemukan')
  })

  it('loads a guarded AI explanation for the recommendation context', async () => {
    const explanation = {
      summary: 'Menu dipilih berdasarkan konteks rekomendasi.',
      highlights: [
        {
          title: 'Kecocokan',
          detail: 'Pilihan selaras dengan kebutuhan waktu makan.',
        },
        {
          title: 'Preferensi',
          detail: 'Bahan mempertimbangkan preferensi pengguna.',
        },
      ],
      disclaimer: 'Nilai gizi tetap berasal dari backend.',
      generatedAt: '2026-07-28T10:00:00.000Z',
      model: 'openrouter/free',
    }
    vi.mocked(generateRecommendationAiExplanation).mockResolvedValue(
      explanation,
    )
    const store = useMenuDetailStore()

    await store.fetchAiExplanation({
      date: '2026-07-28',
      mealType: 'breakfast',
      menuId: 'menu-1',
    })

    expect(generateRecommendationAiExplanation).toHaveBeenCalledWith({
      token: 'access-token',
      date: '2026-07-28',
      mealType: 'breakfast',
      menuId: 'menu-1',
    })
    expect(store.aiExplanation).toEqual(explanation)
    expect(store.aiLoading).toBe(false)
    expect(store.aiErrorMessage).toBeNull()
  })
})
