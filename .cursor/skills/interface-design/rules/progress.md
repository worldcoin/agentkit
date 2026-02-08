---
title: Progress Component
category: feedback-display
tags: progress, indicator, loading, bar
---

## Progress

A progress indicator component that shows the completion status of a task or process. The progress is represented by a horizontal bar that fills from left to right based on the provided value between 0 and 100.

**Key Props**:

- `value` (number): Progress value between 0 and 100
- `className` (string): Additional CSS classes for styling

**Examples**:

```tsx
// Basic progress bar
<Progress value={33} />

// Custom styling
<Progress
  value={75}
  className="bg-success-600"
/>
```

**Edge Cases**:

- Value should be between 0 and 100
- Background and indicator colors can be customized with Tailwind classes
- Uses `data-value` attribute for styling

**Storybook Reference**: `stories/Progress.stories.tsx`
