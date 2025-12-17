import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { navyTheme, darkNavyTheme } from '../lib/theme';

// Get default theme to preserve shadows and other default values
const defaultTheme = createTheme();

// Create context for theme management
const ThemeContext = createContext();

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Export a convenience hook for accessing theme colors
export const useCustomTheme = () => {
  console.log('useCustomTheme: Hook called');
  const { theme, isDarkMode, brandColors } = useThemeContext();
  
  return useMemo(() => {
    console.log('useCustomTheme: Computing memoized values');
    return {
      theme,
      isDarkMode,
      brandColors,
      // Convenience color getters
      colors: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        background: theme.palette.background.default,
        surface: theme.palette.background.paper,
        text: theme.palette.text.primary,
        textSecondary: theme.palette.text.secondary,
        error: theme.palette.error.main,
        warning: theme.palette.warning.main,
        info: theme.palette.info.main,
        success: theme.palette.success.main,
        // Navy theme specific colors
        navyPrimary: '#1e3a5f',
        navyAccent: '#3182ce',
        navyBackground: '#f8fafc',
        navySurface: '#ffffff',
        navyText: '#1a202c',
        navyTextSecondary: '#4a5568',
      }
    };
  }, [theme, isDarkMode, brandColors]);
};

export const ThemeProvider = ({ children }) => {
  // Get theme preference from localStorage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [brandColors, setBrandColors] = useState({
    primary: '#1e3a5f',
    accent: '#3182ce',
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#1a202c',
    textSecondary: '#4a5568',
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save theme preference to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Update brand colors from server (if brand settings are available)
  const updateBrandColors = useCallback((brandSettings) => {
    console.log('ThemeProvider: updateBrandColors called', brandSettings);
    if (brandSettings) {
      setBrandColors({
        primary: brandSettings.primary_color || '#1e3a5f',
        accent: brandSettings.accent_color || '#3182ce',
        background: brandSettings.background_color || '#f8fafc',
        surface: brandSettings.surface_color || '#ffffff',
        textPrimary: brandSettings.text_primary_color || '#1a202c',
        textSecondary: brandSettings.text_secondary_color || '#4a5568',
      });
    }
  }, []);

  // Create dynamic theme with brand colors - memoized to prevent infinite re-renders
  const theme = useMemo(() => {
    console.log('ThemeProvider: Creating theme with brandColors', brandColors, 'isDarkMode', isDarkMode);
    const baseTheme = isDarkMode ? darkNavyTheme : navyTheme;
    
    return createTheme({
      ...baseTheme,
      shadows: baseTheme.shadows || defaultTheme.shadows, // Ensure shadows are preserved
      palette: {
        ...baseTheme.palette,
        primary: {
          ...baseTheme.palette.primary,
          main: brandColors.primary,
        },
        secondary: {
          ...baseTheme.palette.secondary,
          main: brandColors.accent,
        },
        background: {
          ...baseTheme.palette.background,
          default: isDarkMode ? '#0f172a' : brandColors.background,
          paper: isDarkMode ? '#1e293b' : brandColors.surface,
        },
        text: {
          ...baseTheme.palette.text,
          primary: isDarkMode ? '#f8fafc' : brandColors.textPrimary,
          secondary: isDarkMode ? '#cbd5e1' : brandColors.textSecondary,
        },
      },
      shape: {
        ...baseTheme.shape,
        borderRadius: baseTheme.shape?.borderRadius || 8, // Ensure borderRadius is available
      },
      spacing: baseTheme.spacing || defaultTheme.spacing, // Ensure spacing is available
      zIndex: {
        ...baseTheme.zIndex,
        modal: baseTheme.zIndex?.modal || 1300, // Ensure zIndex is available
      },
    });
  }, [brandColors, isDarkMode]);

  const value = useMemo(() => {
    console.log('ThemeProvider: Creating context value');
    return {
      isDarkMode,
      toggleTheme,
      updateBrandColors,
      brandColors,
      theme,
    };
  }, [isDarkMode, toggleTheme, updateBrandColors, brandColors, theme]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;