---
title: SearchField Component
category: form-controls
tags: search, input, paste, validation
---

## SearchField

A text input component designed for search functionality. Includes optional paste button and validation states.

**Key Props**:

- `label` (string): Search placeholder/label
- `value`, `onChange`: Standard controlled input props
- `showPasteButton` (boolean): Shows paste button as end adornment
- `pasteButtonLabel` (string): Label for paste button
- `error` (boolean): Error state styling
- `isValid` (boolean): Success state styling
- `disabled` (boolean): Disables the input
- `endAdornment` (ReactNode): Custom end adornment

**Examples**:

```tsx
// Basic search
<SearchField label="Name, Address or ENS" />

// With paste button
<SearchField label="Name, Address or ENS" showPasteButton />

// With error state
<Form.Root>
  <Form.Field name="search">
    <SearchField label="Name, Address or ENS" error />
    <Form.Message error>This is an error message</Form.Message>
  </Form.Field>
</Form.Root>
```

**Edge Cases**:

- Paste button appears as end adornment when `showPasteButton` is true
- Error state integrates with Form component

**Storybook Reference**: `stories/SearchField.stories.tsx`
