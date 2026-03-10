import { randomBytes, randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { recoverMessageAddress } from 'viem'
import { z } from 'zod'
import { agentBook } from '@/lib/agentkit'
import { env } from '@/lib/config'
import {
  createRequestContext,
  createSyntheticRequestContext,
  elapsedMs,
  ERROR_CODES,
  logEvent,
  maskAddress,
  responseError,
  responseWithRequestId,
  withSpan,
} from '@/lib/observability'

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

export async function GET(req: NextRequest) {
  const ctx = createRequestContext(req, '/api/agent-challenge')
  trimExpiredChallenges()
  logEvent('info', 'agent_challenge.issue.start', {
    requestId: ctx.requestId,
    route: ctx.route,
  })

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

  logEvent('info', 'agent_challenge.issue.success', {
    requestId: ctx.requestId,
    route: ctx.route,
    durationMs: elapsedMs(ctx.startedAt),
  })

  return responseWithRequestId(ctx, {
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
  const ctx = createRequestContext(req, '/api/agent-challenge')
  trimExpiredChallenges()
  logEvent('info', 'agent_challenge.verify.start', {
    requestId: ctx.requestId,
    route: ctx.route,
  })

  try {
    const json = await req.json()
    const parsed = proofSchema.safeParse(json)
    if (!parsed.success) {
      return responseError(ctx, 400, ERROR_CODES.BAD_REQUEST, 'Invalid proof payload')
    }

    const { challengeId, proof } = parsed.data
    const challenge = ACTIVE_CHALLENGES.get(challengeId)
    if (!challenge) {
      return responseError(ctx, 404, ERROR_CODES.CHALLENGE_NOT_FOUND, 'Unknown challenge')
    }
    if (challenge.used) {
      return responseError(ctx, 409, ERROR_CODES.CHALLENGE_USED, 'Challenge already used')
    }
    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      return responseError(ctx, 410, ERROR_CODES.NONCE_EXPIRED, 'Challenge expired')
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
      return responseError(
        ctx,
        400,
        ERROR_CODES.DETERMINISTIC_PAYLOAD_MISMATCH,
        'Deterministic schema mismatch'
      )
    }
    if (proof.nonce !== challenge.nonce || proof.payload.nonce !== challenge.nonce) {
      return responseError(ctx, 400, ERROR_CODES.NONCE_INVALID, 'Nonce mismatch')
    }
    if (proof.payload.challengeId !== challengeId) {
      return responseError(ctx, 400, ERROR_CODES.BAD_REQUEST, 'Challenge ID mismatch')
    }

    const message = `agent-capability:${expectedPayload}`
    const recoveredAddress = await withSpan(
      'agent_challenge.recover_address',
      {
        route: ctx.route,
      },
      () =>
        recoverMessageAddress({
          message,
          signature: proof.signature as `0x${string}`,
        })
    )

    if (recoveredAddress.toLowerCase() !== proof.address.toLowerCase()) {
      return responseError(ctx, 401, ERROR_CODES.INVALID_SIGNATURE, 'Signature check failed')
    }
    if (proof.delegation.worldIdSignal.toLowerCase() !== proof.address.toLowerCase()) {
      return responseError(ctx, 403, ERROR_CODES.INVALID_SIGNATURE, 'World ID delegation mismatch')
    }
    const humanId = await withSpan(
      'agent_challenge.lookup_human',
      {
        route: ctx.route,
      },
      () => agentBook.lookupHuman(proof.address, env.NEXT_PUBLIC_CHAIN_ID)
    )
    if (!humanId) {
      return responseError(
        ctx,
        403,
        ERROR_CODES.AGENT_NOT_REGISTERED,
        'Agent is not registered in the AgentBook. Register first.'
      )
    }

    challenge.used = true
    ACTIVE_CHALLENGES.set(challengeId, challenge)

    logEvent('info', 'agent_challenge.verify.success', {
      requestId: ctx.requestId,
      route: ctx.route,
      wallet: maskAddress(proof.address),
      durationMs: elapsedMs(ctx.startedAt),
    })

    return responseWithRequestId(ctx, {
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
    logEvent('error', 'agent_challenge.verify.failed', {
      requestId: ctx.requestId,
      route: ctx.route,
      durationMs: elapsedMs(ctx.startedAt),
      errorMessage: error instanceof Error ? error.message : 'unknown',
    })
    return responseError(ctx, 500, ERROR_CODES.INTERNAL_ERROR, 'Challenge verification failed')
  }
}
