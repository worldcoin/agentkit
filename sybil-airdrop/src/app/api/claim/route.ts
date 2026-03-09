import { NextRequest, NextResponse } from 'next/server'
import { parseAgentkitHeader, validateAgentkitMessage, verifyAgentkitSignature, agentBook } from '@/lib/agentkit'
import { executeAirdrop } from '@/lib/airdrop'
import db from '@/lib/db'
import type { Challenge, Claim } from '@/lib/db'
import { env } from '@/lib/config'

export async function POST(req: NextRequest) {
	try {
		const { payload } = await req.json()

		if (!payload || typeof payload !== 'string') {
			return NextResponse.json({ error: 'Missing or invalid payload' }, { status: 400 })
		}

		let parsed
		try {
			parsed = parseAgentkitHeader(payload)
		} catch (err) {
			return NextResponse.json(
				{ error: `Failed to parse payload: ${err instanceof Error ? err.message : 'unknown'}` },
				{ status: 400 }
			)
		}

		const resourceUri = `https://${env.NEXT_PUBLIC_DOMAIN}`
		const validation = await validateAgentkitMessage(parsed, resourceUri, {
			checkNonce: async (nonce: string) => {
				const { data: challenge } = await db
					.from('Challenge')
					.select('*')
					.eq('nonce', nonce)
					.single<Challenge>()

				if (!challenge || challenge.used || new Date(challenge.expiresAt) < new Date()) return false

				await db.from('Challenge').update({ used: true }).eq('nonce', nonce)
				return true
			},
		})

		if (!validation.valid) {
			return NextResponse.json({ error: `Validation failed: ${validation.error}` }, { status: 400 })
		}

		const verification = await verifyAgentkitSignature(parsed)
		if (!verification.valid || !verification.address) {
			return NextResponse.json(
				{ error: `Signature verification failed: ${verification.error}` },
				{ status: 401 }
			)
		}

		const agentAddress = verification.address as `0x${string}`

		const nullifierHash = await agentBook.lookupHuman(agentAddress, env.NEXT_PUBLIC_CHAIN_ID)
		if (!nullifierHash) {
			return NextResponse.json(
				{ error: 'Agent is not registered in the AgentBook. Register with World ID first.' },
				{ status: 403 }
			)
		}

		const { data: existingClaim } = await db
			.from('Claim')
			.select('*')
			.eq('nullifierHash', nullifierHash)
			.single<Claim>()

		if (existingClaim) {
			return NextResponse.json(
				{
					error: 'This human has already claimed the airdrop',
					txHash: existingClaim.txHash,
					claimedAt: existingClaim.claimedAt,
				},
				{ status: 409 }
			)
		}

		const txHash = await executeAirdrop(agentAddress, BigInt(nullifierHash))

		const { error: insertError } = await db.from('Claim').insert({
			nullifierHash,
			agentAddress,
			txHash,
			amount: env.CLAIM_AMOUNT,
		})

		if (insertError) {
			console.error('Claim insert error:', insertError)
		}

		return NextResponse.json({
			success: true,
			txHash,
			amount: env.CLAIM_AMOUNT,
			agentAddress,
			explorerUrl: `https://basescan.org/tx/${txHash}`,
		})
	} catch (error) {
		console.error('Claim error:', error)
		return NextResponse.json(
			{ error: `Internal server error: ${error instanceof Error ? error.message : 'unknown'}` },
			{ status: 500 }
		)
	}
}
