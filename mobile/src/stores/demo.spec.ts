import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoStore } from '@/stores/demo'

describe('demo store feedback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('menyimpan satu status feedback untuk sebuah menu', () => {
    const store = useDemoStore()

    store.setFeedback('menu-oat-pisang', 'like')
    expect(store.feedback['menu-oat-pisang']).toBe('like')

    store.setFeedback('menu-oat-pisang', 'consumed')
    expect(store.feedback['menu-oat-pisang']).toBe('consumed')
  })

  it('membatalkan feedback saat aksi aktif dipilih kembali', () => {
    const store = useDemoStore()

    store.setFeedback('menu-oat-pisang', 'dislike')
    store.setFeedback('menu-oat-pisang', 'dislike')

    expect(store.feedback['menu-oat-pisang']).toBeNull()
  })

  it('mengganti menu rekomendasi berdasarkan waktu makan', () => {
    const store = useDemoStore()

    store.replaceMenu('lunch', 'menu-gado-gado')

    expect(store.recommendation.menuIds.lunch).toBe('menu-gado-gado')
  })
})
