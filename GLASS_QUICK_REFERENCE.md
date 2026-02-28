# Glass Design System - Quick Reference Guide

## CSS Custom Properties (Available in All Components)

```css
/* Glass Background Colors */
--glass-bg-primary: rgba(255, 255, 255, 0.08);
--glass-bg-secondary: rgba(255, 255, 255, 0.05);
--glass-bg-tertiary: rgba(255, 255, 255, 0.03);
--glass-bg-hover: rgba(255, 255, 255, 0.12);

/* Glass Border Colors */
--glass-border-primary: rgba(255, 255, 255, 0.12);
--glass-border-secondary: rgba(255, 255, 255, 0.08);
--glass-border-hover: rgba(255, 255, 255, 0.18);

/* Glass Blur Amounts */
--glass-blur-sm: 10px;
--glass-blur-md: 20px;
--glass-blur-lg: 30px;

/* Text Hierarchy */
--text-primary: rgba(255, 255, 255, 1);
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.5);

/* Rounded Corners */
--radius-sm: 12px;
--radius-md: 16px;
--radius-lg: 20px;
--radius-xl: 24px;

/* Easing Curves */
--ease-out: cubic-bezier(0.23, 1, 0.320, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-subtle: cubic-bezier(0.33, 0.66, 0.66, 1);
```

## Core Glass Classes

### Primary Containers
| Class | Usage | Blur | Opacity | Use Case |
|-------|-------|------|---------|----------|
| `.admin-glass-card` | Main card containers | 20px | 8% | Dashboard cards, panels |
| `.admin-glass-lg` | Large sections | 30px | 10% | Main headers, large overlays |
| `.admin-glass-sm` | Small elements | 10px | 5% | Badges, small inputs |
| `.admin-glass-stat` | Data displays | 20px | 7% | KPI cards, metrics |

### Form Elements
| Class | Usage | Properties |
|-------|-------|-----------|
| `.admin-form-input` | Text inputs | Glass bg, orange focus |
| `.admin-form-textarea` | Multi-line inputs | Auto-resize, glass styling |
| `.admin-form-select` | Dropdowns | Custom arrow, glass styling |
| `.admin-checkbox` | Checkboxes | Custom appearance, 20px size |
| `.admin-toggle` | Toggle switches | Smooth animation, 48x28px |
| `.admin-range-input` | Sliders | Orange accent track |

### Interactive Elements
| Class | Usage | Hover Effect |
|-------|-------|--------------|
| `.admin-button-glass` | Secondary actions | Elevation, glow |
| `.admin-button-orange-glass` | Primary actions | Gradient shift, glow |
| `.admin-menu-item` | Navigation items | Background highlight |
| `.admin-dropdown-item` | Menu options | Orange background shift |
| `.admin-pagination-button` | Page controls | Background highlight |

### Data Display
| Class | Usage | Features |
|-------|-------|----------|
| `.admin-glass-table` | Table wrapper | Header styling, row hover |
| `.admin-glass-chart` | Chart containers | Border, padding, hover |
| `.admin-stat-container` | KPI grid | Auto-responsive grid |
| `.admin-table-status.*` | Status badges | Color-coded (pending, completed, etc.) |

## Status Badge Colors

```html
<!-- Pending: Yellow -->
<span class="admin-table-status pending">Pending</span>

<!-- Processing: Blue -->
<span class="admin-table-status processing">Processing</span>

<!-- Completed/Shipped: Green -->
<span class="admin-table-status completed">Completed</span>

<!-- Delivered: Bright Green -->
<span class="admin-table-status delivered">Delivered</span>

<!-- Cancelled: Red -->
<span class="admin-table-status cancelled">Cancelled</span>
```

## Component Examples

### Card Container
```html
<div class="admin-glass-card p-6">
  <h3 class="text-white text-lg font-semibold">Title</h3>
  <p class="text-white/70 text-sm">Content here</p>
</div>
```

### Form Group
```html
<div class="admin-form-group">
  <label class="admin-form-label required">Email Address</label>
  <input 
    type="email" 
    class="admin-form-input" 
    placeholder="Enter email"
  >
  <span class="admin-form-help">We'll never share your email</span>
</div>
```

### Table with Glass
```html
<table class="admin-glass-table">
  <thead>
    <tr>
      <th>Order ID</th>
      <th>Status</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr class="admin-glass-row">
      <td>#12345</td>
      <td><span class="admin-table-status completed">Completed</span></td>
      <td>$299.99</td>
    </tr>
  </tbody>
</table>
```

### Button Group
```html
<div class="admin-button-group">
  <button class="admin-button-group-item active">All</button>
  <button class="admin-button-group-item">Pending</button>
  <button class="admin-button-group-item">Completed</button>
</div>
```

### Modal Dialog
```html
<div class="admin-modal">
  <div class="admin-modal-header">
    <h2 class="admin-modal-title">Confirm Action</h2>
  </div>
  <div class="admin-modal-content">
    <p class="text-white/70">Are you sure?</p>
  </div>
  <div class="admin-modal-footer">
    <button class="admin-button-glass">Cancel</button>
    <button class="admin-button-orange-glass">Confirm</button>
  </div>
</div>
```

## Animation Classes

| Class | Effect | Duration |
|-------|--------|----------|
| `.glass-float` | Subtle up-down bobbing | 3s infinite |
| `.glass-glow` | Pulsing box-shadow | 2s infinite |
| `.admin-glass-skeleton` | Shimmer loading effect | 2s infinite |

## Color Codes Reference

```
Primary Orange:    #FF8A00
Dark Background:   #0a0a0a
Success Green:     #34C759
Warning Yellow:    #FFC107
Error Red:         #FF3B30
Info Blue:         #2196F3
```

## Responsive Breakpoints

```css
/* Large screens - Desktop */
@media (min-width: 1025px) { ... }

/* Tablet and small desktops */
@media (max-width: 1024px) {
  .admin-stat-container {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

/* Tablets */
@media (max-width: 768px) {
  .admin-form-input {
    font-size: 16px; /* Prevents iOS zoom */
  }
}

/* Mobile phones */
@media (max-width: 480px) {
  .admin-modal-content {
    max-height: 50vh;
  }
}
```

## Accessibility Best Practices

✓ Always include `aria-label` or `aria-describedby` on interactive elements
✓ Use semantic HTML (buttons, inputs, labels)
✓ Test with keyboard navigation (Tab, Enter, Escape)
✓ Ensure focus indicators are visible (auto-applied)
✓ Provide alt text for images
✓ Use color + icon/text for status badges (not color alone)
✓ Test with screen readers (NVDA, JAWS, VoiceOver)

## Performance Tips

1. **Use CSS containment** on glass elements:
   ```css
   contain: layout style paint;
   ```

2. **Limit will-change usage** to animated elements:
   ```css
   will-change: transform; /* Only for animated elements */
   ```

3. **GPU acceleration** for smooth animations:
   ```css
   transform: translateZ(0);
   backface-visibility: hidden;
   ```

4. **Respect reduced motion**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * { animation: none !important; }
   }
   ```

## Troubleshooting

### Glass effect not visible
- Check if element has `backdrop-filter` support
- Ensure background beneath is visible (not another glass element)
- Verify z-index doesn't place element behind content

### Focus ring not showing
- Check if `-webkit-focus-visible-color` is being overridden
- Ensure `outline: none` isn't applied
- Test in different browsers

### Performance issues
- Reduce number of simultaneous backdrop-filters
- Use `contain: layout style paint` on glass containers
- Consider reducing blur amount on mobile devices
- Profile with DevTools Performance tab

### Text not readable
- Increase blur amount to make background more obscured
- Use text shadow for additional contrast
- Ensure sufficient opacity in glass background
- Consider using `@media (prefers-contrast: more)` override

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| backdrop-filter | 76+ | 103+ | 12+ | 79+ |
| CSS Variables | 49+ | 31+ | 9.1+ | 15+ |
| focus-visible | 86+ | 85+ | 15+ | 86+ |
| will-change | 36+ | 36+ | 9.1+ | 15+ |

---

Last Updated: February 2026
Liquid Glass Admin Design System v1.0
