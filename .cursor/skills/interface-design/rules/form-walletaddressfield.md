---
title: WalletAddressField Component
category: form-controls
tags: wallet, address, input, validation
---

## WalletAddressField

A text input component designed for entering wallet addresses. Includes validation states for valid/invalid addresses.

**Key Props**:

- `label` (string): Input label
- `value`, `onChange`: Standard controlled input props
- `error` (boolean): Error state styling
- `isValid` (boolean): Success state styling
- `disabled` (boolean): Disables the input

**Examples**:

```tsx
// Basic wallet address field
;<WalletAddressField label="Enter wallet address" />

// With validation
const [value, setValue] = useState('')
const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(value)

;<WalletAddressField
  value={value}
  onChange={e => setValue(e.target.value)}
  isValid={isEthAddress}
  error={value.length > 0 && !isEthAddress}
  label="Enter ETH wallet address"
/>
```

**Edge Cases**:

- Validation should be handled by parent component
- `isValid` shows success state (green checkmark)
- `error` shows error state (red border)

**Storybook Reference**: `stories/WalletAddressField.stories.tsx`
