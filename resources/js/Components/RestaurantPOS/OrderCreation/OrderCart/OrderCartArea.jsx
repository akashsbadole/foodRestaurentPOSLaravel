import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Receipt as CheckoutIcon,
  Restaurant as TableIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../../Components/ThemeProvider';
import OrderItemCard from './OrderItemCard';
import OrderSummary from './OrderSummary';

const StyledContainer = styled(Box, {
  shouldForwardProp: (prop) => !['isEmpty'].includes(prop)
})(({ theme, isEmpty, isDarkMode }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  overflow: 'hidden',
  position: 'relative',
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

const StyledFooter = styled(Box)(({ theme, isDarkMode }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  backgroundColor: isDarkMode 
    ? 'rgba(30, 58, 95, 0.1)'
    : 'rgba(30, 58, 95, 0.02)',
}));

const EmptyCartMessage = styled(Box)(({ theme, isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const OrderCartArea = ({
  order = {},
  items = [],
  onItemUpdate,
  onItemRemove,
  onClearCart,
  onCheckout,
  onAddItem,
  loading = false,
  error = null,
  currency = 'USD',
  compact = false,
  showTableInfo = true,
  showActions = true
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const isEmpty = items.length === 0;

  const handleClearCart = () => {
    onClearCart?.();
  };

  const handleCheckout = () => {
    if (!isEmpty) {
      onCheckout?.();
    }
  };

  const handleAddItem = () => {
    onAddItem?.();
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const modifiersTotal = item.modifiers?.reduce((modTotal, modifier) => {
        return modTotal + (modifier.price * modifier.quantity * item.quantity);
      }, 0) || 0;
      return total + itemTotal + modifiersTotal;
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  return (
    <StyledContainer isEmpty={isEmpty} isDarkMode={isDarkMode}>
      {/* Header */}
      <StyledHeader isDarkMode={isDarkMode}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <CartIcon color="primary" />
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Current Order
            </Typography>
            {!isEmpty && (
              <Box
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  ml: 1,
                }}
              >
                <Typography variant="caption" color="primary.main" fontWeight="600">
                  {items.length} items
                </Typography>
              </Box>
            )}
          </Box>
          
          {showActions && !isEmpty && (
            <IconButton
              onClick={handleClearCart}
              size="small"
              sx={{
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                color: isDarkMode ? '#f87171' : '#dc2626',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                },
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Table Info */}
        {showTableInfo && order.selectedTable && (
          <Box
            mt={2}
            sx={{
              backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
              px: 1.5,
              py: 1,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <TableIcon fontSize="small" color="primary.main" />
            <Typography variant="body2" color="text.primary" fontWeight="500">
              Table: {order.selectedTable.name || `T${order.selectedTable.table_number}`}
            </Typography>
            {order.customerCount && (
              <>
                <Typography variant="body2" color="text.secondary">
                  •
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PeopleIcon fontSize="small" />
                  <Typography variant="body2" color="text.primary" fontWeight="500">
                    {order.customerCount} guests
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </StyledHeader>

      {/* Content */}
      <StyledContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isEmpty ? (
          <EmptyCartMessage isDarkMode={isDarkMode}>
            <CartIcon
              sx={{
                fontSize: 64,
                color: 'text.secondary',
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add items from the menu to get started
            </Typography>
            {showActions && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{
                  background: isDarkMode
                    ? 'linear-gradient(45deg, #2c5282, #3182ce)'
                    : 'linear-gradient(45deg, #1e3a5f, #2563eb)',
                  '&:hover': {
                    background: isDarkMode
                      ? 'linear-gradient(45deg, #3182ce, #60a5fa)'
                      : 'linear-gradient(45deg, #2563eb, #3b82f6)',
                  },
                }}
              >
                Add Items
              </Button>
            )}
          </EmptyCartMessage>
        ) : (
          <Box>
            {/* Order Items */}
            {items.map((item) => (
              <Box key={item.id} mb={2}>
                <OrderItemCard
                  item={item}
                  onQuantityChange={onItemUpdate}
                  onPriceChange={onItemUpdate}
                  onModifierChange={onItemUpdate}
                  onRemove={onItemRemove}
                  compact={compact}
                  showControls={showActions}
                  currency={currency}
                />
              </Box>
            ))}

            {/* Order Summary */}
            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              total={total}
              currency={currency}
              compact={compact}
              showBreakdown={!compact}
            />
          </Box>
        )}
      </StyledContent>

      {/* Footer */}
      {showActions && !isEmpty && (
        <StyledFooter isDarkMode={isDarkMode}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleCheckout}
            disabled={loading}
            startIcon={<CheckoutIcon />}
            sx={{
              py: 1.5,
              background: isDarkMode
                ? 'linear-gradient(45deg, #2c5282, #3182ce)'
                : 'linear-gradient(45deg, #1e3a5f, #2563eb)',
              boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: isDarkMode
                  ? 'linear-gradient(45deg, #3182ce, #60a5fa)'
                  : 'linear-gradient(45deg, #2563eb, #3b82f6)',
                boxShadow: '0 6px 25px rgba(30, 58, 95, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            {loading ? 'Processing...' : `Checkout ${currency} ${total.toFixed(2)}`}
          </Button>
        </StyledFooter>
      )}
    </StyledContainer>
  );
};

export default OrderCartArea;