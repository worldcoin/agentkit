type ClientTelemetryLevel = 'info' | 'warn' | 'error'

type ClientTelemetryPayload = {
  level?: ClientTelemetryLevel
  event: string
  requestId?: string | null
  route?: string
  errorCode?: string
  message?: string
  step?: string
}

export function getResponseRequestId(response: Response) {
  return response.headers.get('x-request-id')
}

export function trackClientEvent(payload: ClientTelemetryPayload) {
  const body = {
    timestamp: new Date().toISOString(),
    source: 'client',
    ...payload,
  }

  if (process.env.NODE_ENV === 'production' && payload.level !== 'error') {
    return
  }

  const serialized = JSON.stringify(body)
  if (payload.level === 'error') {
    console.error(serialized)
    return
  }
  if (payload.level === 'warn') {
    console.warn(serialized)
    return
  }
  console.info(serialized)
}
