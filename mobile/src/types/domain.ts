export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type RecommendationMealType = MealType | 'snack'

export type FeedbackAction = 'like' | 'dislike' | 'consumed'

export interface UserMenuFeedback {
  consumed: boolean
  disliked: boolean
  liked: boolean
  menuId: string
  updatedAt: string | null
  userId: string
}

export interface UserMenuFeedbackPatch {
  consumed?: boolean
  disliked?: boolean
  liked?: boolean
}

export interface RecommendationFeedbackRules {
  consumedMenuIds: string[]
  dislikedMenuIds: string[]
  likedMenuIds: string[]
}

export interface AuthUser {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface UserProfileInput {
  name: string
  age: number
  gender: 'male' | 'female'
  heightCm: number
  weightKg: number
  activityLevel: 'low' | 'moderate' | 'high'
  goal: 'maintain' | 'weight_loss' | 'weight_gain'
  healthConditions: string[]
  allergies: string[]
  dislikedFoods: string[]
  foodPreferences: string[]
}

export interface UserProfile extends UserProfileInput {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface DemoUser {
  id: string
  name: string
  email: string
  age: number
  gender: 'male' | 'female'
  heightCm: number
  weightKg: number
  activityLevel: 'low' | 'moderate' | 'high'
  goal: 'maintain' | 'weight_loss' | 'weight_gain'
  healthConditions: string[]
  allergies: string[]
  dislikedFoods: string[]
  foodPreferences: string[]
}

export interface Nutrition {
  calories: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  fiberG: number
  sodiumMg: number
}

export interface Menu {
  id: string
  name: string
  mealType: MealType
  description: string
  imageUrl: string
  nutrition: Nutrition
  preparationMinutes: number
  ingredients: string[]
  instructions: string[]
  explanation: string
}

export interface DailyRecommendation {
  date: string
  calorieTarget: number
  menuIds: Record<MealType, string>
  alternativeMenuIds: string[]
}

export interface RecommendationNutrition {
  carbohydrateG: number | null
  energyKcal: number
  fatG: number | null
  fiberG: number | null
  proteinG: number | null
  sodiumMg: number | null
}

export interface RecommendationMenu {
  allergens: string[]
  description: string
  id: string
  ingredientNames: string[]
  mealType: RecommendationMealType | 'all_day'
  name: string
  nutrition: RecommendationNutrition
  servingDescription: string
  servingSizeG: number
  slug: string
  tags: string[]
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

export interface DailyRecommendationItem {
  mealType: RecommendationMealType
  menu: RecommendationMenu
  reasons: Array<{
    code:
      | 'CALORIE_FIT'
      | 'CONVERSATION_FILTERS'
      | 'PREFERENCE_MATCH'
      | 'NO_PREFERENCE_MATCH'
      | 'DAILY_ROTATION'
      | 'SAFETY_FILTERS'
    message: string
  }>
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

export interface DailyRecommendationResult {
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
  filterStats: Record<RecommendationMealType, RecommendationFilterStats>
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
  mealType: RecommendationMealType
  preferredIngredients: string[]
}

export interface ReplacementConversationInterpretation
  extends ReplacementConversationFilters {
  interpretedAt: string
  model: string
  originalRequest: string
}

export interface RecommendationAlternativeSearch {
  alternatives: DailyRecommendationItem[]
  appliedConversationFilters: ReplacementConversationFilters | null
  appliedFeedbackRules: RecommendationFeedbackRules
  appliedProfileRules: DailyRecommendationResult['appliedProfileRules']
  currentMenuId: string
  date: string
  excludedMenuIds: string[]
  filterStats: RecommendationFilterStats
  hasMore: boolean
  limit: number
  mealType: RecommendationMealType
  strategy: DailyRecommendationResult['strategy']
  targetCalories: number
  warnings: string[]
}

export interface RecommendationAiExplanation {
  disclaimer: string
  generatedAt: string
  highlights: Array<{
    detail: string
    title: string
  }>
  model: string
  summary: string
}

export interface RecommendationHistoryPage {
  items: DailyRecommendationResult[]
  limit: number
  page: number
  total: number
  totalPages: number
}

export interface WeeklyRecommendationPlan {
  days: DailyRecommendationResult[]
  endDate: string
  isFullyUnique: boolean
  startDate: string
  totalMenus: number
  uniqueMenuCount: number
  warnings: string[]
}

export type MenuMealType = RecommendationMealType | 'all_day'

export interface MenuNutritionDetail {
  ashG: number | null
  betaCaroteneMcg: number | null
  calciumMg: number | null
  carbohydrateG: number | null
  copperMg: number | null
  energyKcal: number | null
  fatG: number | null
  fiberG: number | null
  ironMg: number | null
  niacinMg: number | null
  phosphorusMg: number | null
  potassiumMg: number | null
  proteinG: number | null
  retinolMcg: number | null
  riboflavinMg: number | null
  sodiumMg: number | null
  thiaminMg: number | null
  totalCaroteneMcg: number | null
  vitaminCMg: number | null
  waterG: number | null
  zincMg: number | null
}

export interface MenuIngredientDetail {
  amountG: number
  category: string
  componentRole: string
  name: string
  preparationNote: string
  sourceReference: string
  tkpiCode: string
}

export interface MenuAllergenDetail {
  evidence: string
  name: string
}

export interface MenuDetail {
  allergens: MenuAllergenDetail[]
  calculationVersion: string
  description: string
  id: string
  ingredients: MenuIngredientDetail[]
  mealType: MenuMealType
  name: string
  nutrition: MenuNutritionDetail
  nutritionSource: string
  servingDescription: string
  servingSizeG: number
  slug: string
  tags: string[]
}
