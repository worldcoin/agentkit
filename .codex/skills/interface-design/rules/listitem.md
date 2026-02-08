---
title: ListItem Component
category: interactive-elements
tags: listitem, list, display, variant
---

## ListItem

A versatile list item component that can be styled with different variants: duotone (alternating backgrounds), outline (bordered), and ghost (minimal). Used for displaying content in list format with consistent height and alignment.

**Key Props**:

- `label` (string): Primary text content
- `description` (string): Secondary text content
- `startAdornment` (ReactNode): Element at the start (icon, token, etc.)
- `endAdornment` (ReactNode): Element at the end (icon, chip, etc.)
- `disabled` (boolean): Disables the item
- `variant` ("duotone" | "outline" | "ghost"): Styling variant

**Examples**:

```tsx
// Basic list item
<ListItem
  label="Basic List Item"
  description="This is a basic list item with a label and description"
/>

// With start adornment
<ListItem
  label="List Item with Icon"
  description="This list item has a start adornment"
  startAdornment={<Token value="BTC" />}
/>

// With end adornment
<ListItem
  label="List Item with Action"
  description="This list item has an end adornment"
  endAdornment={<Chip label="Suggested" className="bg-gray-200" />}
/>

// With both adornments
<ListItem
  label="Complete Item"
  description="With both start and end adornments"
  startAdornment={<Token value="ETH" />}
  endAdornment={<Star />}
/>
```

**Edge Cases**:

- Adornments can be any ReactNode (icons, tokens, chips, etc.)
- Variants provide different visual styles
- Disabled state prevents interaction

**Storybook Reference**: `stories/ListItem.stories.tsx`
