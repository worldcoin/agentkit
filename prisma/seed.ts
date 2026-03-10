import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.claim.deleteMany()
  await prisma.challenge.deleteMany()

  const claims = await Promise.all([
    prisma.claim.create({
      data: {
        nullifierHash: '0x1a2b3c4d5e6f708192a3b4c5d6e7f80011223344',
        agentAddress: '0xbEBB5B46fFDA7E7494595E826FC4D4a61ce5f6A6',
        txHash: '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456',
        amount: '1000000000000000000',
      },
    }),
    prisma.claim.create({
      data: {
        nullifierHash: '0x2b3c4d5e6f708192a3b4c5d6e7f800112233445566',
        agentAddress: '0x00d01CE88eA613281800E84b6C53Dfea58875d29',
        txHash: '0xdef456789012345678901234567890abcdef1234567890abcdef123456789abc',
        amount: '1000000000000000000',
      },
    }),
    prisma.claim.create({
      data: {
        nullifierHash: '0x3c4d5e6f708192a3b4c5d6e7f8001122334455667788',
        agentAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
        txHash: '0x789012345678901234567890abcdef1234567890abcdef123456789abcdef012',
        amount: '1000000000000000000',
      },
    }),
  ])

  const now = new Date()
  const challenges = await Promise.all([
    prisma.challenge.create({
      data: {
        nonce: 'abc123def456',
        domain: 'localhost:3000',
        uri: 'https://localhost:3000',
        chainId: 'eip155:8453',
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        used: false,
      },
    }),
    prisma.challenge.create({
      data: {
        nonce: 'xyz789ghi012',
        domain: 'localhost:3000',
        uri: 'https://localhost:3000',
        chainId: 'eip155:8453',
        expiresAt: new Date(now.getTime() - 10 * 60 * 1000),
        used: true,
      },
    }),
  ])

  console.log(`Created ${claims.length} claims and ${challenges.length} challenges`)
  console.log('Seed complete.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
