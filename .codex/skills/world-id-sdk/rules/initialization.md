---
title: MiniKit Initialization
category: setup
tags: initialization, setup, install, provider
---

## Initialization

Proper initialization of MiniKit is required before using any commands in your mini-app.

## When to Use

- Setting up a new mini-app
- Ensuring MiniKit is available before command execution
- Creating provider components for app-wide MiniKit access

## API

```tsx
// Install MiniKit
MiniKit.install(): void

// Check if MiniKit is installed
MiniKit.isInstalled(): boolean
```

## DOs

- **DO**: Call `MiniKit.install()` in a `useEffect` hook in your root provider
- **DO**: Check `MiniKit.isInstalled()` before using any commands
- **DO**: Wrap your app with a provider component for consistent initialization
- **DO**: Use client-side only code (`'use client'`) for MiniKit initialization

## DONTs

- **DON'T**: Call `MiniKit.install()` multiple times
- **DON'T**: Use commands without checking if MiniKit is installed
- **DON'T**: Initialize MiniKit in server components
- **DON'T**: Assume MiniKit is always available (handle gracefully when not installed)

## Examples

### Basic Provider Setup

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

### Using in App Layout

```tsx
import MiniKitProvider from '@/providers/minikit-provider'

export default function RootLayout({ children }) {
  return <MiniKitProvider>{children}</MiniKitProvider>
}
```

### Checking Before Commands

```tsx
const handleVerify = async () => {
  if (!MiniKit.isInstalled()) {
    console.warn('MiniKit is not installed')
    // Show fallback UI or disable feature
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.verify({
    action: 'my-action',
  })
  // ...
}
```

## References

- [World Mini Apps - Initialization](https://docs.world.org/mini-apps/quick-start/initialization)
