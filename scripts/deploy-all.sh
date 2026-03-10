#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# Dropping Air — Deploy all contracts to Base mainnet
#
# Deployer: 0xbEBB5B46fFDA7E7494595E826FC4D4a61ce5f6A6
#
# Usage:
#   DEPLOYER_PRIVATE_KEY=0x... bash scripts/deploy-all.sh
# ──────────────────────────────────────────────────────────

if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "Error: DEPLOYER_PRIVATE_KEY is not set."
  echo ""
  echo "Usage:"
  echo "  cd sybil-airdrop"
  echo "  DEPLOYER_PRIVATE_KEY=0x... bash scripts/deploy-all.sh"
  exit 1
fi

RPC_URL="https://mainnet.base.org"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYBIL_CONTRACTS_DIR="$SCRIPT_DIR/../contracts"
AGENTBOOK_CONTRACTS_DIR="$SCRIPT_DIR/../../contracts"

# Pre-computed externalNullifierHash for:
#   app_id = app_51925df0f1fa5388389b749e6a0f576c
#   action = claim-token-dropping-air
WORLD_ID_ROUTER="0xBCC7e5910178AFFEEeBA573ba6903E9869594163"
GROUP_ID="1"
EXTERNAL_NULLIFIER_HASH="328856683023252186786757582795161293175094147904016535319765956645134055853"

CLAIM_AMOUNT="1000000000000000000"        # 1 DROP (18 decimals)
TOTAL_SUPPLY="1000000000000000000000000"  # 1,000,000 DROP
FUND_AMOUNT="10000000000000000000000"     # 10,000 DROP to seed

DEPLOYER_ADDRESS=$(cast wallet address "$DEPLOYER_PRIVATE_KEY")

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Dropping Air — Contract Deployment   ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Network:  Base mainnet (8453)"
echo "Deployer: $DEPLOYER_ADDRESS"
echo "Balance:  $(cast balance "$DEPLOYER_ADDRESS" --rpc-url "$RPC_URL" --ether) ETH"
echo ""

# ── 1. AgentBook ────────────────────────────────────────
echo "━━━ [1/4] Deploying AgentBook ━━━"
cd "$AGENTBOOK_CONTRACTS_DIR"

AGENTBOOK_OUTPUT=$(forge create src/AgentBook.sol:AgentBook \
  --constructor-args "$WORLD_ID_ROUTER" "$GROUP_ID" "$EXTERNAL_NULLIFIER_HASH" \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --json)
AGENTBOOK_ADDRESS=$(echo "$AGENTBOOK_OUTPUT" | jq -r '.deployedTo')
echo "  AgentBook:  $AGENTBOOK_ADDRESS"
echo ""

# ── 2. DroppingAirToken ────────────────────────────────
echo "━━━ [2/4] Deploying DroppingAirToken (DROP) ━━━"
cd "$SYBIL_CONTRACTS_DIR"

TOKEN_OUTPUT=$(forge create src/DroppingAirToken.sol:DroppingAirToken \
  --constructor-args "$TOTAL_SUPPLY" \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --json)
TOKEN_ADDRESS=$(echo "$TOKEN_OUTPUT" | jq -r '.deployedTo')
echo "  Token:      $TOKEN_ADDRESS"
echo ""

# ── 3. SybilAirdrop ────────────────────────────────────
echo "━━━ [3/4] Deploying SybilAirdrop ━━━"

AIRDROP_OUTPUT=$(forge create src/SybilAirdrop.sol:SybilAirdrop \
  --constructor-args "$TOKEN_ADDRESS" "$CLAIM_AMOUNT" \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --json)
AIRDROP_ADDRESS=$(echo "$AIRDROP_OUTPUT" | jq -r '.deployedTo')
echo "  Airdrop:    $AIRDROP_ADDRESS"
echo ""

# ── 4. Fund airdrop ────────────────────────────────────
echo "━━━ [4/4] Funding SybilAirdrop with 10,000 DROP ━━━"

cast send "$TOKEN_ADDRESS" \
  "transfer(address,uint256)" "$AIRDROP_ADDRESS" "$FUND_AMOUNT" \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --json > /dev/null

echo "  Done."
echo ""

# ── Summary ─────────────────────────────────────────────
echo "╔══════════════════════════════════════════╗"
echo "║          Deployment Complete!            ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Add these to sybil-airdrop/.env:"
echo ""
echo "  AGENTBOOK_CONTRACT_ADDRESS=$AGENTBOOK_ADDRESS"
echo "  NEXT_PUBLIC_AGENTBOOK_ADDRESS=$AGENTBOOK_ADDRESS"
echo "  AIRDROP_CONTRACT_ADDRESS=$AIRDROP_ADDRESS"
echo "  TOKEN_ADDRESS=$TOKEN_ADDRESS"
echo "  AIRDROP_SIGNER_PRIVATE_KEY=\$DEPLOYER_PRIVATE_KEY"
echo ""
echo "The deployer ($DEPLOYER_ADDRESS) is the SybilAirdrop owner."
echo "Its private key must be set as AIRDROP_SIGNER_PRIVATE_KEY."
