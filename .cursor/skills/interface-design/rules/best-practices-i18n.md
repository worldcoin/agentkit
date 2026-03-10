---
title: Internationalization Best Practices
category: best-practices
tags: i18n, internationalization, locale, rtl, translation
---

## Internationalization

Concise rules for internationalization with the Mini Apps UI Kit. Use MUST/SHOULD/NEVER to guide decisions.

- MUST: Use `I18nProvider` with locale data for i18n support
- MUST: Use `loadLocale` for SSR-friendly locale loading
- MUST: Set `dir` prop to `"rtl"` for RTL languages (Arabic, Hebrew, etc.)
- MUST: Use `locale` prop on `PhoneField` for proper phone number formatting
- SHOULD: Test components with RTL languages when supporting international users
- NEVER: Hardcode text that should be translatable
- NEVER: Assume LTR layout for all users

**Examples**:

```tsx
// ✅ Correct
<PhoneField locale="en" dir="ltr" />
<PhoneField locale="ar" dir="rtl" label="الهاتف" />

// ❌ Incorrect
<PhoneField /> // Missing locale and dir for international users
```
