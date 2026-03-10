---
title: Pill Component
category: buttons-actions
tags: pill, toggle, filter, tag
---

## Pill

A pill-shaped component that can be used as a toggle or label with a rounded appearance. Use for filters, tags, or toggleable options.

**Key Props**:

- `checked` (boolean): Checked/toggled state
- `children` (ReactNode): Pill content
- `asChild` (boolean): Render as child component

**Examples**:

```tsx
// Basic pill
<Pill checked={false}>Pill Label</Pill>

// Checked state
<Pill checked={true}>Active</Pill>
```

**Edge Cases**:

- Can be used as a controlled component
- Styling adapts based on checked state

**Storybook Reference**: `stories/Pill.stories.tsx`
