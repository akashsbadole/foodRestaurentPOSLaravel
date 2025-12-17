import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Grid,
  useTheme
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  LocalOffer as DiscountIcon,
  AccountBalance as TaxIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../../Components/ThemeProvider';

const StyledContainer = styled(Box)(({ theme, isDarkMode }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: isDarkMode
      ? 'linear-gradient(90deg, #2c5282 0%, #3182ce 50%, #2c5282 100%)'
      : 'linear-gradient(90deg, #1e3a5f 0%, #2563eb 50%, #1e3a5f 100%)',
    backgroundSize: '200% 100%',
    animation: 'gradientShift 3s ease infinite',
  },
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const SummaryRow = styled(Box)(({ theme, isHighlighted, isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isHighlighted 
    ? (isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)')
    : 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': isHighlighted && {
    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.3)' : 'rgba(30, 58, 95, 0.08)',
  },
}));

const OrderSummary = ({
  items = [],
  subtotal = 0,
  tax = 0,
  discount = 0,
  serviceCharge = 0,
  total = 0,
  currency = 'USD',
  showBreakdown = true,
  compact = false
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculateTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotalDiscount = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const discountAmount = (itemTotal * item.discount) / 100;
      return total + discountAmount;
    }, 0);
  };

  const totalItems = calculateTotalItems();
  const totalDiscount = calculateTotalDiscount();

  if (compact) {
    return (
      <Box>
        <SummaryRow isHighlighted isDarkMode={isDarkMode}>
          <Typography variant="body1" color="text.secondary">
            Total ({totalItems} items):
          </Typography>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              background: isDarkMode
                ? 'linear-gradient(45deg, #60a5fa, #90caf9)'
                : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {formatCurrency(total)}
          </Typography>
        </SummaryRow>
      </Box>
    );
  }

  return (
    <StyledContainer isDarkMode={isDarkMode}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ReceiptIcon color="primary" />
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          Order Summary
        </Typography>
      </Box>

      {/* Item Count */}
      <SummaryRow isDarkMode={isDarkMode}>
        <Typography variant="body2" color="text.secondary">
          Items:
        </Typography>
        <Typography variant="body2" fontWeight="500">
          {totalItems}
        </Typography>
      </SummaryRow>

      {showBreakdown && (
        <>
          {/* Subtotal */}
          <SummaryRow isDarkMode={isDarkMode}>
            <Typography variant="body2" color="text.secondary">
              Subtotal:
            </Typography>
            <Typography variant="body2" fontWeight="500">
              {formatCurrency(subtotal)}
            </Typography>
          </SummaryRow>

          {/* Discount */}
          {totalDiscount > 0 && (
            <SummaryRow isHighlighted isDarkMode={isDarkMode}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <DiscountIcon fontSize="small" color="error.main" />
                <Typography variant="body2" color="error.main">
                  Discount:
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="500" color="error.main">
                -{formatCurrency(totalDiscount)}
              </Typography>
            </SummaryRow>
          )}

          {/* Tax */}
          {tax > 0 && (
            <SummaryRow isDarkMode={isDarkMode}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <TaxIcon fontSize="small" color="text.secondary" />
                <Typography variant="body2" color="text.secondary">
                  Tax (10%):
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="500">
                {formatCurrency(tax)}
              </Typography>
            </SummaryRow>
          )}

          {/* Service Charge */}
          {serviceCharge > 0 && (
            <SummaryRow isDarkMode={isDarkMode}>
              <Typography variant="body2" color="text.secondary">
                Service Charge:
              </Typography>
              <Typography variant="body2" fontWeight="500">
                {formatCurrency(serviceCharge)}
              </Typography>
            </SummaryRow>
          )}

          <Divider sx={{ my: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />
        </>
      )}

      {/* Total */}
      <SummaryRow isHighlighted isDarkMode={isDarkMode}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color="text.primary"
        >
          Total:
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            background: isDarkMode
              ? 'linear-gradient(45deg, #60a5fa, #90caf9)'
              : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '1.5rem',
          }}
        >
          {formatCurrency(total)}
        </Typography>
      </SummaryRow>

      {/* Additional Info */}
      {items.length > 0 && (
        <Box mt={2} pt={2} borderTop={`1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`}>
          <Typography variant="caption" color="text.secondary" align="center">
            Prices include tax where applicable
          </Typography>
          {totalDiscount > 0 && (
            <Typography variant="caption" color="success.main" align="center" sx={{ mt: 0.5 }}>
              You saved {formatCurrency(totalDiscount)}!
            </Typography>
          )}
        </Box>
      )}
    </StyledContainer>
  );
};

export default OrderSummary;