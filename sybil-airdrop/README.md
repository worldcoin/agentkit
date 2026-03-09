# Sybil-Resistant Airdrop

A token airdrop system that enforces one-claim-per-human using [AgentKit](../agentkit/) and World ID proof-of-personhood. Built on Base Sepolia.

## How It Works

1. Agents register their wallet in the **AgentBook** smart contract using a World ID proof, linking their address to an anonymous human identifier (nullifier hash).
2. To claim, the agent signs a CAIP-122 challenge (SIWE format) proving wallet ownership.
3. The server verifies the signature via AgentKit, looks up the human identifier in the AgentBook, and checks for duplicate claims.
4. If eligible, the server calls the **SybilAirdrop** contract to transfer tokens.

**Dual sybil protection**: the backend checks a database before submitting, and the contract itself rejects duplicate claims on-chain.

## Architecture

```
Agent → GET /api/challenge → Server returns CAIP-122 challenge
Agent → Signs challenge with wallet (SIWE)
Agent → POST /api/claim { payload } → Server verifies → AgentBook lookup → Airdrop
```

## Setup

### Prerequisites

- Node.js 18+
- A deployed AgentBook contract on Base Sepolia
- A deployed SybilAirdrop contract (funded with ERC-20 tokens)
- A backend signer wallet (owner of the SybilAirdrop contract)

### Install

```bash
# From the repo root
npm install

# Generate Prisma client and create database
cd sybil-airdrop
npx prisma generate
npx prisma db push
```

### Configure

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Smart Contract

`contracts/src/SybilAirdrop.sol` — an ERC-20 airdrop contract with per-human claim tracking:

- `claim(address agent, uint256 nullifierHash)` — owner-only, transfers tokens to the agent
- `hasClaimed(uint256 nullifierHash)` — check if a human already claimed
- `remainingBalance()` — tokens left in the pool
- `withdraw()` — owner reclaims unclaimed tokens

Deploy with Foundry:

```bash
cd contracts
forge create src/SybilAirdrop.sol:SybilAirdrop \
  --constructor-args <TOKEN_ADDRESS> <CLAIM_AMOUNT> \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_KEY
```

Then fund the contract by transferring ERC-20 tokens to its address.

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/challenge` | GET | Generate a CAIP-122 challenge (nonce, domain, chain) |
| `/api/claim` | POST | Submit signed payload to verify identity and claim tokens |
| `/api/status?address=0x...` | GET | Check registration and claim status for an address |

## Tech Stack

- **Next.js 15** (App Router) with Tailwind CSS v3
- **Prisma** with SQLite for claim tracking
- **viem** for contract interactions
- **@worldcoin/agentkit** for signature verification and AgentBook lookups
- **Foundry** for the SybilAirdrop Solidity contract
