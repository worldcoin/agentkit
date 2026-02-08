---
title: BottomBar Component
category: layout-navigation
tags: bottombar, actions, buttons, mobile
---

## BottomBar

A container for action buttons at the bottom of a view. Provides a consistent layout for primary and secondary actions, supporting both horizontal and vertical arrangements.

**Key Props**:

- `direction` ("horizontal" | "vertical"): Button arrangement (default: "horizontal")
- `children` (ReactNode): Button elements

**Examples**:

```tsx
// Horizontal layout (default)
<BottomBar direction="horizontal">
  <Button variant="secondary" fullWidth>Cancel</Button>
  <Button variant="primary" fullWidth>Confirm</Button>
</BottomBar>

// Vertical layout
<BottomBar direction="vertical">
  <Button variant="secondary" fullWidth>Cancel</Button>
  <Button variant="primary" fullWidth>Confirm</Button>
</BottomBar>

// With LiveFeedback
<LiveFeedback state={state}>
  <BottomBar>
    <Button fullWidth variant="secondary" onClick={handleCancel}>
      Cancel
    </Button>
    <Button fullWidth onClick={handleSubmit}>Submit</Button>
  </BottomBar>
</LiveFeedback>
```

**Edge Cases**:

- Buttons should use `fullWidth` for consistent sizing
- Vertical layout useful for narrow viewports or long button labels
- Commonly used with LiveFeedback for async operations

**Storybook Reference**: `stories/BottomBar.stories.tsx`
