---
title: Send Transaction Command
category: commands
tags: send-transaction, transaction, smart-contract, blockchain
---

## Send Transaction Command

Interact with smart contracts by sending transactions. Allows your mini-app to execute blockchain transactions.

## When to Use

- Interacting with smart contracts
- Executing blockchain transactions
- Calling contract methods
- Transferring tokens (beyond simple payments)
- Complex DeFi operations

**Example Use Cases:**

- Swap tokens on DEX
- Interact with NFT contracts
- Execute complex smart contract functions
- Batch transactions
- DeFi protocol interactions

## API

### Input

```tsx
export type SendTransactionCommandInput = {
  to: string // Contract or address to send to
  value?: string // Amount in wei (for ETH/WLD transfers)
  data?: string // Contract call data (ABI-encoded)
  gasLimit?: string // Optional gas limit
}
```

### Output

```tsx
type MiniAppSendTransactionSuccessPayload = {
  status: 'success'
  transaction_hash: string
}

type MiniAppSendTransactionErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **MUST**: Verify transaction on blockchain before considering it successful
- **DO**: Provide clear transaction details to user before confirmation
- **DO**: Estimate gas costs when possible
- **DO**: Handle transaction failures gracefully
- **DO**: Show transaction status to user
- **DO**: Verify transaction_hash on blockchain

## DONTs

- **DON'T**: Trust frontend transaction responses without blockchain verification
- **DON'T**: Skip transaction verification
- **DON'T**: Send transactions without user understanding
- **DON'T**: Process orders before blockchain confirmation

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleSendTransaction = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
    to: '0xContractAddress...',
    value: '0', // No ETH transfer
    data: '0x...', // ABI-encoded function call
  })

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled
    }
    toast.error('Transaction failed')
    return
  }

  // Verify transaction on blockchain
  const verifyResponse = await fetch('/api/transaction/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_hash: finalPayload.transaction_hash,
    }),
  })

  const verifyResult = await verifyResponse.json()
  if (verifyResult.confirmed) {
    toast.success('Transaction confirmed!')
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppSendTransactionPayload } from '@worldcoin/minikit-js'

// Send command
const handleSendTransaction = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.sendTransaction({
    to: '0xContractAddress...',
    data: '0x...',
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppSendTransaction,
    async (response: MiniAppSendTransactionPayload) => {
      if (response.status === 'error') {
        return
      }

      // Verify transaction
      await fetch('/api/transaction/verify', {
        method: 'POST',
        body: JSON.stringify({
          transaction_hash: response.transaction_hash,
        }),
      })
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppSendTransaction)
  }
}, [])
```

## References

- [World Mini Apps - Send Transaction](https://docs.world.org/mini-apps/commands/send-transaction)
