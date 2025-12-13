import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Touch gesture utilities for restaurant workflow optimization
 * Designed to work with gloves and in busy restaurant environments
 */

// Touch target sizes optimized for restaurant use (minimum 44px for accessibility)
export const TOUCH_TARGET_SIZES = {
  small: 44,   // Minimum touch target
  medium: 48,  // Comfortable touch target
  large: 56,   // Easy touch target for gloves
  extraLarge: 64, // Maximum touch target for critical actions
};

// Gesture configurations
export const GESTURE_CONFIGS = {
  swipe: {
    threshold: 50,      // Minimum distance for swipe
    velocity: 0.3,      // Minimum velocity for swipe
    direction: 'horizontal', // Default swipe direction
  },
  pan: {
    threshold: 10,      // Minimum distance to start pan
    momentum: true,     // Enable momentum scrolling
    friction: 0.95,     // Friction for momentum
  },
  pinch: {
    threshold: 20,      // Minimum distance for pinch
    scaleRange: { min: 0.5, max: 3 }, // Zoom limits
  },
  tap: {
    threshold: 10,      // Maximum movement for tap
    timeout: 300,       // Maximum time for tap
    doubleTapDelay: 300, // Delay between double taps
  },
  longPress: {
    threshold: 10,      // Maximum movement for long press
    timeout: 500,       // Minimum time for long press
  },
};

// Haptic feedback simulation (visual feedback for web)
export const simulateHapticFeedback = (type = 'light') => {
  // Create visual feedback for haptic simulation
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${type === 'heavy' ? '100px' : type === 'medium' ? '60px' : '40px'};
    height: ${type === 'heavy' ? '100px' : type === 'medium' ? '60px' : '40px'};
    background: rgba(30, 58, 95, 0.1);
    border: 2px solid rgba(30, 58, 95, 0.3);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    animation: hapticPulse 0.2s ease-out;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes hapticPulse {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    document.body.removeChild(feedback);
    document.head.removeChild(style);
  }, 200);
};

// Touch-friendly button wrapper
export const createTouchButton = (onClick, options = {}) => {
  const {
    size = 'medium',
    hapticFeedback = true,
    preventDefault = true,
    stopPropagation = true,
    delay = 0,
  } = options;

  return (event) => {
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    
    if (hapticFeedback) {
      simulateHapticFeedback('light');
    }
    
    if (delay > 0) {
      setTimeout(() => onClick(event), delay);
    } else {
      onClick(event);
    }
  };
};

// Custom hook for swipe gestures
export const useSwipeGesture = (onSwipe, config = {}) => {
  const [startPoint, setStartPoint] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);

  const finalConfig = { ...GESTURE_CONFIGS.swipe, ...config };

  const handleStart = useCallback((clientX, clientY) => {
    setStartPoint({ x: clientX, y: clientY, time: Date.now() });
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!startPoint || !isDragging) return;
    
    const deltaX = clientX - startPoint.x;
    const deltaY = clientY - startPoint.y;
    
    // Provide visual feedback during swipe
    if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
      const element = elementRef.current;
      if (element) {
        element.style.transform = `translateX(${deltaX * 0.3}px)`;
        element.style.transition = 'none';
      }
    }
  }, [startPoint, isDragging]);

  const handleEnd = useCallback((clientX, clientY) => {
    if (!startPoint || !isDragging) return;

    const deltaX = clientX - startPoint.x;
    const deltaY = clientY - startPoint.y;
    const deltaTime = Date.now() - startPoint.time;
    
    // Reset element position
    const element = elementRef.current;
    if (element) {
      element.style.transform = '';
      element.style.transition = 'transform 0.2s ease-out';
    }

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Check if swipe meets threshold
    if (distance > finalConfig.threshold || velocity > finalConfig.velocity) {
      let direction;
      
      if (finalConfig.direction === 'horizontal') {
        direction = deltaX > 0 ? 'right' : 'left';
      } else if (finalConfig.direction === 'vertical') {
        direction = deltaY > 0 ? 'down' : 'up';
      } else {
        // Auto-detect direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
      }

      onSwipe(direction, { deltaX, deltaY, distance, velocity });
      simulateHapticFeedback('medium');
    }

    setStartPoint(null);
    setIsDragging(false);
  }, [startPoint, isDragging, onSwipe, finalConfig]);

  const eventHandlers = {
    onTouchStart: (e) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    onTouchMove: (e) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    onTouchEnd: (e) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    },
    onMouseDown: (e) => {
      handleStart(e.clientX, e.clientY);
    },
    onMouseMove: (e) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    },
    onMouseUp: (e) => {
      if (isDragging) {
        handleEnd(e.clientX, e.clientY);
      }
    },
  };

  return { elementRef, eventHandlers, isDragging };
};

// Custom hook for pan gestures (for table floor plan)
export const usePanGesture = (onPan, config = {}) => {
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const elementRef = useRef(null);

  const finalConfig = { ...GESTURE_CONFIGS.pan, ...config };

  const handleStart = useCallback((clientX, clientY) => {
    setStartPoint({ x: clientX, y: clientY });
    setCurrentPoint({ x: clientX, y: clientY });
    setIsPanning(true);
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isPanning || !startPoint) return;

    const deltaX = clientX - startPoint.x;
    const deltaY = clientY - startPoint.y;

    setCurrentPoint({ x: clientX, y: clientY });
    onPan({ deltaX, deltaY, isPanning: true });
  }, [isPanning, startPoint, onPan]);

  const handleEnd = useCallback(() => {
    setIsPanning(false);
    onPan({ isPanning: false, momentum: finalConfig.momentum });
  }, [onPan, finalConfig.momentum]);

  const eventHandlers = {
    onTouchStart: (e) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    onTouchMove: (e) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    onTouchEnd: () => {
      handleEnd();
    },
    onMouseDown: (e) => {
      handleStart(e.clientX, e.clientY);
    },
    onMouseMove: (e) => {
      if (isPanning) {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    },
    onMouseUp: () => {
      if (isPanning) {
        handleEnd();
      }
    },
  };

  return { elementRef, eventHandlers, isPanning, currentPoint };
};

// Custom hook for pinch-to-zoom
export const usePinchZoom = (onZoom, config = {}) => {
  const [isZooming, setIsZooming] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [currentScale, setCurrentScale] = useState(1);
  const elementRef = useRef(null);

  const finalConfig = { ...GESTURE_CONFIGS.pinch, ...config };

  const getDistance = useCallback((touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches);
      setInitialDistance(distance);
      setIsZooming(true);
      e.preventDefault();
    }
  }, [getDistance]);

  const handleMove = useCallback((e) => {
    if (!isZooming || e.touches.length !== 2) return;

    const currentDistance = getDistance(e.touches);
    const scale = currentDistance / initialDistance;
    
    // Clamp scale to configured range
    const clampedScale = Math.max(
      finalConfig.scaleRange.min,
      Math.min(finalConfig.scaleRange.max, scale)
    );

    setCurrentScale(clampedScale);
    onZoom(clampedScale);
    e.preventDefault();
  }, [isZooming, initialDistance, onZoom, finalConfig, getDistance]);

  const handleEnd = useCallback(() => {
    setIsZooming(false);
    setInitialDistance(0);
  }, []);

  const eventHandlers = {
    onTouchStart: handleStart,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
  };

  return { elementRef, eventHandlers, isZooming, currentScale };
};

// Custom hook for long press gestures
export const useLongPress = (onLongPress, config = {}) => {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef(null);

  const finalConfig = { ...GESTURE_CONFIGS.longPress, ...config };

  const start = useCallback(() => {
    setIsPressing(true);
    simulateHapticFeedback('light');
    
    timerRef.current = setTimeout(() => {
      onLongPress();
      simulateHapticFeedback('heavy');
    }, finalConfig.timeout);
  }, [onLongPress, finalConfig.timeout]);

  const cancel = useCallback(() => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const eventHandlers = {
    onTouchStart: (e) => {
      e.preventDefault();
      start();
    },
    onTouchMove: (e) => {
      const touch = e.touches[0];
      const startX = e.targetTouches[0].clientX;
      const startY = e.targetTouches[0].clientY;
      
      // Check if movement exceeds threshold
      if (Math.abs(touch.clientX - startX) > finalConfig.threshold ||
          Math.abs(touch.clientY - startY) > finalConfig.threshold) {
        cancel();
      }
    },
    onTouchEnd: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };

  return { eventHandlers, isPressing };
};

// Utility to create touch-friendly styles
export const getTouchStyles = (size = 'medium', additionalStyles = {}) => {
  const touchSize = TOUCH_TARGET_SIZES[size] || TOUCH_TARGET_SIZES.medium;
  
  return {
    minWidth: `${touchSize}px`,
    minHeight: `${touchSize}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    ...additionalStyles,
  };
};

// Utility to create responsive touch targets
export const getResponsiveTouchStyles = (baseSize = 'medium', additionalStyles = {}) => {
  const sizes = {
    mobile: TOUCH_TARGET_SIZES[baseSize === 'small' ? 'medium' : 'large'],
    tablet: TOUCH_TARGET_SIZES[baseSize === 'small' ? 'small' : 'medium'],
    desktop: TOUCH_TARGET_SIZES[baseSize],
  };

  return {
    ...getTouchStyles(baseSize, additionalStyles),
    '@media (max-width: 768px)': {
      minWidth: `${sizes.mobile}px`,
      minHeight: `${sizes.mobile}px`,
    },
    '@media (min-width: 769px) and (max-width: 1024px)': {
      minWidth: `${sizes.tablet}px`,
      minHeight: `${sizes.tablet}px`,
    },
    '@media (min-width: 1025px)': {
      minWidth: `${sizes.desktop}px`,
      minHeight: `${sizes.desktop}px`,
    },
  };
};

// Touch-friendly component wrapper
export const withTouchOptimization = (Component, options = {}) => {
  const {
    touchSize = 'medium',
    hapticFeedback = true,
    preventDefault = true,
    ...restOptions
  } = options;

  return (props) => {
    const touchStyles = getResponsiveTouchStyles(touchSize);
    
    return (
      <div style={touchStyles}>
        <Component
          {...props}
          {...restOptions}
          onClick={createTouchButton(props.onClick, {
            hapticFeedback,
            preventDefault,
          })}
        />
      </div>
    );
  };
};

// Utility to detect touch device capabilities
export const getTouchCapabilities = () => {
  const capabilities = {
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    multiTouch: navigator.maxTouchPoints > 1,
    passive: false, // Will be updated based on feature detection
  };

  // Test for passive event listener support
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: () => {
        capabilities.passive = true;
        return false;
      },
    });
    window.addEventListener('test', null, opts);
    window.removeEventListener('test', null, opts);
  } catch (e) {
    capabilities.passive = false;
  }

  return capabilities;
};

// Restaurant-specific gesture configurations
export const RESTAURANT_GESTURES = {
  tableManagement: {
    swipe: { ...GESTURE_CONFIGS.swipe, direction: 'horizontal', threshold: 40 },
    longPress: { ...GESTURE_CONFIGS.longPress, timeout: 400 },
  },
  orderTaking: {
    swipe: { ...GESTURE_CONFIGS.swipe, direction: 'vertical', threshold: 30 },
    tap: { ...GESTURE_CONFIGS.tap, timeout: 200 },
  },
  kitchenDisplay: {
    swipe: { ...GESTURE_CONFIGS.swipe, direction: 'horizontal', threshold: 60 },
    longPress: { ...GESTURE_CONFIGS.longPress, timeout: 300 },
  },
  reservationManagement: {
    swipe: { ...GESTURE_CONFIGS.swipe, direction: 'horizontal', threshold: 50 },
    pinch: { ...GESTURE_CONFIGS.pinch, scaleRange: { min: 0.8, max: 2 } },
  },
};

export default {
  TOUCH_TARGET_SIZES,
  GESTURE_CONFIGS,
  simulateHapticFeedback,
  createTouchButton,
  useSwipeGesture,
  usePanGesture,
  usePinchZoom,
  useLongPress,
  getTouchStyles,
  getResponsiveTouchStyles,
  withTouchOptimization,
  getTouchCapabilities,
  RESTAURANT_GESTURES,
};