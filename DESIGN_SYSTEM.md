# Apple-Inspired Dashboard Design Guide

## Design Language Overview

### Core Principles
1. **Minimalist**: Only essential elements, plenty of white space
2. **Clean**: Clear hierarchy, professional typography
3. **Responsive**: Mobile-first, works on all devices
4. **Accessible**: High contrast, large touch targets
5. **Consistent**: Unified color palette and spacing

---

## Color System

### Primary Colors (Text & Backgrounds)
```
White (bg):        #ffffff
Gray-900 (text):   #111827
Gray-600 (desc):   #4b5563
```

### Accent Colors (Soft Pastels)
```
Blue:    #eff6ff / #0369a1 (Blue-50 / Blue-600)
Green:   #f0fdf4 / #16a34a (Green-50 / Green-600)
Orange:  #fff7ed / #ea580c (Orange-50 / Orange-600)
Purple:  #f3e8ff / #9333ea (Purple-50 / Purple-600)
Yellow:  #fefce8 / #eab308 (Yellow-50 / Yellow-400)
Red:     #fef2f2 / #dc2626 (Red-50 / Red-600)
```

### Neutral Colors
```
Gray-50:   #f9fafb (Light backgrounds)
Gray-100:  #f3f4f6 (Hover states)
Gray-200:  #e5e7eb (Borders)
Gray-300:  #d1d5db (Secondary borders)
Gray-600:  #4b5563 (Secondary text)
```

---

## Typography

### Font Stack
```
-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif
```

### Scale
```
Page Title:      32px-36px, font-semibold, tracking-tight
Card Title:      18px-20px, font-semibold
Metric Value:    24px-32px, font-semibold (tabular)
Body Text:       14px-16px, font-normal
Helper Text:     12px, font-normal, text-gray-600
Label:           12px-13px, font-medium, uppercase
```

---

## Spacing System (8px Grid)

### Standard Spacing
```
2px, 4px, 6px, 8px, 12px, 16px, 24px, 32px, 40px, 48px
```

### Component Spacing
```
Card Padding:      p-6 (24px)
Section Gap:       gap-6 (24px)
Item Gap:          gap-3 (12px)
Inner Gap:         gap-2 (8px)
```

---

## Component Library

### Primary Metric Card (AppleCard)
```
Layout:
  - Soft colored background (50 variant)
  - 24px padding
  - Border: 1px gray-200
  - rounded-2xl (16px)
  - shadow-sm (hover: shadow-md)

Content:
  - Title: text-sm text-gray-600
  - Value: text-2xl-3xl font-semibold
  - Subtitle: text-xs text-gray-600 mt-2
  - Icon: Top right, 20px, colored
  - Trend: text-xs mt-4, green/red with arrow

Mobile: Full width
Tablet: 2 columns
Desktop: 4 columns
```

### Secondary Metric Card
```
Layout:
  - Colored background (50 variant)
  - 16px padding
  - Border: 1px colored-200
  - rounded-xl (12px)

Content:
  - Icon: Top right, 16px
  - Label: text-xs uppercase text-gray-600
  - Value: text-2xl font-semibold mt-1
  - Sublabel: text-xs text-gray-600 mt-1

Mobile: Single column
Tablet: 2 columns
Desktop: 5 columns
```

### Data Cards (Order, Customer, Product)
```
Layout:
  - White background
  - 12px padding
  - Border: 1px gray-200
  - rounded-lg (8px)
  - bg-gray-50 hover:bg-white transition

Content:
  - Primary: font-medium text-sm
  - Secondary: text-xs text-gray-600
  - Action: Right-aligned, can include badge
```

### Large Info Cards
```
Layout:
  - White background
  - 24px padding
  - Border: 1px gray-200
  - rounded-2xl (16px)
  - shadow-sm

Header:
  - Title: text-lg font-semibold
  - Description: text-sm text-gray-600
  - Action button: Right side

Content:
  - Space-y-3 for list items
  - border-b border-gray-100 between items
```

---

## Button Styles

### Primary Button
```
Background: bg-gray-900
Hover: bg-gray-800
Text: text-white font-medium
Padding: px-4 py-2 (h-10)
Rounded: rounded-lg
Size: sm/base text
```

### Secondary Button
```
Background: bg-white
Border: border border-gray-300
Text: text-gray-700 font-medium
Hover: bg-gray-50
Rounded: rounded-lg
```

### Ghost Button (Link-style)
```
Background: transparent
Text: text-blue-600
Hover: bg-blue-50
Rounded: rounded-lg
```

---

## Status Badges

### Colors by Status
```
Pending:    bg-yellow-100 text-yellow-800
Processing: bg-blue-100 text-blue-800
Shipped:    bg-purple-100 text-purple-800
Delivered:  bg-green-100 text-green-800
Cancelled:  bg-red-100 text-red-800
Refunded:   bg-gray-100 text-gray-800
Premium:    bg-yellow-100 text-yellow-800
```

### Styling
```
Padding: px-2 py-1 / px-3 py-1
Rounded: rounded-lg
Text: text-xs font-medium / font-semibold
Border: border-0 (no border)
```

---

## Progress Indicators

### Progress Bar
```
Height: h-2
Background: bg-gray-200
Fill: bg-colored (blue/green/yellow)
Rounded: rounded-full
```

### Trend Indicator
```
Icon: Arrow up/down 3px or 4px
Color: Green (#16a34a) or Red (#dc2626)
Text: text-xs font-medium
Container: px-2 py-1 rounded-lg
Background: Green-100 / Red-100
```

### Star/Rating Display
```
Width: w-2
Height: h-2
Gap: gap-0.5
Filled: bg-yellow-400
Empty: bg-gray-300
```

---

## Layout Grid System

### Mobile (< 640px)
```
1 column layout
Padding: p-4 (16px sides)
Gap: gap-4-6
Full width cards
```

### Tablet (640px - 1024px)
```
2 columns for primary cards
Padding: p-6 (24px sides)
Gap: gap-6
2-column secondary metrics
```

### Desktop (1024px+)
```
4 columns for primary cards
5 columns for secondary metrics
2-3 columns for data sections
Padding: p-8 (32px sides)
Max-width: max-w-7xl (1280px)
Gap: gap-6-8
```

---

## Interactive States

### Hover
```
Card: shadow-sm → shadow-md
Button: opacity/color shift
Link: underline/color change
```

### Focus
```
Outline: ring-2 ring-blue-500
Offset: ring-offset-2
```

### Active
```
Background: darker shade
Scale: hover:scale-105 (optional on cards)
```

### Disabled
```
Opacity: opacity-50
Cursor: cursor-not-allowed
Color: text-gray-400
```

---

## Loading & Error States

### Loading State
```
Display: Spinner icon + text
Background: White
Message: "Loading dashboard data..."
Centered in container
```

### Error State
```
Alert: Alert component
Border: border-red-200
Background: bg-red-50
Icon: AlertCircle text-red-600
Text: text-red-800 text-sm
Rounded: rounded-lg
```

### Empty State
```
Icon: Centered
Message: Descriptive text
Action: Optional button
Gray tones throughout
```

---

## Responsive Behavior

### Cards
```
Mobile:  100% width, gap-4
Tablet:  grid-cols-2, gap-6
Desktop: grid-cols-4 (primary), grid-cols-5 (secondary)
```

### Text
```
Heading: text-2xl → text-3xl → text-4xl
Value:   text-2xl → text-3xl
Label:   text-sm consistent
Helper:  text-xs consistent
```

### Buttons
```
Mobile:  Icon only (label hidden)
Tablet:  Icon + Label
Desktop: Icon + Label
```

### Spacing
```
Mobile:  p-4, gap-4
Tablet:  p-6, gap-6
Desktop: p-8, gap-8
```

---

## Accessibility Features

### Color Contrast
```
Text on White:       WCAG AAA (7:1+)
Text on Colored BG:  WCAG AA minimum (4.5:1)
Border on White:     WCAG AA minimum
```

### Touch Targets
```
Minimum: 44px × 44px
Recommended: 48px × 48px
Spacing: 8px minimum between targets
```

### Semantic HTML
```
<header> for top section
<main> for content
<section> for major sections
<article> for cards
<button> for all clickable elements
ARIA labels where needed
```

---

## Dark Mode Consideration (Future)

While currently white-theme only, future dark mode should use:
```
Background: #0f172a / #1a1a1a
Text:       #f8fafc / #e4e4e7
Cards:      #1e293b / #2a2a2a
Borders:    #334155 / #3f3f46
Accents:    Lighter variants of current colors
```

---

## Animation Guidelines

### Transitions
```
Default:    transition-all duration-300
Subtle:     transition-shadow duration-200
Quick:      duration-150
Slow:       duration-500
```

### Motion Principles
- Reduced motion: Respect prefers-reduced-motion
- Purpose: Only for interaction feedback
- Subtle: Avoid excessive animations
- Performance: Use transform/opacity only

---

## Final Notes

This design system ensures:
- ✅ Professional Apple-inspired aesthetic
- ✅ Consistent mobile responsiveness
- ✅ Accessible for all users
- ✅ Scalable component system
- ✅ Clean, maintainable CSS
- ✅ Future-proof architecture
