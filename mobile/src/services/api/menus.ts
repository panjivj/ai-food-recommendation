import { apiRequest } from './client'
import type { MenuDetail } from '@/types/domain'

interface MenuDetailResponse {
  data: {
    menu: MenuDetail
  }
}

export async function getMenuDetail(
  identifier: string,
  token?: string,
): Promise<MenuDetail> {
  const response = await apiRequest<MenuDetailResponse>(
    `/menus/${encodeURIComponent(identifier)}`,
    { token },
  )

  return response.data.menu
}
