---
title: ColorPicker Component
category: interactive-elements
tags: colorpicker, color, selection, input
---

## ColorPicker

A color picker input component with a visual color preview. Allows users to select from a predefined set of colors.

**Key Components**:

- `ColorPickerGroup`: Container for color items
- `ColorPickerItem`: Individual color option

**Key Props**:

- `ColorPickerGroup`:
  - `value` (string): Selected color value
  - `onChange` (function): Callback when color changes
  - `disabled` (boolean): Disables the picker
- `ColorPickerItem`:
  - `value` (string): Color hex value (e.g., "#FF0000")

**Examples**:

```tsx
// Basic color picker
<ColorPickerGroup>
  <ColorPickerItem value="#9D50FF" />
  <ColorPickerItem value="#4940E0" />
  <ColorPickerItem value="#00C3B6" />
  <ColorPickerItem value="#FF5096" />
</ColorPickerGroup>
```

**Edge Cases**:

- Colors should be provided as hex values
- Group manages selection state
- Disabled state prevents selection

**Storybook Reference**: `stories/ColorPicker.stories.tsx`
