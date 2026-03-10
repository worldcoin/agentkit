---
title: Button Component
category: buttons-actions
tags: button, action, icon, variants
---

## Button

A versatile button component that supports different variants, sizes, and states with optional icon support. Use for primary actions, secondary actions, or icon-only buttons.

**Key Props**:

- `variant` ("primary" | "secondary" | "tertiary"): Button style variant
- `size` ("sm" | "lg" | "icon"): Button size
- `fullWidth` (boolean): Makes button full width
- `disabled` (boolean): Disables the button
- `children` (ReactNode): Button content (text, icon, or both)
- `onClick` (function): Click handler

**Examples**:

```tsx
// Primary button
<Button variant="primary" size="lg">Click Me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Icon button
<Button variant="tertiary" size="icon">
  <Star />
</Button>

// Button with icon and text
<Button variant="primary">
  <Star />
  Button
</Button>

// Full width
<Button fullWidth>Submit</Button>

// Disabled
<Button disabled>Disabled</Button>
```

**Edge Cases**:

- Icon-only buttons should use `size="icon"`
- Icons and text can be combined in children
- Full width buttons are useful in forms and bottom bars

**Storybook Reference**: `stories/Button.stories.tsx`
