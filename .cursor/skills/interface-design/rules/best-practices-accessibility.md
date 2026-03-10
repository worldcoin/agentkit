---
title: Accessibility Best Practices
category: best-practices
tags: accessibility, a11y, keyboard, screen-reader, aria
---

## Accessibility

Concise rules for building accessible interfaces with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Components built on Radix UI include proper ARIA attributes automatically
- MUST: Full keyboard support per [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/)
- MUST: Visible focus rings (handled by components; use `:focus-visible` for custom elements)
- MUST: Manage focus (trap, move, return) in modals and drawers
- MUST: Use semantic HTML tags via `as` prop for screen readers
- MUST: Associate form labels with inputs using `htmlFor` and `id`
- SHOULD: Test with keyboard navigation and screen readers
- NEVER: Remove focus styles without providing visible replacement
- NEVER: Use `<div onClick>` for navigation (use `<a>` or `<Link>`)

**Examples**:

```tsx
// ✅ Correct
<Typography variant="label" level={1} as="label" htmlFor="email">
  Email Address
</Typography>
<Input id="email" label="Email" />

// ❌ Incorrect
<div onClick={handleClick}>Navigate</div> // Should use Link or Button
```
