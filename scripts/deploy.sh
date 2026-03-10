#!/bin/bash
set -euo pipefail

# Dropping Air — Full deployment script for Base mainnet
# Deploys: DroppingAirToken, SybilAirdrop, then funds the airdrop contract
#
# Prerequisites:
#   - Wallet 0x00d01CE88eA613281800E84b6C53Dfea58875d29 must have ETH on Base mainnet
#   - Run from the sybil-airdrop directory

PRIVATE_KEY="0x01da274469d86f517d0274c9bcf026b531874458fee7304812bb3210116104b5"
RPC_URL="https://mainnet.base.org"
CONTRACTS_DIR="$(dirname "$0")/../contracts"

CLAIM_AMOUNT="1000000000000000000"        # 1 token (18 decimals)
TOTAL_SUPPLY="1000000000000000000000000"  # 1,000,000 tokens

echo "=== Deploying DroppingAirToken ==="
TOKEN_OUTPUT=$(forge create "$CONTRACTS_DIR/src/DroppingAirToken.sol:DroppingAirToken" \
  --constructor-args "$TOTAL_SUPPLY" \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --json)
TOKEN_ADDRESS=$(echo "$TOKEN_OUTPUT" | jq -r '.deployedTo')
echo "Token deployed at: $TOKEN_ADDRESS"

echo ""
echo "=== Deploying SybilAirdrop ==="
AIRDROP_OUTPUT=$(forge create "$CONTRACTS_DIR/src/SybilAirdrop.sol:SybilAirdrop" \
  --constructor-args "$TOKEN_ADDRESS" "$CLAIM_AMOUNT" \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --json)
AIRDROP_ADDRESS=$(echo "$AIRDROP_OUTPUT" | jq -r '.deployedTo')
echo "SybilAirdrop deployed at: $AIRDROP_ADDRESS"

echo ""
echo "=== Funding SybilAirdrop with 10,000 tokens ==="
FUND_AMOUNT="10000000000000000000000"  # 10,000 tokens
cast send "$TOKEN_ADDRESS" \
  "transfer(address,uint256)" "$AIRDROP_ADDRESS" "$FUND_AMOUNT" \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"

echo ""
echo "=== Deployment Complete ==="
echo "TOKEN_ADDRESS=$TOKEN_ADDRESS"
echo "AIRDROP_CONTRACT_ADDRESS=$AIRDROP_ADDRESS"
echo ""
echo "Update your .env file with these values."
