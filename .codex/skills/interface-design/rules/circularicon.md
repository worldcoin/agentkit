---
title: CircularIcon Component
category: utilities
tags: circular-icon, icon, container, bullet
---

## CircularIcon

A circular icon container component. Use for displaying icons in circular backgrounds, often used as bullet points or status indicators.

**Key Props**:

- `children` (ReactNode): Icon element
- `size` ("xs" | "sm" | "md" | "lg" | "xl"): Size variant
- `className` (string): Additional CSS classes (use for background colors, custom sizing)

**Examples**:

```tsx
// Basic circular icon
<CircularIcon className="bg-gray-200" size="md">
  <SparkIcon />
</CircularIcon>

// Custom size and color
<CircularIcon className="size-9 bg-gray-900">
  <SparkIcon className="text-gray-0" />
</CircularIcon>

// With different background
<CircularIcon className="bg-success-500">
  <Shield className="text-gray-0" />
</CircularIcon>
```

**Edge Cases**:

- Size prop provides standard sizes, className can override
- Background colors controlled via className
- Icon color should contrast with background

**Storybook Reference**: `stories/CircularIcon.stories.tsx`
