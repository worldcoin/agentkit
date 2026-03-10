---
title: Get Permissions Command
category: commands
tags: get-permissions, permissions, check, status
---

## Get Permissions Command

Get current user permissions status. Check if user has granted notifications or microphone access.

## When to Use

- Checking permission status before requesting
- Determining if features are available
- Showing appropriate UI based on permissions
- Onboarding flows
- Permission status checks

**Example Use Cases:**

- Check if notifications are enabled
- Verify microphone access before audio features
- Conditional UI based on permissions
- Permission status display

## API

### Input

```tsx
// No input required
```

### Output

```tsx
type MiniAppGetPermissionsSuccessPayload = {
  status: 'success'
  notifications: 'granted' | 'denied' | 'not_requested'
  microphone: 'granted' | 'denied' | 'not_requested'
}

type MiniAppGetPermissionsErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **DO**: Check permissions before requesting them
- **DO**: Use permission status to show appropriate UI
- **DO**: Handle all permission states (granted, denied, not_requested)
- **DO**: Update UI when permissions change

## DONTs

- **DON'T**: Request permissions if already granted
- **DON'T**: Assume permission status without checking
- **DON'T**: Ignore permission status in UI

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const checkPermissions = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.getPermissions()

  if (finalPayload.status === 'error') {
    return
  }

  // Use permission status
  if (finalPayload.notifications === 'granted') {
    // Notifications enabled - show enabled UI
    setNotificationsEnabled(true)
  } else if (finalPayload.notifications === 'denied') {
    // Notifications denied - show disabled UI with option to enable in settings
    setNotificationsEnabled(false)
  } else {
    // Not requested yet - show request button
    setShowRequestButton(true)
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppGetPermissionsPayload } from '@worldcoin/minikit-js'

// Send command
const checkPermissions = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.getPermissions()
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppGetPermissions,
    (response: MiniAppGetPermissionsPayload) => {
      if (response.status === 'error') {
        return
      }

      // Update UI based on permissions
      setNotificationsStatus(response.notifications)
      setMicrophoneStatus(response.microphone)
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppGetPermissions)
  }
}, [])
```

## References

- [World Mini Apps - Get Permissions](https://docs.world.org/mini-apps/commands/get-permissions)
