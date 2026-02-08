---
title: Haptic Component
category: utilities
tags: haptic, feedback, mobile, touch
---

## Haptic

A component that provides haptic feedback when touched. Supports different types of haptic feedback including impact, notification, and selection changed. Note: All interactive components in the UI Kit already include appropriate haptic feedback by default. This component is for custom implementations.

**Key Props**:

- `variant` ("impact" | "notification" | "selection"): Haptic feedback type
- `type` ("light" | "medium" | "heavy" | "success" | "warning" | "error"): Feedback intensity/type
- `children` (ReactNode): Element to wrap
- `asChild` (boolean): Render as child component

**Examples**:

```tsx
// Basic haptic wrapper
<Haptic variant="selection" type="light">
  <button>Touch me for haptic feedback</button>
</Haptic>

// Impact feedback
<Haptic variant="impact" type="medium">
  <button>Medium impact</button>
</Haptic>

// Notification feedback
<Haptic variant="notification" type="success">
  <button>Success notification</button>
</Haptic>
```

**Edge Cases**:

- Only works on mobile devices with haptic support
- Most UI Kit components already include haptics
- Use for custom components that need haptic feedback

**Storybook Reference**: `stories/Haptic.stories.tsx`
