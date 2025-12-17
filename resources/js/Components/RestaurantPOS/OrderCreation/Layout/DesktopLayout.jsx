import React from 'react';
import {
  Box,
  Grid,
  useTheme
} from '@mui/material';
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
  overflow: 'hidden',
}));

const DesktopLayout = ({
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

  const handleSectionChange = (section) => {
    onSectionChange?.(section);
  };

  return (
    <StyledContainer isDarkMode={isDarkMode}>
      {/* Main Content Area */}
      <StyledMainContent>
        <Grid container sx={{ height: '100%' }}>
          {/* Table Selection Area - Left Column */}
          <Grid
            item
            xs={12}
            md={3}
            sx={{
              height: '100%',
              borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            }}
          >
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
          </Grid>

          {/* Product Selection Area - Center Column */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              height: '100%',
              borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            }}
          >
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
          </Grid>

          {/* Order Cart Area - Right Column */}
          <Grid
            item
            xs={12}
            md={3}
            sx={{
              height: '100%',
            }}
          >
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
          </Grid>
        </Grid>
      </StyledMainContent>
    </StyledContainer>
  );
};

export default DesktopLayout;