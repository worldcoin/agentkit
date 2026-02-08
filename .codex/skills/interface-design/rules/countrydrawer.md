---
title: CountryDrawer Component
category: overlays-dialogs
tags: country, drawer, selection, phone, rtl
---

## CountryDrawer

A responsive country selection component that adapts to different screen sizes. On mobile devices, it displays as a full-page drawer interface, while on desktop it renders as a centered dialog modal. Typically used in conjunction with phone number input fields.

**Key Props**:

- `value` (CountryCode): Selected country code
- `onChange` (function): Callback when country changes
- `countries` (CountryCode[]): Restricted list of available countries (optional)
- `disabled` (boolean): Disables the drawer
- `dir` ("ltr" | "rtl"): Text direction
- `title` (string): Custom title
- `searchLabel` (string): Custom search placeholder

**Examples**:

```tsx
// Basic country drawer
const [country, setCountry] = useState<CountryCode>("US");

<CountryDrawer value={country} onChange={(code) => setCountry(code)}>
  <Button variant="secondary" size="icon">
    <Flag countryCode={country} />
  </Button>
</CountryDrawer>

// With restricted countries
<CountryDrawer
  value={country}
  countries={["US", "CA", "GB", "FR", "DE"]}
  onChange={(code) => setCountry(code)}
>
  <Button variant="secondary" size="icon">
    <Flag countryCode={country} />
  </Button>
</CountryDrawer>

// RTL support
<CountryDrawer
  value={country}
  onChange={(code) => setCountry(code)}
  dir="rtl"
  title="البلد"
  searchLabel="البحث عن البلد"
>
  <Button variant="secondary" size="icon">
    <Flag countryCode={country} />
  </Button>
</CountryDrawer>
```

**Edge Cases**:

- Responsive: drawer on mobile, dialog on desktop
- Includes search functionality for quick country lookup
- Countries are alphabetically grouped
- RTL support for Arabic and other RTL languages

**Storybook Reference**: `stories/CountryDrawer.stories.tsx`
