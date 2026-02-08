import { completeSiwe } from '@/utils/complete-siwe'
import { safeCall } from '@/utils/safe-call'
import { MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js'
import Credentials from 'next-auth/providers/credentials'

export const siweProvider = Credentials({
  id: 'siwe',
  name: 'Sign with Ethereum',
  credentials: {},
  async authorize(_credentials, req) {
    const { nonce, ...payload } = req?.query as MiniAppWalletAuthSuccessPayload & {
      nonce: string
    }

    const {
      success: completeSiweSuccess,
      data: completeSiweData,
      error: completeSiweError,
    } = await safeCall(completeSiwe)({
      payload: { ...payload, version: Number(payload.version) },
      nonce,
    })

    if (!completeSiweSuccess || !completeSiweData) {
      console.error('Error completing SIWE', completeSiweError)
      return null
    }

    if (!completeSiweData.isValid || !completeSiweData.siweMessageData.address) {
      console.error('Invalid message signature', completeSiweData)
      return null
    }

    const defaultAuthData = {
      id: completeSiweData.siweMessageData.address,
    }

    return defaultAuthData
  },
})
