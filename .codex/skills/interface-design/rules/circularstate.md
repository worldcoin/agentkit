---
title: CircularState Component
category: utilities
tags: circular-state, status, indicator, state
---

## CircularState

A circular state indicator component that displays different states (success, error, warning, pending, critical) with appropriate colors and icons.

**Key Props**:

- `value` ("success" | "error" | "warning" | "pending" | "critical"): State value
- `size` ("xs" | "sm" | "md" | "lg" | "xl"): Size variant

**Examples**:

```tsx
// Success state
<CircularState value="success" size="md" />

// Error state
<CircularState value="error" size="md" />

// Warning state
<CircularState value="warning" size="md" />

// Pending state
<CircularState value="pending" size="md" />

// Critical state
<CircularState value="critical" size="md" />
```

**Edge Cases**:

- Each state has predefined colors and icons
- Size controls the overall component size
- Use for status indicators, loading states, or validation feedback

**Storybook Reference**: `stories/CircularState.stories.tsx`
