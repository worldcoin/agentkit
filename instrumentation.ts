import { logEvent } from '@/lib/observability'

let isBootstrapped = false

export async function register() {
  if (isBootstrapped) {
    return
  }
  isBootstrapped = true

  logEvent('info', 'otel.bootstrap', {
    runtime: process.env.NEXT_RUNTIME ?? 'nodejs',
  })
}
