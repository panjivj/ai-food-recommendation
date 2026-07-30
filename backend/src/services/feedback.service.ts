import type {
  RecommendationFeedbackRules,
  UserMenuFeedback,
  UserMenuFeedbackPatch,
} from '../domain/feedback.js'
import { AppError } from '../errors/app-error.js'
import type {
  FeedbackRepository,
} from '../repositories/feedback.repository.js'

export class FeedbackService {
  constructor(private readonly feedback: FeedbackRepository) {}

  get(userId: string, menuId: string): UserMenuFeedback {
    this.requireMenu(menuId)
    return this.feedback.find(userId, menuId)
  }

  update(
    userId: string,
    menuId: string,
    patch: UserMenuFeedbackPatch,
  ): UserMenuFeedback {
    this.requireMenu(menuId)
    return this.feedback.update(userId, menuId, patch)
  }

  getRecommendationRules(userId: string): RecommendationFeedbackRules {
    return this.feedback.getRecommendationRules(userId)
  }

  private requireMenu(menuId: string) {
    if (!this.feedback.menuExists(menuId)) {
      throw new AppError(404, 'MENU_NOT_FOUND', 'Menu not found')
    }
  }
}
