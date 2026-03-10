---
title: Flag Component
category: feedback-display
tags: flag, country, region, svg
---

## Flag

A component that displays a country or region flag using SVG icons. Use for country selection, user profiles, or location indicators.

**Key Props**:

- `countryCode` (CountryCode): ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "FR", "DE")
- `size` (number): Width and height in pixels (default: 40px)

**Examples**:

```tsx
// Basic flag
<Flag countryCode="US" />

// Custom size
<Flag countryCode="DE" size={24} />

// In country selector
<Button>
  <Flag countryCode={selectedCountry} />
  {countryName}
</Button>
```

**Edge Cases**:

- Country codes must be valid ISO 3166-1 alpha-2 codes
- SVG flags are included in the package
- Size defaults to 40px if not specified

**Storybook Reference**: `stories/Flag.stories.tsx`
