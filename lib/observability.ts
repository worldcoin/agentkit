import { context, trace, SpanStatusCode } from '@opentelemetry/api'
import { NextRequest, NextResponse } from 'next/server'

type LogLevel = 'info' | 'warn' | 'error'

type LogFields = Record<string, unknown>

type RequestContext = {
  requestId: string
  route: string
  method: string
  startedAt: number
}

const REDACT_KEYS = [
  'authorization',
  'signature',
  'token',
  'privatekey',
  'private_key',
  'proof',
  'payload',
  'airdrop_signer_private_key',
]

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  NONCE_INVALID: 'NONCE_INVALID',
  NONCE_EXPIRED: 'NONCE_EXPIRED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  AGENT_NOT_REGISTERED: 'AGENT_NOT_REGISTERED',
  CLAIM_ALREADY_EXISTS: 'CLAIM_ALREADY_EXISTS',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',
  DB_READ_FAILED: 'DB_READ_FAILED',
  CHAIN_TX_FAILED: 'CHAIN_TX_FAILED',
  CHALLENGE_NOT_FOUND: 'CHALLENGE_NOT_FOUND',
  CHALLENGE_USED: 'CHALLENGE_USED',
  DETERMINISTIC_PAYLOAD_MISMATCH: 'DETERMINISTIC_PAYLOAD_MISMATCH',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RP_CONTEXT_FAILED: 'RP_CONTEXT_FAILED',
} as const

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue)
  }
  if (value && typeof value === 'object') {
    const redacted: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      const normalized = key.toLowerCase()
      if (REDACT_KEYS.some(secretKey => normalized.includes(secretKey))) {
        redacted[key] = '[REDACTED]'
      } else {
        redacted[key] = redactValue(entry)
      }
    }
    return redacted
  }
  return value
}

export function createRequestContext(req: NextRequest, route: string): RequestContext {
  return {
    requestId: req.headers.get('x-request-id') ?? createRequestId(),
    route,
    method: req.method,
    startedAt: Date.now(),
  }
}

export function createSyntheticRequestContext(route: string, method: string): RequestContext {
  return {
    requestId: createRequestId(),
    route,
    method,
    startedAt: Date.now(),
  }
}

export function logEvent(level: LogLevel, event: string, fields: LogFields = {}) {
  const activeSpan = trace.getSpan(context.active())
  const payload = redactValue({
    timestamp: new Date().toISOString(),
    level,
    event,
    env: process.env.NODE_ENV ?? 'development',
    service: 'dropping-air',
    traceId: activeSpan?.spanContext().traceId,
    spanId: activeSpan?.spanContext().spanId,
    ...fields,
  })

  const serialized = JSON.stringify(payload)
  if (level === 'error') {
    console.error(serialized)
    return
  }
  if (level === 'warn') {
    console.warn(serialized)
    return
  }
  console.info(serialized)
}

export async function withSpan<T>(
  spanName: string,
  attributes: Record<string, string | number | boolean>,
  run: () => Promise<T>
) {
  const tracer = trace.getTracer('dropping-air')
  return tracer.startActiveSpan(spanName, { attributes }, async span => {
    try {
      const result = await run()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}

export function responseWithRequestId(
  ctx: RequestContext,
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(
    {
      ...body,
      requestId: ctx.requestId,
    },
    {
      status,
      headers: { 'x-request-id': ctx.requestId },
    }
  )
}

export function maskAddress(address: string | null | undefined) {
  if (!address) return null
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function responseError(
  ctx: RequestContext,
  status: number,
  code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES],
  message: string
) {
  return responseWithRequestId(
    ctx,
    {
      error: message,
      code,
    },
    status
  )
}

export function elapsedMs(startedAt: number) {
  return Date.now() - startedAt
}
