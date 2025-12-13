// Accessibility utilities for checking contrast ratios and ensuring WCAG compliance

// Color conversion utilities
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return null;
  
  const lum1 = rgbToLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = rgbToLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// WCAG AA compliance levels
const WCAG_AA = {
  normalText: 4.5,      // 4.5:1 for normal text
  largeText: 3.0,       // 3.0:1 for large text (18pt+ or 14pt bold)
  graphicalObjects: 3.0, // 3.0:1 for graphical objects
};

const WCAG_AAA = {
  normalText: 7.0,      // 7.0:1 for normal text
  largeText: 4.5,       // 4.5:1 for large text
  graphicalObjects: 4.5, // 4.5:1 for graphical objects
};

// Navy Blue Theme Color Palette
export const navyThemeColors = {
  primary: '#1e3a5f',
  primaryLight: '#2c5282',
  accent: '#3182ce',
  background: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#1a202c',
  textSecondary: '#4a5568',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Restaurant Status Colors
  tableAvailable: '#10b981',
  tableOccupied: '#ef4444',
  tableReserved: '#f59e0b',
  tableCleaning: '#6b7280',
  
  orderPending: '#f59e0b',
  orderPreparing: '#3b82f6',
  orderReady: '#10b981',
  orderServed: '#6b7280',
};

// Dark Theme Colors
export const darkThemeColors = {
  primary: '#2c5282',
  primaryLight: '#3182ce',
  accent: '#4299e1',
  background: '#0f172a',
  surface: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  
  // Status Colors (lighter versions for dark mode)
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  
  // Restaurant Status Colors (lighter versions for dark mode)
  tableAvailable: '#34d399',
  tableOccupied: '#f87171',
  tableReserved: '#fbbf24',
  tableCleaning: '#94a3b8',
  
  orderPending: '#fbbf24',
  orderPreparing: '#60a5fa',
  orderReady: '#34d399',
  orderServed: '#94a3b8',
};

// Test contrast ratios for common color combinations
export const testContrastRatios = (isDarkMode = false) => {
  const colors = isDarkMode ? darkThemeColors : navyThemeColors;
  const results = [];
  
  // Test primary text on background
  results.push({
    name: 'Primary text on background',
    foreground: colors.textPrimary,
    background: colors.background,
    ratio: getContrastRatio(colors.textPrimary, colors.background),
    passesAA: getContrastRatio(colors.textPrimary, colors.background) >= WCAG_AA.normalText,
    passesAAA: getContrastRatio(colors.textPrimary, colors.background) >= WCAG_AAA.normalText,
  });
  
  // Test secondary text on background
  results.push({
    name: 'Secondary text on background',
    foreground: colors.textSecondary,
    background: colors.background,
    ratio: getContrastRatio(colors.textSecondary, colors.background),
    passesAA: getContrastRatio(colors.textSecondary, colors.background) >= WCAG_AA.normalText,
    passesAAA: getContrastRatio(colors.textSecondary, colors.background) >= WCAG_AAA.normalText,
  });
  
  // Test white text on primary
  results.push({
    name: 'White text on primary',
    foreground: '#ffffff',
    background: colors.primary,
    ratio: getContrastRatio('#ffffff', colors.primary),
    passesAA: getContrastRatio('#ffffff', colors.primary) >= WCAG_AA.normalText,
    passesAAA: getContrastRatio('#ffffff', colors.primary) >= WCAG_AAA.normalText,
  });
  
  // Test white text on accent
  results.push({
    name: 'White text on accent',
    foreground: '#ffffff',
    background: colors.accent,
    ratio: getContrastRatio('#ffffff', colors.accent),
    passesAA: getContrastRatio('#ffffff', colors.accent) >= WCAG_AA.normalText,
    passesAAA: getContrastRatio('#ffffff', colors.accent) >= WCAG_AAA.normalText,
  });
  
  // Test status colors with white text
  const statusColors = [
    { name: 'Success', color: colors.success },
    { name: 'Warning', color: colors.warning },
    { name: 'Error', color: colors.error },
    { name: 'Info', color: colors.info },
  ];
  
  statusColors.forEach(status => {
    results.push({
      name: `White text on ${status.name}`,
      foreground: '#ffffff',
      background: status.color,
      ratio: getContrastRatio('#ffffff', status.color),
      passesAA: getContrastRatio('#ffffff', status.color) >= WCAG_AA.normalText,
      passesAAA: getContrastRatio('#ffffff', status.color) >= WCAG_AAA.normalText,
    });
  });
  
  // Test restaurant status colors
  const restaurantStatusColors = [
    { name: 'Table Available', color: colors.tableAvailable },
    { name: 'Table Occupied', color: colors.tableOccupied },
    { name: 'Table Reserved', color: colors.tableReserved },
    { name: 'Table Cleaning', color: colors.tableCleaning },
    { name: 'Order Pending', color: colors.orderPending },
    { name: 'Order Preparing', color: colors.orderPreparing },
    { name: 'Order Ready', color: colors.orderReady },
    { name: 'Order Served', color: colors.orderServed },
  ];
  
  restaurantStatusColors.forEach(status => {
    results.push({
      name: `White text on ${status.name}`,
      foreground: '#ffffff',
      background: status.color,
      ratio: getContrastRatio('#ffffff', status.color),
      passesAA: getContrastRatio('#ffffff', status.color) >= WCAG_AA.normalText,
      passesAAA: getContrastRatio('#ffffff', status.color) >= WCAG_AAA.normalText,
    });
  });
  
  return results;
};

// Generate accessibility report
export const generateAccessibilityReport = (isDarkMode = false) => {
  const results = testContrastRatios(isDarkMode);
  const failedTests = results.filter(test => !test.passesAA);
  const passedTests = results.filter(test => test.passesAA);
  const aaaTests = results.filter(test => test.passesAAA);
  
  return {
    mode: isDarkMode ? 'dark' : 'light',
    totalTests: results.length,
    passedAA: passedTests.length,
    passedAAA: aaaTests.length,
    failedAA: failedTests.length,
    compliance: failedTests.length === 0 ? 'WCAG AA Compliant' : 'Not WCAG AA Compliant',
    details: results,
    failures: failedTests,
  };
};

// Get suggested text color for a given background
export const getSuggestedTextColor = (backgroundColor, isLargeText = false) => {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  
  const threshold = isLargeText ? WCAG_AA.largeText : WCAG_AA.normalText;
  
  if (whiteContrast >= threshold && blackContrast >= threshold) {
    // Both pass, return the one with higher contrast
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  } else if (whiteContrast >= threshold) {
    return '#ffffff';
  } else if (blackContrast >= threshold) {
    return '#000000';
  } else {
    // Neither passes, return the one with higher contrast
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  }
};

// Export utilities for use in components
export const accessibilityUtils = {
  hexToRgb,
  rgbToLuminance,
  getContrastRatio,
  getSuggestedTextColor,
  WCAG_AA,
  WCAG_AAA,
};

export default {
  testContrastRatios,
  generateAccessibilityReport,
  getSuggestedTextColor,
  navyThemeColors,
  darkThemeColors,
  accessibilityUtils,
};