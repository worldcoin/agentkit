---
title: Toast Component
category: feedback-display
tags: toast, notification, feedback, haptic
---

## Toast

Provides a way to display temporary notifications to users. Built on top of Radix UI's Toast primitives and includes haptic feedback for mobile devices. Supports success and error variants.

**Key Components**:

- `Toaster`: Must be included in app root to render toasts
- `useToast`: Hook for showing and managing toasts

**Toast Methods**:

- `toast.success(props)`: Show a success toast
- `toast.error(props)`: Show an error toast
- `dismiss(toastId?)`: Dismiss a specific toast or all toasts

**Toast Props**:

- `title` (string): The message to display
- `duration` (number): Duration in milliseconds before auto-dismiss (default: 3000)

**Examples**:

```tsx
import { Toaster, useToast } from '@worldcoin/mini-apps-ui-kit-react'

function MyComponent() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast.success({
      title: 'Operation completed successfully!',
      duration: 3000,
    })
  }

  const handleError = () => {
    toast.error({
      title: 'Something went wrong. Please try again.',
      duration: 5000,
    })
  }

  return (
    <div>
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button onClick={handleError}>Show Error</Button>
      <Toaster />
    </div>
  )
}
```

**Edge Cases**:

- `<Toaster />` must be included in app root
- Toasts automatically dismiss after duration
- Haptic feedback is included automatically on mobile
- Multiple toasts can be displayed simultaneously

**Storybook Reference**: `stories/Toast.stories.tsx`
