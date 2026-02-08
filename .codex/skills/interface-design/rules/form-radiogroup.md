---
title: RadioGroup Component
category: form-controls
tags: radio, radiogroup, form, radix-ui
---

## RadioGroup

A radio group component that extends Radix's RadioGroup primitive, allowing users to select a single option from a list of options.

**Key Props**:

- `defaultValue` (string): Uncontrolled default value
- `value`, `onValueChange`: Controlled value
- `orientation` ("vertical" | "horizontal"): Layout direction (default: "vertical")
- `name` (string): HTML name attribute for form submission

**Subcomponents**:

- `RadioGroupItem`: Individual radio button

**Examples**:

```tsx
// Basic radio group
<RadioGroup defaultValue="option1" orientation="vertical">
  <RadioGroupItem value="option1" id="option1" />
  <RadioGroupItem value="option2" id="option2" />
  <RadioGroupItem value="option3" id="option3" />
</RadioGroup>

// With labels
<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <label htmlFor="r1">Option 1</label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <label htmlFor="r2">Option 2</label>
  </div>
</RadioGroup>
```

**Edge Cases**:

- Can be controlled or uncontrolled
- Supports both vertical and horizontal orientations
- Each RadioGroupItem should have a unique id when using labels

**Storybook Reference**: `stories/RadioGroup.stories.tsx`
