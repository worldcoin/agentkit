---
title: PhoneField Component
category: form-controls
tags: phone, input, country, formatting, rtl
---

## PhoneField

A phone number input field with country code selection and formatting support. Includes a drawer for country selection and automatic phone number formatting.

**Key Props**:

- `value` (string): Phone number value
- `onChange` (function): Callback when value changes
- `locale` (string): Locale for formatting (e.g., "en", "de")
- `dir` ("ltr" | "rtl"): Text direction
- `defaultCountryCode` (CountryCode): Initial country code
- `countries` (CountryCode[]): Restricted list of available countries
- `disableDialCodePrefill` (boolean): Prevents auto-filling dial code
- `error` (boolean): Error state styling
- `isValid` (boolean): Success state styling
- `label` (string): Input label

**Examples**:

```tsx
// Basic phone field
<PhoneField locale="en" dir="ltr" />

// With restricted countries
<PhoneField
  defaultCountryCode="DE"
  countries={["DE", "PL"]}
  value={value}
  onChange={setValue}
/>

// With validation
const isValid = value.length >= 12;
<PhoneField
  value={value}
  onChange={setValue}
  isValid={isValid}
/>

// RTL support
<PhoneField
  dir="rtl"
  label="الهاتف"
  defaultCountryCode="AE"
/>
```

**Edge Cases**:

- Phone numbers are automatically formatted based on selected country
- Country drawer opens on mobile as full-page, desktop as dialog
- RTL support available for Arabic and other RTL languages
- Validation state can be controlled via `isValid` prop

**Storybook Reference**: `stories/PhoneField.stories.tsx`
