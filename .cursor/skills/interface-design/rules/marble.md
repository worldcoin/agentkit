---
title: Marble Component
category: feedback-display
tags: marble, avatar, image, circular
---

## Marble

A circular component that displays an image with a border, resembling a marble. Use for avatars, profile pictures, or decorative elements.

**Key Props**:

- `src` (string | StaticImageData): Image source (URL or imported image)
- `className` (string): Additional CSS classes (use for sizing)

**Examples**:

```tsx
import marble1 from "./images/marble1.png";

// Basic marble
<Marble src={marble1} />

// Custom size
<Marble src={marble1} className="w-32" />

// Multiple marbles
<div className="flex gap-x-4">
  <Marble src={marble1} />
  <Marble src={marble2} />
  <Marble src={marble3} />
</div>
```

**Edge Cases**:

- Supports both URL strings and imported images
- Size controlled via className (Tailwind width classes)
- Circular shape with border styling

**Storybook Reference**: `stories/Marble.stories.tsx`
