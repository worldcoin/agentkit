---
title: Performance & Loading Best Practices
category: best-practices
tags: performance, loading, skeleton, feedback, async
---

## Performance & Loading

Concise rules for performance and loading states with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Use `Skeleton` and `SkeletonTypography` for loading states
- MUST: Use `LiveFeedback` to show pending/success/failed states for async operations
- MUST: Reset `LiveFeedback` state to `undefined` after showing result
- SHOULD: Show loading indicators immediately on user action
- NEVER: Leave users without feedback during async operations

**Examples**:

```tsx
// ✅ Correct
{loading ? (
  <SkeletonTypography variant="heading" level={2} />
) : (
  <Typography variant="heading" level={2}>Content</Typography>
)}

<LiveFeedback state={state}>
  <Button onClick={handleSubmit}>Submit</Button>
</LiveFeedback>

// ❌ Incorrect
<Button onClick={handleSubmit}>Submit</Button> // No feedback during async operation
```
