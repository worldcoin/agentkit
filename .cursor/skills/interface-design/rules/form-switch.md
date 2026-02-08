---
title: Switch Component
category: form-controls
tags: switch, toggle, form, accessibility
---

## Switch

A toggle switch component that provides a visual way to turn an option on or off. Built with accessibility in mind.

**Key Props**:

- `checked` (boolean): Checked state
- `onChange` (function): Callback when toggled
- `disabled` (boolean): Disables the switch

**Examples**:

```tsx
// Controlled switch
const [checked, setChecked] = useState(false);
<Switch checked={checked} onChange={setChecked} />

// Disabled
<Switch disabled />
```

**Edge Cases**:

- Always use controlled state
- Disabled state prevents interaction
- Includes proper ARIA attributes (role="switch", aria-checked)

**Storybook Reference**: `stories/Switch.stories.tsx`
