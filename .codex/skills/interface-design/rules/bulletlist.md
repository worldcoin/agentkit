---
title: BulletList Component
category: utilities
tags: bulletlist, list, icons, circular-icon
---

## BulletList

A component that renders a list of BulletListItems with custom bullet points (typically icons). Use for feature lists, step-by-step instructions, or any ordered list with custom bullets.

**Key Components**:

- `BulletList`: Container component
- `BulletListItem`: Individual list item

**Key Props**:

- `BulletListItem`:
  - `bulletPoint` (ReactNode): Custom bullet element (typically CircularIcon with icon)

**Examples**:

```tsx
// Basic bullet list
<BulletList>
  <BulletListItem
    bulletPoint={
      <CircularIcon className="size-9 bg-gray-900">
        <SparkIcon className="text-gray-0" />
      </CircularIcon>
    }
  >
    First bullet point with spark icon
  </BulletListItem>
  <BulletListItem
    bulletPoint={
      <CircularIcon className="size-9 bg-gray-900">
        <SparkIcon className="text-gray-0" />
      </CircularIcon>
    }
  >
    Second bullet point
  </BulletListItem>
</BulletList>

// With custom bullets
<BulletList>
  <BulletListItem
    bulletPoint={
      <CircularIcon className="bg-success-500">
        <Shield className="text-gray-0" />
      </CircularIcon>
    }
  >
    Success item
  </BulletListItem>
  <BulletListItem
    bulletPoint={
      <CircularIcon className="bg-error-500">
        <Star className="text-gray-0" />
      </CircularIcon>
    }
  >
    Error item
  </BulletListItem>
</BulletList>

// With Typography
<BulletList>
  <BulletListItem
    bulletPoint={
      <CircularIcon className="size-9 bg-gray-900">
        <SparkIcon className="text-gray-0" />
      </CircularIcon>
    }
  >
    <Typography variant="body">Regular text item with body styling</Typography>
  </BulletListItem>
</BulletList>
```

**Edge Cases**:

- Bullet points are typically CircularIcon components with icons
- Supports custom content in list items (text, Typography, custom elements)
- Long text automatically wraps

**Storybook Reference**: `stories/BulletList.stories.tsx`
