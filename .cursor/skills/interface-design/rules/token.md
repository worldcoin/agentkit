---
title: Token Component
category: buttons-actions
tags: token, cryptocurrency, symbol, display
---

## Token

A component that displays a token symbol. Use for displaying cryptocurrency or token symbols in lists, balances, or transaction details.

**Key Props**:

- `value` (string): Token symbol (e.g., "BTC", "ETH", "USDC", "WLD")
- `variant` ("default" | "monochrome"): Display variant
- `disabled` (boolean): Disabled state

**Examples**:

```tsx
// Default token
<Token value="BTC" />

// Monochrome variant
<Token value="BTC" variant="monochrome" />

// Disabled
<Token value="BTC" disabled />

// Multiple tokens
<div className="flex gap-2">
  <Token value="BTC" />
  <Token value="USDC" />
  <Token value="WLD" />
</div>
```

**Edge Cases**:

- Supported tokens: BTC, ETH, USDC, WLD, DAI, USDT, SUI, DOGE, XRP, SOL, LINK
- Monochrome variant removes color styling

**Storybook Reference**: `stories/Token.stories.tsx`
