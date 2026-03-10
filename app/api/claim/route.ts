import { NextRequest, NextResponse } from 'next/server'
import {
  parseAgentkitHeader,
  validateAgentkitMessage,
  verifyAgentkitSignature,
  agentBook,
} from '@/lib/agentkit'
import { executeAirdrop } from '@/lib/airdrop'
import db from '@/lib/db'
import type { Challenge, Claim } from '@/lib/db'
import { env } from '@/lib/config'
import {
  createRequestContext,
  elapsedMs,
  ERROR_CODES,
  logEvent,
  maskAddress,
  responseError,
  responseWithRequestId,
  withSpan,
} from '@/lib/observability'

export async function POST(req: NextRequest) {
  const ctx = createRequestContext(req, '/api/claim')
  logEvent('info', 'claim.request.start', {
    requestId: ctx.requestId,
    route: ctx.route,
    method: ctx.method,
  })

  try {
    const { payload } = await req.json()

    if (!payload || typeof payload !== 'string') {
      return responseError(ctx, 400, ERROR_CODES.BAD_REQUEST, 'Missing or invalid payload')
    }

    let parsed
    try {
      parsed = parseAgentkitHeader(payload)
    } catch (err) {
      logEvent('warn', 'claim.payload.parse_failed', {
        requestId: ctx.requestId,
        route: ctx.route,
        errorMessage: err instanceof Error ? err.message : 'unknown',
      })
      return responseError(ctx, 400, ERROR_CODES.BAD_REQUEST, 'Failed to parse payload')
    }

    const resourceUri = `https://${env.NEXT_PUBLIC_DOMAIN}`
    const validation = await withSpan(
      'claim.validate_agentkit_message',
      {
        route: ctx.route,
      },
      () =>
        validateAgentkitMessage(parsed, resourceUri, {
          checkNonce: async (nonce: string) => {
            const { data: challenge } = await db
              .from('Challenge')
              .select('*')
              .eq('nonce', nonce)
              .single<Challenge>()

            if (!challenge || challenge.used || new Date(challenge.expiresAt) < new Date()) {
              return false
            }

            await db.from('Challenge').update({ used: true }).eq('nonce', nonce)
            return true
          },
        })
    )

    if (!validation.valid) {
      logEvent('warn', 'claim.validation.failed', {
        requestId: ctx.requestId,
        route: ctx.route,
        validationError: validation.error,
      })
      return responseError(ctx, 400, ERROR_CODES.NONCE_INVALID, 'Validation failed')
    }

    const verification = await withSpan(
      'claim.verify_signature',
      {
        route: ctx.route,
      },
      () => verifyAgentkitSignature(parsed)
    )
    if (!verification.valid || !verification.address) {
      logEvent('warn', 'claim.signature.invalid', {
        requestId: ctx.requestId,
        route: ctx.route,
        verificationError: verification.error,
      })
      return responseError(ctx, 401, ERROR_CODES.INVALID_SIGNATURE, 'Signature verification failed')
    }

    const agentAddress = verification.address as `0x${string}`

    const nullifierHash = await withSpan(
      'claim.lookup_human',
      {
        route: ctx.route,
      },
      () => agentBook.lookupHuman(agentAddress, env.NEXT_PUBLIC_CHAIN_ID)
    )
    if (!nullifierHash) {
      logEvent('warn', 'claim.agent_not_registered', {
        requestId: ctx.requestId,
        route: ctx.route,
        wallet: maskAddress(agentAddress),
      })
      return responseError(
        ctx,
        403,
        ERROR_CODES.AGENT_NOT_REGISTERED,
        'Agent is not registered in the AgentBook. Register with World ID first.'
      )
    }

    const { data: existingClaim } = await withSpan(
      'claim.lookup_existing',
      {
        route: ctx.route,
      },
      () =>
        db
          .from('Claim')
          .select('*')
          .eq('nullifierHash', nullifierHash)
          .single<Claim>()
    )

    if (existingClaim) {
      logEvent('warn', 'claim.already_exists', {
        requestId: ctx.requestId,
        route: ctx.route,
        wallet: maskAddress(agentAddress),
      })
      return responseWithRequestId(
        ctx,
        {
          error: 'This human has already claimed the airdrop',
          code: ERROR_CODES.CLAIM_ALREADY_EXISTS,
          txHash: existingClaim.txHash,
          claimedAt: existingClaim.claimedAt,
        },
        409
      )
    }

    const txHash = await withSpan(
      'claim.execute_airdrop',
      {
        route: ctx.route,
      },
      () => executeAirdrop(agentAddress, BigInt(nullifierHash))
    )

    const { error: insertError } = await withSpan(
      'claim.insert_record',
      {
        route: ctx.route,
      },
      () =>
        db.from('Claim').insert({
          nullifierHash,
          agentAddress,
          txHash,
          amount: env.CLAIM_AMOUNT,
        })
    )

    if (insertError) {
      logEvent('error', 'claim.insert.failed', {
        requestId: ctx.requestId,
        route: ctx.route,
        durationMs: elapsedMs(ctx.startedAt),
        errorMessage: insertError.message,
      })
      return responseError(ctx, 500, ERROR_CODES.DB_WRITE_FAILED, 'Failed to persist claim')
    }

    logEvent('info', 'claim.request.success', {
      requestId: ctx.requestId,
      route: ctx.route,
      wallet: maskAddress(agentAddress),
      txHash,
      durationMs: elapsedMs(ctx.startedAt),
    })

    return responseWithRequestId(ctx, {
      success: true,
      txHash,
      amount: env.CLAIM_AMOUNT,
      agentAddress,
      explorerUrl: `https://basescan.org/tx/${txHash}`,
    })
  } catch (error) {
    logEvent('error', 'claim.request.failed', {
      requestId: ctx.requestId,
      route: ctx.route,
      durationMs: elapsedMs(ctx.startedAt),
      errorMessage: error instanceof Error ? error.message : 'unknown',
    })
    return responseError(ctx, 500, ERROR_CODES.INTERNAL_ERROR, 'Internal server error')
  }
}
