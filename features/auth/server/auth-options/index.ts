import { NextAuthOptions } from 'next-auth'
import { getProviders } from './get-providers'

export const authOptions: NextAuthOptions = {
  providers: getProviders(),

  session: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },

  callbacks: {
    async jwt(params) {
      const { token } = params
      return token
    },

    session(params) {
      const { session } = params
      return session
    },

    signIn() {
      return true
    },
  },

  debug: process.env.NODE_ENV === 'development',
}
