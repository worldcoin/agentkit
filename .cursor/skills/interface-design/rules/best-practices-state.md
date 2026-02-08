---
title: State & Navigation Best Practices
category: best-practices
tags: state, navigation, url, routing, i18n
---

## State & Navigation

Concise rules for managing state and navigation with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Use controlled state for form inputs and interactive elements
- MUST: URL reflects state (deep-link filters, tabs, pagination, expanded panels)
- MUST: Back/Forward restores scroll position
- MUST: Links use `<a>` or `<Link>` for navigation (support Cmd/Ctrl/middle-click)
- MUST: Use `I18nProvider` with `loadLocale` for SSR compatibility
- SHOULD: Use `useToast` hook for user feedback instead of custom notifications
- SHOULD: Use `LiveFeedback` for async operations to show loading/success/error states
- NEVER: Use `<div onClick>` for navigation
- NEVER: Use uncontrolled state when component supports controlled mode

**Examples**:

```tsx
// ✅ Correct
const [value, setValue] = useState("");
<Input value={value} onChange={(e) => setValue(e.target.value)} />

<Link href="/page">Navigate</Link>

// ❌ Incorrect
<Input /> // Uncontrolled
<div onClick={() => router.push('/page')}>Navigate</div>
```
