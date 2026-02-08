---
title: OTPField Component
category: form-controls
tags: otp, code, input, validation
---

## OTPField

A one-time password input field that allows entering numeric codes. Displays multiple input slots for code entry.

**Key Props**:

- `maxLength` (number): Number of input slots (default: 6)
- `value` (string): Current code value
- `onChange` (function): Callback when value changes
- `onComplete` (function): Callback when all slots are filled
- `error` (boolean): Error state styling
- `mode` ("digits" | "chars" | "digitsAndChars"): Input mode

**Examples**:

```tsx
// Basic OTP field
<OTPField maxLength={6} />

// With error state
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

- Automatically moves focus to next slot on input
- Error state applies to all slots
- Supports paste functionality

**Storybook Reference**: `stories/OTPField.stories.tsx`
