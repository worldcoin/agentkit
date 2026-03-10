import { randomBytes, randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { recoverMessageAddress } from 'viem'
import { z } from 'zod'
import { agentBook } from '@/lib/agentkit'
import { env } from '@/lib/config'

type ChallengeRecord = {
  nonce: string
  issuedAt: string
  expiresAt: string
  used: boolean
}

const ACTIVE_CHALLENGES = new Map<string, ChallengeRecord>()
const CHALLENGE_TTL_MS = 5 * 60 * 1000

const proofSchema = z.object({
  challengeId: z.string().min(1),
  proof: z.object({
    address: z.string().startsWith('0x'),
    nonce: z.string().min(1),
    signature: z.string().startsWith('0x'),
    delegation: z.object({
      worldIdSignal: z.string().startsWith('0x'),
    }),
    payload: z.object({
      challengeId: z.string().min(1),
      nonce: z.string().min(1),
      capability: z.literal('agent-capability-test'),
      timestamp: z.string().datetime(),
      sdk: z.literal('agentkit'),
      schemaVersion: z.literal('1.0.0'),
    }),
  }),
})

function canonicalizePayload(payload: {
  challengeId: string
  nonce: string
  capability: string
  timestamp: string
  sdk: string
  schemaVersion: string
}) {
  return JSON.stringify({
    capability: payload.capability,
    challengeId: payload.challengeId,
    nonce: payload.nonce,
    schemaVersion: payload.schemaVersion,
    sdk: payload.sdk,
    timestamp: payload.timestamp,
  })
}

function trimExpiredChallenges() {
  const now = Date.now()
  for (const [challengeId, record] of ACTIVE_CHALLENGES) {
    if (new Date(record.expiresAt).getTime() < now) {
      ACTIVE_CHALLENGES.delete(challengeId)
    }
  }
}

export async function GET() {
  trimExpiredChallenges()

  const challengeId = randomUUID()
  const nonce = randomBytes(16).toString('hex')
  const issuedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString()

  ACTIVE_CHALLENGES.set(challengeId, {
    nonce,
    issuedAt,
    expiresAt,
    used: false,
  })

  return NextResponse.json({
    challengeId,
    nonce,
    issuedAt,
    expiresAt,
    tasks: [
      'fetch nonce from endpoint',
      'sign structured payload',
      'return deterministic JSON schema',
    ],
    payloadTemplate: {
      capability: 'agent-capability-test',
      challengeId,
      nonce,
      schemaVersion: '1.0.0',
      sdk: 'agentkit',
      timestamp: issuedAt,
    },
  })
}

export async function POST(req: NextRequest) {
  trimExpiredChallenges()

  try {
    const json = await req.json()
    const parsed = proofSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid proof payload' }, { status: 400 })
    }

    const { challengeId, proof } = parsed.data
    const challenge = ACTIVE_CHALLENGES.get(challengeId)
    if (!challenge) {
      return NextResponse.json({ error: 'Unknown challenge' }, { status: 404 })
    }
    if (challenge.used) {
      return NextResponse.json({ error: 'Challenge already used' }, { status: 409 })
    }
    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 410 })
    }

    const expectedPayload = canonicalizePayload({
      capability: 'agent-capability-test',
      challengeId,
      nonce: challenge.nonce,
      schemaVersion: '1.0.0',
      sdk: 'agentkit',
      timestamp: challenge.issuedAt,
    })
    const receivedPayload = canonicalizePayload(proof.payload)
    if (receivedPayload !== expectedPayload) {
      return NextResponse.json({ error: 'Deterministic schema mismatch' }, { status: 400 })
    }
    if (proof.nonce !== challenge.nonce || proof.payload.nonce !== challenge.nonce) {
      return NextResponse.json({ error: 'Nonce mismatch' }, { status: 400 })
    }
    if (proof.payload.challengeId !== challengeId) {
      return NextResponse.json({ error: 'Challenge ID mismatch' }, { status: 400 })
    }

    const message = `agent-capability:${expectedPayload}`
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: proof.signature as `0x${string}`,
    })

    if (recoveredAddress.toLowerCase() !== proof.address.toLowerCase()) {
      return NextResponse.json({ error: 'Signature check failed' }, { status: 401 })
    }
    if (proof.delegation.worldIdSignal.toLowerCase() !== proof.address.toLowerCase()) {
      return NextResponse.json({ error: 'World ID delegation mismatch' }, { status: 403 })
    }
    const humanId = await agentBook.lookupHuman(proof.address, env.NEXT_PUBLIC_CHAIN_ID)
    if (!humanId) {
      return NextResponse.json(
        { error: 'Agent is not registered in the AgentBook. Register first.' },
        { status: 403 }
      )
    }

    challenge.used = true
    ACTIVE_CHALLENGES.set(challengeId, challenge)

    return NextResponse.json({
      success: true,
      status: {
        challengeIssued: true,
        proofReceived: true,
        worldIdDelegationMatched: true,
      },
      claimUnlocked: true,
      humanId,
      message,
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Challenge verification failed: ${error instanceof Error ? error.message : 'unknown'}` },
      { status: 500 }
    )
  }
}
