---
title: Input Component
category: form-controls
tags: input, form, validation, adornments
---

## Input

A customizable text input component that supports adornments and various states. Use for single-line text input with optional icons or validation states.

**Key Props**:

- `label` (string): Label text for the input
- `id` (string): HTML id attribute
- `variant` ("default" | "floating-label"): Label display style
- `startAdornment` (ReactNode): Icon or element at the start
- `endAdornment` (ReactNode): Icon or element at the end
- `disabled` (boolean): Disables user interaction
- `error` (boolean): Shows error styling
- `value`, `onChange`: Standard controlled input props

**Examples**:

```tsx
// Basic input
<Input label="Name" id="name" />

// With floating label
<Input label="Email" id="email" variant="floating-label" />

// With icons
<Input
  label="Number"
  startAdornment={<CountryCode />}
  endAdornment={<Switch />}
/>

// Disabled state
<Input label="Name" disabled />

// Error state with Form integration
<Form.Root>
  <Form.Field name="email" className="has-error">
    <Form.Control asChild>
      <Input error label="Enter your email" />
    </Form.Control>
    <Form.Message error>Please enter a valid email</Form.Message>
  </Form.Field>
</Form.Root>
```

**Edge Cases**:

- Long labels automatically wrap with floating-label variant
- Error state requires Form.Field with `has-error` className for proper styling
- Icons should use consistent sizing (typically 20x20px)

**Storybook Reference**: `stories/Input.stories.tsx`
