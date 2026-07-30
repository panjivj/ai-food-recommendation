import argon2 from 'argon2'

const dummyPasswordHash =
  '$argon2id$v=19$m=19456,p=1,t=2$ysydlE0WWnu8CI8K83X1BQ$OwL1ohQxsWt7h26pFubUqJu0axdVsZrIfpiuI9Mpjhs'

const hashingOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, hashingOptions)
}

export async function verifyPassword(
  passwordHash: string | undefined,
  password: string,
): Promise<boolean> {
  const hashToVerify = passwordHash ?? dummyPasswordHash

  try {
    const matches = await argon2.verify(hashToVerify, password)
    return passwordHash ? matches : false
  } catch {
    return false
  }
}
