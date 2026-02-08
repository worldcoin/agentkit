---
title: Mobile & Touch Best Practices
category: best-practices
tags: mobile, touch, responsive, safe-area, keyboard
---

## Mobile & Touch

Concise rules for mobile-first design with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Components are designed mobile-first—test on mobile viewports
- MUST: Hit targets ≥24px (mobile ≥44px); if visual <24px, expand hit area
- MUST: Mobile `<input>` font-size ≥16px to prevent iOS zoom
- MUST: Use `repositionInputs` prop on Drawer when containing inputs
- MUST: Use `SafeAreaView` for content that should respect device safe areas
- SHOULD: Set `-webkit-tap-highlight-color` to match design (if customizing)
- NEVER: Disable browser zoom (`user-scalable=no`, `maximum-scale=1`)
- NEVER: Use desktop-only patterns on mobile interfaces

**Examples**:

```tsx
// ✅ Correct
<Drawer height="full" repositionInputs>
  <DrawerContent>
    <Input label="Name" /> {/* Font size handled by component */}
  </DrawerContent>
</Drawer>

<SafeAreaView>
  <div>Content respects safe areas</div>
</SafeAreaView>

// ❌ Incorrect
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
```
