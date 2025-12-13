# Navy Blue Theme Design System for InfoShop POS

This guide documents the implementation of the navy blue color scheme design system for the InfoShop restaurant POS application.

## Overview

The navy blue theme provides a professional, modern appearance with excellent contrast and readability for restaurant management operations. The design system includes:

- Consistent color palette for all UI components
- Restaurant-specific status colors for tables, orders, and kitchen operations
- Dark mode support with optimized contrast ratios
- Accessibility compliance with WCAG AA standards
- Material-UI theme integration
- Tailwind CSS custom properties

## Color Palette

### Primary Navy Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Navy | `#1e3a5f` | Main navigation, primary buttons, headers |
| Primary Light | `#2c5282` | Hover states, active elements |
| Accent Blue | `#3182ce` | Secondary actions, highlights |
| Background | `#f8fafc` | Main application background |
| Surface | `#ffffff` | Cards, modals, dropdowns |
| Text Primary | `#1a202c` | Primary text content |
| Text Secondary | `#4a5568` | Secondary text, captions |

### Restaurant Status Colors

#### Table Statuses
| Status | Color | Hex | Meaning |
|--------|-------|-----|---------|
| Available | Green | `#10b981` | Table is free for seating |
| Occupied | Red | `#ef4444` | Table currently in use |
| Reserved | Amber | `#f59e0b` | Table reserved for future time |
| Cleaning | Gray | `#6b7280` | Table being cleaned/reset |

#### Order Statuses
| Status | Color | Hex | Meaning |
|--------|-------|-----|---------|
| Pending | Amber | `#f59e0b` | Order received but not started |
| Preparing | Blue | `#3b82f6` | Order being prepared by kitchen |
| Ready | Green | `#10b981` | Order ready for serving |
| Served | Gray | `#6b7280` | Order delivered to customer |

#### Kitchen Queue Statuses
| Status | Color | Hex | Meaning |
|--------|-------|-----|---------|
| New | Amber | `#f59e0b` | New kitchen order |
| In Progress | Blue | `#3b82f6` | Currently being prepared |
| Completed | Green | `#10b981` | Preparation complete |
| Cancelled | Red | `#ef4444` | Order cancelled |

## Implementation Files

### 1. Tailwind Configuration (`tailwind.config.js`)

Updated with custom navy color palette and restaurant status colors:

```javascript
colors: {
  navy: {
    primary: '#1e3a5f',
    primary-light: '#2c5282',
    accent: '#3182ce',
    bg-primary: '#f8fafc',
    surface: '#ffffff',
    text-primary: '#1a202c',
    text-secondary: '#4a5568',
    // Restaurant status colors...
  }
}
```

### 2. CSS Custom Properties (`resources/css/app.css`)

Added comprehensive CSS custom properties for both light and dark themes:

```css
:root {
  --primary: #1e3a5f;
  --background: #f8fafc;
  --text-primary: #1a202c;
  /* ... other colors */
}

.dark {
  --primary: #2c5282;
  --background: #0f172a;
  --text-primary: #f8fafc;
  /* ... other dark mode colors */
}
```

### 3. Material-UI Theme (`resources/js/lib/theme.js`)

Created comprehensive Material-UI theme configuration with:

- Custom color palette
- Component style overrides
- Restaurant status color variants
- Dark mode support
- Typography settings

### 4. Status Color Mapping (`resources/js/lib/statusColors.js`)

Utility functions for consistent status color usage:

```javascript
import { getTableStatusColor, getOrderStatusColor } from './lib/statusColors';

// Get color for table status
const tableColor = getTableStatusColor('available'); // Returns '#10b981'

// Get Material-UI variant for chip
const variant = getOrderStatusMuiVariant('preparing'); // Returns 'orderPreparing'
```

### 5. Theme Provider (`resources/js/Components/ThemeProvider.jsx`)

React context provider for theme management:

- Theme switching between light and dark modes
- Dynamic brand color updates
- System preference detection
- LocalStorage persistence

### 6. Accessibility Testing (`resources/js/lib/accessibility.js`)

Comprehensive accessibility utilities:

- WCAG contrast ratio calculations
- Automated testing for all color combinations
- Suggested text color recommendations
- Accessibility reporting

## Usage Examples

### Using Tailwind Classes

```jsx
// Primary button with navy theme
<button className="bg-navy-primary hover:bg-navy-primary-light text-white px-4 py-2 rounded">
  Save
</button>

// Table status indicator
<div className="w-4 h-4 rounded-full bg-navy-table-available"></div>
```

### Using Material-UI Components

```jsx
import { Chip } from '@mui/material';

// Restaurant table status chip
<Chip 
  label="Available" 
  variant="tableAvailable" 
  size="small" 
/>

// Using theme colors
<Box 
  sx={{ 
    backgroundColor: 'primary.main',
    color: 'primary.contrastText' 
  }}
>
  Navy Blue Content
</Box>
```

### Using Status Color Utilities

```jsx
import { 
  getTableStatusColor, 
  getTableStatusLabel,
  getOrderStatusColor 
} from '../lib/statusColors';

// Dynamic status styling
const tableStatusColor = getTableStatusColor(table.status);
const orderStatusColor = getOrderStatusColor(order.status);

<div style={{ backgroundColor: tableStatusColor }}>
  {getTableStatusLabel(table.status)}
</div>
```

## Dark Mode

The navy blue theme includes comprehensive dark mode support:

- Darker backgrounds with navy accents
- Lighter status colors for better visibility
- Optimized contrast ratios
- Automatic system preference detection
- Manual theme toggle capability

## Accessibility Compliance

All color combinations have been tested for WCAG AA compliance:

- Normal text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3.0:1 contrast ratio
- Interactive elements: Minimum 3.0:1 contrast ratio

The accessibility testing utilities can be used to verify compliance:

```javascript
import { generateAccessibilityReport } from '../lib/accessibility';

// Generate accessibility report
const report = generateAccessibilityReport(false); // Light mode
console.log(report.compliance); // "WCAG AA Compliant"
```

## Integration with Existing Components

The theme system is designed to integrate seamlessly with existing components:

1. **ThemeProvider** wraps the entire application in `app.jsx`
2. **AuthenticatedLayout** uses theme context for dynamic colors
3. **Brand settings** can override default colors through the theme provider
4. **Existing components** will automatically inherit the new theme

## Customization

The theme system supports customization:

1. **Brand Colors**: Update through brand settings in the database
2. **Component Overrides**: Extend theme in `theme.js`
3. **Custom Status Colors**: Add new status mappings in `statusColors.js`
4. **Additional CSS Properties**: Extend in `app.css`

## Migration Notes

When migrating existing components to use the new theme:

1. Replace hardcoded colors with theme variables
2. Use status color utilities for restaurant-specific colors
3. Test contrast ratios for any custom color combinations
4. Ensure dark mode compatibility for new components

## Future Enhancements

Potential improvements to the theme system:

1. **Colorblind-friendly palette variants**
2. **High contrast mode support**
3. **Custom theme builder interface**
4. **Animated theme transitions**
5. **Brand color preview in settings**