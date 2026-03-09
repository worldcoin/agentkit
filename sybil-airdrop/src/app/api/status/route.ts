import { NextRequest, NextResponse } from 'next/server'
import { agentBook } from '@/lib/agentkit'
import db from '@/lib/db'
import type { Claim } from '@/lib/db'
import { env } from '@/lib/config'

export async function GET(req: NextRequest) {
	const address = req.nextUrl.searchParams.get('address')

	if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
		return NextResponse.json({ error: 'Invalid or missing address parameter' }, { status: 400 })
	}

	try {
		const nullifierHash = await agentBook.lookupHuman(address, env.NEXT_PUBLIC_CHAIN_ID)

		if (!nullifierHash) {
			return NextResponse.json({
				registered: false,
				humanId: null,
				claimed: false,
				claim: null,
			})
		}

		const { data: claim } = await db
			.from('Claim')
			.select('*')
			.eq('nullifierHash', nullifierHash)
			.single<Claim>()

		return NextResponse.json({
			registered: true,
			humanId: `${nullifierHash.slice(0, 10)}...${nullifierHash.slice(-8)}`,
			claimed: !!claim,
			claim: claim
				? {
						txHash: claim.txHash,
						amount: claim.amount,
						claimedAt: claim.claimedAt,
						explorerUrl: `https://basescan.org/tx/${claim.txHash}`,
					}
				: null,
		})
	} catch (err) {
		console.error('Status check error:', err)
		return NextResponse.json(
			{ error: `Failed to check status: ${err instanceof Error ? err.message : 'unknown'}` },
			{ status: 500 }
		)
	}
}
