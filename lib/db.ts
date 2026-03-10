import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const db = createClient(supabaseUrl, supabaseKey)

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
