---
title: ToggleGroup Component
category: interactive-elements
tags: togglegroup, toggle, selection, radix-ui
---

## ToggleGroup

A toggle group component that allows users to select one or multiple options. Built on Radix UI ToggleGroup primitive.

**Key Components**:

- `ToggleGroupRoot`: Root component
- `ToggleGroupItem`: Individual toggle item

**Key Props**:

- `ToggleGroupRoot`:
  - `type` ("single" | "multiple"): Selection type
  - `value`, `onValueChange`: Controlled value
  - `defaultValue`: Uncontrolled default value
  - `disabled` (boolean): Disables the group
  - `loop` (boolean): Keyboard navigation loops
  - `rovingFocus` (boolean): Gets focus on mount
  - `dir` ("ltr" | "rtl"): Reading direction
- `ToggleGroupItem`:
  - `value` (string): Item value
  - `disabled` (boolean): Disables individual item

**Examples**:

```tsx
// Single select
<ToggleGroupRoot type="single" defaultValue="1d">
  <ToggleGroupItem value="1d">1D</ToggleGroupItem>
  <ToggleGroupItem value="1w">1W</ToggleGroupItem>
  <ToggleGroupItem value="1m">1M</ToggleGroupItem>
  <ToggleGroupItem value="1y">1Y</ToggleGroupItem>
</ToggleGroupRoot>

// Multiple select
<ToggleGroupRoot type="multiple" defaultValue={["1d"]}>
  <ToggleGroupItem value="1d">1D</ToggleGroupItem>
  <ToggleGroupItem value="1w">1W</ToggleGroupItem>
  <ToggleGroupItem value="1m">1M</ToggleGroupItem>
  <ToggleGroupItem value="1y">1Y</ToggleGroupItem>
</ToggleGroupRoot>

// With disabled item
<ToggleGroupRoot type="single" defaultValue="1d">
  <ToggleGroupItem value="1d">1D</ToggleGroupItem>
  <ToggleGroupItem value="1w" disabled>1W</ToggleGroupItem>
  <ToggleGroupItem value="1m">1M</ToggleGroupItem>
</ToggleGroupRoot>
```

**Edge Cases**:

- Single type allows one selection, multiple allows many
- Can be controlled or uncontrolled
- Individual items can be disabled
- Supports keyboard navigation

**Storybook Reference**: `stories/ToggleGroup.stories.tsx`
