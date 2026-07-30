import { randomUUID } from 'node:crypto'

import { AppError } from '../../errors/app-error.js'
import { DuplicateEmailError } from '../../repositories/user.repository.js'
import type {
  UserRecord,
  UserRepository,
} from '../../repositories/user.repository.js'
import { hashPassword, verifyPassword } from './password.service.js'
import type { TokenService } from './token.service.js'

export interface PublicUser {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthenticationResult {
  accessToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: PublicUser
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly tokenTtlSeconds: number,
  ) {}

  async register(
    rawEmail: string,
    password: string,
  ): Promise<AuthenticationResult> {
    const email = rawEmail.trim().toLowerCase()
    const passwordHash = await hashPassword(password)

    let user: UserRecord

    try {
      user = this.users.create(randomUUID(), email, passwordHash)
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new AppError(
          409,
          'EMAIL_ALREADY_REGISTERED',
          'Email is already registered',
        )
      }

      throw error
    }

    return this.createAuthenticationResult(user)
  }

  async login(
    rawEmail: string,
    password: string,
  ): Promise<AuthenticationResult> {
    const email = rawEmail.trim().toLowerCase()
    const user = this.users.findByEmail(email)
    const passwordMatches = await verifyPassword(user?.passwordHash, password)

    if (!user || !passwordMatches) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect',
      )
    }

    return this.createAuthenticationResult(user)
  }

  getUser(userId: string): PublicUser {
    const user = this.users.findById(userId)

    if (!user) {
      throw new AppError(
        401,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required',
      )
    }

    return toPublicUser(user)
  }

  private async createAuthenticationResult(
    user: UserRecord,
  ): Promise<AuthenticationResult> {
    return {
      accessToken: await this.tokens.issue(user.id),
      expiresIn: this.tokenTtlSeconds,
      tokenType: 'Bearer',
      user: toPublicUser(user),
    }
  }
}
