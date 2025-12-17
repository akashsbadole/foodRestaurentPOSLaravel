import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../ThemeProvider';
import useOrderCreation from './Hooks/useOrderCreation';
import OrderCreationLayout from './Layout/OrderCreationLayout';

const StyledContainer = styled(Box)(({ theme, isDarkMode }) => ({
  minHeight: '100vh',
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
}));

const POSOrderCreation = ({
  // Initial data
  initialOrder = {},
  initialTables = [],
  initialProducts = [],
  initialCategories = [],
  
  // API callbacks
  onOrderSubmit,
  onTableFetch,
  onProductFetch,
  onCategoryFetch,
  
  // Navigation
  onCancel,
  onSuccess
}) => {
  const { isDarkMode } = useThemeContext();
  
  // Order creation hook
  const {
    state,
    loadingStates,
    errors,
    
    // Actions
    selectTable,
    addProduct,
    updateItem,
    removeItem,
    clearCart,
    updateOrderData,
    resetOrder,
    setActiveSection,
    setSelectedCategory,
    setSearchTerm,
    openModifiersDialog,
    closeModifiersDialog,
    openCheckoutDialog,
    closeCheckoutDialog,
    setEditingItem,
    clearEditingItem,
    setLoading,
    setFieldError,
    clearErrors,
    clearFieldError,
    
    // Calculations
    calculateSubtotal,
    calculateTax,
    calculateTotal,
    
    // Validation
    validateOrder,
    
    // Data preparation
    prepareSubmissionData
  } = useOrderCreation(initialOrder);

  // Local state
  const [tables, setTables] = useState(initialTables);
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    // Load tables
    if (tables.length === 0 && onTableFetch) {
      setLoading('tables', true);
      onTableFetch()
        .then(response => {
          const tablesData = response.data || response || [];
          setTables(tablesData);
          setLoading('tables', false);
        })
        .catch(error => {
          setFieldError('tables', error.message || 'Failed to load tables');
          setLoading('tables', false);
        });
    }

    // Load products
    if (products.length === 0 && onProductFetch) {
      setLoading('products', true);
      onProductFetch()
        .then(response => {
          const productsData = response.data || response || [];
          setProducts(productsData);
          setLoading('products', false);
        })
        .catch(error => {
          setFieldError('products', error.message || 'Failed to load products');
          setLoading('products', false);
        });
    }

    // Load categories
    if (categories.length === 0 && onCategoryFetch) {
      setLoading('categories', true);
      onCategoryFetch()
        .then(response => {
          const categoriesData = response.data || response || [];
          setCategories(categoriesData);
          setLoading('categories', false);
        })
        .catch(error => {
          setFieldError('categories', error.message || 'Failed to load categories');
          setLoading('categories', false);
        });
    }
  }, []);

  // Handle table selection
  const handleTableSelect = (table) => {
    selectTable(table);
    updateOrderData({
      table_id: table.id,
      table_name: table.name,
      order_type: 'dine_in'
    });
    clearFieldError('table_id');
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    addProduct(product);
    setActiveSection('cart');
    clearFieldError('items');
  };

  // Handle item updates
  const handleItemUpdate = (itemId, updates) => {
    updateItem(itemId, updates);
  };

  // Handle item removal
  const handleItemRemove = (itemId) => {
    removeItem(itemId);
  };

  // Handle cart clear
  const handleClearCart = () => {
    clearCart();
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!validateOrder()) {
      return;
    }

    setCheckoutDialogOpen(true);
  };

  // Handle order submission
  const handleSubmit = () => {
    if (!validateOrder()) {
      return;
    }

    setLoading('submitting', true);
    
    const submissionData = prepareSubmissionData();
    
    onOrderSubmit(submissionData)
      .then(response => {
        setLoading('submitting', false);
        setCheckoutDialogOpen(false);
        resetOrder();
        onSuccess?.(response);
      })
      .catch(error => {
        setLoading('submitting', false);
        setFieldError('submit', error.message || 'Failed to create order');
      });
  };

  // Handle cancel
  const handleCancel = () => {
    onCancel?.();
  };

  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // Handle back navigation
  const handleBack = () => {
    if (state.activeSection === 'cart') {
      setActiveSection('menu');
    } else if (state.activeSection === 'menu') {
      setActiveSection('table');
    } else {
      handleCancel();
    }
  };

  // Handle add item (for empty cart)
  const handleAddItem = () => {
    setActiveSection('menu');
  };

  return (
    <StyledContainer isDarkMode={isDarkMode}>
      {/* Main Layout */}
      <OrderCreationLayout
        // Data
        tables={tables}
        sections={categories || []}
        products={products}
        categories={categories}
        order={state}
        
        // Table selection props
        selectedTable={state.selectedTable}
        onTableSelect={handleTableSelect}
        onTableDetails={(table) => console.log('Table details:', table)}
        tablesLoading={loadingStates.tables}
        tablesError={errors.tables}
        
        // Product selection props
        selectedCategory={state.selectedCategory}
        onProductSelect={handleProductSelect}
        onProductDetails={(product) => console.log('Product details:', product)}
        productsLoading={loadingStates.products}
        productsError={errors.products}
        
        // Cart props
        onItemUpdate={handleItemUpdate}
        onItemRemove={handleItemRemove}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
        onAddItem={handleAddItem}
        cartLoading={loadingStates.submitting}
        cartError={errors.submit}
        
        // UI state
        searchTerm={state.searchTerm}
        onSearchChange={setSearchTerm}
        activeSection={state.activeSection}
        onSectionChange={handleSectionChange}
        onBack={handleBack}
      />

      {/* Checkout Confirmation Dialog */}
      <Dialog
        open={checkoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle>
          Confirm Order
        </DialogTitle>
        
        <DialogContent>
          {/* Order Summary */}
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            
            {/* Table Info */}
            {state.selectedTable && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Table: {state.selectedTable.name || `T${state.selectedTable.table_number}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Guests: {state.customerCount}
                </Typography>
              </Box>
            )}
            
            {/* Items Count */}
            <Typography variant="body2" color="text.secondary">
              Items: {state.items.length}
            </Typography>
            
            {/* Totals */}
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                Subtotal: ${calculateSubtotal().toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tax: ${calculateTax().toFixed(2)}
              </Typography>
              <Typography variant="h6" color="primary.main">
                Total: ${calculateTotal().toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {/* Special Instructions */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Special Instructions"
            value={state.specialInstructions}
            onChange={(e) => updateOrderData({ specialInstructions: e.target.value })}
            placeholder="Add any special instructions for this order..."
          />
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => setCheckoutDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={loadingStates.submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loadingStates.submitting}
            sx={{
              background: isDarkMode
                ? 'linear-gradient(45deg, #2c5282, #3182ce)'
                : 'linear-gradient(45deg, #1e3a5f, #2563eb)',
            }}
          >
            {loadingStates.submitting ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Display */}
      {errors.submit && (
        <Alert
          severity="error"
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            right: 20,
            zIndex: 2000,
          }}
        >
          {errors.submit}
        </Alert>
      )}
    </StyledContainer>
  );
};

export default POSOrderCreation;