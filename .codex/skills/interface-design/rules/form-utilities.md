---
title: Form Utilities
category: utilities
tags: form, validation, radix-ui, error-handling
---

## Form

A form component that provides form validation and submission handling functionality. Built on Radix UI Form primitives. Use for form validation, error display, and form state management.

**Key Components**:

- `Form.Root`: Root form component
- `Form.Field`: Field container with validation
- `Form.Control`: Control wrapper (use `asChild` for custom inputs)
- `Form.Message`: Validation/error message display

**Key Props**:

- `Form.Field`:
  - `name` (string): Field name
  - `className` (string): Use `"has-error"` for error styling
- `Form.Message`:
  - `error` (boolean): Error message styling
  - `textAlign` ("left" | "center" | "right"): Text alignment

**Examples**:

```tsx
// Basic form with validation
<Form.Root>
  <Form.Field name="email">
    <Form.Control asChild>
      <Input label="Enter your email" />
    </Form.Control>
    <Form.Message>This field is required</Form.Message>
  </Form.Field>
</Form.Root>

// With error state
<Form.Root>
  <Form.Field name="email" className="has-error">
    <Form.Control asChild>
      <Input error label="Enter your email" />
    </Form.Control>
    <Form.Message error>Please enter a valid email</Form.Message>
  </Form.Field>
</Form.Root>

// With Select
<Form.Root>
  <Form.Field name="select" className="has-error">
    <Form.Control asChild>
      <Select options={options} error />
    </Form.Control>
    <Form.Message error>Error message</Form.Message>
  </Form.Field>
</Form.Root>

// With OTPField
<Form.Root>
  <Form.Field name="otp">
    <OTPField error />
    <Form.Message error textAlign="center">
      Error message
    </Form.Message>
  </Form.Field>
</Form.Root>
```

**Edge Cases**:

- `has-error` className on Form.Field is required for error styling
- Form.Control uses `asChild` to wrap custom input components
- Form.Message supports different text alignments
- Works with Input, Select, PhoneField, SearchField, OTPField, etc.

**Storybook Reference**: `stories/Form.stories.tsx`
