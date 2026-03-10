---
title: Checkbox Component
category: form-controls
tags: checkbox, form, radix-ui, accessibility
---

## Checkbox

A checkbox component that allows users to select one or multiple options. Built on Radix UI Checkbox primitive for accessibility.

**Key Props**:

- `checked` (boolean): Checked state
- `onChange` (function): Callback when checked state changes
- `disabled` (boolean): Disables the checkbox
- `id` (string): HTML id attribute

**Examples**:

```tsx
// Controlled checkbox
const [checked, setChecked] = useState(false);
<Checkbox checked={checked} onChange={setChecked} />

// Disabled
<Checkbox checked={true} disabled />
```

**Edge Cases**:

- Always use controlled state for React
- Disabled state prevents all interaction
- Includes proper ARIA attributes via Radix UI

**Storybook Reference**: `stories/Checkbox.stories.tsx`
