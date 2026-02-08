import { Provider } from 'next-auth/providers/index'
import { localProvider } from './providers/local'
import { siweProvider } from './providers/siwe'
import { worldIdProvider } from './providers/worldcoin'

export const getProviders = (): Provider[] => {
  if (
    [process.env.NODE_ENV, process.env.NEXT_PUBLIC_APP_ENV].every(env => env === 'production')
  ) {
    // NOTE: Change production provider here
    return [siweProvider]
  }

  if (process.env.NEXTAUTH_PROVIDER === 'local') {
    return [localProvider]
  }

  if (process.env.NEXTAUTH_PROVIDER === 'siwe') {
    return [siweProvider]
  }

  if (process.env.NEXTAUTH_PROVIDER === 'worldcoin') {
    return [worldIdProvider]
  }

  return [localProvider]
}
