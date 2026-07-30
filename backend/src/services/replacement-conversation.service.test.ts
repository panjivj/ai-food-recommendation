import { describe, expect, it, vi } from 'vitest'

import { OpenRouterReplacementConversationService } from './replacement-conversation.service.js'

const configuration = {
  apiKey: 'test-openrouter-key',
  appName: 'NutriChoice Test',
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'openrouter/free',
  siteUrl: 'http://localhost:5173',
  timeoutMs: 5_000,
}

function openRouterResponse(content: unknown): Response {
  return new Response(
    JSON.stringify({
      model: 'test/model',
      choices: [
        {
          message: {
            content: JSON.stringify(content),
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

describe('OpenRouter replacement conversation service', () => {
  it('converts an Indonesian request into bounded structured filters', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      openRouterResponse({
        excludedIngredients: ['Talas', 'talas'],
        preferredIngredients: ['Buah', 'Talas'],
        mealType: 'breakfast',
      }),
    )
    const service = new OpenRouterReplacementConversationService(
      configuration,
      fetcher,
    )

    const result = await service.interpret({
      mealType: 'breakfast',
      message:
        'Saya ingin pilihan sarapan tanpa talas dan lebih banyak buah.',
    })

    expect(result).toMatchObject({
      excludedIngredients: ['Talas'],
      preferredIngredients: ['Buah'],
      mealType: 'breakfast',
      model: 'test/model',
    })
    const [, options] = fetcher.mock.calls[0] ?? []
    const body =
      typeof options?.body === 'string'
        ? (JSON.parse(options.body) as {
            messages: Array<{ content: string }>
            response_format: {
              json_schema: { strict: boolean }
            }
          })
        : undefined

    expect(body?.response_format.json_schema.strict).toBe(true)
    expect(body?.messages[1]?.content).toContain(
      'Saya ingin pilihan sarapan',
    )
    expect(body?.messages[1]?.content).not.toContain(
      'test-openrouter-key',
    )
  })

  it('rejects a request without supported ingredient filters', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      openRouterResponse({
        excludedIngredients: [],
        preferredIngredients: [],
        mealType: 'breakfast',
      }),
    )
    const service = new OpenRouterReplacementConversationService(
      configuration,
      fetcher,
    )

    await expect(
      service.interpret({
        mealType: 'breakfast',
        message: 'Berikan sesuatu yang enak.',
      }),
    ).rejects.toMatchObject({
      code: 'AI_REPLACEMENT_FILTER_EMPTY',
      statusCode: 422,
    })
  })

  it('retries a provider error and rejects a changed meal slot', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: 502, message: 'Temporary provider error' },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        openRouterResponse({
          excludedIngredients: ['Talas'],
          preferredIngredients: ['Buah'],
          mealType: 'lunch',
        }),
      )
    const service = new OpenRouterReplacementConversationService(
      configuration,
      fetcher,
    )

    await expect(
      service.interpret({
        mealType: 'breakfast',
        message: 'Tanpa talas dan lebih banyak buah.',
      }),
    ).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
      statusCode: 502,
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
