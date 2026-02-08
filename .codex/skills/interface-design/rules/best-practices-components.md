---
title: Component Usage Best Practices
category: best-practices
tags: components, ui-kit, structure, usage
---

## Components & Structure

Concise rules for using UI Kit components effectively. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Use UI Kit components instead of building custom equivalents
- MUST: Check corresponding `.stories.tsx` file for component usage examples
- MUST: Use `Toaster` component in app root when using Toast notifications
- MUST: Wrap form controls with `Form.Control` using `asChild` prop
- SHOULD: Use consistent icon sizes (typically 20x20px) when providing custom icons
- SHOULD: Use `fullWidth` prop on buttons in `BottomBar` for consistent sizing
- NEVER: Create custom components that duplicate UI Kit functionality
- NEVER: Use raw HTML elements when UI Kit components exist

**Examples**:

```tsx
// ✅ Correct
<Button variant="primary" size="lg">Click Me</Button>
<Input label="Email" id="email" />

// ❌ Incorrect
<button className="custom-button">Click Me</button>
<input type="text" placeholder="Email" />
```
