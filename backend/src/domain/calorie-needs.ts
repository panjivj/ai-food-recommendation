import type {
  ActivityLevel,
  Gender,
  Goal,
} from './profile.js'

export type MealTargetName =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'

export interface CalorieNeedsInput {
  activityLevel: ActivityLevel
  age: number
  bodyMassIndex: number
  gender: Gender
  goal: Goal
  heightCm: number
  profileUpdatedAt: string
  weightKg: number
}

export interface MealCalorieTarget {
  calories: number
  percentage: number
}

export interface GoalCalorieAdjustment {
  appliedCalories: number
  minimumWeightLossTargetCalories: number | null
  requestedCalories: number
}

export interface CalorieCalculationMethod {
  activityFactor: number
  activityPolicy: string
  bmrEquation: string
  goalPolicy: string
  mealDistributionPolicy: string
  name: 'mifflin_st_jeor'
  roundingPolicy: string
  version: 'v1'
}

export interface CalorieReference {
  title: string
  url: string
}

export interface CalorieNeeds {
  bmrCalories: number
  calculatedAt: string
  dailyTargetCalories: number
  disclaimer: string
  goalAdjustment: GoalCalorieAdjustment
  input: CalorieNeedsInput
  mealTargets: Record<MealTargetName, MealCalorieTarget>
  method: CalorieCalculationMethod
  references: CalorieReference[]
  tdeeCalories: number
  warnings: string[]
}
