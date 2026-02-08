---
title: Share Command
category: commands
tags: share, native-share, os-share, sharing
---

## Share Command

Open the native OS share modal. Allows users to share content using their device's native sharing capabilities.

## When to Use

- Sharing content from your mini-app
- Sharing links, text, or images
- Social sharing features
- Content distribution
- User-generated content sharing

**Example Use Cases:**

- Share app link
- Share content
- Share achievements
- Share results
- Social sharing

## API

### Input

```tsx
export type ShareCommandInput = {
  title?: string
  text?: string
  url?: string
}
```

### Output

```tsx
type MiniAppShareSuccessPayload = {
  status: 'success'
  shared: boolean // Whether user actually shared
}

type MiniAppShareErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **DO**: Provide meaningful share content
- **DO**: Include URL for easy sharing
- **DO**: Handle user cancellations gracefully
- **DO**: Use appropriate share text

## DONTs

- **DON'T**: Share empty or meaningless content
- **DON'T**: Force users to share
- **DON'T**: Assume user shared (check shared status)

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleShare = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.share({
    title: 'Check out this mini-app!',
    text: 'I found this amazing mini-app on World App',
    url: 'https://myapp.com',
  })

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled - normal behavior
    }
    toast.error('Failed to share')
    return
  }

  if (finalPayload.shared) {
    toast.success('Shared successfully!')
  } else {
    // User opened share modal but didn't share
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppSharePayload } from '@worldcoin/minikit-js'

// Send command
const handleShare = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.share({
    title: 'My Achievement',
    text: 'I just completed a challenge!',
    url: 'https://myapp.com/achievement',
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(ResponseEvent.MiniAppShare, (response: MiniAppSharePayload) => {
    if (response.status === 'error') {
      return
    }

    if (response.shared) {
      console.log('User shared content')
    }
  })

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppShare)
  }
}, [])
```

### Sharing Different Content Types

```tsx
// Share link
await MiniKit.commandsAsync.share({
  url: 'https://myapp.com',
  text: 'Check this out!',
})

// Share text
await MiniKit.commandsAsync.share({
  text: 'This is some text to share',
})

// Share with title
await MiniKit.commandsAsync.share({
  title: 'My App',
  text: 'Description',
  url: 'https://myapp.com',
})
```

## References

- [World Mini Apps - Share Command](https://docs.world.org/mini-apps/commands/share)
