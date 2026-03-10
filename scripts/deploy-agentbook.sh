#!/bin/bash
set -euo pipefail

# Deploy AgentBook to Base mainnet
#
# Prerequisites:
#   - Wallet must have ETH on Base mainnet
#   - Run from repo root or sybil-airdrop directory

PRIVATE_KEY="0x01da274469d86f517d0274c9bcf026b531874458fee7304812bb3210116104b5"
RPC_URL="https://mainnet.base.org"
CONTRACTS_DIR="$(dirname "$0")/../../contracts"

# World ID configuration
WORLD_ID_ROUTER="0xBCC7e5910178AFFEEeBA573ba6903E9869594163"
GROUP_ID="1"
APP_ID="app_51925df0f1fa5388389b749e6a0f576c"
ACTION="claim-token-dropping-air"

echo "=== Deploying AgentBook ==="
echo "World ID Router: $WORLD_ID_ROUTER"
echo "Group ID: $GROUP_ID"
echo "App ID: $APP_ID"
echo "Action: $ACTION"

cd "$CONTRACTS_DIR"

WORLD_ID_ROUTER="$WORLD_ID_ROUTER" \
GROUP_ID="$GROUP_ID" \
APP_ID="$APP_ID" \
ACTION="$ACTION" \
forge script script/DeployAgentBook.s.sol:DeployAgentBook \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  -vvvv

echo ""
echo "=== AgentBook deployment complete ==="
echo "Check the output above for the deployed address."
echo "Update AGENTBOOK_CONTRACT_ADDRESS in your .env file."
