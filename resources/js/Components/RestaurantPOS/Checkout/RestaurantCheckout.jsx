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
import SplitBillDialog from './SplitBillDialog';
import TipManagement from './TipManagement';

const CheckoutCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  margin: '0 auto',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[8],
  },
}));

const PaymentMethodCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : `2px solid ${theme.palette.divider}`,
  backgroundColor: selected ? theme.palette.primary.light : theme.palette.background.paper,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Checkout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order #{order.order_number || order.id}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton onClick={() => setShowTipDialog(true)} disabled={!showTips}>
              <ReceiptIcon />
            </IconButton>
            <IconButton onClick={onPrintReceipt}>
              <PrintIcon />
            </IconButton>
            <IconButton onClick={onShareReceipt}>
              <ShareIcon />
            </IconButton>
            <IconButton onClick={onOrderEdit}>
              <EditIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Order Info */}
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            {order.table_name && (
              <Chip
                icon={<RestaurantIcon />}
                label={`Table: ${order.table_name}`}
                size="small"
                variant="outlined"
              />
            )}
            {order.guest_count && (
              <Chip
                icon={<PeopleIcon />}
                label={`${order.guest_count} guests`}
                size="small"
                variant="outlined"
              />
            )}
            {splitBill && (
              <Chip
                label={`Split: ${splitItems.length} ways`}
                size="small"
                color="primary"
              />
            )}
          </Box>
        </Box>

        {/* Order Summary */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Order Summary
          </Typography>
          
          {order.items?.slice(0, 3).map((item, index) => (
            <Box key={index} display="flex" justifyContent="space-between" py={0.5}>
              <Typography variant="body2">
                {item.quantity}x {item.name}
              </Typography>
              <Typography variant="body2">
                {formatCurrency(item.price * item.quantity)}
              </Typography>
            </Box>
          ))}
          
          {order.items?.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{order.items.length - 3} more items
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Price Breakdown */}
        <Box mb={2}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Subtotal:
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="body2">
                {formatCurrency(calculateSubtotal())}
              </Typography>
            </Grid>
            
            {calculateTax() > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                Tax:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2">
                    {formatCurrency(calculateTax())}
                  </Typography>
                </Grid>
              </>
            )}

            {calculateServiceCharge() > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Service Charge:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2">
                    {formatCurrency(calculateServiceCharge())}
                  </Typography>
                </Grid>
              </>
            )}

            {appliedDiscount > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Discount:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2" color="error.main">
                    -{formatCurrency(appliedDiscount)}
                  </Typography>
                </Grid>
              </>
            )}

            {tipAmount > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tip ({tipPercentage}%):
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(tipAmount)}
                  </Typography>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="h6" fontWeight="bold">
                {splitBill ? 'Per Person:' : 'Total:'}
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(splitBill ? calculatePerPersonTotal() : calculateTotal())}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Split Bill */}
        {showSplitBill && (
          <Box mb={2}>
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
                />
              }
              label="Split Bill"
            />
            
            {splitBill && (
              <Box mt={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSplitBill}
                  startIcon={<EditIcon />}
                >
                  Configure Split ({splitItems.length} ways)
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Payment Methods */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Payment Method
          </Typography>
          
          <Grid container spacing={1}>
            {supportedPaymentMethods.map((method) => (
              <Grid item xs={12} sm={4} key={method}>
                <PaymentMethodCard
                  selected={selectedPaymentMethod === method}
                  onClick={() => handlePaymentMethodChange(method)}
                  sx={{ p: 2, textAlign: 'center' }}
                >
                  {getPaymentMethodIcon(method)}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {getPaymentMethodLabel(method)}
                  </Typography>
                </PaymentMethodCard>
              </Grid>
            ))}
          </Grid>

          {errors.paymentMethod && (
            <Alert severity="error" sx={{ mt: 1 }}>
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
          />
        </Box>

        {/* Action Buttons */}
        <Box display="flex" gap={1} flexDirection="column">
          <Button
            variant="contained"
            size="large"
            onClick={handlePayment}
            startIcon={getPaymentMethodIcon(selectedPaymentMethod)}
          >
            Pay {formatCurrency(calculateTotal())}
          </Button>
          
          <Button
            variant="outlined"
            onClick={onClose}
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