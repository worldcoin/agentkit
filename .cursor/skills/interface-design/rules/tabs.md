---
title: Tabs Component
category: layout-navigation
tags: tabs, navigation, switching, icons
---

## Tabs

A tab navigation component that allows users to switch between different views or sections. Each tab can have an icon and label, with support for active/inactive icon states.

**Key Components**:

- `Tabs`: Root component
- `TabItem`: Individual tab item

**Key Props**:

- `value` (string): Currently selected tab value
- `onValueChange` (function): Callback when tab changes
- `TabItem` props:
  - `value` (string): Unique tab identifier
  - `icon` (ReactNode): Icon for inactive state
  - `altIcon` (ReactNode): Icon for active state (optional)
  - `label` (string): Tab label text

**Examples**:

```tsx
// Basic tabs
const [value, setValue] = useState("wallet");

<Tabs value={value} onValueChange={setValue}>
  <TabItem value="apps" icon={<Apps />} label="Apps" />
  <TabItem value="wallet" icon={<Wallet />} label="Wallet" />
  <TabItem value="contacts" icon={<Contacts />} label="Contacts" />
  <TabItem value="worldid" icon={<WorldID />} label="World ID" />
</Tabs>

// With active/inactive icons
<Tabs value={value} onValueChange={setValue}>
  <TabItem
    value="apps"
    icon={<Apps />}
    altIcon={<Apps solid />}
    label="Apps"
  />
  <TabItem
    value="wallet"
    icon={<Wallet />}
    altIcon={<Wallet solid />}
    label="Wallet"
  />
</Tabs>

// As links
<Tabs value={value} onValueChange={setValue}>
  <a>
    <TabItem value="apps" icon={<Apps />} altIcon={<Apps solid />} label="Apps" />
  </a>
  <a>
    <TabItem value="wallet" icon={<Wallet />} altIcon={<Wallet solid />} label="Wallet" />
  </a>
</Tabs>
```

**Edge Cases**:

- `altIcon` provides different icon for active state (typically solid version)
- Can be wrapped in anchor tags for navigation
- Value must match one of the TabItem values

**Storybook Reference**: `stories/Tabs.stories.tsx`
