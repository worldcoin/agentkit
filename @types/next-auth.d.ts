import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
  }

  interface Session {
    user: User
  }
}
