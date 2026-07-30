import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  getMenuFeedback,
  updateMenuFeedback,
} from '@/services/api/feedback'
import { useAuthStore } from '@/stores/auth'
import { useFeedbackStore } from '@/stores/feedback'
import type { UserMenuFeedback } from '@/types/domain'

vi.mock('@/services/api/feedback', () => ({
  getMenuFeedback: vi.fn(),
  updateMenuFeedback: vi.fn(),
}))

const emptyFeedback: UserMenuFeedback = {
  userId: 'user-1',
  menuId: 'menu-1',
  liked: false,
  disliked: false,
  consumed: false,
  updatedAt: null,
}

describe('feedback store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().accessToken = 'access-token'
  })

  it('loads feedback for a menu', async () => {
    vi.mocked(getMenuFeedback).mockResolvedValue(emptyFeedback)
    const store = useFeedbackStore()

    await store.fetch('menu-1')

    expect(getMenuFeedback).toHaveBeenCalledWith(
      'access-token',
      'menu-1',
    )
    expect(store.feedback).toEqual(emptyFeedback)
    expect(store.loading).toBe(false)
  })

  it('toggles independent feedback fields using the latest state', async () => {
    const liked = {
      ...emptyFeedback,
      liked: true,
      updatedAt: '2026-07-28T10:00:00.000Z',
    }
    const likedAndConsumed = {
      ...liked,
      consumed: true,
    }
    vi.mocked(updateMenuFeedback)
      .mockResolvedValueOnce(liked)
      .mockResolvedValueOnce(likedAndConsumed)
    const store = useFeedbackStore()
    store.feedback = emptyFeedback
    store.menuId = emptyFeedback.menuId

    await store.toggle('like')
    await store.toggle('consumed')

    expect(updateMenuFeedback).toHaveBeenNthCalledWith(
      1,
      'access-token',
      'menu-1',
      { liked: true },
    )
    expect(updateMenuFeedback).toHaveBeenNthCalledWith(
      2,
      'access-token',
      'menu-1',
      { consumed: true },
    )
    expect(store.feedback).toEqual(likedAndConsumed)
  })

  it('sends false when an active status is toggled off', async () => {
    vi.mocked(updateMenuFeedback).mockResolvedValue(emptyFeedback)
    const store = useFeedbackStore()
    store.feedback = {
      ...emptyFeedback,
      disliked: true,
    }

    await store.toggle('dislike')

    expect(updateMenuFeedback).toHaveBeenCalledWith(
      'access-token',
      'menu-1',
      { disliked: false },
    )
  })
})
