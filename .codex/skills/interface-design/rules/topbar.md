---
title: TopBar Component
category: layout-navigation
tags: topbar, navigation, header, mobile
---

## TopBar

A navigation bar component that displays a title with optional start and end elements. Commonly used at the top of pages or modals to show the current section and navigation controls.

**Key Props**:

- `title` (string): Bar title text
- `startAdornment` (ReactNode): Element at the start (typically back button)
- `endAdornment` (ReactNode): Element at the end (typically action button)

**Examples**:

```tsx
// Basic top bar
<TopBar title="World" />

// With back button
<TopBar
  title="World"
  startAdornment={
    <Button variant="tertiary" size="icon">
      <ArrowLeft />
    </Button>
  }
/>

// With end action
<TopBar
  title="World"
  endAdornment={
    <Button variant="tertiary" size="icon">
      <Clock />
    </Button>
  }
/>

// Both adornments
<TopBar
  title="World"
  startAdornment={<BackButton />}
  endAdornment={<ClockIcon />}
/>

// No title, just start adornment
<TopBar startAdornment={<BackButton />} />
```

**Edge Cases**:

- Title is optional
- Adornments are typically icon buttons
- Commonly used in mobile app layouts

**Storybook Reference**: `stories/TopBar.stories.tsx`
