export interface UserMenuFeedback {
  consumed: boolean
  disliked: boolean
  liked: boolean
  menuId: string
  updatedAt: string | null
  userId: string
}

export interface UserMenuFeedbackPatch {
  consumed?: boolean | undefined
  disliked?: boolean | undefined
  liked?: boolean | undefined
}

export interface RecommendationFeedbackRules {
  consumedMenuIds: string[]
  dislikedMenuIds: string[]
  likedMenuIds: string[]
}
