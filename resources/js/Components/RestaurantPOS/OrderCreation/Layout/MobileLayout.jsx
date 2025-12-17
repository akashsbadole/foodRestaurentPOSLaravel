import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Badge,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ShoppingCart as CartIcon,
  TableRestaurant as TableIcon,
  RestaurantMenu as ProductIcon,
  Home as HomeIcon
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
  padding: theme.spacing(1),
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
}));

const MobileLayout = ({
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
  onSectionChange,
  onBack
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  
  const [tabValue, setTabValue] = useState(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    onSectionChange?.(['table', 'menu', 'cart'][newValue]);
  };

  const handleCartToggle = () => {
    setCartDrawerOpen(!cartDrawerOpen);
  };

  const handleBack = () => {
    onBack?.();
  };

  const getTabIcon = (index) => {
    switch (index) {
      case 0: return <TableIcon />;
      case 1: return <ProductIcon />;
      case 2: return <CartIcon />;
      default: return <HomeIcon />;
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
      {/* App Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: isDarkMode 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <Toolbar>
          {/* Back Button */}
          {onBack && (
            <IconButton
              edge="start"
              onClick={handleBack}
              sx={{
                color: isDarkMode ? '#cbd5e1' : '#475569',
                marginRight: 1,
              }}
            >
              <BackIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              color: isDarkMode ? '#f8fafc' : '#1e293b',
            }}
          >
            Create Order
          </Typography>

          {/* Cart Button */}
          <IconButton
            onClick={handleCartToggle}
            sx={{
              color: isDarkMode ? '#cbd5e1' : '#475569',
            }}
          >
            <Badge
              badgeContent={order.items?.length || 0}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  height: 16,
                  minWidth: 16,
                }
              }}
            >
              <CartIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <StyledMainContent>
        {/* Navigation Tabs */}
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
              minHeight: 50,
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
            sx={{ minHeight: 50 }}
          />
          <Tab
            icon={getTabIcon(1)}
            label={getTabLabel(1)}
            iconPosition="start"
            sx={{ minHeight: 50 }}
          />
          <Tab
            icon={getTabIcon(2)}
            label={getTabLabel(2)}
            iconPosition="start"
            sx={{ minHeight: 50 }}
          />
        </Tabs>

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
              compact={false}
            />
          )}
        </StyledTabPanel>
      </StyledMainContent>
    </StyledContainer>
  );
};

export default MobileLayout;