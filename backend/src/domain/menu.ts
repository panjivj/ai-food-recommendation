export type MenuMealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'all_day'

export interface MenuNutritionSummary {
  carbohydrateG: number | null
  energyKcal: number | null
  fatG: number | null
  fiberG: number | null
  proteinG: number | null
  sodiumMg: number | null
}

export interface MenuNutrition extends MenuNutritionSummary {
  ashG: number | null
  betaCaroteneMcg: number | null
  calciumMg: number | null
  copperMg: number | null
  ironMg: number | null
  niacinMg: number | null
  phosphorusMg: number | null
  potassiumMg: number | null
  retinolMcg: number | null
  riboflavinMg: number | null
  thiaminMg: number | null
  totalCaroteneMcg: number | null
  vitaminCMg: number | null
  waterG: number | null
  zincMg: number | null
}

export interface MenuSummary {
  allergens: string[]
  description: string
  id: string
  mealType: MenuMealType
  name: string
  nutrition: MenuNutritionSummary
  servingDescription: string
  servingSizeG: number
  slug: string
  tags: string[]
}

export interface MenuIngredient {
  amountG: number
  category: string
  componentRole: string
  name: string
  preparationNote: string
  sourceReference: string
  tkpiCode: string
}

export interface MenuAllergen {
  evidence: string
  name: string
}

export interface MenuDetail extends Omit<MenuSummary, 'allergens' | 'nutrition'> {
  allergens: MenuAllergen[]
  calculationVersion: string
  ingredients: MenuIngredient[]
  nutrition: MenuNutrition
  nutritionSource: string
}

export interface MenuListFilters {
  limit: number
  maximumCalories?: number
  mealType?: MenuMealType
  minimumCalories?: number
  page: number
  search?: string
}

export interface MenuListResult {
  items: MenuSummary[]
  limit: number
  page: number
  total: number
  totalPages: number
}
