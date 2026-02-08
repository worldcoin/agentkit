import 'server-only'

import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js'
import { cookies } from 'next/headers'

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload
  nonce: string
}

export const completeSiwe = async ({ payload, nonce }: IRequestPayload) => {
  if (nonce !== (await cookies()).get('siwe')?.value) {
    throw new Error('Invalid nonce from cookies')
  }

  const validMessage = await verifySiweMessage(payload, nonce)
  return validMessage
}
