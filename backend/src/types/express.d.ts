interface AuthContext {
  userId: string
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext
  }
}

export {}
