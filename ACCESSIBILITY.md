# Accessibility Checklist & Testing Guide

This document provides a comprehensive checklist for ensuring WCAG 2.1 Level AA compliance for the Dykstra Funeral Home Family Portal.

## Quick Reference

**Current Status**: ✅ Foundation Complete  
**WCAG Level**: AA (Target)  
**Last Audit**: Not yet performed  
**Tools Used**: axe DevTools, WAVE, Lighthouse

---

## 1. Color Contrast (WCAG 2.1.1)

### Design System Colors

| Color | Hex | Usage | Tested Against |
|-------|-----|-------|----------------|
| Navy | `#1e3a5f` | Primary, headings, CTA | White backgrounds ✅ |
| Sage | `#8b9d83` | Secondary, accents | White backgrounds ⚠️ |
| Cream | `#f5f3ed` | Alt backgrounds | Dark text ✅ |
| Gold | `#b8956a` | Premium accents | White backgrounds ⚠️ |
| Charcoal | `#2c3539` | Footer, dark text | Light backgrounds ✅ |

### Requirements

- **Body text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+): Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio
- **Focus indicators**: Minimum 3:1 contrast ratio

### Testing Checklist

- [ ] Run WebAIM Contrast Checker on all color combinations
- [ ] Test navy text on white: ✅ Expected 8.5:1
- [ ] Test sage text on white: ⚠️ May need darkening (currently ~4.2:1)
- [ ] Test gold text on white: ⚠️ May need darkening
- [ ] Test white text on navy: ✅ Expected 8.5:1
- [ ] Test focus ring colors against all backgrounds
- [ ] Verify button text contrast in all states (hover, active, disabled)

### Recommendations

If sage or gold fail contrast tests for text:
```css
/* Darken sage for better contrast */
--sage-dark: #6b7d63; /* Use for text on light backgrounds */

/* Darken gold for better contrast */
--gold-dark: #987646; /* Use for text on light backgrounds */
```

---

## 2. Focus Indicators (WCAG 2.4.7)

### Current Implementation

All interactive elements have focus indicators via Tailwind:
```css
focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
```

### Testing Checklist

- [ ] Tab through entire application
- [ ] Verify focus ring visible on ALL interactive elements:
  - [ ] Links
  - [ ] Buttons
  - [ ] Form inputs
  - [ ] Select dropdowns
  - [ ] Radio buttons
  - [ ] Checkboxes
  - [ ] Custom components (Timeline, Toast)
- [ ] Test focus visibility on different backgrounds
- [ ] Verify focus indicator is 2px minimum
- [ ] Test with browser zoom at 200%

### Known Issues

None currently identified. Components use `focus-visible:` for keyboard-only focus.

---

## 3. ARIA Labels & Semantic HTML (WCAG 4.1.2)

### Implemented

✅ **ValidatedInput components** - Full ARIA support:
- `aria-invalid` for error states
- `aria-describedby` for error messages and hints
- `role="alert"` on error messages

✅ **Progress components** - ARIA progress indicators:
- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` for context

✅ **Timeline component** - Semantic navigation:
- `<nav aria-label="Progress">`
- `aria-current="step"` for current step

### Testing Checklist

- [ ] Audit all icon-only buttons (must have aria-label or sr-only text)
- [ ] Check navigation landmarks (header, nav, main, footer, aside)
- [ ] Verify form labels associated with inputs
- [ ] Test custom controls announce correctly
- [ ] Verify live regions for dynamic content (toasts, notifications)

### Icon Buttons to Audit

Search codebase for:
- `<button>` with only icon children
- `<a>` with only icon children
- Custom interactive components without labels

**Action**: Add `aria-label="Description"` to all icon-only interactive elements.

---

## 4. Heading Hierarchy (WCAG 1.3.1)

### Rules

1. Each page has exactly ONE `<h1>`
2. Headings follow logical order (h1 → h2 → h3, no skips)
3. Headings describe content structure, not styling

### Page Audit

#### Dashboard (`/portal/dashboard`)
- [ ] One h1: "Dashboard" or "Welcome"
- [ ] h2 for sections (Recent Cases, Quick Actions)
- [ ] No skipped levels

#### Case Details (`/portal/cases/[id]`)
- [ ] One h1: Deceased name
- [ ] h2 for sections (Service Details, Timeline, Quick Actions)
- [ ] No skipped levels

#### Payments (`/portal/cases/[id]/payments`)
- [ ] One h1: "Payments"
- [ ] h2 for sections (Balance, History, Methods)
- [ ] h3 for subsections if needed
- [ ] No skipped levels

#### Profile (`/portal/profile`)
- [ ] One h1: "Profile Settings"
- [ ] h2 for tabs (Personal Information, Notifications)
- [ ] No skipped levels

#### Memorial (`/portal/memorials/[id]/photos`)
- [ ] One h1: "Photo Gallery"
- [ ] h2 for sections (Upload, Gallery)
- [ ] No skipped levels

### Common Issues to Fix

- Multiple h1 tags on same page
- Skipping from h1 to h3 (missing h2)
- Using headings for styling instead of structure

---

## 5. Form Labels (WCAG 3.3.2)

### Current Implementation

✅ **ValidatedInput components** use proper `htmlFor` association
✅ **Required fields** marked with asterisk and aria-required
✅ **Error messages** associated via `aria-describedby`

### Testing Checklist

- [ ] All text inputs have visible labels
- [ ] All labels associated with inputs (click label focuses input)
- [ ] Radio button groups have fieldset + legend
- [ ] Checkbox groups have fieldset + legend
- [ ] Select dropdowns have labels
- [ ] Required fields indicated (visually and to screen readers)
- [ ] Error messages announced by screen readers

### Pages to Audit

- [ ] Profile page (personal info form)
- [ ] Payment page (all payment method forms)
- [ ] Arrangements page (service selection, products)
- [ ] Photo upload page (caption field)
- [ ] Contact forms (if any)

---

## 6. Keyboard Navigation (WCAG 2.1.1)

### Requirements

- All functionality available via keyboard
- Logical tab order
- No keyboard traps
- Escape closes modals/dropdowns
- Enter/Space activates buttons
- Arrow keys navigate custom controls

### Testing Checklist

- [ ] Tab through entire application
- [ ] Verify tab order is logical (top to bottom, left to right)
- [ ] Test all interactive elements reachable
- [ ] Escape closes modals ⚠️ (modals not yet implemented)
- [ ] Enter submits forms
- [ ] Space toggles checkboxes
- [ ] Arrow keys work in:
  - [ ] Radio button groups
  - [ ] Select dropdowns
  - [ ] Custom timeline/progress components (if interactive)

### Known Issues

- Mobile menu keyboard navigation (needs testing)
- Custom file upload component keyboard support
- Payment flow multi-step keyboard navigation

---

## 7. Screen Reader Testing (WCAG 4.1.3)

### Test with VoiceOver (Mac)

**Enable**: System Preferences → Accessibility → VoiceOver (Cmd+F5)

#### Test Pages

**Dashboard**
- [ ] Page title announced
- [ ] Landmark regions identified (navigation, main, aside, footer)
- [ ] Case cards announced with all info
- [ ] Links announce destination

**Forms**
- [ ] Form labels announced
- [ ] Error messages announced when validation fails
- [ ] Required fields identified
- [ ] Field hints read aloud
- [ ] Success/error toasts announced (live region)

**Timeline**
- [ ] Progress steps announced
- [ ] Current step identified
- [ ] Completed vs upcoming steps distinguished

**Photo Upload**
- [ ] Drag-drop zone has accessible alternative
- [ ] File input accessible
- [ ] Upload progress announced
- [ ] Success/error announced

### Test with NVDA (Windows)

Same test checklist as VoiceOver.

### Common Issues to Fix

- Missing alt text on images
- Empty links/buttons
- Form errors not in live regions
- Tables without headers
- Unlabeled icons

---

## 8. Reduced Motion (WCAG 2.3.3)

### Current Implementation

✅ **Global CSS** respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Testing Checklist

- [ ] Enable reduced motion: System Preferences → Accessibility → Display → Reduce motion
- [ ] Test all animated components:
  - [ ] Page transitions
  - [ ] Toast notifications (fade in/out)
  - [ ] Loading spinners (still visible but minimal motion)
  - [ ] Progress indicators (no smooth transitions)
  - [ ] Hover effects (instant, no transition)
  - [ ] Timeline animations

### Expected Behavior

- Animations still happen but nearly instantaneously
- No smooth scrolling
- No parallax effects
- Loading indicators still visible (essential feedback)

---

## 9. Focus Management

### Requirements

- Focus trap in modals
- Return focus after modal close
- Set focus to first input on form pages
- Manage focus after route changes

### Implementation Needed

⚠️ **No modals currently implemented**

When implementing modals:
```typescript
import FocusTrap from 'focus-trap-react';

<FocusTrap>
  <div role="dialog" aria-modal="true">
    {/* Modal content */}
  </div>
</FocusTrap>
```

### Testing Checklist

- [ ] When modal opens, focus moves to modal
- [ ] Tab stays within modal (doesn't reach page behind)
- [ ] Escape closes modal and returns focus to trigger
- [ ] After form submission, focus moves to success message
- [ ] After navigation, focus moves to main content

---

## 10. Mobile Touch Targets (WCAG 2.5.5)

### Requirement

Minimum **44x44 CSS pixels** for all touch targets.

### Testing Checklist

Test on iPhone SE (375px) or Android (360px):

- [ ] All buttons ≥ 44x44px
- [ ] All links ≥ 44x44px
- [ ] Navigation items ≥ 44x44px
- [ ] Form inputs ≥ 44px height
- [ ] Icon buttons ≥ 44x44px
- [ ] Checkbox/radio touch areas ≥ 44x44px

### Common Issues

- Small icon buttons (32x32px)
- Tight spacing between interactive elements
- Small text links in paragraphs

### Fixes

```css
/* Increase button padding on mobile */
@media (max-width: 768px) {
  button, a.button {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 16px;
  }
}
```

---

## Testing Tools

### Browser Extensions

1. **axe DevTools** (Chrome/Firefox)
   - Install: https://www.deque.com/axe/devtools/
   - Run on every page
   - Fix all Critical and Serious issues

2. **WAVE** (Chrome/Firefox)
   - Install: https://wave.webaim.org/extension/
   - Visual overlay shows accessibility issues
   - Check for missing alt text, poor contrast

3. **Lighthouse** (Chrome built-in)
   - DevTools → Lighthouse tab
   - Run Accessibility audit
   - Aim for 90+ score

### Online Tools

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Oracle**: Simulate color blindness
- **tota11y**: Visual accessibility toolkit

### Manual Testing Checklist

- [ ] Test with keyboard only (unplug mouse)
- [ ] Test with VoiceOver/NVDA
- [ ] Test with 200% browser zoom
- [ ] Test with Windows High Contrast mode
- [ ] Test with browser extensions disabled (ensure graceful degradation)

---

## Compliance Checklist

### WCAG 2.1 Level AA

- [ ] **1.1.1** - Non-text Content (alt text)
- [ ] **1.3.1** - Info and Relationships (semantic HTML, headings)
- [ ] **1.3.2** - Meaningful Sequence (logical tab order)
- [ ] **1.4.3** - Contrast (Minimum) (4.5:1 text, 3:1 UI)
- [ ] **1.4.11** - Non-text Contrast (3:1 for UI components)
- [ ] **2.1.1** - Keyboard (all functionality available)
- [ ] **2.1.2** - No Keyboard Trap
- [ ] **2.4.3** - Focus Order (logical tab order)
- [ ] **2.4.7** - Focus Visible (visible focus indicators)
- [ ] **2.5.5** - Target Size (44x44px minimum)
- [ ] **3.2.4** - Consistent Identification
- [ ] **3.3.1** - Error Identification
- [ ] **3.3.2** - Labels or Instructions
- [ ] **4.1.2** - Name, Role, Value (ARIA)
- [ ] **4.1.3** - Status Messages (live regions)

---

## Next Steps

1. **Run axe DevTools** on all pages
2. **Fix Critical issues** (contrast, missing labels)
3. **Test keyboard navigation** on every page
4. **Test with screen reader** (at least 3 pages)
5. **Audit color contrast** and adjust if needed
6. **Document remaining issues** in GitHub/Jira

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Articles](https://webaim.org/articles/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
