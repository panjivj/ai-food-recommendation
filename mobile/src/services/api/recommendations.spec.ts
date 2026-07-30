import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getConversationalRecommendationAlternatives,
  getDailyRecommendation,
  generateRecommendationAiExplanation,
  getRecommendationHistory,
  getRecommendationAlternatives,
  getWeeklyRecommendations,
  replaceRecommendationItem,
} from './recommendations'
import type {
  DailyRecommendationResult,
  RecommendationAlternativeSearch,
} from '@/types/domain'

const recommendation = {
  id: 'recommendation-1',
  date: '2026-07-28',
  items: [],
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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('daily recommendation API', () => {
  it('sends the selected local date and Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { recommendation } }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getDailyRecommendation('access-token', '2026-07-28'),
    ).resolves.toEqual(recommendation)

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/recommendations/daily?date=2026-07-28')
    expect(new Headers(options.headers).get('authorization')).toBe(
      'Bearer access-token',
    )
  })

  it('loads a seven-day plan from the selected start date', async () => {
    const plan = {
      startDate: '2026-07-28',
      endDate: '2026-08-03',
      days: [recommendation],
      totalMenus: 4,
      uniqueMenuCount: 4,
      isFullyUnique: true,
      warnings: [],
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { plan } }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getWeeklyRecommendations('access-token', '2026-07-28'),
    ).resolves.toEqual(plan)

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toContain(
      '/recommendations/weekly?start_date=2026-07-28',
    )
    expect(new Headers(options.headers).get('authorization')).toBe(
      'Bearer access-token',
    )
  })

  it('requests an AI explanation for the stored recommendation item', async () => {
    const explanation = {
      summary: 'Menu sesuai dengan kebutuhan dan preferensi pengguna.',
      highlights: [
        {
          title: 'Kecocokan energi',
          detail: 'Komposisi mendukung kebutuhan waktu makan.',
        },
        {
          title: 'Preferensi',
          detail: 'Bahan menu sesuai preferensi yang tersimpan.',
        },
      ],
      disclaimer: 'Nilai gizi tetap berasal dari backend.',
      generatedAt: '2026-07-28T10:00:00.000Z',
      model: 'openrouter/free',
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { explanation } }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateRecommendationAiExplanation({
        token: 'access-token',
        date: '2026-07-28',
        mealType: 'breakfast',
        menuId: 'menu-1',
      }),
    ).resolves.toEqual(explanation)

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toContain(
      '/recommendations/daily/2026-07-28/items/breakfast/explanation',
    )
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify({ menu_id: 'menu-1' }))
  })

  it('sends slot, current menu, exclusions, and limit for alternatives', async () => {
    const replacement = {
      date: '2026-07-28',
      mealType: 'breakfast',
      currentMenuId: 'menu-1',
      alternatives: [],
    } as unknown as RecommendationAlternativeSearch
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { replacement } }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getRecommendationAlternatives({
      token: 'access-token',
      date: '2026-07-28',
      mealType: 'breakfast',
      currentMenuId: 'menu-1',
      excludedMenuIds: ['menu-1', 'menu-2'],
      limit: 3,
    })

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toContain('/recommendations/daily/alternatives')
    expect(parsed.searchParams.get('date')).toBe('2026-07-28')
    expect(parsed.searchParams.get('meal_type')).toBe('breakfast')
    expect(parsed.searchParams.get('current_menu_id')).toBe('menu-1')
    expect(parsed.searchParams.get('excluded_menu_ids')).toBe(
      'menu-1,menu-2',
    )
    expect(parsed.searchParams.get('limit')).toBe('3')
  })

  it('sends a conversational request and returns its interpretation', async () => {
    const replacement = {
      date: '2026-07-28',
      mealType: 'breakfast',
      currentMenuId: 'menu-1',
      alternatives: [],
    } as unknown as RecommendationAlternativeSearch
    const interpretation = {
      originalRequest: 'Tanpa talas dan lebih banyak buah.',
      excludedIngredients: ['Talas'],
      preferredIngredients: ['Buah'],
      mealType: 'breakfast',
      model: 'test/model',
      interpretedAt: '2026-07-28T10:00:00.000Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { interpretation, replacement },
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getConversationalRecommendationAlternatives({
        token: 'access-token',
        date: '2026-07-28',
        mealType: 'breakfast',
        currentMenuId: 'menu-1',
        excludedMenuIds: ['menu-1', 'menu-2'],
        message: 'Tanpa talas dan lebih banyak buah.',
      }),
    ).resolves.toEqual({ interpretation, replacement })

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toContain(
      '/recommendations/daily/alternatives/conversation',
    )
    expect(options.method).toBe('POST')
    expect(JSON.parse(String(options.body))).toMatchObject({
      meal_type: 'breakfast',
      current_menu_id: 'menu-1',
      excluded_menu_ids: ['menu-1', 'menu-2'],
      message: 'Tanpa talas dan lebih banyak buah.',
    })
  })

  it('persists a replacement and loads paginated history', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { recommendation } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { recommendations: [recommendation] },
            meta: {
              pagination: {
                page: 2,
                limit: 5,
                total: 6,
                totalPages: 2,
              },
            },
          }),
          { status: 200 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    await replaceRecommendationItem({
      token: 'access-token',
      date: '2026-07-28',
      mealType: 'breakfast',
      currentMenuId: 'menu-1',
      replacementMenuId: 'menu-3',
    })
    const [, replacementOptions] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ]

    expect(replacementOptions.method).toBe('PUT')
    expect(replacementOptions.body).toBe(
      JSON.stringify({
        current_menu_id: 'menu-1',
        replacement_menu_id: 'menu-3',
      }),
    )

    await expect(
      getRecommendationHistory('access-token', 2, 5),
    ).resolves.toEqual({
      items: [recommendation],
      page: 2,
      limit: 5,
      total: 6,
      totalPages: 2,
    })
    expect(fetchMock.mock.calls[1]?.[0]).toContain(
      '/recommendations/history?page=2&limit=5',
    )
  })
})
