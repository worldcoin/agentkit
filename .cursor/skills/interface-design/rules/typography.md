---
title: Typography Component
category: feedback-display
tags: typography, text, semantic-html, accessibility
---

## Typography

A comprehensive typography system with multiple variants and levels for consistent text styling across the application. Uses the [TWK Lausanne](https://weltkern.com/typefaces/lausanne) font family and supports semantic HTML through the `as` prop. Supports display, heading, subtitle, body, label, and number variants. **Note**: Ensure you have the proper license to use TWK Lausanne before implementing these typography styles.

**Key Props**:

- `variant` ("display" | "heading" | "subtitle" | "body" | "label" | "number"): Text variant
- `level` (number): Hierarchy level (1-5 depending on variant)
- `as` ("p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "small" | "strong" | "div" | "em"): HTML element to render (default: "p"). Use this prop to ensure semantic HTML structure for accessibility and SEO.
- `children` (ReactNode): Text content

**When to Use Each Variant**:

- **Display**: Use for hero sections, landing page headlines, large marketing statements, or any prominent text that needs maximum visual impact. Largest text size in the system.
- **Heading**: Use for page titles, section headers, content hierarchy (h1-h4 equivalent). Creates clear visual hierarchy in documents and pages.
- **Subtitle**: Use for supporting text directly under headings, descriptions, introductory text, or secondary headings. Provides context without overwhelming.
- **Body**: Use for paragraphs, general content, readable text blocks, and any standard text content. Default variant for most text content.
- **Label**: Use for form labels, UI labels, small emphasized text, field names, or any text that needs to stand out but remain compact.
- **Number**: Use for statistics, metrics, large numeric displays, data visualization labels, or any numeric content that needs emphasis.

**Semantic HTML Mapping**:

The `as` prop allows you to render the Typography component as any semantic HTML element. Here are recommended mappings:

| Variant    | Level | Recommended `as`      | Semantic Use                   |
| ---------- | ----- | --------------------- | ------------------------------ |
| `display`  | 1     | `"h1"`                | Main page title, hero headline |
| `heading`  | 1     | `"h1"`                | Primary page heading           |
| `heading`  | 2     | `"h2"`                | Section heading                |
| `heading`  | 3     | `"h3"`                | Subsection heading             |
| `heading`  | 4     | `"h4"`                | Minor heading                  |
| `subtitle` | 1-4   | `"p"` or `"span"`     | Supporting text, descriptions  |
| `body`     | 1-4   | `"p"`                 | Paragraphs, body text          |
| `label`    | 1-2   | `"label"` or `"span"` | Form labels, UI labels         |
| `number`   | 1-5   | `"span"` or `"div"`   | Numeric displays, statistics   |

**Best Practices for Semantic HTML**:

- Always use appropriate heading tags (`h1`-`h6`) for headings to maintain document structure
- Use `h1` only once per page for the main title
- Use `p` for body text and paragraphs
- Use `label` when the Typography is associated with a form input
- Use `span` for inline text that doesn't need its own block
- Maintain proper heading hierarchy (h1 → h2 → h3, don't skip levels)

**Levels by Variant**:

- `display`: level 1 only
- `heading`: levels 1-4
- `subtitle`: levels 1-4
- `body`: levels 1-4
- `label`: levels 1-2
- `number`: levels 1-5

**Examples**:

```tsx
// Display text (hero section)
<Typography variant="display" level={1} as="h1">
  The real human network
</Typography>

// Headings with semantic HTML
<Typography variant="heading" level={1} as="h1">
  Main Page Title
</Typography>
<Typography variant="heading" level={2} as="h2">
  Section Heading
</Typography>
<Typography variant="heading" level={3} as="h3">
  Subsection Heading
</Typography>

// Subtitle (supporting text)
<Typography variant="subtitle" level={1} as="p">
  Supporting description text that provides context
</Typography>

// Body text (paragraphs)
<Typography variant="body" level={1} as="p">
  Regular paragraph text for body content. This is the default variant.
</Typography>
<Typography variant="body" level={2} as="p">
  Smaller body text for secondary content.
</Typography>

// Labels (form labels)
<Typography variant="label" level={1} as="label" htmlFor="email">
  Email Address
</Typography>

// Numbers (statistics)
<Typography variant="number" level={1} as="span">
  483K Trading Volume Today
</Typography>

// Inline text (using span)
<Typography variant="body" level={2} as="span">
  Inline text content
</Typography>
```

**Edge Cases**:

- Each variant has specific level ranges - using invalid level combinations will not apply correct styling
- `as` prop defaults to `"p"` but should be overridden for semantic HTML (e.g., use `"h1"` for main headings)
- Always use semantic HTML tags (`h1`-`h6` for headings, `p` for paragraphs) for accessibility and SEO
- Maintain proper heading hierarchy - don't skip levels (e.g., h1 → h3 without h2)
- Use `h1` only once per page for the main document title
- Typography system ensures consistent spacing and sizing across all variants
- Font licensing: TWK Lausanne requires proper licensing - ensure compliance before use

**Storybook Reference**: `stories/Typography.stories.tsx`, `stories/Typography.mdx`
