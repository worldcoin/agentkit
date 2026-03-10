---
title: VerificationBadge Component
category: feedback-display
tags: badge, verification, status, orb
---

## VerificationBadge

A badge component that displays orb verification status. Indicates whether a person is a verified human (orb verified) with a blue badge, or unverified with a gray badge.

**Key Props**:

- `verified` (boolean): Whether the person is a verified human (orb verified)
- `className` (string): Additional CSS classes (use for sizing)

**Examples**:

```tsx
// Verified badge
<VerificationBadge verified={true} />

// Unverified badge
<VerificationBadge verified={false} />

// Custom size
<VerificationBadge verified={true} className="size-8" />
```

**Edge Cases**:

- Verified state shows blue badge with white icon
- Unverified state shows gray badge with gray icon
- Size can be customized with className

**Storybook Reference**: `stories/VerificationBadge.stories.tsx`
