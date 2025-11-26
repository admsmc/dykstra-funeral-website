# @dykstra/ui

Dykstra Funeral Home Design System - A comprehensive React component library built with Radix UI, Tailwind CSS v4, and TypeScript.

## Features

- 🎨 **Dykstra Brand Colors** - Navy, Sage, Cream, Gold, Charcoal
- ♿ **Accessible** - Built on Radix UI primitives with WCAG 2.2 AA compliance
- 🎭 **Variants** - CVA (class-variance-authority) for type-safe component variants
- 🎬 **Animations** - Framer Motion for smooth interactions
- 📱 **Responsive** - Mobile-first design with breakpoints
- 🔧 **TypeScript** - Full type safety
- 📚 **Storybook** - Interactive component documentation

## Installation

```bash
npm install @dykstra/ui
```

### Peer Dependencies

```bash
npm install react react-dom
```

### Optional (for Stripe integration)

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## Quick Start

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@dykstra/ui';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="primary">Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### Primitives

#### Button
```tsx
<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```
- **Variants**: primary, secondary, ghost, danger
- **Sizes**: sm, md, lg
- **States**: loading, disabled
- **Animation**: Framer Motion press effect

#### Card
```tsx
<Card variant="default">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```
- **Variants**: default, bordered, elevated

### Form Components

#### Input
```tsx
<Input type="text" placeholder="Enter text" variant="default" />
```

#### Textarea
```tsx
<Textarea autoResize placeholder="Enter text" />
```

#### Select (Radix UI)
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox (Radix UI)
```tsx
<Checkbox id="terms" />
<label htmlFor="terms">I agree</label>
```

#### RadioGroup (Radix UI)
```tsx
<RadioGroup defaultValue="1">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="1" id="r1" />
    <label htmlFor="r1">Option 1</label>
  </div>
</RadioGroup>
```

#### Switch (Radix UI)
```tsx
<Switch id="notifications" />
<label htmlFor="notifications">Enable notifications</label>
```

#### FormField
```tsx
<FormField
  label="Email"
  htmlFor="email"
  error="Invalid email"
  required
>
  <Input id="email" type="email" />
</FormField>
```

### Feedback

#### Modal (Radix Dialog)
```tsx
<Modal>
  <ModalTrigger asChild>
    <Button>Open</Button>
  </ModalTrigger>
  <ModalContent size="md">
    <ModalHeader>
      <ModalTitle>Title</ModalTitle>
      <ModalDescription>Description</ModalDescription>
    </ModalHeader>
    <ModalBody>Content</ModalBody>
    <ModalFooter>
      <Button>Close</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```
- **Sizes**: sm, md, lg, xl, full

#### Toast (Radix Toast)
```tsx
// 1. Wrap app with ToastContextProvider
<ToastContextProvider>
  <App />
</ToastContextProvider>

// 2. Use the hook
const { toast } = useToast();

toast({
  title: 'Success',
  description: 'Operation completed',
  variant: 'success',
  duration: 5000,
});
```
- **Variants**: info, success, warning, error

### Display

#### Avatar (Radix Avatar)
```tsx
<Avatar
  src="/image.jpg"
  fallback="John Doe"
  status="online"
  size="md"
/>
```
- **Sizes**: xs, sm, md, lg, xl
- **Status**: online, offline, away
- **Auto-generates initials** from fallback text

#### Timeline
```tsx
<Timeline>
  <TimelineEvent
    eventType="created"
    timestamp={new Date()}
    title="Case Created"
    description="John Doe created the case"
  />
  <TimelineEvent
    eventType="payment"
    timestamp={new Date()}
    title="Payment Received"
    isLast
  />
</Timeline>
```
- **Event Types**: created, updated, deleted, signed, payment, upload, message, user
- **Status Colors**: default, success, warning, error, info

### Specialized

#### FileUpload
```tsx
const [files, setFiles] = useState<FileWithPreview[]>([]);

<FileUpload
  files={files}
  onFilesSelected={setFiles}
  onRemove={(index) => setFiles(prev => prev.filter((_, i) => i !== index))}
  maxFiles={10}
  maxSize={10 * 1024 * 1024}
  accept="image/*"
/>
```
- Drag-and-drop support
- Image previews
- Progress bars
- File validation

#### SignaturePad
```tsx
const [signature, setSignature] = useState<string | null>(null);

<SignaturePad
  onChange={setSignature}
  width={600}
  height={200}
  penColor="#1e3a5f"
/>
```
- Canvas-based drawing
- Touch and mouse support
- Base64 PNG export
- High DPI support

#### PaymentForm (Stripe Elements)
```tsx
<PaymentForm onSubmit={handlePayment} loading={loading}>
  <FormField label="Card Details" required>
    <PaymentCardContainer>
      <CardElement options={stripeCardElementOptions} />
    </PaymentCardContainer>
  </FormField>
  <Button type="submit" loading={loading}>Pay Now</Button>
</PaymentForm>
```

### Layout

#### Stack
```tsx
<Stack spacing="md" align="center">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```
- **Spacing**: none, xs, sm, md, lg, xl
- **Align**: start, center, end, stretch

#### Grid
```tsx
<Grid cols={3} gap="md">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</Grid>
```
- **Cols**: 1, 2, 3, 4, 6, 12 (responsive)
- **Gap**: none, xs, sm, md, lg, xl

#### Panel
```tsx
<Panel
  header={<PanelHeader title="Title" actions={<Button>Edit</Button>} />}
  footer={<Button>Save</Button>}
  padding="md"
>
  Content
</Panel>
```

#### PageShell
```tsx
<PageShell
  title="Dashboard"
  description="Welcome back"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard' }
  ]}
  actions={<Button>New Case</Button>}
  maxWidth="xl"
>
  Page content
</PageShell>
```

## Design Tokens

### Colors
```ts
import { colors } from '@dykstra/ui';

colors.navy      // #1e3a5f - Primary brand
colors.sage      // #8b9d83 - Secondary accent
colors.cream     // #f5f3ed - Alternate backgrounds
colors.gold      // #b8956a - Premium accents
colors.charcoal  // #2c3539 - Footer, dark contrasts
```

### Typography
```ts
import { typography } from '@dykstra/ui';

typography.fontFamily.serif // Playfair Display
typography.fontFamily.sans  // Inter
```

### Spacing, Shadows, Transitions
```ts
import { spacing, shadows, transitions } from '@dykstra/ui';
```

## Utilities

### cn() - Class Name Utility
```tsx
import { cn } from '@dykstra/ui';

<div className={cn('base-class', isActive && 'active-class')} />
```
Combines `clsx` and `tailwind-merge` for optimal class management.

## Storybook

Run Storybook to view all components interactively:

```bash
cd packages/ui
npm run storybook
```

Visit `http://localhost:6006`

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npm run typecheck
```

## Architecture

- **Radix UI** - Accessible component primitives
- **Tailwind CSS v4** - Utility-first styling with `@theme inline`
- **CVA** - Type-safe variant management
- **Framer Motion** - Animation library
- **TypeScript** - Full type safety
- **Storybook 8** - Component documentation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

When adding new components:

1. Create component in `src/components/`
2. Export from `src/index.ts`
3. Create Storybook story in `src/components/*.stories.tsx`
4. Use Dykstra brand colors and design tokens
5. Follow Radix UI patterns for accessibility
6. Add TypeScript types for all props

## License

Private - Dykstra Funeral Home
