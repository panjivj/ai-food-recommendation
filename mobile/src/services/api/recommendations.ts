import { apiRequest } from './client'
import type {
  DailyRecommendationResult,
  RecommendationAlternativeSearch,
  RecommendationAiExplanation,
  ReplacementConversationFilters,
  ReplacementConversationInterpretation,
  RecommendationHistoryPage,
  RecommendationMealType,
  WeeklyRecommendationPlan,
} from '@/types/domain'

interface DailyRecommendationResponse {
  data: {
    recommendation: DailyRecommendationResult
  }
}

interface RecommendationAlternativeResponse {
  data: {
    replacement: RecommendationAlternativeSearch
  }
}

interface RecommendationAiExplanationResponse {
  data: {
    explanation: RecommendationAiExplanation
  }
}

interface AlternativeRequest {
  conversationFilters?: ReplacementConversationFilters
  currentMenuId: string
  date: string
  excludedMenuIds: string[]
  limit?: number
  mealType: RecommendationMealType
  token: string
}

interface ConversationalAlternativeResponse {
  data: {
    interpretation: ReplacementConversationInterpretation
    replacement: RecommendationAlternativeSearch
  }
}

interface ConversationalAlternativeRequest
  extends Omit<AlternativeRequest, 'conversationFilters'> {
  message: string
}

interface RecommendationHistoryResponse {
  data: {
    recommendations: DailyRecommendationResult[]
  }
  meta: {
    pagination: Omit<RecommendationHistoryPage, 'items'>
  }
}

interface WeeklyRecommendationResponse {
  data: {
    plan: WeeklyRecommendationPlan
  }
}

interface ReplacementRequest {
  conversationFilters?: ReplacementConversationFilters
  currentMenuId: string
  date: string
  excludedMenuIds?: string[]
  mealType: RecommendationMealType
  replacementMenuId: string
  token: string
}

interface ExplanationRequest {
  date: string
  mealType: RecommendationMealType
  menuId: string
  token: string
}

export async function getDailyRecommendation(
  token: string,
  date: string,
): Promise<DailyRecommendationResult> {
  const query = new URLSearchParams({ date })
  const response = await apiRequest<DailyRecommendationResponse>(
    `/recommendations/daily?${query.toString()}`,
    { token },
  )

  return response.data.recommendation
}

export async function getWeeklyRecommendations(
  token: string,
  startDate: string,
): Promise<WeeklyRecommendationPlan> {
  const query = new URLSearchParams({ start_date: startDate })
  const response = await apiRequest<WeeklyRecommendationResponse>(
    `/recommendations/weekly?${query.toString()}`,
    { token },
  )

  return response.data.plan
}

export async function generateRecommendationAiExplanation({
  date,
  mealType,
  menuId,
  token,
}: ExplanationRequest): Promise<RecommendationAiExplanation> {
  const response =
    await apiRequest<RecommendationAiExplanationResponse>(
      `/recommendations/daily/${date}/items/${mealType}/explanation`,
      {
        method: 'POST',
        body: { menu_id: menuId },
        token,
      },
    )

  return response.data.explanation
}

export async function getRecommendationAlternatives({
  conversationFilters,
  currentMenuId,
  date,
  excludedMenuIds,
  limit = 3,
  mealType,
  token,
}: AlternativeRequest): Promise<RecommendationAlternativeSearch> {
  const query = new URLSearchParams({
    date,
    meal_type: mealType,
    current_menu_id: currentMenuId,
    limit: String(limit),
  })

  if (excludedMenuIds.length > 0) {
    query.set('excluded_menu_ids', excludedMenuIds.join(','))
  }

  if (conversationFilters?.excludedIngredients.length) {
    query.set(
      'excluded_ingredients',
      conversationFilters.excludedIngredients.join(','),
    )
  }

  if (conversationFilters?.preferredIngredients.length) {
    query.set(
      'preferred_ingredients',
      conversationFilters.preferredIngredients.join(','),
    )
  }

  const response = await apiRequest<RecommendationAlternativeResponse>(
    `/recommendations/daily/alternatives?${query.toString()}`,
    { token },
  )

  return response.data.replacement
}

export async function getConversationalRecommendationAlternatives({
  currentMenuId,
  date,
  excludedMenuIds,
  limit = 3,
  mealType,
  message,
  token,
}: ConversationalAlternativeRequest): Promise<{
  interpretation: ReplacementConversationInterpretation
  replacement: RecommendationAlternativeSearch
}> {
  const response =
    await apiRequest<ConversationalAlternativeResponse>(
      '/recommendations/daily/alternatives/conversation',
      {
        method: 'POST',
        body: {
          date,
          meal_type: mealType,
          current_menu_id: currentMenuId,
          excluded_menu_ids: excludedMenuIds,
          limit,
          message,
        },
        token,
      },
    )

  return response.data
}

export async function replaceRecommendationItem({
  conversationFilters,
  currentMenuId,
  date,
  excludedMenuIds,
  mealType,
  replacementMenuId,
  token,
}: ReplacementRequest): Promise<DailyRecommendationResult> {
  const response = await apiRequest<DailyRecommendationResponse>(
    `/recommendations/daily/${date}/items/${mealType}`,
    {
      method: 'PUT',
      body: {
        current_menu_id: currentMenuId,
        replacement_menu_id: replacementMenuId,
        ...(excludedMenuIds && excludedMenuIds.length > 0
          ? { excluded_menu_ids: excludedMenuIds }
          : {}),
        ...(conversationFilters
          ? {
              conversation_filters: {
                excluded_ingredients:
                  conversationFilters.excludedIngredients,
                preferred_ingredients:
                  conversationFilters.preferredIngredients,
              },
            }
          : {}),
      },
      token,
    },
  )

  return response.data.recommendation
}

export async function getRecommendationHistory(
  token: string,
  page = 1,
  limit = 20,
): Promise<RecommendationHistoryPage> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  const response = await apiRequest<RecommendationHistoryResponse>(
    `/recommendations/history?${query.toString()}`,
    { token },
  )

  return {
    items: response.data.recommendations,
    ...response.meta.pagination,
  }
}
