---
title: PasswordField Component
category: form-controls
tags: password, input, security, visibility
---

## PasswordField

A password input component with a toggle to show/hide the password. Provides secure password entry with visibility control.

**Key Props**:

- `label` (string): Input label
- `value`, `onChange`: Standard controlled input props
- `disabled` (boolean): Disables the input
- `error` (boolean): Error state styling

**Examples**:

```tsx
<PasswordField label="Enter password" />
```

**Edge Cases**:

- Password visibility toggle is built-in
- Follows standard Input component patterns for styling

**Storybook Reference**: `stories/PasswordField.stories.tsx`
