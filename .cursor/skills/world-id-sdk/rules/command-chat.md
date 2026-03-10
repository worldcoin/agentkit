---
title: Chat Command
category: commands
tags: chat, messaging, world-chat, communication
---

## Chat Command

Send messages and create groups in World Chat. Enables messaging functionality within your mini-app.

## When to Use

- Implementing chat features
- Sending messages to users
- Creating group chats
- Building communication features
- User-to-user messaging

**Example Use Cases:**

- In-app messaging
- Group discussions
- Customer support chat
- Community features
- Direct messaging

## API

### Input

```tsx
export type ChatCommandInput = {
  type: 'send_message' | 'create_group'
  recipient?: string // Username for send_message
  message?: string // Message content
  groupName?: string // For create_group
  members?: string[] // Usernames for group
}
```

### Output

```tsx
type MiniAppChatSuccessPayload = {
  status: 'success'
  message_id?: string // For send_message
  group_id?: string // For create_group
}

type MiniAppChatErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **DO**: Request chat permissions before using
- **DO**: Handle user cancellations gracefully
- **DO**: Validate usernames before sending
- **DO**: Provide clear feedback on message status
- **DO**: Handle errors appropriately

## DONTs

- **DON'T**: Use chat without requesting permissions first
- **DON'T**: Send messages to invalid usernames
- **DON'T**: Spam users with messages
- **DON'T**: Skip error handling

## Examples

### Async Pattern - Send Message

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleSendMessage = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.chat({
    type: 'send_message',
    recipient: 'username',
    message: 'Hello!',
  })

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled
    }
    toast.error('Failed to send message')
    return
  }

  // Message sent successfully
  toast.success('Message sent!')
}
```

### Async Pattern - Create Group

```tsx
const handleCreateGroup = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.chat({
    type: 'create_group',
    groupName: 'My Group',
    members: ['user1', 'user2'],
  })

  if (finalPayload.status === 'error') {
    toast.error('Failed to create group')
    return
  }

  // Group created
  console.log('Group ID:', finalPayload.group_id)
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppChatPayload } from '@worldcoin/minikit-js'

// Send command
const handleSendMessage = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.chat({
    type: 'send_message',
    recipient: 'username',
    message: 'Hello!',
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(ResponseEvent.MiniAppChat, (response: MiniAppChatPayload) => {
    if (response.status === 'error') {
      return
    }

    // Handle success
    if (response.message_id) {
      console.log('Message sent:', response.message_id)
    }
  })

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppChat)
  }
}, [])
```

## References

- [World Mini Apps - Chat Command](https://docs.world.org/mini-apps/commands/chat)
