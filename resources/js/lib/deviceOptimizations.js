import { useState, useEffect, useCallback } from 'react';

/**
 * Device-specific optimizations for restaurant workflow
 * Optimizes performance and user experience based on device capabilities
 */

// Device type detection
export const DEVICE_TYPES = {
  SMARTPHONE: 'smartphone',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  KITCHEN_DISPLAY: 'kitchen_display',
  UNKNOWN: 'unknown',
};

// Performance tiers for optimization
export const PERFORMANCE_TIERS = {
  LOW: 'low',      // Basic smartphones, older tablets
  MEDIUM: 'medium', // Modern smartphones, standard tablets
  HIGH: 'high',    // High-end tablets, desktops
  ULTRA: 'ultra',  // Premium devices, kitchen displays
};

// Restaurant-specific device configurations
export const RESTAURANT_DEVICE_CONFIGS = {
  [DEVICE_TYPES.SMARTPHONE]: {
    // Manager/staff use - quick status updates, notifications
    performance: PERFORMANCE_TIERS.MEDIUM,
    touchOptimization: 'high',
    gestureSupport: 'full',
    animations: 'reduced',
    layout: 'compact',
    features: {
      quickActions: true,
      notifications: true,
      statusUpdates: true,
      fullOrderManagement: false,
      kitchenDisplay: false,
      tableFloorPlan: 'simplified',
    },
    ui: {
      buttonSize: 'medium',
      fontSize: 'base',
      spacing: 'comfortable',
      bottomNav: true,
      sidebar: false,
      floatingActions: true,
    },
    performance: {
      lazyLoading: true,
      virtualScrolling: true,
      imageOptimization: true,
      animationReduction: true,
      batchUpdates: true,
    },
  },
  [DEVICE_TYPES.TABLET]: {
    // Primary restaurant device - full functionality
    performance: PERFORMANCE_TIERS.HIGH,
    touchOptimization: 'maximum',
    gestureSupport: 'full',
    animations: 'standard',
    layout: 'adaptive',
    features: {
      quickActions: true,
      notifications: true,
      statusUpdates: true,
      fullOrderManagement: true,
      kitchenDisplay: true,
      tableFloorPlan: 'full',
      splitScreen: true,
    },
    ui: {
      buttonSize: 'large',
      fontSize: 'lg',
      spacing: 'spacious',
      bottomNav: false,
      sidebar: true,
      floatingActions: true,
    },
    performance: {
      lazyLoading: true,
      virtualScrolling: false,
      imageOptimization: true,
      animationReduction: false,
      batchUpdates: false,
    },
  },
  [DEVICE_TYPES.DESKTOP]: {
    // Management and administrative tasks
    performance: PERFORMANCE_TIERS.ULTRA,
    touchOptimization: 'standard',
    gestureSupport: 'basic',
    animations: 'full',
    layout: 'expanded',
    features: {
      quickActions: true,
      notifications: true,
      statusUpdates: true,
      fullOrderManagement: true,
      kitchenDisplay: true,
      tableFloorPlan: 'full',
      splitScreen: true,
      multiWindow: true,
    },
    ui: {
      buttonSize: 'medium',
      fontSize: 'base',
      spacing: 'comfortable',
      bottomNav: false,
      sidebar: true,
      floatingActions: false,
    },
    performance: {
      lazyLoading: false,
      virtualScrolling: false,
      imageOptimization: false,
      animationReduction: false,
      batchUpdates: false,
    },
  },
  [DEVICE_TYPES.KITCHEN_DISPLAY]: {
    // Kitchen-specific optimizations
    performance: PERFORMANCE_TIERS.HIGH,
    touchOptimization: 'maximum',
    gestureSupport: 'limited',
    animations: 'minimal',
    layout: 'focused',
    features: {
      quickActions: false,
      notifications: true,
      statusUpdates: true,
      fullOrderManagement: false,
      kitchenDisplay: true,
      tableFloorPlan: false,
      autoRefresh: true,
    },
    ui: {
      buttonSize: 'extraLarge',
      fontSize: 'xl',
      spacing: 'spacious',
      bottomNav: false,
      sidebar: false,
      floatingActions: false,
      highContrast: true,
    },
    performance: {
      lazyLoading: false,
      virtualScrolling: true,
      imageOptimization: true,
      animationReduction: true,
      batchUpdates: true,
    },
  },
};

// Device detection utilities
export const detectDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const touchPoints = navigator.maxTouchPoints || 0;
  const aspectRatio = screenWidth / screenHeight;

  // Kitchen display detection (larger screens, landscape orientation)
  if (screenWidth >= 1200 && aspectRatio > 1.3 && touchPoints >= 10) {
    return DEVICE_TYPES.KITCHEN_DISPLAY;
  }

  // Tablet detection
  if (touchPoints > 0 && (
    (screenWidth >= 768 && screenWidth <= 1024) ||
    (screenHeight >= 768 && screenHeight <= 1024) ||
    userAgent.includes('tablet') ||
    userAgent.includes('ipad')
  )) {
    return DEVICE_TYPES.TABLET;
  }

  // Smartphone detection
  if (touchPoints > 0 && (
    screenWidth < 768 ||
    screenHeight < 768 ||
    userAgent.includes('mobile') ||
    userAgent.includes('android') ||
    userAgent.includes('iphone')
  )) {
    return DEVICE_TYPES.SMARTPHONE;
  }

  // Desktop detection
  if (touchPoints === 0 || screenWidth >= 1025) {
    return DEVICE_TYPES.DESKTOP;
  }

  return DEVICE_TYPES.UNKNOWN;
};

// Performance detection
export const detectPerformanceTier = () => {
  const deviceType = detectDeviceType();
  const config = RESTAURANT_DEVICE_CONFIGS[deviceType];
  
  if (!config) return PERFORMANCE_TIERS.MEDIUM;

  // Enhanced performance detection
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const connection = navigator.connection || {};
  const effectiveType = connection.effectiveType || '4g';

  // Calculate performance score
  let score = 0;
  
  // Memory scoring (0-2 points)
  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;
  
  // CPU cores scoring (0-2 points)
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  
  // Network scoring (0-2 points)
  if (effectiveType === '4g') score += 2;
  else if (effectiveType === '3g') score += 1;
  
  // Device type scoring (0-2 points)
  if (deviceType === DEVICE_TYPES.DESKTOP) score += 2;
  else if (deviceType === DEVICE_TYPES.TABLET) score += 1;
  else if (deviceType === DEVICE_TYPES.KITCHEN_DISPLAY) score += 1;

  // Determine performance tier based on score
  if (score >= 6) return PERFORMANCE_TIERS.ULTRA;
  if (score >= 4) return PERFORMANCE_TIERS.HIGH;
  if (score >= 2) return PERFORMANCE_TIERS.MEDIUM;
  return PERFORMANCE_TIERS.LOW;
};

// Orientation detection and optimization
export const getOrientationOptimizations = () => {
  const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  const deviceType = detectDeviceType();

  const optimizations = {
    smartphone: {
      portrait: {
        layout: 'single-column',
        navigation: 'bottom',
        tablePlan: 'scrollable',
        orderView: 'stacked',
      },
      landscape: {
        layout: 'two-column',
        navigation: 'side',
        tablePlan: 'compact',
        orderView: 'side-by-side',
      },
    },
    tablet: {
      portrait: {
        layout: 'adaptive',
        navigation: 'side',
        tablePlan: 'optimized',
        orderView: 'split',
      },
      landscape: {
        layout: 'full',
        navigation: 'side',
        tablePlan: 'expanded',
        orderView: 'split-screen',
      },
    },
  };

  return optimizations[deviceType]?.[orientation] || {};
};

// Custom hook for device optimizations
export const useDeviceOptimizations = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    type: DEVICE_TYPES.UNKNOWN,
    performance: PERFORMANCE_TIERS.MEDIUM,
    orientation: 'portrait',
    config: RESTAURANT_DEVICE_CONFIGS[DEVICE_TYPES.UNKNOWN],
    orientationOptimizations: {},
  });

  const updateDeviceInfo = useCallback(() => {
    const deviceType = detectDeviceType();
    const performance = detectPerformanceTier();
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    const config = RESTAURANT_DEVICE_CONFIGS[deviceType] || RESTAURANT_DEVICE_CONFIGS[DEVICE_TYPES.UNKNOWN];
    const orientationOptimizations = getOrientationOptimizations();

    setDeviceInfo({
      type: deviceType,
      performance,
      orientation,
      config,
      orientationOptimizations,
    });
  }, []);

  useEffect(() => {
    updateDeviceInfo();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100); // Delay to ensure dimensions are updated
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
};

// Performance optimization utilities
export const optimizeForDevice = (component, deviceInfo) => {
  const { config, performance } = deviceInfo;

  // Apply performance optimizations
  if (performance === PERFORMANCE_TIERS.LOW) {
    return {
      ...component,
      animations: false,
      shadows: false,
      gradients: false,
      transitions: 'fast',
      lazyLoad: true,
      virtualScroll: true,
    };
  }

  if (performance === PERFORMANCE_TIERS.MEDIUM) {
    return {
      ...component,
      animations: 'reduced',
      shadows: 'subtle',
      gradients: 'simple',
      transitions: 'standard',
      lazyLoad: true,
      virtualScroll: false,
    };
  }

  return {
    ...component,
    animations: config.animations,
    shadows: 'full',
    gradients: 'full',
    transitions: 'smooth',
    lazyLoad: config.performance.lazyLoading,
    virtualScroll: config.performance.virtualScrolling,
  };
};

// Touch optimization based on device
export const getTouchOptimizations = (deviceInfo) => {
  const { type, config } = deviceInfo;

  const baseOptimizations = {
    touchTargetSize: config.ui.buttonSize,
    gestureSupport: config.gestureSupport,
    hapticFeedback: config.touchOptimization === 'maximum',
    preventAccidentalTouches: true,
    gloveCompatibility: config.touchOptimization === 'maximum',
  };

  // Device-specific adjustments
  if (type === DEVICE_TYPES.KITCHEN_DISPLAY) {
    return {
      ...baseOptimizations,
      touchTargetSize: 'extraLarge',
      gestureSupport: 'limited',
      hapticFeedback: false,
      preventAccidentalTouches: true,
      gloveCompatibility: true,
      splashResistance: true,
    };
  }

  if (type === DEVICE_TYPES.SMARTPHONE) {
    return {
      ...baseOptimizations,
      touchTargetSize: 'medium',
      gestureSupport: 'full',
      hapticFeedback: true,
      preventAccidentalTouches: true,
      gloveCompatibility: false,
      oneHandedOptimization: true,
    };
  }

  return baseOptimizations;
};

// Restaurant workflow optimizations
export const getRestaurantWorkflowOptimizations = (deviceInfo) => {
  const { type, config } = deviceInfo;

  const workflowOptimizations = {
    [DEVICE_TYPES.SMARTPHONE]: {
      primaryActions: ['status_update', 'quick_notification'],
      secondaryActions: ['view_details', 'simple_edit'],
      navigationPattern: 'tab_based',
      dataEntry: 'simplified',
      workflow: 'status_focused',
    },
    [DEVICE_TYPES.TABLET]: {
      primaryActions: ['full_order_management', 'table_operations'],
      secondaryActions: ['detailed_editing', 'advanced_features'],
      navigationPattern: 'sidebar_based',
      dataEntry: 'full',
      workflow: 'complete',
    },
    [DEVICE_TYPES.DESKTOP]: {
      primaryActions: ['administrative_tasks', 'reporting'],
      secondaryActions: ['system_configuration', 'bulk_operations'],
      navigationPattern: 'menu_based',
      dataEntry: 'advanced',
      workflow: 'management',
    },
    [DEVICE_TYPES.KITCHEN_DISPLAY]: {
      primaryActions: ['order_status_update', 'timing_control'],
      secondaryActions: ['priority_management', 'communication'],
      navigationPattern: 'minimal',
      dataEntry: 'touch_only',
      workflow: 'display_focused',
    },
  };

  return workflowOptimizations[type] || workflowOptimizations[DEVICE_TYPES.TABLET];
};

// Accessibility optimizations for restaurant environments
export const getAccessibilityOptimizations = (deviceInfo) => {
  const { type, config } = deviceInfo;

  const baseOptimizations = {
    highContrast: false,
    largeText: false,
    reducedMotion: config.animations === 'reduced' || config.animations === 'minimal',
    screenReaderOptimized: true,
    keyboardNavigation: true,
  };

  // Kitchen display specific accessibility
  if (type === DEVICE_TYPES.KITCHEN_DISPLAY) {
    return {
      ...baseOptimizations,
      highContrast: true,
      largeText: true,
      reducedMotion: true,
      screenReaderOptimized: false, // Visual display is primary
      keyboardNavigation: false, // Touch-only interface
      colorBlindFriendly: true,
      glareReduction: true,
    };
  }

  return baseOptimizations;
};

// Utility to apply device-specific CSS classes
export const getDeviceClasses = (deviceInfo) => {
  const { type, performance, orientation } = deviceInfo;

  return [
    `device-${type}`,
    `performance-${performance}`,
    `orientation-${orientation}`,
    `touch-${deviceInfo.config.touchOptimization}`,
  ].join(' ');
};

// Custom hook for responsive restaurant layouts
export const useRestaurantLayout = () => {
  const deviceInfo = useDeviceOptimizations();
  const touchOptimizations = getTouchOptimizations(deviceInfo);
  const workflowOptimizations = getRestaurantWorkflowOptimizations(deviceInfo);
  const accessibilityOptimizations = getAccessibilityOptimizations(deviceInfo);

  return {
    deviceInfo,
    touchOptimizations,
    workflowOptimizations,
    accessibilityOptimizations,
    classes: getDeviceClasses(deviceInfo),
    optimizeComponent: (component) => optimizeForDevice(component, deviceInfo),
  };
};

export default {
  DEVICE_TYPES,
  PERFORMANCE_TIERS,
  RESTAURANT_DEVICE_CONFIGS,
  detectDeviceType,
  detectPerformanceTier,
  getOrientationOptimizations,
  useDeviceOptimizations,
  optimizeForDevice,
  getTouchOptimizations,
  getRestaurantWorkflowOptimizations,
  getAccessibilityOptimizations,
  getDeviceClasses,
  useRestaurantLayout,
};