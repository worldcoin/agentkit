import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _db: SupabaseClient | null = null

function getDb(): SupabaseClient {
  if (_db) return _db
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or key environment variables')
  }
  _db = createClient(supabaseUrl, supabaseKey)
  return _db
}

const db = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const instance = getDb()
    const value = instance[prop as keyof SupabaseClient]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

export default db

export type Claim = {
  id: string
  nullifierHash: string
  agentAddress: string
  txHash: string
  amount: string
  claimedAt: string
}

export type Challenge = {
  id: string
  nonce: string
  domain: string
  uri: string
  chainId: string
  createdAt: string
  expiresAt: string
  used: boolean
}
