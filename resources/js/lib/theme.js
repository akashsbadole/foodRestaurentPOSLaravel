import { createTheme } from '@mui/material/styles';

// Get default theme to preserve shadows and other default values
const defaultTheme = createTheme();

// Enhanced Navy Blue Color Palette - Modern & WCAG AA Compliant
const navyPalette = {
  primary: {
    main: '#1e3a5f',      // Deep navy blue
    light: '#2c5282',     // Lighter navy for hover states
    dark: '#172a45',      // Darker navy
    contrastText: '#ffffff', // High contrast white text
    // Enhanced gradient support
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
    gradientLight: 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
  },
  secondary: {
    main: '#2563eb',      // Brighter blue for actions (improved contrast)
    light: '#3b82f6',     // Lighter accent blue
    dark: '#1d4ed8',      // Darker accent blue
    contrastText: '#ffffff', // High contrast white text
    // Enhanced gradient support
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  },
  background: {
    default: '#f8fafc',    // Light grayish blue background
    paper: '#ffffff',      // Clean white for cards
    // Enhanced backgrounds with subtle gradients
    defaultGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    paperGradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  },
  text: {
    primary: '#1e293b',    // Dark blue-gray (improved contrast)
    secondary: '#475569',  // Medium blue-gray (improved contrast)
    // Enhanced text colors for better hierarchy
    hint: '#94a3b8',      // Subtle hint text
    disabled: '#cbd5e1',   // Disabled text
  },
  // Restaurant Status Colors
  restaurant: {
    // Table Statuses
    tableAvailable: '#10b981',    // Green
    tableOccupied: '#ef4444',     // Red
    tableReserved: '#f59e0b',     // Amber
    tableCleaning: '#6b7280',     // Gray
    
    // Order Statuses
    orderPending: '#f59e0b',      // Amber
    orderPreparing: '#3b82f6',    // Blue
    orderReady: '#10b981',        // Green
    orderServed: '#6b7280',       // Gray
    
    // Kitchen Queue Statuses
    kitchenNew: '#f59e0b',        // Amber
    kitchenInProgress: '#3b82f6', // Blue
    kitchenCompleted: '#10b981',   // Green
    kitchenCancelled: '#ef4444',  // Red
  },
  // Status Colors - WCAG AA Compliant
  success: {
    main: '#059669',      // Darker green for better contrast
    contrastText: '#ffffff',
  },
  warning: {
    main: '#d97706',      // Darker amber for better contrast
    contrastText: '#ffffff',
  },
  error: {
    main: '#dc2626',      // Darker red for better contrast
    contrastText: '#ffffff',
  },
  info: {
    main: '#2563eb',      // Darker blue for better contrast
    contrastText: '#ffffff',
  },
};

// Create the theme with navy blue palette
const navyTheme = createTheme({
  ...defaultTheme, // This preserves shadows and other default values
  palette: navyPalette,
  typography: {
    fontFamily: [
      'Inter',
      'Figtree',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      textTransform: 'none',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    overline: {
      fontWeight: 600,
      fontSize: '0.75rem',
      lineHeight: 1.4,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: navyPalette.primary.gradient,
          boxShadow: '0 2px 8px rgba(30, 58, 95, 0.15)',
          '&:hover': {
            background: navyPalette.primary.gradientLight,
            boxShadow: '0 4px 16px rgba(30, 58, 95, 0.25)',
          },
        },
        containedPrimary: {
          background: navyPalette.primary.gradient,
          '&:hover': {
            background: navyPalette.primary.gradientLight,
          },
        },
        containedSecondary: {
          background: navyPalette.secondary.gradient,
          '&:hover': {
            background: navyPalette.secondary.gradientLight,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(30, 58, 95, 0.08), 0 1px 4px rgba(30, 58, 95, 0.04)',
          transition: 'all 0.3s ease-in-out',
          background: navyPalette.background.paperGradient,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(30, 58, 95, 0.12), 0 4px 8px rgba(30, 58, 95, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(30, 58, 95, 0.08), 0 1px 4px rgba(30, 58, 95, 0.04)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(30, 58, 95, 0.1), 0 2px 6px rgba(30, 58, 95, 0.06)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(30, 58, 95, 0.12), 0 3px 8px rgba(30, 58, 95, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(30, 58, 95, 0.08), 0 1px 4px rgba(30, 58, 95, 0.04)',
          background: navyPalette.background.paperGradient,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(30, 58, 95, 0.08)',
          boxShadow: '0 4px 12px rgba(30, 58, 95, 0.08), 0 2px 6px rgba(30, 58, 95, 0.04)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: navyPalette.primary.main,
            color: navyPalette.primary.contrastText,
            '&:hover': {
              backgroundColor: navyPalette.primary.light,
            },
            '& .MuiListItemIcon-root': {
              color: navyPalette.primary.contrastText,
            },
          },
          '&:hover': {
            backgroundColor: navyPalette.secondary.light,
            color: navyPalette.secondary.contrastText,
            '& .MuiListItemIcon-root': {
              color: navyPalette.secondary.contrastText,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
      variants: [
        {
          props: { variant: 'tableAvailable' },
          style: {
            backgroundColor: navyPalette.restaurant.tableAvailable,
            color: '#ffffff',
          },
        },
        {
          props: { variant: 'tableOccupied' },
          style: {
            backgroundColor: navyPalette.restaurant.tableOccupied,
            color: '#ffffff',
          },
        },
        {
          props: { variant: 'tableReserved' },
          style: {
            backgroundColor: navyPalette.restaurant.tableReserved,
            color: '#ffffff',
          },
        },
        {
          props: { variant: 'tableCleaning' },
          style: {
            backgroundColor: navyPalette.restaurant.tableCleaning,
            color: '#ffffff',
          },
        },
        {
          props: { variant: 'orderPending' },
          style: {
            backgroundColor: navyPalette.restaurant.orderPending,
            color: '#ffffff',
          },
        },
        {
          props: { variant: 'orderPreparing' },
          style: {
            backgroundColor: navyPalette.restaurant.orderPreparing,
            color: '#ffffff',
          },
        },
        {
          props: { variant: 'orderReady' },
          style: {
            backgroundColor: navyPalette.restaurant.orderReady,
            color: '#ffffff',
          },
        },
        {
          props: { variant: 'orderServed' },
          style: {
            backgroundColor: navyPalette.restaurant.orderServed,
            color: '#ffffff',
          },
        },
      ],
    },
  },
  shape: {
    borderRadius: 8,
  },
});

// Dark theme variant
const darkNavyTheme = createTheme({
  ...defaultTheme, // Preserve default shadows
  ...navyTheme,
  palette: {
    mode: 'dark',
    ...navyPalette,
    background: {
      default: '#0f172a',    // Very dark navy background
      paper: '#1e293b',      // Dark navy card
      // Enhanced backgrounds with subtle gradients
      defaultGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      paperGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    },
    text: {
      primary: '#f8fafc',    // Light grayish blue text
      secondary: '#cbd5e1',  // Lighter blue-gray text
      // Enhanced text colors for better hierarchy
      hint: '#64748b',      // Subtle hint text
      disabled: '#475569',   // Disabled text
    },
    primary: {
      ...navyPalette.primary,
      main: '#2c5282',       // Lighter navy for dark mode
      light: '#3182ce',      // Brighter navy for hover states
      // Enhanced gradient support
      gradient: 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
      gradientLight: 'linear-gradient(135deg, #3182ce 0%, #60a5fa 100%)',
    },
    secondary: {
      ...navyPalette.secondary,
      main: '#4299e1',       // Even brighter blue for actions
      // Enhanced gradient support
      gradient: 'linear-gradient(135deg, #4299e1 0%, #60a5fa 100%)',
      gradientLight: 'linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)',
    },
    // Dark mode restaurant status colors - WCAG AA compliant
    restaurant: {
      ...navyPalette.restaurant,
      tableAvailable: '#22c55e',    // Better contrast green
      tableOccupied: '#f87171',     // Lighter red
      tableReserved: '#f59e0b',     // Better contrast amber
      tableCleaning: '#94a3b8',     // Lighter gray
      
      orderPending: '#f59e0b',      // Better contrast amber
      orderPreparing: '#3b82f6',    // Better contrast blue
      orderReady: '#22c55e',        // Better contrast green
      orderServed: '#94a3b8',       // Lighter gray
      
      kitchenNew: '#f59e0b',        // Better contrast amber
      kitchenInProgress: '#3b82f6', // Better contrast blue
      kitchenCompleted: '#22c55e',  // Better contrast green
      kitchenCancelled: '#f87171',  // Lighter red
    },
  },
  // Enhanced dark mode component styles
  components: {
    ...navyTheme.components,
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(66, 153, 225, 0.25)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
          boxShadow: '0 2px 8px rgba(66, 153, 225, 0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3182ce 0%, #60a5fa 100%)',
            boxShadow: '0 4px 16px rgba(66, 153, 225, 0.25)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3182ce 0%, #60a5fa 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #4299e1 0%, #60a5fa 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export { navyTheme, darkNavyTheme };
export default navyTheme;