import type {
  MenuDetail,
  MenuListFilters,
  MenuListResult,
} from '../domain/menu.js'
import { AppError } from '../errors/app-error.js'
import type { MenuRepository } from '../repositories/menu.repository.js'

export class MenuService {
  constructor(private readonly menus: MenuRepository) {}

  list(filters: MenuListFilters): MenuListResult {
    return this.menus.list(filters)
  }

  get(identifier: string): MenuDetail {
    const menu = this.menus.findApproved(identifier)

    if (!menu) {
      throw new AppError(
        404,
        'MENU_NOT_FOUND',
        'An approved menu with this identifier was not found',
      )
    }

    return menu
  }
}
