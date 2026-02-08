---
name: world-id-sdk
description: >-
  Comprehensive guide for using the World ID SDK (MiniKit) in mini-apps. Includes all commands
  for verification, payments, authentication, transactions, chat, and more. Apps in this repository
  MUST use the SDK for all World App integrations.
license: MIT
compatibility: React 18+, Next.js, TypeScript, World App
metadata:
  author: Worldcoin
  version: '1.0.0'
---

# World ID SDK (MiniKit) - Commands Reference

This document provides comprehensive documentation for all MiniKit commands available in World App mini-apps. The SDK enables your mini-app to interact with World App features including World ID verification, payments, wallet authentication, transactions, chat, and more.

## When to Apply

Reference these guidelines when:

- Building mini-apps that integrate with World App
- Implementing World ID verification flows
- Adding payment functionality (WLD, USDC)
- Setting up wallet authentication (Sign in with Ethereum)
- Interacting with smart contracts
- Implementing chat or messaging features
- Requesting user permissions (notifications, microphone)
- Sending notifications or haptic feedback
- Sharing content or contacts

## Initialization

Before using any commands, MiniKit must be installed. Use the `MiniKitProvider` component:

```tsx
'use client'

import { MiniKit } from '@worldcoin/minikit-js'
import { ReactNode, useEffect } from 'react'

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    MiniKit.install()
  }, [])

  return <>{children}</>
}
```

Wrap your app root with the provider:

```tsx
import MiniKitProvider from '@/providers/minikit-provider'

export default function RootLayout({ children }) {
  return <MiniKitProvider>{children}</MiniKitProvider>
}
```

**MUST**: Always check if MiniKit is installed before using commands:

```tsx
if (!MiniKit.isInstalled()) {
  return // Handle case where World App is not available
}
```

## Command Patterns

MiniKit commands are available in two patterns:

### 1. Async Pattern (Recommended)

Commands return promises that resolve with the result:

```tsx
const { finalPayload } = await MiniKit.commandsAsync.verify({
  action: 'my-action',
})

if (finalPayload.status === 'error') {
  // Handle error
  return
}

// Handle success
```

### 2. Event-Based Pattern

Commands dispatch events that you subscribe to:

```tsx
// Send command
MiniKit.commands.verify({ action: 'my-action' })

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, response => {
    if (response.status === 'error') {
      // Handle error
      return
    }
    // Handle success
  })

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction)
  }
}, [])
```

**DO**: Use async pattern for simpler code flow
**DO**: Use event-based pattern for complex state management
**DON'T**: Mix both patterns for the same command

## Commands Overview

| Command                  | Description                             | Use Case                                         |
| ------------------------ | --------------------------------------- | ------------------------------------------------ |
| **Verify**               | Request a World ID proof                | Gating features behind unique human verification |
| **Pay**                  | Request a payment                       | Processing WLD or USDC payments                  |
| **Wallet Auth**          | Authenticate via Sign in with Ethereum  | User authentication with wallet                  |
| **Send Transaction**     | Interact with smart contracts           | Executing blockchain transactions                |
| **Sign Message**         | Sign personal messages                  | Message authentication                           |
| **Sign Typed Data**      | Sign EIP-712 payloads                   | Structured data signing                          |
| **Chat**                 | Send messages and create groups         | World Chat integration                           |
| **Share Contacts**       | Share user contacts (username only)     | Contact sharing features                         |
| **Request Permission**   | Request notifications/microphone access | Permission management                            |
| **Get Permissions**      | Get current user permissions            | Check permission status                          |
| **Send Notifications**   | Send push notifications                 | User engagement                                  |
| **Send Haptic Feedback** | Send haptic feedback                    | Enhanced UX feedback                             |
| **Share**                | Native OS share modal                   | Content sharing                                  |

## Command Documentation

### Verification & Authentication

- `rules/command-verify.md` - World ID verification with incognito actions
- `rules/command-wallet-auth.md` - Sign in with Ethereum authentication

### Payments & Transactions

- `rules/command-pay.md` - Payment processing (WLD, USDC)
- `rules/command-send-transaction.md` - Smart contract interactions

### Signing

- `rules/command-sign-message.md` - Personal message signing
- `rules/command-sign-typed-data.md` - EIP-712 typed data signing

### Communication

- `rules/command-chat.md` - World Chat messaging
- `rules/command-share-contacts.md` - Contact sharing

### Permissions & Notifications

- `rules/command-request-permission.md` - Request permissions
- `rules/command-get-permissions.md` - Get current permissions
- `rules/command-send-notifications.md` - Send push notifications

### User Experience

- `rules/command-haptics.md` - Haptic feedback
- `rules/command-share.md` - Native OS share modal

## Setup & Best Practices

- `rules/initialization.md` - SDK setup and initialization patterns
- `rules/best-practices-security.md` - Security guidelines
- `rules/best-practices-error-handling.md` - Error handling patterns

## Quick Reference

### Always Check Installation

```tsx
if (!MiniKit.isInstalled()) {
  // Handle gracefully
  return
}
```

### Always Verify in Backend

For sensitive operations (verify, pay), **MUST** verify responses in your backend:

```tsx
// Frontend
const { finalPayload } = await MiniKit.commandsAsync.verify({
  action: 'my-action',
})

// Backend verification
const verifyResponse = await fetch('/api/verify', {
  method: 'POST',
  body: JSON.stringify({ payload: finalPayload }),
})
```

### Error Handling

Always check response status:

```tsx
if (finalPayload.status === 'error') {
  console.error('Error:', finalPayload.error_code)
  // Handle error appropriately
  return
}
```

## Key Guidelines

- **MUST**: Always verify sensitive operations (verify, pay) in backend
- **MUST**: Check `MiniKit.isInstalled()` before using commands
- **MUST**: Handle error responses with proper status checking
- **DO**: Use async pattern for simpler code flow
- **DO**: Use event-based pattern for complex state management
- **DON'T**: Trust frontend responses for sensitive operations
- **DON'T**: Skip error handling
- **DON'T**: Use commands without checking if MiniKit is installed

## References

- [World Mini Apps Documentation](https://docs.world.org/mini-apps/quick-start/commands)
- [MiniKit JS Package](https://www.npmjs.com/package/@worldcoin/minikit-js)

---

_Last updated: Based on World App Mini Apps documentation_
