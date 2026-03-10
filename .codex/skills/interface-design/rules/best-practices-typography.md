---
title: Typography & Content Best Practices
category: best-practices
tags: typography, content, semantic-html, accessibility
---

## Typography & Content

Concise rules for typography and content with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Use `Typography` component instead of raw HTML text elements (`<h1>`, `<p>`, `<span>`, etc.)
- MUST: Use semantic HTML via `as` prop (e.g., `as="h1"` for headings, `as="p"` for paragraphs)
- MUST: Use `h1` only once per page for the main document title
- MUST: Maintain proper heading hierarchy (h1 → h2 → h3, don't skip levels)
- SHOULD: Use appropriate variant for content type (display for heroes, heading for titles, body for paragraphs)
- NEVER: Use raw HTML text elements when Typography component is available
- NEVER: Skip heading levels in document structure

**Examples**:

```tsx
// ✅ Correct
<Typography variant="heading" level={1} as="h1">
  Main Page Title
</Typography>
<Typography variant="heading" level={2} as="h2">
  Section Heading
</Typography>
<Typography variant="body" level={1} as="p">
  Paragraph text
</Typography>

// ❌ Incorrect
<h1>Main Page Title</h1>
<h3>Section Heading</h3> // Skipped h2
<p>Paragraph text</p>
```
