---
title: Select Component
category: form-controls
tags: select, dropdown, radix-ui, form
---

## Select

A select component that provides a dropdown list of options with support for default values, disabled state, and error handling. Built on Radix UI Select primitive.

**Key Props**:

- `options` (SelectOption[]): Array of {value, label} objects
- `value` (string | undefined): Controlled value
- `onChange` (function): Callback when selection changes
- `defaultValue` (string): Uncontrolled default value
- `placeholder` (string): Placeholder text
- `disabled` (boolean): Disables the select
- `error` (boolean): Error state styling
- `defaultOpen` (boolean): Opens dropdown on mount
- `open`, `onOpenChange`: Controlled open state

**Examples**:

```tsx
const options = [
  { value: "10", label: "$10" },
  { value: "25", label: "$25" },
  { value: "50", label: "$50" },
];

// Basic select
<Select
  options={options}
  placeholder="Value"
  value={selectedValue}
  onChange={setSelectedValue}
/>

// With default value
<Select
  options={options}
  defaultValue={options[0].value}
  placeholder="Value"
/>

// With error state
<Form.Root>
  <Form.Field name="select" className="has-error">
    <Form.Control asChild>
      <Select options={options} error />
    </Form.Control>
    <Form.Message error>Error message</Form.Message>
  </Form.Field>
</Form.Root>

// Controlled open state
<Select
  options={options}
  open={open}
  onOpenChange={setOpen}
  value={selectedValue}
  onChange={setSelectedValue}
/>
```

**Edge Cases**:

- Supports long lists with scrolling
- Can be controlled or uncontrolled
- Error state requires Form.Field with `has-error` className
- Dropdown viewport is rendered in document.body

**Storybook Reference**: `stories/Select.stories.tsx`
