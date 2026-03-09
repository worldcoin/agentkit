import { NextResponse } from 'next/server'
import { generateNonce } from 'siwe'
import db from '@/lib/db'
import { env } from '@/lib/config'

export async function GET() {
	const nonce = generateNonce()
	const domain = env.NEXT_PUBLIC_DOMAIN
	const chainId = env.NEXT_PUBLIC_CHAIN_ID
	const uri = `https://${domain}`
	const now = new Date()
	const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)

	const { error } = await db.from('Challenge').insert({
		nonce,
		domain,
		uri,
		chainId,
		expiresAt: expiresAt.toISOString(),
	})

	if (error) {
		console.error('Challenge creation error:', error)
		return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
	}

	return NextResponse.json({
		nonce,
		domain,
		uri,
		chainId,
		issuedAt: now.toISOString(),
		expirationTime: expiresAt.toISOString(),
		supportedChains: [chainId],
	})
}
