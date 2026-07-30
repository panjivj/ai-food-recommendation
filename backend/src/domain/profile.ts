export type Gender = 'male' | 'female'
export type ActivityLevel = 'low' | 'moderate' | 'high'
export type Goal = 'maintain' | 'weight_loss' | 'weight_gain'

export interface ProfileInput {
  name: string
  age: number
  gender: Gender
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
  healthConditions: string[]
  allergies: string[]
  dislikedFoods: string[]
  foodPreferences: string[]
}

export interface UserProfile extends ProfileInput {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
}
