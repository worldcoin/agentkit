---
title: SafeAreaView Component
category: layout-navigation
tags: safe-area, mobile, insets, notch
---

## SafeAreaView

A component that provides safe area insets for mobile devices, ensuring content is not obscured by notches, status bars, or home indicators. Includes a hook for accessing insets programmatically.

**Key Components**:

- `SafeAreaView`: Component wrapper
- `useSafeAreaInsets`: Hook for accessing insets

**Examples**:

```tsx
// Basic usage
;<SafeAreaView>
  <div>Content that respects safe areas</div>
</SafeAreaView>

// With hook
function MyComponent() {
  const insets = useSafeAreaInsets()

  return <div style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>Content</div>
}
```

**Edge Cases**:

- Primarily useful for mobile web apps
- Automatically handles iOS notch and Android system bars
- Hook provides programmatic access to inset values

**Storybook Reference**: Not available in stories (utility component)
