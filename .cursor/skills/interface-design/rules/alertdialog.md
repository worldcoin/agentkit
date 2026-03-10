---
title: AlertDialog Component
category: overlays-dialogs
tags: dialog, modal, alert, confirmation, vaul
---

## AlertDialog

A modal dialog that interrupts the user with important content and expects a response. Built on top of Vaul and Radix UI Dialog. Use for confirmations, warnings, or critical information.

**Key Components**:

- `AlertDialog`: Root component
- `AlertDialogTrigger`: Button/element that opens the dialog
- `AlertDialogContent`: Main content container
- `AlertDialogHeader`: Header section (supports icon prop)
- `AlertDialogTitle`: Title text
- `AlertDialogDescription`: Description/body text
- `AlertDialogFooter`: Footer with action buttons
- `AlertDialogClose`: Element that closes dialog
- `AlertDialogPortal`: Portal for rendering (optional)

**Key Props**:

- `dismissible` (boolean): Whether the dialog can be dismissed (default: true)

**Examples**:

```tsx
// Basic alert dialog
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="secondary" size="sm">
      Open Alert Dialog
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogDescription>
      This action cannot be undone. This will permanently delete your account.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogClose asChild>
        <Button variant="secondary">Cancel</Button>
      </AlertDialogClose>
      <Button>Continue</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// With icon
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader icon={<CircleSpark />}>
      <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogDescription>
      This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogClose asChild>
        <Button variant="secondary">Cancel</Button>
      </AlertDialogClose>
      <Button>Delete</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// With long scrollable content
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Terms and Conditions</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogDescription>
      {/* Long scrollable content */}
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogClose asChild>
        <Button variant="secondary">Decline</Button>
      </AlertDialogClose>
      <Button>Accept</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Edge Cases**:

- Use `asChild` on trigger and close elements
- Header supports icon prop for custom styling
- Description area is scrollable for long content
- Footer typically contains action buttons

**Storybook Reference**: `stories/AlertDialog.stories.tsx`
