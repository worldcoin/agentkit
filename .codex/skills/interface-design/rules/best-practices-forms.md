---
title: Forms & Inputs Best Practices
category: best-practices
tags: forms, inputs, validation, error-handling
---

## Forms & Inputs

Concise rules for building accessible, fast, delightful forms with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Use `Form.Root`, `Form.Field`, and `Form.Control` for validation and error display
- MUST: Add `has-error` className to `Form.Field` when showing error states
- MUST: Use controlled state for all form inputs (`value` + `onChange`)
- MUST: Display errors inline next to fields using `Form.Message`
- MUST: Focus first error field on form submission
- MUST: Use appropriate `autocomplete` and `name` attributes for password managers
- MUST: Allow paste in all input fields (never block paste)
- MUST: Accept free text input, validate after—don't block typing
- MUST: Allow incomplete form submission to surface validation errors
- MUST: Keep submit button enabled until request starts, then disable with spinner
- MUST: Use `LiveFeedback` wrapper for async form submissions
- SHOULD: Disable spellcheck for emails, codes, and usernames
- SHOULD: Use placeholders that end with `…` and show example patterns
- NEVER: Block paste in `<input>` or `<textarea>` fields
- NEVER: Disable submit button before validation completes
- NEVER: Use uncontrolled form inputs when controlled state is available

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
<Input label="Email" /> // No Form wrapper, no error handling
```
