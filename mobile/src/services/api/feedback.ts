import { apiRequest } from './client'
import type {
  UserMenuFeedback,
  UserMenuFeedbackPatch,
} from '@/types/domain'

interface FeedbackResponse {
  data: {
    feedback: UserMenuFeedback
  }
}

export async function getMenuFeedback(
  token: string,
  menuId: string,
): Promise<UserMenuFeedback> {
  const response = await apiRequest<FeedbackResponse>(
    `/feedback/${encodeURIComponent(menuId)}`,
    { token },
  )

  return response.data.feedback
}

export async function updateMenuFeedback(
  token: string,
  menuId: string,
  patch: UserMenuFeedbackPatch,
): Promise<UserMenuFeedback> {
  const response = await apiRequest<FeedbackResponse>(
    `/feedback/${encodeURIComponent(menuId)}`,
    {
      method: 'PUT',
      body: patch,
      token,
    },
  )

  return response.data.feedback
}
