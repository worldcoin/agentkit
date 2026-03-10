---
title: Haptics Command
category: commands
tags: haptics, haptic-feedback, tactile, ux
---

## Haptics Command

Send haptic feedback to the user's device. Provides tactile feedback for enhanced user experience.

## When to Use

- Providing tactile feedback for actions
- Enhancing user interactions
- Confirming user actions
- Error feedback
- Success feedback

**Example Use Cases:**

- Button press feedback
- Transaction confirmations
- Error notifications
- Success confirmations
- Interactive feedback

## API

### Input

```tsx
export type SendHapticFeedbackCommandInput = {
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
}
```

### Output

```tsx
type MiniAppSendHapticFeedbackSuccessPayload = {
  status: 'success'
}

type MiniAppSendHapticFeedbackErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **DO**: Use haptics to enhance important interactions
- **DO**: Match haptic type to action (success for success, error for errors)
- **DO**: Use sparingly - don't overuse haptics
- **DO**: Provide haptic feedback for critical actions

## DONTs

- **DON'T**: Overuse haptics (can be annoying)
- **DON'T**: Use haptics for every action
- **DON'T**: Ignore user device settings

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleSuccess = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  // Send success haptic
  await MiniKit.commandsAsync.sendHapticFeedback({
    type: 'success',
  })

  toast.success('Action completed!')
}

const handleError = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  // Send error haptic
  await MiniKit.commandsAsync.sendHapticFeedback({
    type: 'error',
  })

  toast.error('Something went wrong')
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent } from '@worldcoin/minikit-js'

const triggerHaptic = (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
) => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.sendHapticFeedback({ type })
}

// Use in button handlers
;<Button
  onClick={() => {
    triggerHaptic('medium')
    handleAction()
  }}
>
  Click Me
</Button>
```

### Common Patterns

```tsx
// Success action
await MiniKit.commandsAsync.sendHapticFeedback({ type: 'success' })

// Error action
await MiniKit.commandsAsync.sendHapticFeedback({ type: 'error' })

// Warning
await MiniKit.commandsAsync.sendHapticFeedback({ type: 'warning' })

// Light feedback for subtle actions
await MiniKit.commandsAsync.sendHapticFeedback({ type: 'light' })

// Medium feedback for standard actions
await MiniKit.commandsAsync.sendHapticFeedback({ type: 'medium' })

// Heavy feedback for important actions
await MiniKit.commandsAsync.sendHapticFeedback({ type: 'heavy' })
```

## References

- [World Mini Apps - Send Haptic Feedback](https://docs.world.org/mini-apps/commands/send-haptic-feedback)
