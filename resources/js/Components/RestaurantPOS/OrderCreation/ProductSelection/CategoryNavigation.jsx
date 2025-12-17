import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../../Components/ThemeProvider';

const StyledContainer = styled(Box)(({ theme, isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: isDarkMode 
    ? 'rgba(30, 58, 95, 0.1)'
    : 'rgba(30, 58, 95, 0.02)',
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  overflow: 'hidden',
  position: 'relative',
}));

const StyledChip = styled(Chip, {
  shouldForwardProp: (prop) => !['isActive', 'scrollable'].includes(prop)
})(({ theme, isActive, isDarkMode }) => ({
  fontWeight: 600,
  backgroundColor: isActive 
    ? (isDarkMode ? '#2c5282' : '#1e3a5f')
    : (isDarkMode ? 'rgba(148, 163, 184, 0.2)' : '#f1f5f9'),
  color: isActive 
    ? '#ffffff'
    : (isDarkMode ? '#cbd5e1' : '#475569'),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: isActive 
      ? (isDarkMode ? '#3182ce' : '#2563eb')
      : (isDarkMode ? 'rgba(148, 163, 184, 0.3)' : '#e2e8f0'),
    transform: 'scale(1.02)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

const CategoryNavigation = ({
  categories = [],
  selectedCategory = null,
  onCategorySelect,
  loading = false
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const scrollContainerRef = React.useRef(null);
  
  // Add "All" category at the beginning
  const allCategories = [
    { id: 'all', name: 'All Items', icon: '🍽' },
    ...categories
  ];

  const handleCategoryClick = (category) => {
    onCategorySelect?.(category.id === 'all' ? null : category);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  const getCategoryIcon = (category) => {
    if (category.icon) return category.icon;
    
    // Default icons for common categories
    const iconMap = {
      'Appetizer': '🥟',
      'Main Course': '🍖',
      'Dessert': '🍰',
      'Beverage': '🥤',
      'Soup': '🍲',
      'Salad': '🥗',
      'Pizza': '🍕',
      'Pasta': '🍝',
      'Burger': '🍔',
      'Seafood': '🦞',
      'Vegetarian': '🥬',
      'Breakfast': '🍳',
      'Lunch': '🍱',
      'Dinner': '🍽',
    };
    
    return iconMap[category.name] || '🍽';
  };

  if (loading) {
    return (
      <StyledContainer isDarkMode={isDarkMode}>
        <Box display="flex" gap={1} flexWrap="wrap">
          {[1, 2, 3, 4, 5].map((item) => (
            <StyledChip
              key={item}
              label="Loading..."
              isDarkMode={isDarkMode}
              sx={{ 
                width: 100, 
                height: 32,
                backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : '#f1f5f9',
              }}
            />
          ))}
        </Box>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer isDarkMode={isDarkMode}>
      {/* Left scroll button for mobile */}
      {isMobile && (
        <IconButton
          onClick={scrollLeft}
          size="small"
          sx={{
            backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)',
            color: isDarkMode ? '#90caf9' : '#1e3a5f',
            borderRadius: 1,
            minWidth: 32,
            height: 32,
            flexShrink: 0,
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      )}

      {/* Category chips */}
      <Box
        ref={scrollContainerRef}
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: isMobile ? 'auto' : 'visible',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome, Safari, Edge
          },
          flex: 1,
        }}
      >
        {allCategories.map((category) => {
          const isActive = selectedCategory 
            ? selectedCategory.id === category.id 
            : category.id === 'all';
            
          return (
            <StyledChip
              key={category.id}
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <span>{getCategoryIcon(category)}</span>
                  <span>{category.name}</span>
                </Box>
              }
              isActive={isActive}
              isDarkMode={isDarkMode}
              onClick={() => handleCategoryClick(category)}
              sx={{
                minWidth: 'fit-content',
                whiteSpace: 'nowrap',
              }}
            />
          );
        })}
      </Box>

      {/* Right scroll button for mobile */}
      {isMobile && (
        <IconButton
          onClick={scrollRight}
          size="small"
          sx={{
            backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)',
            color: isDarkMode ? '#90caf9' : '#1e3a5f',
            borderRadius: 1,
            minWidth: 32,
            height: 32,
            flexShrink: 0,
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      )}
    </StyledContainer>
  );
};

export default CategoryNavigation;