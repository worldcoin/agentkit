---
title: Error Handling Best Practices
category: best-practices
tags: error-handling, errors, status, validation
---

## Error Handling Best Practices

Proper error handling patterns for MiniKit commands to ensure robust mini-app behavior.

## When to Apply

- Implementing any MiniKit command
- Handling user cancellations
- Managing network failures
- Processing command responses

## DOs

- **MUST**: Always check `status` field in command responses
- **MUST**: Handle both `'success'` and `'error'` status cases
- **DO**: Check `MiniKit.isInstalled()` before commands
- **DO**: Provide user-friendly error messages
- **DO**: Log errors for debugging (avoid logging sensitive data)
- **DO**: Handle user cancellations gracefully
- **DO**: Use try-catch for async commands
- **DO**: Clean up event listeners in useEffect cleanup

## DONTs

- **DON'T**: Assume commands always succeed
- **DON'T**: Skip error status checks
- **DON'T**: Show technical error codes to users
- **DON'T**: Ignore user cancellations
- **DON'T**: Leave event listeners subscribed after component unmount

## Examples

### Async Pattern Error Handling

```tsx
const handleVerify = async () => {
  if (!MiniKit.isInstalled()) {
    toast.error('World App is required for this feature')
    return
  }

  try {
    const { finalPayload } = await MiniKit.commandsAsync.verify({
      action: 'my-action',
    })

    if (finalPayload.status === 'error') {
      // Handle specific error codes
      switch (finalPayload.error_code) {
        case 'user_cancelled':
          // User cancelled - don't show error
          return
        case 'invalid_action':
          toast.error('Invalid verification action')
          break
        default:
          toast.error('Verification failed. Please try again.')
      }
      return
    }

    // Handle success
    if (finalPayload.status === 'success') {
      // Process verification
    }
  } catch (error) {
    console.error('Verify command error:', error)
    toast.error('An unexpected error occurred')
  }
}
```

### Event-Based Pattern Error Handling

```tsx
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  const handleResponse = (response: MiniAppVerifyActionPayload) => {
    if (response.status === 'error') {
      if (response.error_code === 'user_cancelled') {
        // User cancelled - handle gracefully
        return
      }
      toast.error('Verification failed')
      return
    }

    // Handle success
    if (response.status === 'success') {
      // Process verification
    }
  }

  MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, handleResponse)

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction)
  }
}, [])
```

### Common Error Codes

```tsx
// Handle common error scenarios
if (finalPayload.status === 'error') {
  const errorCode = finalPayload.error_code

  if (errorCode === 'user_cancelled') {
    // User cancelled - normal behavior, don't show error
    return
  }

  if (errorCode === 'not_installed') {
    toast.error('Please open this in World App')
    return
  }

  if (errorCode === 'invalid_action') {
    toast.error('Invalid action. Please contact support.')
    return
  }

  // Generic error handling
  toast.error('Something went wrong. Please try again.')
}
```

## References

- [World Mini Apps - Responses](https://docs.world.org/mini-apps/quick-start/responses)
- [World Mini Apps - Errors](https://docs.world.org/mini-apps/technical-reference/errors)
