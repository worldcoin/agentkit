---
title: NumberPad Component
category: interactive-elements
tags: numberpad, numeric, input, keypad
---

## NumberPad

A numeric keypad component that allows users to input numbers and decimals. Includes a delete button and validates input to ensure only valid numbers are entered.

**Key Props**:

- `value` (string): Current numeric value
- `onChange` (function): Callback when value changes
- `onLongDeletePress` (function): Callback for long press on delete (clears all)
- `longPressOptions` (object): Options for long press detection
  - `threshold` (number): Milliseconds for long press (default: 1500)

**Examples**:

```tsx
// Basic number pad
const [value, setValue] = useState("");

<NumberPad value={value} onChange={setValue} />

// With display
<div className="flex flex-col gap-4">
  <div className="text-4xl">${value || "0"}</div>
  <NumberPad value={value} onChange={setValue} />
</div>

// With long delete press (clear all)
const handleLongDeletePress = () => {
  setValue("");
};

<NumberPad
  value={value}
  onChange={setValue}
  onLongDeletePress={handleLongDeletePress}
  longPressOptions={{ threshold: 1500 }}
/>
```

**Edge Cases**:

- Validates input to ensure only valid numbers
- Long press on delete button clears entire value
- Decimal point can only be entered once
- Delete button removes last character on single press

**Storybook Reference**: `stories/NumberPad.stories.tsx`
