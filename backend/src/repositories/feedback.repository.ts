import type { AppDatabase } from '../database/database.js'
import type {
  RecommendationFeedbackRules,
  UserMenuFeedback,
  UserMenuFeedbackPatch,
} from '../domain/feedback.js'

interface FeedbackRow {
  consumed: number
  disliked: number
  liked: number
  menu_id: string
  updated_at: string
  user_id: string
}

interface MenuExistsRow {
  exists_flag: number
}

function toFeedback(row: FeedbackRow): UserMenuFeedback {
  return {
    userId: row.user_id,
    menuId: row.menu_id,
    liked: row.liked === 1,
    disliked: row.disliked === 1,
    consumed: row.consumed === 1,
    updatedAt: row.updated_at,
  }
}

function emptyFeedback(
  userId: string,
  menuId: string,
): UserMenuFeedback {
  return {
    userId,
    menuId,
    liked: false,
    disliked: false,
    consumed: false,
    updatedAt: null,
  }
}

export class FeedbackRepository {
  constructor(private readonly database: AppDatabase) {}

  menuExists(menuId: string): boolean {
    return Boolean(
      this.database
        .prepare<[string], MenuExistsRow>(
          `SELECT 1 AS exists_flag
           FROM menus
           WHERE id = ?`,
        )
        .get(menuId),
    )
  }

  find(userId: string, menuId: string): UserMenuFeedback {
    const row = this.database
      .prepare<[string, string], FeedbackRow>(
        `SELECT
           user_id,
           menu_id,
           liked,
           disliked,
           consumed,
           updated_at
         FROM user_menu_feedback
         WHERE user_id = ? AND menu_id = ?`,
      )
      .get(userId, menuId)

    return row ? toFeedback(row) : emptyFeedback(userId, menuId)
  }

  update(
    userId: string,
    menuId: string,
    patch: UserMenuFeedbackPatch,
  ): UserMenuFeedback {
    const update = this.database.transaction(() => {
      const current = this.find(userId, menuId)
      let liked = patch.liked ?? current.liked
      let disliked = patch.disliked ?? current.disliked
      const consumed = patch.consumed ?? current.consumed

      if (patch.liked === true) {
        disliked = false
      }

      if (patch.disliked === true) {
        liked = false
      }

      if (!liked && !disliked && !consumed) {
        this.database
          .prepare(
            `DELETE FROM user_menu_feedback
             WHERE user_id = ? AND menu_id = ?`,
          )
          .run(userId, menuId)

        return emptyFeedback(userId, menuId)
      }

      this.database
        .prepare(
          `INSERT INTO user_menu_feedback (
             user_id,
             menu_id,
             liked,
             disliked,
             consumed
           )
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, menu_id) DO UPDATE SET
             liked = excluded.liked,
             disliked = excluded.disliked,
             consumed = excluded.consumed,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
        )
        .run(
          userId,
          menuId,
          Number(liked),
          Number(disliked),
          Number(consumed),
        )

      return this.find(userId, menuId)
    })

    return update()
  }

  getRecommendationRules(userId: string): RecommendationFeedbackRules {
    const rows = this.database
      .prepare<[string], FeedbackRow>(
        `SELECT
           user_id,
           menu_id,
           liked,
           disliked,
           consumed,
           updated_at
         FROM user_menu_feedback
         WHERE user_id = ?
         ORDER BY menu_id`,
      )
      .all(userId)

    return {
      likedMenuIds: rows
        .filter((row) => row.liked === 1)
        .map((row) => row.menu_id),
      dislikedMenuIds: rows
        .filter((row) => row.disliked === 1)
        .map((row) => row.menu_id),
      consumedMenuIds: rows
        .filter((row) => row.consumed === 1)
        .map((row) => row.menu_id),
    }
  }
}
