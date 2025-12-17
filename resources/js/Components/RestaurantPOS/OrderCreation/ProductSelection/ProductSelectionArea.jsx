import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../../Components/ThemeProvider';
import CategoryNavigation from './CategoryNavigation';
import ProductCard from './ProductCard';

const StyledContainer = styled(Box)(({ theme, isDarkMode }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  overflow: 'hidden',
}));

const StyledHeader = styled(Box)(({ theme, isDarkMode }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  backgroundColor: isDarkMode 
    ? 'rgba(30, 58, 95, 0.1)'
    : 'rgba(30, 58, 95, 0.02)',
}));

const StyledContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const SearchBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  alignItems: 'center',
}));

const ProductSelectionArea = ({
  products = [],
  categories = [],
  selectedCategory = null,
  onProductSelect,
  onProductDetails,
  loading = false,
  error = null,
  viewMode = 'grid', // 'grid' or 'list'
  onViewModeChange,
  sortBy = 'name', // 'name', 'price', 'category'
  sortOrder = 'asc', // 'asc', 'desc'
  onSortChange
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    // Debug logging to help identify the issue
    console.log('ProductSelectionArea - products type:', typeof products);
    console.log('ProductSelectionArea - products value:', products);
    console.log('ProductSelectionArea - isArray check:', Array.isArray(products));
    
    // Ensure products is always an array
    let filtered = Array.isArray(products) ? products : [];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category_id === selectedCategory.id || 
        product.category === selectedCategory.name
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter out unavailable items
    filtered = filtered.filter(product => product.is_available !== false);

    // Sort products
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'price':
          compareValue = a.price - b.price;
          break;
        case 'category':
          compareValue = (a.category || '').localeCompare(b.category || '');
          break;
        default:
          compareValue = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [products, selectedCategory, searchTerm, sortBy, sortOrder]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortChange = (newSortBy) => {
    if (onSortChange) {
      // If clicking the same sort, toggle order
      const newSortOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
      onSortChange(newSortBy, newSortOrder);
    }
    handleSortMenuClose();
  };

  const handleProductClick = (product) => {
    onProductSelect?.(product);
  };

  const handleProductLongPress = (product) => {
    onProductDetails?.(product);
  };

  // Calculate grid columns based on screen size
  const getGridColumns = () => {
    if (isMobile) return 12;
    if (isTablet) return 6;
    return 4;
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <StyledContainer isDarkMode={isDarkMode}>
      {/* Header */}
      <StyledHeader isDarkMode={isDarkMode}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Menu Items
        </Typography>
        
        {/* Search Bar */}
        <SearchBar>
          <TextField
            fullWidth
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <Box
                    component="button"
                    onClick={handleClearSearch}
                    sx={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'text.primary',
                      }
                    }}
                  >
                    ✕
                  </Box>
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
              },
            }}
          />
        </SearchBar>
      </StyledHeader>

      {/* Category Navigation */}
      <CategoryNavigation
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={(category) => onProductSelect?.(null)} // Reset selection when changing category
        loading={loading}
      />

      {/* Content */}
      <StyledContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="h6" color="text.secondary">
              Loading products...
            </Typography>
          </Box>
        ) : filteredAndSortedProducts.length > 0 ? (
          <Grid container spacing={2}>
            {filteredAndSortedProducts.map((product) => (
              <Grid
                key={product.id}
                item
                xs={getGridColumns()}
                sm={6}
                md={4}
                lg={3}
              >
                <ProductCard
                  product={product}
                  onClick={handleProductClick}
                  onLongPress={handleProductLongPress}
                  compact={viewMode === 'list'}
                  showDescription={viewMode === 'grid'}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100%"
            textAlign="center"
            py={4}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm
                ? `No products match "${searchTerm}"`
                : selectedCategory
                ? `No products in ${selectedCategory.name}`
                : 'No products available'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try adjusting your filters or search criteria
            </Typography>
          </Box>
        )}
      </StyledContent>
    </StyledContainer>
  );
};

export default ProductSelectionArea;