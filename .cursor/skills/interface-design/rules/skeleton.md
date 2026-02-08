---
title: Skeleton Component
category: feedback-display
tags: skeleton, loading, placeholder, typography
---

## Skeleton

Display a placeholder preview of your content before the data gets loaded to reduce load-time frustration. Use while content is loading to improve perceived performance.

**Key Props**:

- `width` (number): Width in pixels
- `height` (number): Height in pixels
- `className` (string): Additional CSS classes (use for sizing and styling)

**Subcomponents**:

- `SkeletonTypography`: Skeleton for text content matching Typography variants

**Examples**:

```tsx
// Basic skeleton
<Skeleton className="size-12" />

// Avatar skeleton
<Skeleton className="size-12 rounded-full" />

// Typography skeleton
<SkeletonTypography variant="heading" level={2} />
<SkeletonTypography variant="body" level={1} lines={2} />

// Complex layout
<div className="space-y-4">
  <Skeleton className="h-10 w-full" />
  <SkeletonTypography variant="heading" level={2} />
  <SkeletonTypography variant="body" level={1} lines={3} />
</div>
```

**Edge Cases**:

- Use `SkeletonTypography` for text placeholders to match typography styles
- `lines` prop for SkeletonTypography controls number of text lines
- Supports all Typography variants: display, heading, subtitle, body, label, number

**Storybook Reference**: `stories/Skeleton.stories.tsx`, `stories/SkeletonTypograhy.stories.tsx`
