import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTouchCard = styled(Box, {
  shouldForwardProp: (prop) => !['isPressed', 'disabled', 'rippleColor'].includes(prop)
})(({ theme, isPressed, disabled, rippleColor, minHeight = 48 }) => ({
  position: 'relative',
  overflow: 'hidden',
  cursor: disabled ? 'not-allowed' : 'pointer',
  userSelect: 'none',
  minHeight: minHeight,
  minWidth: minHeight,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
  opacity: disabled ? 0.5 : 1,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  '&:hover': !disabled && {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    backgroundColor: theme.palette.action.hover,
  },
  '&:active': !disabled && {
    transform: 'translateY(0px) scale(0.98)',
    boxShadow: theme.shadows[2],
  },
  // Touch feedback
  '@media (hover: none)': {
    '&:hover': {
      transform: 'none',
      boxShadow: theme.shadows[1],
    },
  },
}));

const Ripple = styled('span')(({ theme, x, y, size, color }) => ({
  position: 'absolute',
  borderRadius: '50%',
  backgroundColor: color || 'rgba(66, 153, 225, 0.3)',
  transform: 'scale(0)',
  animation: 'ripple-animation 0.6s ease-out',
  pointerEvents: 'none',
  left: x - size / 2,
  top: y - size / 2,
  width: size,
  height: size,
  '@keyframes ripple-animation': {
    '0%': {
      transform: 'scale(0)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(4)',
      opacity: 0,
    },
  },
}));

const TouchCard = ({
  children,
  onClick,
  onLongPress,
  disabled = false,
  rippleColor,
  minHeight = 48,
  longPressDelay = 500,
  ...props
}) => {
  const [ripples, setRipples] = useState([]);
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef(null);
  const longPressTimer = useRef(null);

  const createRipple = (event) => {
    if (disabled) return null;

    const card = cardRef.current;
    if (!card) return null;

    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    return newRipple;
  };

  const handleTouchStart = (e) => {
    if (disabled) return;

    setIsPressed(true);
    const touch = e.touches[0];
    createRipple(touch);

    // Set up long press timer
    longPressTimer.current = setTimeout(() => {
      onLongPress?.(e);
    }, longPressDelay);
  };

  const handleTouchEnd = (e) => {
    if (disabled) return;

    setIsPressed(false);
    clearTimeout(longPressTimer.current);

    // Don't trigger click if long press was handled
    if (onLongPress) {
      return;
    }

    // Trigger click with a small delay to feel more natural
    setTimeout(() => {
      onClick?.(e);
    }, 100);
  };

  const handleMouseDown = (e) => {
    if (disabled) return;

    setIsPressed(true);
    createRipple(e);

    // Set up long press timer for mouse
    longPressTimer.current = setTimeout(() => {
      onLongPress?.(e);
    }, longPressDelay);
  };

  const handleMouseUp = (e) => {
    if (disabled) return;

    setIsPressed(false);
    clearTimeout(longPressTimer.current);

    // Don't trigger click if long press was handled
    if (onLongPress) {
      return;
    }

    onClick?.(e);
  };

  const handleMouseLeave = () => {
    if (disabled) return;

    setIsPressed(false);
    clearTimeout(longPressTimer.current);
  };

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <StyledTouchCard
      ref={cardRef}
      isPressed={isPressed}
      disabled={disabled}
      rippleColor={rippleColor}
      minHeight={minHeight}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <Ripple
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          size={ripple.size}
          color={rippleColor}
        />
      ))}
    </StyledTouchCard>
  );
};

export default TouchCard;