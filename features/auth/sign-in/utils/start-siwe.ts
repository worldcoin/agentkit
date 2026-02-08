import { MiniKit } from '@worldcoin/minikit-js'
import { signIn, SignInAuthorizationParams } from 'next-auth/react'
import { fetchNonce } from './fetch-nonce'

export const startSiweAuth = async (
  callbackUrl: string,
  options?: {
    onComplete?: () => void
    onError?: (error: Error) => void
  }
) => {
  const { nonce } = await fetchNonce()

  if (!nonce) {
    console.error('No nonce found')
    return
  }

  const { finalPayload: walletAuthPayload } = await MiniKit.commandsAsync.walletAuth({
    nonce,
  })

  if (walletAuthPayload.status === 'error') {
    console.warn(`walletAuth: ${walletAuthPayload.error_code}`)
    return
  }

  try {
    await signIn(
      'siwe',
      {
        callbackUrl,
      },
      {
        ...walletAuthPayload,
        nonce,
      } as unknown as SignInAuthorizationParams
    )

    options?.onComplete?.()
  } catch (error) {
    options?.onError?.(error as Error)
  }
}
