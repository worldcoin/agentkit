---
title: Chip Component
category: buttons-actions
tags: chip, label, status, variant
---

## Chip

A chip component that displays labels with optional icons and different variants including success, warning, error, and important states. Use for status indicators, tags, or labels.

**Key Props**:

- `label` (string): Chip text content
- `variant` ("default" | "success" | "warning" | "error" | "important"): Color variant
- `icon` (ReactNode): Optional icon to display
- `className` (string): Additional CSS classes

**Examples**:

```tsx
// Default chip
<Chip label="Default" />

// With icon
<Chip label="Default with icon" icon={<Shield />} />

// Success variant
<Chip label="Success" variant="success" icon={<Shield variant="success" />} />

// Warning variant
<Chip label="Warning" variant="warning" icon={<Shield variant="warning" />} />

// Error variant
<Chip label="Error" variant="error" icon={<Shield variant="error" />} />

// Important variant
<Chip label="Important" variant="important" icon={<Shield variant="important" />} />

// Custom colors
<Chip
  label="Custom"
  variant="important"
  className="bg-success-100 text-primary-pink"
  icon={<Shield variant="important" color="#9D50FF" />}
/>
```

**Edge Cases**:

- Icons should match variant colors for consistency
- Custom colors can override default variant colors via className
- Variants apply background and text color classes

**Storybook Reference**: `stories/Chip.stories.tsx`
