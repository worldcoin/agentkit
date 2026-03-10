---
name: mini-apps-ui-kit-react
description: >-
  A comprehensive React UI component library for building mini-apps with form controls,
  buttons, feedback components, overlays, layout components, and utilities. Built with
  TypeScript, Tailwind CSS, Radix UI primitives, and Vaul for drawers.
license: MIT
compatibility: React 18+, TypeScript, Tailwind CSS, SSR-friendly, RTL support
metadata:
  author: Worldcoin
  version: '1.0.0'
---

# Mini Apps UI Kit - Component Skills Reference

This document provides a comprehensive reference for all components in the `@worldcoin/mini-apps-ui-kit-react` package. Each component is documented with its purpose, props, usage examples, variants, and edge cases to help AI agents effectively use these components.

## When to Apply

Reference these guidelines when:

- Building UI components with the Mini Apps UI Kit
- Implementing forms, buttons, or interactive elements
- Creating layouts, navigation, or feedback components
- Reviewing code for UI/UX best practices
- Ensuring accessibility and mobile-first design

## Component Categories

### Form Controls

- `rules/form-input.md` - Input component with adornments and validation
- `rules/form-phonefield.md` - Phone number input with country selection
- `rules/form-passwordfield.md` - Password input with visibility toggle
- `rules/form-searchfield.md` - Search input with paste button
- `rules/form-textarea.md` - Multi-line text input
- `rules/form-select.md` - Dropdown select component
- `rules/form-checkbox.md` - Checkbox component
- `rules/form-switch.md` - Toggle switch component
- `rules/form-radiogroup.md` - Radio group component
- `rules/form-otpfield.md` - One-time password input
- `rules/form-walletaddressfield.md` - Wallet address input

### Buttons & Actions

- `rules/button.md` - Versatile button component
- `rules/chip.md` - Chip component with variants
- `rules/pill.md` - Pill-shaped toggle component
- `rules/token.md` - Token symbol display

### Feedback & Display

- `rules/toast.md` - Toast notification system
- `rules/livefeedback.md` - Async operation feedback wrapper
- `rules/progress.md` - Progress indicator
- `rules/skeleton.md` - Loading skeleton placeholders
- `rules/typography.md` - Typography system
- `rules/flag.md` - Country flag component
- `rules/marble.md` - Circular image component
- `rules/verificationbadge.md` - Verification status badge

### Overlays & Dialogs

- `rules/drawer.md` - Bottom drawer component
- `rules/alertdialog.md` - Alert dialog modal
- `rules/countrydrawer.md` - Country selection drawer

### Layout & Navigation

- `rules/topbar.md` - Top navigation bar
- `rules/bottombar.md` - Bottom action bar
- `rules/tabs.md` - Tab navigation
- `rules/safeareaview.md` - Safe area wrapper

### Interactive Elements

- `rules/numberpad.md` - Numeric keypad
- `rules/colorpicker.md` - Color picker component
- `rules/togglegroup.md` - Toggle group component
- `rules/listitem.md` - List item component

### Utilities

- `rules/haptic.md` - Haptic feedback wrapper
- `rules/form-utilities.md` - Form validation utilities
- `rules/bulletlist.md` - Bullet list component
- `rules/circularicon.md` - Circular icon container
- `rules/circularstate.md` - Circular state indicator
- `rules/i18n.md` - Internationalization support

## Best Practices

- `rules/best-practices-typography.md` - Typography & content guidelines
- `rules/best-practices-forms.md` - Forms & inputs guidelines
- `rules/best-practices-components.md` - Component usage guidelines
- `rules/best-practices-accessibility.md` - Accessibility requirements
- `rules/best-practices-mobile.md` - Mobile & touch guidelines
- `rules/best-practices-state.md` - State & navigation guidelines
- `rules/best-practices-i18n.md` - Internationalization guidelines
- `rules/best-practices-validation.md` - Error handling & validation
- `rules/best-practices-performance.md` - Performance & loading

## Quick Reference

### Form Controls

All form controls integrate with the `Form` component for validation:

```tsx
<Form.Root>
  <Form.Field name="email" className="has-error">
    <Form.Control asChild>
      <Input error label="Enter your email" />
    </Form.Control>
    <Form.Message error>Please enter a valid email</Form.Message>
  </Form.Field>
</Form.Root>
```

### Typography

Always use `Typography` component instead of raw HTML elements:

```tsx
<Typography variant="heading" level={1} as="h1">
  Main Page Title
</Typography>
```

### Buttons

Use appropriate variants and sizes:

```tsx
<Button variant="primary" size="lg">Click Me</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="tertiary" size="icon">
  <Star />
</Button>
```

## How to Use

Read individual rule files for detailed component documentation:

```
rules/form-input.md
rules/button.md
rules/best-practices-typography.md
```

Each rule file contains:

- Component purpose and use cases
- Key props and their types
- Usage examples with code
- Edge cases and gotchas
- Storybook references

## See Also

- **Form Controls**: All integrate with Form component for validation
- **Overlays**: Drawer and AlertDialog use Vaul and Radix UI Dialog
- **Feedback**: Toast, LiveFeedback, and Progress provide user feedback
- **Layout**: TopBar and BottomBar commonly used together in mobile layouts
- **Icons**: Many components accept icon props - see icon exports from the package
- **Typography**: Use Typography component for all text content
- **Validation**: Form component provides validation patterns

---

_Last updated: Based on Storybook stories in `stories/` directory_
