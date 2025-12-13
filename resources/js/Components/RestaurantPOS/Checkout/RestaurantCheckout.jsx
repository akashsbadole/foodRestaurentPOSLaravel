import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Divider,
  IconButton,
  Chip,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CreditCard as CreditCardIcon,
  Payments as CashIcon,
  Smartphone as SmartphoneIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from '../../../Components/ThemeProvider';
import SplitBillDialog from './SplitBillDialog';
import TipManagement from './TipManagement';

const CheckoutCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  margin: '0 auto',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(145deg, #1a2332 0%, #243447 100%)'
    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  border: `1px solid ${theme.palette.mode === 'dark' ? '#2c3e50' : '#e2e8f0'}`,
  borderRadius: 16,
  overflow: 'hidden',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%)',
    backgroundSize: '200% 100%',
    animation: 'gradientShift 3s ease infinite',
  },
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(30, 58, 95, 0.4)'
      : '0 12px 40px rgba(30, 58, 95, 0.15)',
    transform: 'translateY(-4px) scale(1.02)',
  },
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const PaymentMethodCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : `2px solid ${theme.palette.divider}`,
  backgroundColor: selected
    ? (theme.palette.mode === 'dark' ? 'rgba(30, 58, 95, 0.2)' : theme.palette.primary.light)
    : (theme.palette.mode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : theme.palette.background.paper),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: 12,
  position: 'relative',
  overflow: 'hidden',
  '&:before': selected ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)',
    animation: 'pulse 2s infinite',
  } : {},
  '&:hover': {
    transform: 'translateY(-4px) scale(1.05)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 25px rgba(30, 58, 95, 0.4)'
      : '0 8px 25px rgba(30, 58, 95, 0.2)',
    backgroundColor: selected
      ? (theme.palette.mode === 'dark' ? 'rgba(30, 58, 95, 0.3)' : theme.palette.primary.light)
      : (theme.palette.mode === 'dark' ? 'rgba(45, 55, 72, 0.8)' : theme.palette.action.hover),
  },
  '&:active': {
    transform: 'translateY(-2px) scale(1.02)',
  },
  '@keyframes pulse': {
    '0%': { opacity: 0.3 },
    '50%': { opacity: 0.6 },
    '100%': { opacity: 0.3 },
  },
}));

const RestaurantCheckout = ({
  order,
  onPaymentProcess,
  onPrintReceipt,
  onShareReceipt,
  onOrderEdit,
  onClose,
  showSplitBill = true,
  showTips = true,
  allowPartialPayment = true,
  supportedPaymentMethods = ['cash', 'card', 'mobile']
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [splitBill, setSplitBill] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [customerNotes, setCustomerNotes] = useState('');
  const [splitItems, setSplitItems] = useState([]);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (order) {
      setSplitBill(false);
      setTipAmount(0);
      setTipPercentage(0);
      setAppliedDiscount(order.discount || 0);
      setCustomerNotes(order.customer_notes || '');
      setSplitItems([]);
    }
  }, [order]);

  const calculateSubtotal = () => {
    if (!order?.items) return 0;
    return order.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const modifiersTotal = item.modifiers?.reduce((modTotal, modifier) => {
        return modTotal + (modifier.price * modifier.quantity * item.quantity);
      }, 0) || 0;
      return total + itemTotal + modifiersTotal;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (order.tax_rate || 0.08); // Default 8% tax
  };

  const calculateServiceCharge = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (order.service_charge_rate || 0.10); // Default 10% service charge
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateServiceCharge() - appliedDiscount + tipAmount;
  };

  const calculatePerPersonTotal = () => {
    if (!splitBill || splitItems.length === 0) return calculateTotal();
    return calculateTotal() / splitItems.length;
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setErrors(prev => ({ ...prev, paymentMethod: '' }));
  };

  const handleTipChange = (amount, percentage = 0) => {
    setTipAmount(amount);
    setTipPercentage(percentage);
  };

  const handleSplitBill = () => {
    setShowSplitDialog(true);
  };

  const handleSplitConfirm = (items) => {
    setSplitItems(items);
    setSplitBill(true);
    setShowSplitDialog(false);
  };

  const handleTipConfirm = (amount, percentage) => {
    setTipAmount(amount);
    setTipPercentage(percentage);
    setShowTipDialog(false);
  };

  const handlePayment = () => {
    const newErrors = {};

    if (!selectedPaymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onPaymentProcess?.({
      orderId: order.id,
      paymentMethod: selectedPaymentMethod,
      amount: calculateTotal(),
      tipAmount,
      tipPercentage,
      splitBill,
      splitItems,
      appliedDiscount,
      customerNotes
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return <CashIcon />;
      case 'card': return <CreditCardIcon />;
      case 'mobile': return <SmartphoneIcon />;
      default: return <CashIcon />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Credit/Debit Card';
      case 'mobile': return 'Mobile Payment';
      default: return 'Cash';
    }
  };

  if (!order) {
    return (
      <Alert severity="info">
        No order selected for checkout
      </Alert>
    );
  }

  return (
    <CheckoutCard elevation={3}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          sx={{
            pb: 2,
            borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: '60px',
              height: 2,
              background: 'linear-gradient(90deg, #1e3a5f 0%, #2c5282 100%)',
            },
          }}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                background: isDarkMode
                  ? 'linear-gradient(45deg, #64b5f6, #90caf9)'
                  : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}
            >
              Checkout
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mt: 0.5,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Badge 
                badgeContent={order.items?.length || 0} 
                color="primary"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
              >
                Order #{order.order_number || order.id}
              </Badge>
            </Typography>
          </Box>
          <Box display="flex" gap={0.5}>
            <IconButton
              onClick={() => setShowTipDialog(true)}
              disabled={!showTips}
              sx={{
                color: theme.palette.mode === 'dark' ? '#90caf9' : '#1e3a5f',
                background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                borderRadius: 12,
                width: 40,
                height: 40,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(30, 58, 95, 0.15)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <ReceiptIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={onPrintReceipt}
              sx={{
                color: theme.palette.mode === 'dark' ? '#90caf9' : '#1e3a5f',
                background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                borderRadius: 12,
                width: 40,
                height: 40,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(30, 58, 95, 0.15)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={onShareReceipt}
              sx={{
                color: theme.palette.mode === 'dark' ? '#90caf9' : '#1e3a5f',
                background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                borderRadius: 12,
                width: 40,
                height: 40,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(30, 58, 95, 0.15)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={onOrderEdit}
              sx={{
                color: theme.palette.mode === 'dark' ? '#90caf9' : '#1e3a5f',
                background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                borderRadius: 12,
                width: 40,
                height: 40,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(30, 58, 95, 0.15)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Order Info */}
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
            {order.table_name && (
              <Chip
                icon={<RestaurantIcon fontSize="small" />}
                label={`Table: ${order.table_name}`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 20,
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.2) 0%, rgba(44, 82, 130, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                  borderColor: isDarkMode ? 'rgba(144, 202, 249, 0.3)' : 'rgba(30, 58, 95, 0.2)',
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                  fontWeight: 500,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 2px 8px rgba(30, 58, 95, 0.2)',
                  },
                }}
              />
            )}
            {order.guest_count && (
              <Chip
                icon={<PeopleIcon fontSize="small" />}
                label={`${order.guest_count} guests`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 20,
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.2) 0%, rgba(44, 82, 130, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                  borderColor: isDarkMode ? 'rgba(144, 202, 249, 0.3)' : 'rgba(30, 58, 95, 0.2)',
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                  fontWeight: 500,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 2px 8px rgba(30, 58, 95, 0.2)',
                  },
                }}
              />
            )}
            {splitBill && (
              <Chip
                label={`Split: ${splitItems.length} ways`}
                size="small"
                color="primary"
                sx={{
                  borderRadius: 20,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                  color: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 2px 8px rgba(30, 58, 95, 0.4)',
                  },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Order Summary */}
        <Box 
          mb={2}
          sx={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(44, 82, 130, 0.03) 100%)',
            borderRadius: 12,
            p: 2,
            border: `1px solid ${isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.08)'}`,
          }}
        >
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: isDarkMode ? '#90caf9' : '#1e3a5f',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <ReceiptIcon fontSize="small" />
            Order Summary
          </Typography>
          
          {order.items?.slice(0, 3).map((item, index) => (
            <Box 
              key={index} 
              display="flex" 
              justifyContent="space-between" 
              py={0.8}
              sx={{
                borderBottom: index < Math.min(2, order.items.length - 1) 
                  ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` 
                  : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(30, 58, 95, 0.02)',
                  px: 1,
                  mx: -1,
                  borderRadius: 4,
                },
              }}
            >
              <Typography 
                variant="body2"
                sx={{ 
                  fontWeight: 500,
                  color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
                }}
              >
                {item.quantity}x {item.name}
              </Typography>
              <Typography 
                variant="body2"
                sx={{ 
                  fontWeight: 600,
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                }}
              >
                {formatCurrency(item.price * item.quantity)}
              </Typography>
            </Box>
          ))}
          
          {order.items?.length > 3 && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 1,
                fontWeight: 500,
                color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              }}
            >
              +{order.items.length - 3} more items
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Price Breakdown */}
        <Box 
          mb={2}
          sx={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(44, 82, 130, 0.03) 100%)',
            borderRadius: 12,
            p: 2,
            border: `1px solid ${isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.08)'}`,
          }}
        >
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Subtotal:
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography 
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {formatCurrency(calculateSubtotal())}
              </Typography>
            </Grid>
            
            {calculateTax() > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Tax:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography 
                    variant="body2"
                    sx={{ fontWeight: 600, color: isDarkMode ? '#81c784' : '#2e7d32' }}
                  >
                    {formatCurrency(calculateTax())}
                  </Typography>
                </Grid>
              </>
            )}

            {calculateServiceCharge() > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Service Charge:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography 
                    variant="body2"
                    sx={{ fontWeight: 600, color: isDarkMode ? '#64b5f6' : '#1976d2' }}
                  >
                    {formatCurrency(calculateServiceCharge())}
                  </Typography>
                </Grid>
              </>
            )}

            {appliedDiscount > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Discount:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      color: isDarkMode ? '#e57373' : '#d32f2f',
                    }}
                  >
                    -{formatCurrency(appliedDiscount)}
                  </Typography>
                </Grid>
              </>
            )}

            {tipAmount > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Tip ({tipPercentage}%):
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography 
                    variant="body2"
                    sx={{ 
                      fontWeight: 600, 
                      color: isDarkMode ? '#81c784' : '#2e7d32',
                    }}
                  >
                    {formatCurrency(tipAmount)}
                  </Typography>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Divider sx={{ 
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(30, 58, 95, 0.1)',
                my: 1,
              }} />
            </Grid>

            <Grid item xs={6}>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                sx={{
                  background: isDarkMode
                    ? 'linear-gradient(45deg, #64b5f6, #90caf9)'
                    : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {splitBill ? 'Per Person:' : 'Total:'}
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                sx={{
                  background: 'linear-gradient(45deg, #1e3a5f 0%, #2c5282 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '1.4rem',
                }}
              >
                {formatCurrency(splitBill ? calculatePerPersonTotal() : calculateTotal())}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Split Bill */}
        {showSplitBill && (
          <Box 
            mb={2}
            sx={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(44, 82, 130, 0.03) 100%)',
              borderRadius: 12,
              p: 2,
              border: `1px solid ${isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.08)'}`,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={splitBill}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleSplitBill();
                    } else {
                      setSplitBill(false);
                      setSplitItems([]);
                    }
                  }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#1e3a5f',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'rgba(30, 58, 95, 0.3)',
                    },
                  }}
                />
              }
              label={
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: isDarkMode ? '#90caf9' : '#1e3a5f',
                  }}
                >
                  Split Bill
                </Typography>
              }
            />
            
            {splitBill && (
              <Box mt={1.5}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSplitBill}
                  startIcon={<EditIcon />}
                  sx={{
                    borderRadius: 20,
                    borderColor: isDarkMode ? 'rgba(144, 202, 249, 0.3)' : 'rgba(30, 58, 95, 0.2)',
                    color: isDarkMode ? '#90caf9' : '#1e3a5f',
                    fontWeight: 500,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: isDarkMode ? '#90caf9' : '#1e3a5f',
                      backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  Configure Split ({splitItems.length} ways)
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Payment Methods */}
        <Box mb={2}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: isDarkMode ? '#90caf9' : '#1e3a5f',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 2,
            }}
          >
            <CreditCardIcon fontSize="small" />
            Payment Method
          </Typography>
          
          <Grid container spacing={1.5}>
            {supportedPaymentMethods.map((method) => (
              <Grid item xs={12} sm={4} key={method}>
                <PaymentMethodCard
                  selected={selectedPaymentMethod === method}
                  onClick={() => handlePaymentMethodChange(method)}
                  sx={{ 
                    p: 2.5, 
                    textAlign: 'center',
                    minHeight: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <Box 
                    sx={{
                      color: selected 
                        ? (isDarkMode ? '#90caf9' : '#1e3a5f')
                        : (isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {getPaymentMethodIcon(method)}
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: selected ? 600 : 500,
                      color: selected 
                        ? (isDarkMode ? '#90caf9' : '#1e3a5f')
                        : (isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'),
                    }}
                  >
                    {getPaymentMethodLabel(method)}
                  </Typography>
                </PaymentMethodCard>
              </Grid>
            ))}
          </Grid>

          {errors.paymentMethod && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                borderRadius: 8,
                backgroundColor: isDarkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                border: `1px solid ${isDarkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)'}`,
              }}
            >
              {errors.paymentMethod}
            </Alert>
          )}
        </Box>

        {/* Customer Notes */}
        <Box mb={2}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Customer Notes"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Add any notes for the customer..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 12,
                backgroundColor: isDarkMode 
                  ? 'rgba(30, 58, 95, 0.1)' 
                  : 'rgba(30, 58, 95, 0.02)',
                border: `1px solid ${isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.08)'}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: isDarkMode ? 'rgba(144, 202, 249, 0.3)' : 'rgba(30, 58, 95, 0.2)',
                },
                '&.Mui-focused': {
                  borderColor: isDarkMode ? '#90caf9' : '#1e3a5f',
                  boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(144, 202, 249, 0.2)' : 'rgba(30, 58, 95, 0.1)'}`,
                },
              },
              '& .MuiInputLabel-root': {
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                fontWeight: 500,
                '&.Mui-focused': {
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                },
              },
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Box display="flex" gap={1.5} flexDirection="column">
          <Button
            variant="contained"
            size="large"
            onClick={handlePayment}
            startIcon={getPaymentMethodIcon(selectedPaymentMethod)}
            sx={{
              borderRadius: 12,
              py: 1.5,
              background: 'linear-gradient(45deg, #1e3a5f 0%, #2c5282 100%)',
              boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(45deg, #2c5282 0%, #1e3a5f 100%)',
                boxShadow: '0 6px 25px rgba(30, 58, 95, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            Pay {formatCurrency(calculateTotal())}
          </Button>
          
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderRadius: 12,
              py: 1.2,
              borderColor: isDarkMode ? 'rgba(144, 202, 249, 0.3)' : 'rgba(30, 58, 95, 0.2)',
              color: isDarkMode ? '#90caf9' : '#1e3a5f',
              fontWeight: 500,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'none',
              '&:hover': {
                borderColor: isDarkMode ? '#90caf9' : '#1e3a5f',
                backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </CardContent>

      {/* Split Bill Dialog */}
      <SplitBillDialog
        open={showSplitDialog}
        onClose={() => setShowSplitDialog(false)}
        onConfirm={handleSplitConfirm}
        order={order}
        initialSplitItems={splitItems}
      />

      {/* Tip Management Dialog */}
      <TipManagement
        open={showTipDialog}
        onClose={() => setShowTipDialog(false)}
        onConfirm={handleTipConfirm}
        subtotal={calculateSubtotal()}
        initialTip={tipAmount}
        initialPercentage={tipPercentage}
      />
    </CheckoutCard>
  );
};

export default RestaurantCheckout;