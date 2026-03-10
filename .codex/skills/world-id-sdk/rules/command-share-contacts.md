---
title: Share Contacts Command
category: commands
tags: share-contacts, contacts, sharing, username
---

## Share Contacts Command

Share individual user contacts (username only) from World App. Allows users to share contact information.

## When to Use

- Sharing user contacts
- Referral features
- Inviting friends
- Contact sharing functionality
- Social features

**Example Use Cases:**

- "Invite friends" features
- Sharing contacts between users
- Referral programs
- Social sharing
- Contact discovery

## API

### Input

```tsx
export type ShareContactsCommandInput = {
  usernames: string[] // Array of usernames to share
}
```

### Output

```tsx
type MiniAppShareContactsSuccessPayload = {
  status: 'success'
  shared_count: number
}

type MiniAppShareContactsErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **DO**: Request permission before sharing contacts
- **DO**: Validate usernames before sharing
- **DO**: Respect user privacy
- **DO**: Handle user cancellations gracefully
- **DO**: Provide clear feedback on sharing status

## DONTs

- **DON'T**: Share contacts without user consent
- **DON'T**: Share invalid usernames
- **DON'T**: Spam users with contact sharing
- **DON'T**: Skip permission requests

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleShareContacts = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.shareContacts({
    usernames: ['user1', 'user2'],
  })

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled
    }
    toast.error('Failed to share contacts')
    return
  }

  toast.success(`Shared ${finalPayload.shared_count} contacts`)
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppShareContactsPayload } from '@worldcoin/minikit-js'

// Send command
const handleShareContacts = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.shareContacts({
    usernames: ['user1', 'user2'],
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppShareContacts,
    (response: MiniAppShareContactsPayload) => {
      if (response.status === 'error') {
        return
      }

      console.log('Shared contacts:', response.shared_count)
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppShareContacts)
  }
}, [])
```

## References

- [World Mini Apps - Share Contacts](https://docs.world.org/mini-apps/commands/share-contacts)
