import { describe, expect, it, vi } from 'vitest'

import type {
  DailyRecommendation,
  DailyRecommendationItem,
} from '../domain/recommendation.js'
import { OpenRouterRecommendationExplanationService } from './recommendation-explanation.service.js'

const item = {
  mealType: 'breakfast',
  targetCalories: 500,
  menu: {
    id: 'menu-1',
    name: 'Ubi, Tahu, dan Apel',
    ingredientNames: ['Ubi', 'Tahu', 'Apel'],
    tags: ['sarapan', 'nabati'],
    nutrition: {
      energyKcal: 480,
      proteinG: 18,
      fatG: 9,
      carbohydrateG: 74,
      fiberG: 8,
      sodiumMg: 140,
    },
  },
  score: {
    total: 86,
    calorieDifference: 20,
    calorieDifferencePercent: 4,
    matchedPreferences: ['Tahu'],
    breakdown: {
      calorieFit: 73,
      preferenceMatch: 10,
      dailyRotation: 3,
    },
  },
  reasons: [
    {
      code: 'CALORIE_FIT',
      message: 'Kalori mendekati target slot.',
    },
  ],
} as unknown as DailyRecommendationItem

const recommendation = {
  date: '2026-07-28',
  items: [item],
  appliedProfileRules: {
    allergies: ['Susu'],
    dislikedFoods: ['Udang'],
    foodPreferences: ['Tahu'],
  },
  appliedFeedbackRules: {
    dislikedMenuIds: ['menu-lama'],
  },
} as unknown as DailyRecommendation

const configuration = {
  apiKey: 'test-openrouter-key',
  appName: 'NutriChoice Test',
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'openrouter/free',
  siteUrl: 'http://localhost:5173',
  timeoutMs: 5_000,
}

function openRouterResponse(
  content: unknown,
  serializeContent = true,
): Response {
  return new Response(
    JSON.stringify({
      model: 'test/model',
      choices: [
        {
          message: {
            content: serializeContent
              ? JSON.stringify(content)
              : content,
          },
        },
      ],
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  )
}

describe('OpenRouter recommendation explanation service', () => {
  it('requests structured Indonesian output with minimized profile data', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      openRouterResponse({
        summary:
          'Menu ini dipilih karena selaras dengan kebutuhan makan dan preferensi yang tercatat.',
        highlights: [
          {
            title: 'Kecocokan energi',
            detail:
              'Komposisinya berada dekat dengan kebutuhan pada waktu makan ini.',
          },
          {
            title: 'Preferensi pengguna',
            detail:
              'Bahan yang disukai ikut mendukung relevansi pilihan menu.',
          },
        ],
      }),
    )
    const service = new OpenRouterRecommendationExplanationService(
      configuration,
      fetcher,
    )

    const result = await service.generate({ recommendation, item })

    expect(result.model).toBe('test/model')
    expect(result.summary).toContain('Menu ini dipilih')
    expect(result.highlights[0]?.title).toBe('Kecocokan energi')
    expect(result.disclaimer).toContain('aturan backend')
    const [url, options] = fetcher.mock.calls[0] ?? []
    expect(url).toBe(
      'https://openrouter.ai/api/v1/chat/completions',
    )
    expect(
      new Headers(options?.headers).get('authorization'),
    ).toBe('Bearer test-openrouter-key')
    const serializedBody = options?.body

    if (typeof serializedBody !== 'string') {
      throw new Error('OpenRouter request body was not serialized JSON')
    }

    const requestBody = JSON.parse(serializedBody) as {
      max_tokens: number
      messages: Array<{ content: string }>
      reasoning: {
        effort: string
        exclude: boolean
      }
      response_format: {
        type: string
        json_schema: { strict: boolean }
      }
      plugins: Array<{ id: string }>
      provider: { require_parameters: boolean }
    }
    const minimizedInput = requestBody.messages[1]?.content ?? ''

    expect(requestBody.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: { strict: true },
    })
    expect(requestBody.provider.require_parameters).toBe(true)
    expect(requestBody.plugins).toEqual([{ id: 'response-healing' }])
    expect(requestBody.max_tokens).toBe(1_200)
    expect(requestBody.reasoning).toEqual({
      effort: 'low',
      exclude: true,
    })
    expect(minimizedInput).not.toContain('Susu')
    expect(minimizedInput).not.toContain('Udang')
    expect(minimizedInput).toContain('allergyFilterApplied')
  })

  it('rejects generated numeric or medical claims', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      openRouterResponse({
        summary:
          'Menu ini mengandung 480 kalori dan aman dikonsumsi oleh semua pengguna.',
        highlights: [
          {
            title: 'Nilai gizi',
            detail: 'Angka tersebut telah dipastikan oleh model.',
          },
          {
            title: 'Keamanan',
            detail: 'Tidak ada risiko yang perlu diperhatikan.',
          },
        ],
      }),
    )
    const service = new OpenRouterRecommendationExplanationService(
      configuration,
      fetcher,
    )

    await expect(
      service.generate({ recommendation, item }),
    ).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
      statusCode: 502,
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('accepts schema-valid JSON wrapped in a Markdown code fence', async () => {
    const wrappedContent = `Berikut hasilnya:
\`\`\`json
${JSON.stringify({
  summary:
    'Menu ini dipilih karena komposisinya relevan dengan kebutuhan makan pengguna.',
  highlights: [
    {
      title: 'Kecocokan energi',
      detail:
        'Komposisi menu mendukung kebutuhan energi pada waktu makan ini.',
    },
    {
      title: 'Kesesuaian bahan',
      detail:
        'Pilihan bahan sejalan dengan preferensi yang tersimpan pada profil.',
    },
  ],
})}
\`\`\``
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(openRouterResponse(wrappedContent, false))
    const service = new OpenRouterRecommendationExplanationService(
      configuration,
      fetcher,
    )

    const result = await service.generate({ recommendation, item })

    expect(result.summary).toContain('komposisinya relevan')
    expect(result.highlights).toHaveLength(2)
  })

  it('retries an incomplete free-router response once', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 502,
              message: 'Upstream model returned an incomplete response',
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        openRouterResponse({
          summary:
            'Menu ini dipilih karena komposisinya relevan dengan kebutuhan makan pengguna.',
          highlights: [
            {
              title: 'Kecocokan energi',
              detail:
                'Komposisi menu mendukung kebutuhan energi pada waktu makan ini.',
            },
            {
              title: 'Kesesuaian bahan',
              detail:
                'Pilihan bahan sejalan dengan preferensi yang tersimpan pada profil.',
            },
          ],
        }),
      )
    const service = new OpenRouterRecommendationExplanationService(
      configuration,
      fetcher,
    )

    const result = await service.generate({ recommendation, item })

    expect(result.summary).toContain('komposisinya relevan')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
