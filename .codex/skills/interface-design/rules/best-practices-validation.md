---
title: Error Handling & Validation Best Practices
category: best-practices
tags: validation, error-handling, forms, feedback
---

## Error Handling & Validation

Concise rules for error handling and validation with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Use `Form.Field` with `has-error` className for error styling
- MUST: Show errors inline using `Form.Message` with `error` prop
- MUST: Focus first error field on form submission
- MUST: Allow form submission to surface validation errors
- SHOULD: Use `textAlign="center"` for OTPField error messages
- NEVER: Hide validation errors or prevent form submission to show errors
- NEVER: Use error styling without `Form.Field` wrapper

**Examples**:

```tsx
// ✅ Correct
<Form.Root>
  <Form.Field name="email" className="has-error">
    <Form.Control asChild>
      <Input error label="Enter your email" />
    </Form.Control>
    <Form.Message error>Please enter a valid email</Form.Message>
  </Form.Field>
</Form.Root>

// ❌ Incorrect
<Input error label="Email" /> // Missing Form wrapper
```
