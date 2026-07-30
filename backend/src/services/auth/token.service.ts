import { randomUUID } from 'node:crypto'

import { jwtVerify, SignJWT } from 'jose'

import { AppError } from '../../errors/app-error.js'

export interface TokenConfiguration {
  audience: string
  issuer: string
  secret: string
  ttlSeconds: number
}

export class TokenService {
  private readonly secret: Uint8Array

  constructor(private readonly configuration: TokenConfiguration) {
    this.secret = new TextEncoder().encode(configuration.secret)
  }

  async issue(userId: string): Promise<string> {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(this.configuration.issuer)
      .setAudience(this.configuration.audience)
      .setIssuedAt()
      .setExpirationTime(`${this.configuration.ttlSeconds}s`)
      .setJti(randomUUID())
      .sign(this.secret)
  }

  async verify(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ['HS256'],
        audience: this.configuration.audience,
        issuer: this.configuration.issuer,
      })

      if (!payload.sub) {
        throw new Error('Token subject is missing')
      }

      return payload.sub
    } catch {
      throw new AppError(
        401,
        'INVALID_ACCESS_TOKEN',
        'Access token is invalid or expired',
      )
    }
  }
}
