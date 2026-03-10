import { z } from 'zod'

const envSchema = z.object({
  AGENTBOOK_CONTRACT_ADDRESS: z.string().startsWith('0x'),
  AGENTBOOK_RPC_URL: z.string(),
  AIRDROP_CONTRACT_ADDRESS: z.string().startsWith('0x'),
  AIRDROP_SIGNER_PRIVATE_KEY: z.string().startsWith('0x'),
  TOKEN_ADDRESS: z.string().startsWith('0x'),
  CLAIM_AMOUNT: z.string(),
  NEXT_PUBLIC_CHAIN_ID: z.string(),
  NEXT_PUBLIC_DOMAIN: z.string(),
})

let _env: z.infer<typeof envSchema> | null = null

export function getEnv() {
  if (_env) return _env
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format())
    throw new Error('Invalid environment variables')
  }
  _env = result.data
  return _env
}

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: string) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>]
  },
})
