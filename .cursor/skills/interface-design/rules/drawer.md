---
title: Drawer Component
category: overlays-dialogs
tags: drawer, modal, bottom-sheet, vaul, mobile
---

## Drawer

A drawer component that slides up from the bottom of the screen. Built on top of Vaul and Radix UI Dialog. Use for mobile-friendly modals, bottom sheets, or slide-up content.

**Key Components**:

- `Drawer`: Root component
- `DrawerTrigger`: Button/element that opens the drawer
- `DrawerContent`: Main content container
- `DrawerHeader`: Header section
- `DrawerTitle`: Title text
- `DrawerClose`: Element that closes drawer on click
- `DrawerHeader`: Optional header with icon support

**Key Props**:

- `height` ("default" | "full"): Drawer height
- `repositionInputs` (boolean): Repositions inputs when keyboard appears (mobile)

**Examples**:

```tsx
// Basic drawer
<Drawer>
  <DrawerTrigger asChild>
    <Button variant="secondary" size="sm">Open</Button>
  </DrawerTrigger>
  <DrawerContent className="p-6">
    <DrawerHeader>
      <DrawerTitle>Drawer title</DrawerTitle>
    </DrawerHeader>
    <Typography>Drawer content</Typography>
    <DrawerClose>
      <Button>Close</Button>
    </DrawerClose>
  </DrawerContent>
</Drawer>

// Full page drawer
<Drawer height="full">
  <DrawerTrigger asChild>
    <Button>Open Full Drawer</Button>
  </DrawerTrigger>
  <DrawerContent className="p-6">
    <DrawerHeader>
      <DrawerTitle>Full Page Drawer</DrawerTitle>
    </DrawerHeader>
    <div className="flex-grow overflow-auto">
      {/* Scrollable content */}
    </div>
    <DrawerClose>
      <Button>Close</Button>
    </DrawerClose>
  </DrawerContent>
</Drawer>

// With inputs (mobile keyboard handling)
<Drawer height="full" repositionInputs>
  <DrawerTrigger asChild>
    <Button>Open</Button>
  </DrawerTrigger>
  <DrawerContent className="p-6">
    <Input label="Name" />
    <Button fullWidth>Submit</Button>
  </DrawerContent>
</Drawer>
```

**Edge Cases**:

- Use `asChild` on DrawerTrigger to use custom trigger elements
- `repositionInputs` helps with mobile keyboard issues
- Full height drawers need scrollable content areas
- Any element wrapped in `DrawerClose` will close the drawer on click

**Storybook Reference**: `stories/Drawer.stories.tsx`
