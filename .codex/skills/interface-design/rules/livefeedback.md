---
title: LiveFeedback Component
category: feedback-display
tags: feedback, async, loading, state
---

## LiveFeedback

A wrapper component that provides visual feedback (pending, success, failed) for async operations. Wraps buttons or other interactive elements to show loading and result states.

**Key Props**:

- `state` ("pending" | "success" | "failed" | undefined): Current feedback state
- `label` (object): Labels for each state `{ pending: string, success: string, failed: string }`
- `children` (ReactNode): Element to wrap (typically a Button)

**Examples**:

```tsx
const [state, setState] = useState<"pending" | "success" | "failed" | undefined>();

const handleClick = () => {
  setState("pending");
  // Simulate API call
  setTimeout(() => {
    setState(Math.random() > 0.5 ? "success" : "failed");
    setTimeout(() => setState(undefined), 2000);
  }, 1500);
};

<LiveFeedback state={state} className="w-full">
  <Button onClick={handleClick} fullWidth>Submit</Button>
</LiveFeedback>

// With BottomBar
<LiveFeedback state={state} className="w-full">
  <BottomBar>
    <Button fullWidth variant="secondary" onClick={handleCancel}>
      Cancel
    </Button>
    <Button fullWidth onClick={handleSubmit}>Submit</Button>
  </BottomBar>
</LiveFeedback>
```

**Edge Cases**:

- State should be reset to `undefined` after showing result
- Works with any child component, not just buttons
- Labels are optional, defaults provided

**Storybook Reference**: `stories/LiveFeedback.stories.tsx`
