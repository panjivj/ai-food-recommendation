import type {
  MealTargetName,
} from './calorie-needs.js'
import type {
  RecommendationFeedbackRules,
} from './feedback.js'
import type {
  MenuMealType,
  MenuNutritionSummary,
} from './menu.js'

export interface RecommendationMenu {
  allergens: string[]
  description: string
  id: string
  ingredientNames: string[]
  mealType: MenuMealType
  name: string
  nutrition: MenuNutritionSummary & {
    energyKcal: number
  }
  servingDescription: string
  servingSizeG: number
  slug: string
  tags: string[]
}

export interface RecommendationCandidate {
  menu: RecommendationMenu
}

export interface RecommendationScore {
  breakdown: {
    calorieFit: number
    dailyRotation: number
    preferenceMatch: number
  }
  calorieDifference: number
  calorieDifferencePercent: number
  matchedPreferences: string[]
  total: number
}

export type RecommendationReasonCode =
  | 'CALORIE_FIT'
  | 'CONVERSATION_FILTERS'
  | 'PREFERENCE_MATCH'
  | 'NO_PREFERENCE_MATCH'
  | 'DAILY_ROTATION'
  | 'SAFETY_FILTERS'

export interface RecommendationReason {
  code: RecommendationReasonCode
  message: string
}

export interface DailyRecommendationItem {
  mealType: MealTargetName
  menu: RecommendationMenu
  reasons: RecommendationReason[]
  score: RecommendationScore
  targetCalories: number
}

export interface RecommendationFilterStats {
  candidateCount: number
  eligibleCount: number
  excludedByAllergy: number
  excludedByConversation: number
  excludedByDislikedFood: number
  excludedByFeedback: number
  excludedBySameDayMenu: number
}

export interface DailyRecommendation {
  appliedFeedbackRules: RecommendationFeedbackRules
  appliedProfileRules: {
    allergies: string[]
    dislikedFoods: string[]
    foodPreferences: string[]
    resolvedAllergens: string[]
    unresolvedAllergies: string[]
  }
  dailyTargetCalories: number
  date: string
  differenceFromDailyTargetCalories: number
  filterStats: Record<MealTargetName, RecommendationFilterStats>
  generatedAt: string
  id: string
  items: DailyRecommendationItem[]
  strategy: {
    calorieFitWeight: number
    dailyRotationWeight: number
    deterministic: true
    preferenceWeight: number
    version: 'rule-based-v1'
  }
  totalRecommendedCalories: number
  warnings: string[]
}

export interface ReplacementConversationFilters {
  excludedIngredients: string[]
  mealType: MealTargetName
  preferredIngredients: string[]
}

export interface RecommendationAlternativeSearch {
  alternatives: DailyRecommendationItem[]
  appliedConversationFilters: ReplacementConversationFilters | null
  appliedFeedbackRules: DailyRecommendation['appliedFeedbackRules']
  appliedProfileRules: DailyRecommendation['appliedProfileRules']
  currentMenuId: string
  date: string
  excludedMenuIds: string[]
  filterStats: RecommendationFilterStats
  hasMore: boolean
  limit: number
  mealType: MealTargetName
  strategy: DailyRecommendation['strategy']
  targetCalories: number
  warnings: string[]
}

export interface RecommendationHistoryResult {
  items: DailyRecommendation[]
  limit: number
  page: number
  total: number
  totalPages: number
}

export interface WeeklyRecommendationPlan {
  days: DailyRecommendation[]
  endDate: string
  isFullyUnique: boolean
  startDate: string
  totalMenus: number
  uniqueMenuCount: number
  warnings: string[]
}
