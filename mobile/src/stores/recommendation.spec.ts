import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { ApiError } from '@/services/api/client'
import {
  getConversationalRecommendationAlternatives,
  getDailyRecommendation,
  getRecommendationAlternatives,
  getWeeklyRecommendations,
  replaceRecommendationItem,
} from '@/services/api/recommendations'
import { useAuthStore } from '@/stores/auth'
import {
  localDateKey,
  useRecommendationStore,
} from '@/stores/recommendation'
import type {
  DailyRecommendationItem,
  DailyRecommendationResult,
  RecommendationAlternativeSearch,
} from '@/types/domain'

vi.mock('@/services/api/recommendations', () => ({
  getConversationalRecommendationAlternatives: vi.fn(),
  getDailyRecommendation: vi.fn(),
  getRecommendationAlternatives: vi.fn(),
  getWeeklyRecommendations: vi.fn(),
  replaceRecommendationItem: vi.fn(),
}))

function recommendationItem(
  mealType: 'breakfast' | 'lunch',
  menuId: string,
  energyKcal: number,
): DailyRecommendationItem {
  return {
    mealType,
    targetCalories: mealType === 'breakfast' ? 500 : 700,
    menu: {
      id: menuId,
      slug: menuId,
      name: `Menu ${menuId}`,
      description: 'Menu uji',
      mealType,
      servingSizeG: 100,
      servingDescription: '1 porsi',
      nutrition: {
        energyKcal,
        proteinG: 10,
        fatG: 5,
        carbohydrateG: 30,
        fiberG: 3,
        sodiumMg: 100,
      },
      tags: [],
      allergens: [],
      ingredientNames: [],
    },
    score: {
      total: 80,
      breakdown: {
        calorieFit: 70,
        preferenceMatch: 5,
        dailyRotation: 5,
      },
      calorieDifference: 20,
      calorieDifferencePercent: 4,
      matchedPreferences: [],
    },
    reasons: [],
  }
}

const breakfast = recommendationItem('breakfast', 'menu-1', 480)
const lunch = recommendationItem('lunch', 'menu-2', 710)

const recommendation = {
  id: 'recommendation-1',
  date: '2026-07-28',
  items: [breakfast, lunch],
  dailyTargetCalories: 2000,
  totalRecommendedCalories: 1985,
  differenceFromDailyTargetCalories: -15,
  filterStats: {},
  appliedProfileRules: {
    allergies: [],
    dislikedFoods: [],
    foodPreferences: [],
    resolvedAllergens: [],
    unresolvedAllergies: [],
  },
  strategy: {
    calorieFitWeight: 75,
    dailyRotationWeight: 5,
    deterministic: true,
    preferenceWeight: 20,
    version: 'rule-based-v1',
  },
  warnings: [],
  generatedAt: '2026-07-28T08:00:00.000Z',
} as unknown as DailyRecommendationResult

describe('recommendation store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().accessToken = 'access-token'
  })

  it('formats a date from local calendar fields instead of UTC fields', () => {
    const localLateNight = new Date(2026, 6, 28, 23, 45)

    expect(localDateKey(localLateNight)).toBe('2026-07-28')
  })

  it('loads and stores a recommendation for the selected date', async () => {
    vi.mocked(getDailyRecommendation).mockResolvedValue(recommendation)
    const store = useRecommendationStore()

    await store.fetch('2026-07-28')

    expect(getDailyRecommendation).toHaveBeenCalledWith(
      'access-token',
      '2026-07-28',
    )
    expect(store.recommendation).toEqual(recommendation)
    expect(store.loading).toBe(false)
    expect(store.errorCode).toBeNull()
  })

  it('preserves NO_SAFE_RECOMMENDATION as a distinct UI state', async () => {
    vi.mocked(getDailyRecommendation).mockRejectedValue(
      new ApiError(
        422,
        'NO_SAFE_RECOMMENDATION',
        'No safe recommendation is available',
      ),
    )
    const store = useRecommendationStore()

    await store.fetch('2026-07-28')

    expect(store.hasNoSafeRecommendation).toBe(true)
    expect(store.recommendation).toBeNull()
    expect(store.errorMessage).toContain('kombinasi menu yang aman')
  })

  it('loads and stores seven days starting from the selected date', async () => {
    const plan = {
      startDate: '2026-07-28',
      endDate: '2026-08-03',
      days: [recommendation],
      totalMenus: 4,
      uniqueMenuCount: 4,
      isFullyUnique: true,
      warnings: [],
    }
    vi.mocked(getWeeklyRecommendations).mockResolvedValue(plan)
    const store = useRecommendationStore()

    await store.fetchWeekly('2026-07-28')

    expect(getWeeklyRecommendations).toHaveBeenCalledWith(
      'access-token',
      '2026-07-28',
    )
    expect(store.weeklyPlan).toEqual(plan)
    expect(store.weeklyLoading).toBe(false)
    expect(store.weeklyErrorMessage).toBeNull()
  })

  it('requests alternatives with every currently visible menu excluded', async () => {
    const replacement = {
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      alternatives: [
        recommendationItem('breakfast', 'menu-3', 505),
      ],
      hasMore: true,
      limit: 3,
    } as unknown as RecommendationAlternativeSearch
    vi.mocked(getRecommendationAlternatives).mockResolvedValue(replacement)
    const store = useRecommendationStore()
    store.recommendation = recommendation

    await store.fetchAlternatives('breakfast', breakfast.menu.id)

    expect(getRecommendationAlternatives).toHaveBeenCalledWith({
      token: 'access-token',
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      excludedMenuIds: [breakfast.menu.id, lunch.menu.id],
      limit: 3,
    })
    expect(store.replacementSearch).toEqual(replacement)
    expect(store.replacementHasMore).toBe(true)
    expect(store.replacementSeenMenuIds).toEqual(['menu-3'])
  })

  it('also excludes every menu in the active seven-day plan', async () => {
    const nextBreakfast = recommendationItem(
      'breakfast',
      'menu-week-1',
      495,
    )
    const nextLunch = recommendationItem('lunch', 'menu-week-2', 705)
    const replacement = {
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      alternatives: [
        recommendationItem('breakfast', 'menu-3', 505),
      ],
      hasMore: false,
      limit: 3,
    } as unknown as RecommendationAlternativeSearch
    vi.mocked(getRecommendationAlternatives).mockResolvedValue(replacement)
    const store = useRecommendationStore()
    store.recommendation = recommendation
    store.weeklyPlan = {
      startDate: recommendation.date,
      endDate: '2026-08-03',
      days: [
        recommendation,
        {
          ...recommendation,
          id: 'recommendation-2',
          date: '2026-07-29',
          items: [nextBreakfast, nextLunch],
        },
      ],
      totalMenus: 4,
      uniqueMenuCount: 4,
      isFullyUnique: true,
      warnings: [],
    }

    await store.fetchAlternatives('breakfast', breakfast.menu.id)

    expect(getRecommendationAlternatives).toHaveBeenCalledWith(
      expect.objectContaining({
        excludedMenuIds: [
          breakfast.menu.id,
          lunch.menu.id,
          nextBreakfast.menu.id,
          nextLunch.menu.id,
        ],
      }),
    )
  })

  it('stores conversational filters returned by the AI parser', async () => {
    const replacement = {
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      alternatives: [
        recommendationItem('breakfast', 'menu-fruit', 500),
      ],
      appliedConversationFilters: {
        excludedIngredients: ['Talas'],
        preferredIngredients: ['Buah'],
        mealType: 'breakfast',
      },
      hasMore: false,
      limit: 3,
    } as unknown as RecommendationAlternativeSearch
    const interpretation = {
      ...replacement.appliedConversationFilters!,
      originalRequest: 'Tanpa talas dan lebih banyak buah.',
      model: 'test/model',
      interpretedAt: '2026-07-28T10:00:00.000Z',
    }
    vi.mocked(
      getConversationalRecommendationAlternatives,
    ).mockResolvedValue({ interpretation, replacement })
    const store = useRecommendationStore()
    store.recommendation = recommendation

    await store.fetchConversationalAlternatives(
      'breakfast',
      breakfast.menu.id,
      interpretation.originalRequest,
    )

    expect(
      getConversationalRecommendationAlternatives,
    ).toHaveBeenCalledWith({
      token: 'access-token',
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      excludedMenuIds: [breakfast.menu.id, lunch.menu.id],
      limit: 3,
      message: interpretation.originalRequest,
    })
    expect(store.replacementInterpretation).toEqual(interpretation)
    expect(store.replacementSearch).toEqual(replacement)
  })

  it('requests the next batch without menus shown in earlier batches', async () => {
    const firstBatch = {
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      alternatives: [
        recommendationItem('breakfast', 'menu-3', 505),
        recommendationItem('breakfast', 'menu-4', 490),
        recommendationItem('breakfast', 'menu-5', 515),
      ],
      hasMore: true,
      limit: 3,
    } as unknown as RecommendationAlternativeSearch
    const secondBatch = {
      ...firstBatch,
      alternatives: [
        recommendationItem('breakfast', 'menu-6', 500),
        recommendationItem('breakfast', 'menu-7', 485),
      ],
      hasMore: false,
    }
    vi.mocked(getRecommendationAlternatives)
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce(secondBatch)
    const store = useRecommendationStore()
    store.recommendation = recommendation

    await store.fetchAlternatives('breakfast', breakfast.menu.id)
    await store.fetchMoreAlternatives()

    expect(getRecommendationAlternatives).toHaveBeenNthCalledWith(2, {
      token: 'access-token',
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      excludedMenuIds: [
        breakfast.menu.id,
        lunch.menu.id,
        'menu-3',
        'menu-4',
        'menu-5',
      ],
      limit: 3,
    })
    expect(store.replacementSearch).toEqual(secondBatch)
    expect(store.replacementSeenMenuIds).toEqual([
      'menu-3',
      'menu-4',
      'menu-5',
      'menu-6',
      'menu-7',
    ])
    expect(store.replacementHasMore).toBe(false)
    expect(store.replacementMoreMessage).toContain('batch terakhir')
  })

  it('persists an alternative and uses the returned snapshot', async () => {
    const alternative = recommendationItem(
      'breakfast',
      'menu-3',
      505,
    )
    const updated = {
      ...recommendation,
      items: [alternative, lunch],
      totalRecommendedCalories: 1215,
      differenceFromDailyTargetCalories: -785,
    }
    vi.mocked(replaceRecommendationItem).mockResolvedValue(updated)
    const store = useRecommendationStore()
    store.recommendation = recommendation

    await store.applyAlternative('breakfast', alternative)

    expect(replaceRecommendationItem).toHaveBeenCalledWith({
      token: 'access-token',
      date: recommendation.date,
      mealType: 'breakfast',
      currentMenuId: breakfast.menu.id,
      replacementMenuId: alternative.menu.id,
    })
    expect(store.recommendation).toEqual(updated)
  })

  it('preserves NO_SAFE_ALTERNATIVE as a replacement error', async () => {
    vi.mocked(getRecommendationAlternatives).mockRejectedValue(
      new ApiError(
        422,
        'NO_SAFE_ALTERNATIVE',
        'No safe alternative is available',
      ),
    )
    const store = useRecommendationStore()
    store.recommendation = recommendation

    await store.fetchAlternatives('breakfast', breakfast.menu.id)

    expect(store.replacementErrorCode).toBe('NO_SAFE_ALTERNATIVE')
    expect(store.replacementErrorMessage).toContain(
      'menu pengganti yang aman',
    )
  })
})
