export type MealType = 'breakfast' | 'lunch' | 'dinner'

export type FeedbackAction = 'like' | 'dislike' | 'consumed'

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
