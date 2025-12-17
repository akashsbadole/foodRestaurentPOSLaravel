import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart as CartIcon,
  TableRestaurant as TableIcon,
  RestaurantMenu as ProductIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../ThemeProvider';
import TableSelectionArea from '../TableSelection/TableSelectionArea';
import ProductSelectionArea from '../ProductSelection/ProductSelectionArea';
import OrderCartArea from '../OrderCart/OrderCartArea';

const StyledContainer = styled(Box)(({ theme, isDarkMode }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  overflow: 'hidden',
}));

const StyledMainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const StyledTabPanel = styled(Box)(({ theme, isDarkMode }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
}));

const TabletLayout = ({
  // Data
  tables = [],
  sections = [],
  products = [],
  categories = [],
  order = {},
  
  // Table selection props
  selectedTable = null,
  onTableSelect,
  onTableDetails,
  tablesLoading = false,
  tablesError = null,
  
  // Product selection props
  selectedCategory = null,
  onProductSelect,
  onProductDetails,
  productsLoading = false,
  productsError = null,
  
  // Cart props
  onItemUpdate,
  onItemRemove,
  onClearCart,
  onCheckout,
  onAddItem,
  cartLoading = false,
  cartError = null,
  
  // UI state
  searchTerm = '',
  onSearchChange,
  activeSection = 'table',
  onSectionChange
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  
  const [tabValue, setTabValue] = useState(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    onSectionChange?.(['table', 'menu', 'cart'][newValue]);
  };

  const handleCartToggle = () => {
    setCartDrawerOpen(!cartDrawerOpen);
  };

  const getTabIcon = (index) => {
    switch (index) {
      case 0: return <TableIcon />;
      case 1: return <ProductIcon />;
      case 2: return <CartIcon />;
      default: return <MenuIcon />;
    }
  };

  const getTabLabel = (index) => {
    switch (index) {
      case 0: return 'Tables';
      case 1: return 'Menu';
      case 2: return `Cart (${order.items?.length || 0})`;
      default: return '';
    }
  };

  return (
    <StyledContainer isDarkMode={isDarkMode}>
      {/* Main Content Area */}
      <StyledMainContent>
        {/* Navigation Tabs */}
        <Box
          sx={{
            borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            backgroundColor: isDarkMode 
              ? 'rgba(30, 58, 95, 0.1)'
              : 'rgba(30, 58, 95, 0.02)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: isDarkMode ? '#2c5282' : '#1e3a5f',
              },
              '& .MuiTab-root': {
                color: isDarkMode ? '#cbd5e1' : '#475569',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 60,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#ffffff',
                },
              },
            }}
          >
            <Tab
              icon={getTabIcon(0)}
              label={getTabLabel(0)}
              iconPosition="start"
              sx={{ minHeight: 60 }}
            />
            <Tab
              icon={getTabIcon(1)}
              label={getTabLabel(1)}
              iconPosition="start"
              sx={{ minHeight: 60 }}
            />
            <Tab
              icon={getTabIcon(2)}
              label={getTabLabel(2)}
              iconPosition="start"
              sx={{ minHeight: 60 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <StyledTabPanel isDarkMode={isDarkMode}>
          {/* Table Selection Tab */}
          {tabValue === 0 && (
            <TableSelectionArea
              tables={tables}
              sections={sections}
              selectedTable={selectedTable}
              onTableSelect={onTableSelect}
              onTableDetails={onTableDetails}
              loading={tablesLoading}
              error={tablesError}
              viewMode="grid"
            />
          )}

          {/* Product Selection Tab */}
          {tabValue === 1 && (
            <ProductSelectionArea
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              onProductSelect={onProductSelect}
              onProductDetails={onProductDetails}
              loading={productsLoading}
              error={productsError}
              viewMode="grid"
            />
          )}

          {/* Cart Tab */}
          {tabValue === 2 && (
            <OrderCartArea
              order={order}
              items={order.items || []}
              onItemUpdate={onItemUpdate}
              onItemRemove={onItemRemove}
              onClearCart={onClearCart}
              onCheckout={onCheckout}
              onAddItem={onAddItem}
              loading={cartLoading}
              error={cartError}
              showTableInfo={true}
              showActions={true}
            />
          )}
        </StyledTabPanel>
      </StyledMainContent>

      {/* Floating Cart Button for non-cart tabs */}
      {tabValue !== 2 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <IconButton
            onClick={handleCartToggle}
            sx={{
              backgroundColor: isDarkMode ? '#2c5282' : '#1e3a5f',
              color: '#ffffff',
              width: 56,
              height: 56,
              boxShadow: theme.shadows[4],
              '&:hover': {
                backgroundColor: isDarkMode ? '#3182ce' : '#2563eb',
                transform: 'scale(1.1)',
              },
            }}
          >
            <CartIcon />
            {order.items?.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                }}
              >
                {order.items.length}
              </Box>
            )}
          </IconButton>
        </Box>
      )}
    </StyledContainer>
  );
};

export default TabletLayout;