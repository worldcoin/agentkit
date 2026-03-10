---
title: Send Notifications Command
category: commands
tags: send-notifications, notifications, push, alerts
---

## Send Notifications Command

Send push notifications to users. Requires notification permission to be granted first.

## When to Use

- Sending push notifications
- User engagement
- Important updates
- Reminders
- Alerts

**Example Use Cases:**

- Transaction confirmations
- Important updates
- Reminders
- Engagement notifications
- Alert users of events

## API

### Input

```tsx
export type SendNotificationCommandInput = {
  title: string
  body: string
  data?: Record<string, unknown> // Optional notification data
}
```

### Output

```tsx
type MiniAppSendNotificationSuccessPayload = {
  status: 'success'
  notification_id: string
}

type MiniAppSendNotificationErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **MUST**: Request notification permission before sending
- **DO**: Send meaningful, relevant notifications
- **DO**: Respect user preferences
- **DO**: Handle errors gracefully
- **DO**: Don't spam users with notifications

## DONTs

- **DON'T**: Send notifications without permission
- **DON'T**: Send excessive notifications
- **DON'T**: Send irrelevant notifications
- **DON'T**: Ignore notification guidelines

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleSendNotification = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  // Check permission first
  const { finalPayload: perms } = await MiniKit.commandsAsync.getPermissions()
  if (perms.notifications !== 'granted') {
    // Request permission first
    const { finalPayload: permResult } = await MiniKit.commandsAsync.requestPermission({
      permission: 'notifications',
    })
    if (!permResult.granted) {
      toast.error('Notification permission required')
      return
    }
  }

  const { finalPayload } = await MiniKit.commandsAsync.sendNotification({
    title: 'Transaction Complete',
    body: 'Your payment has been processed',
    data: { transaction_id: '123' },
  })

  if (finalPayload.status === 'error') {
    toast.error('Failed to send notification')
    return
  }

  console.log('Notification sent:', finalPayload.notification_id)
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppSendNotificationPayload } from '@worldcoin/minikit-js'

// Send command
const handleSendNotification = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.sendNotification({
    title: 'Update Available',
    body: 'A new version is available',
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppSendNotification,
    (response: MiniAppSendNotificationPayload) => {
      if (response.status === 'error') {
        return
      }

      console.log('Notification sent:', response.notification_id)
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppSendNotification)
  }
}, [])
```

## References

- [World Mini Apps - Send Notifications](https://docs.world.org/mini-apps/commands/how-to-send-notifications)
- [Notification Guidelines](https://docs.world.org/mini-apps/guidelines/notification-guidelines)
