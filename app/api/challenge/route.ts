import { NextRequest } from 'next/server'
import { generateNonce } from 'siwe'
import db from '@/lib/db'
import { env } from '@/lib/config'
import {
  createRequestContext,
  elapsedMs,
  ERROR_CODES,
  logEvent,
  responseError,
  responseWithRequestId,
  withSpan,
} from '@/lib/observability'

export async function GET(req: NextRequest) {
  const ctx = createRequestContext(req, '/api/challenge')
  logEvent('info', 'challenge.request.start', {
    requestId: ctx.requestId,
    route: ctx.route,
    method: ctx.method,
  })

  try {
    const nonce = generateNonce()
    const domain = env.NEXT_PUBLIC_DOMAIN
    const chainId = env.NEXT_PUBLIC_CHAIN_ID
    const uri = `https://${domain}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)

    const { error } = await withSpan(
      'challenge.insert',
      {
        route: ctx.route,
      },
      async () =>
        db.from('Challenge').insert({
          nonce,
          domain,
          uri,
          chainId,
          expiresAt: expiresAt.toISOString(),
        })
    )

    if (error) {
      logEvent('error', 'challenge.insert.failed', {
        requestId: ctx.requestId,
        route: ctx.route,
        durationMs: elapsedMs(ctx.startedAt),
        errorMessage: error.message,
      })
      return responseError(ctx, 500, ERROR_CODES.DB_WRITE_FAILED, 'Failed to create challenge')
    }

    logEvent('info', 'challenge.request.success', {
      requestId: ctx.requestId,
      route: ctx.route,
      durationMs: elapsedMs(ctx.startedAt),
    })

    return responseWithRequestId(ctx, {
      nonce,
      domain,
      uri,
      chainId,
      issuedAt: now.toISOString(),
      expirationTime: expiresAt.toISOString(),
      supportedChains: [chainId],
    })
  } catch (error) {
    logEvent('error', 'challenge.request.failed', {
      requestId: ctx.requestId,
      route: ctx.route,
      durationMs: elapsedMs(ctx.startedAt),
      errorMessage: error instanceof Error ? error.message : 'unknown',
    })
    return responseError(ctx, 500, ERROR_CODES.INTERNAL_ERROR, 'Internal server error')
  }
}
