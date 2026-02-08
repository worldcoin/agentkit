---
title: TextArea Component
category: form-controls
tags: textarea, multiline, input, floating-label
---

## TextArea

A multi-line text input component that allows users to enter longer form content. Supports floating labels and various states.

**Key Props**:

- `label` (string): Textarea label
- `id` (string): HTML id attribute
- `variant` ("default" | "floating-label"): Label display style
- `value`, `onChange`: Standard controlled input props
- `disabled` (boolean): Disables the textarea
- `error` (boolean): Error state styling
- `isFocused` (boolean): Manually control focus state

**Examples**:

```tsx
// Basic textarea
<TextArea label="Enter your text here..." id="text-area-default" />

// Floating label
<TextArea
  label="Enter your text here..."
  variant="floating-label"
  id="text-area-floating-label"
/>

// With error
<TextArea label="Enter your text here..." error id="text-area-error" />

// Disabled
<TextArea label="This textarea is disabled" disabled id="text-area-disabled" />
```

**Edge Cases**:

- Supports both default and floating-label variants
- Can be controlled with `isFocused` prop

**Storybook Reference**: `stories/TextArea.stories.tsx`
