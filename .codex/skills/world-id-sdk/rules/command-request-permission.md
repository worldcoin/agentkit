---
title: Request Permission Command
category: commands
tags: request-permission, permissions, notifications, microphone
---

## Request Permission Command

Request permissions from the user (notifications, microphone access). Required before using certain features.

## When to Use

- Requesting notification permissions
- Requesting microphone access
- Before using features that require permissions
- Setting up push notifications
- Enabling audio features

**Example Use Cases:**

- Request notification permission for push notifications
- Request microphone permission for voice features
- Setting up permissions before feature use
- Onboarding permission requests

## API

### Input

```tsx
export type RequestPermissionCommandInput = {
  permission: 'notifications' | 'microphone'
}
```

### Output

```tsx
type MiniAppRequestPermissionSuccessPayload = {
  status: 'success'
  permission: 'notifications' | 'microphone'
  granted: boolean
}

type MiniAppRequestPermissionErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **DO**: Request permissions at appropriate times (not immediately on load)
- **DO**: Explain why permission is needed before requesting
- **DO**: Handle denied permissions gracefully
- **DO**: Check current permissions before requesting
- **DO**: Provide fallback UI when permission is denied

## DONTs

- **DON'T**: Request permissions immediately on page load
- **DON'T**: Request permissions without context
- **DON'T**: Spam permission requests
- **DON'T**: Assume permission is granted
- **DON'T**: Block features completely if permission denied

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleRequestNotificationPermission = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  // Check current permission first
  const { finalPayload: currentPerms } = await MiniKit.commandsAsync.getPermissions()
  if (currentPerms.notifications === 'granted') {
    toast.info('Notifications already enabled')
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.requestPermission({
    permission: 'notifications',
  })

  if (finalPayload.status === 'error') {
    toast.error('Failed to request permission')
    return
  }

  if (finalPayload.granted) {
    toast.success('Notifications enabled!')
  } else {
    toast.info('Notifications permission denied')
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppRequestPermissionPayload } from '@worldcoin/minikit-js'

// Send command
const handleRequestPermission = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.requestPermission({
    permission: 'notifications',
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppRequestPermission,
    (response: MiniAppRequestPermissionPayload) => {
      if (response.status === 'error') {
        return
      }

      if (response.granted) {
        console.log('Permission granted:', response.permission)
      } else {
        console.log('Permission denied:', response.permission)
      }
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppRequestPermission)
  }
}, [])
```

## References

- [World Mini Apps - Request Permission](https://docs.world.org/mini-apps/commands/request-permission)
