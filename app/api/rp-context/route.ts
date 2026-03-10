import { NextResponse } from 'next/server'
import { signRequest } from '@worldcoin/idkit/signing'

const RP_SIGNING_KEY = process.env.RP_SIGNING_KEY!
const RP_ID = process.env.RP_ID!
const ACTION = 'claim-token-dropping-air'

export async function GET() {
  try {
    const { sig, nonce, createdAt, expiresAt } = signRequest(ACTION, RP_SIGNING_KEY, 300)

    return NextResponse.json({
      rp_context: {
        rp_id: RP_ID,
        nonce,
        created_at: createdAt,
        expires_at: expiresAt,
        signature: sig,
      },
    })
  } catch (error) {
    console.error('RP context signing error:', error)
    return NextResponse.json({ error: 'Failed to generate RP context' }, { status: 500 })
  }
}
