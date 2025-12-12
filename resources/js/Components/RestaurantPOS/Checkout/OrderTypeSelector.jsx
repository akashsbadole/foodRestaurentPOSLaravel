import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  IconButton,
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
  Chip,
  Alert
} from '@mui/material';
import {
  Restaurant as DineInIcon,
  TakeoutDinner as TakeawayIcon,
  DeliveryDining as DeliveryIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const OrderTypeCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : `2px solid ${theme.palette.divider}`,
  backgroundColor: selected ? theme.palette.primary.light : theme.palette.background.paper,
  transition: 'all 0.3s ease',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    backgroundColor: selected ? theme.palette.primary.light : theme.palette.action.hover,
  },
}));

const OrderTypeSelector = ({
  open,
  onClose,
  onConfirm,
  initialOrderType = 'dine-in',
  showCustomerInfo = true,
  requireCustomerInfo = false,
  supportedOrderTypes = ['dine-in', 'takeaway', 'delivery'],
  allowFutureOrders = true,
  defaultPrepTime = 15
}) => {
  const [selectedOrderType, setSelectedOrderType] = useState(initialOrderType);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [prepTime, setPrepTime] = useState(defaultPrepTime);
  const [scheduledTime, setScheduledTime] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedOrderType(initialOrderType);
      setCustomerInfo({
        name: '',
        phone: '',
        address: '',
        notes: ''
      });
      setPrepTime(defaultPrepTime);
      setScheduledTime('');
      setErrors({});
    }
  }, [open, initialOrderType, defaultPrepTime]);

  const handleOrderTypeSelect = (type) => {
    setSelectedOrderType(type);
    setErrors(prev => ({ ...prev, orderType: '' }));
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleConfirm = () => {
    const newErrors = {};

    if (!selectedOrderType) {
      newErrors.orderType = 'Please select an order type';
    }

    if (requireCustomerInfo || selectedOrderType === 'delivery') {
      if (!customerInfo.name.trim()) {
        newErrors.name = 'Customer name is required';
      }
      if (!customerInfo.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
      if (selectedOrderType === 'delivery' && !customerInfo.address.trim()) {
        newErrors.address = 'Delivery address is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm?.({
      orderType: selectedOrderType,
      customerInfo: showCustomerInfo ? customerInfo : null,
      prepTime,
      scheduledTime: allowFutureOrders ? scheduledTime : null
    });

    onClose();
  };

  const getOrderTypeInfo = (type) => {
    switch (type) {
      case 'dine-in':
        return {
          icon: <DineInIcon fontSize="large" />,
          title: 'Dine In',
          description: 'Eat at the restaurant',
          color: 'primary'
        };
      case 'takeaway':
        return {
          icon: <TakeawayIcon fontSize="large" />,
          title: 'Takeaway',
          description: 'Pick up your order',
          color: 'secondary'
        };
      case 'delivery':
        return {
          icon: <DeliveryIcon fontSize="large" />,
          title: 'Delivery',
          description: 'We deliver to you',
          color: 'success'
        };
      default:
        return {
          icon: <DineInIcon fontSize="large" />,
          title: 'Dine In',
          description: 'Eat at the restaurant',
          color: 'primary'
        };
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMinScheduledTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + prepTime);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Select Order Type
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Order Type Selection */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            How would you like to receive your order?
          </Typography>
          
          <Grid container spacing={2}>
            {supportedOrderTypes.map((type) => {
              const typeInfo = getOrderTypeInfo(type);
              return (
                <Grid item xs={12} sm={4} key={type}>
                  <OrderTypeCard
                    selected={selectedOrderType === type}
                    onClick={() => handleOrderTypeSelect(type)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box color={typeInfo.color} mb={1}>
                        {typeInfo.icon}
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {typeInfo.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {typeInfo.description}
                      </Typography>
                    </CardContent>
                  </OrderTypeCard>
                </Grid>
              );
            })}
          </Grid>

          {errors.orderType && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.orderType}
            </Alert>
          )}
        </Box>

        {/* Customer Information */}
        {showCustomerInfo && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Customer Information
              {(requireCustomerInfo || selectedOrderType === 'delivery') && (
                <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
              )}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={customerInfo.name}
                  onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  InputProps={{
                    startAdornment: <PersonIcon />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  InputProps={{
                    startAdornment: <PhoneIcon />
                  }}
                />
              </Grid>
              
              {selectedOrderType === 'delivery' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Delivery Address"
                    value={customerInfo.address}
                    onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: <HomeIcon />
                    }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Special Instructions (Optional)"
                  value={customerInfo.notes}
                  onChange={(e) => handleCustomerInfoChange('notes', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Any special requests or notes..."
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Preparation Time */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Preparation Time
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Prep Time (minutes)"
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value) || 15)}
                InputProps={{
                  min: 5,
                  max: 120,
                  startAdornment: <TimeIcon />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Estimated ready time: {formatTime(new Date(Date.now() + prepTime * 60000))}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Scheduled Order */}
        {allowFutureOrders && selectedOrderType !== 'dine-in' && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Schedule Order (Optional)
            </Typography>
            
            <TextField
              fullWidth
              label="Scheduled Time"
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              inputProps={{
                min: getMinScheduledTime()
              }}
              helperText="Leave empty for immediate preparation"
            />
          </Box>
        )}

        {/* Order Summary */}
        <Box p={2} bgcolor="background.paper" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            Order Summary
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Order Type:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" fontWeight="bold">
                {getOrderTypeInfo(selectedOrderType).title}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Prep Time:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                {prepTime} minutes
              </Typography>
            </Grid>
            
            {scheduledTime && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatTime(scheduledTime)}
                  </Typography>
                </Grid>
              </>
            )}
            
            {customerInfo.name && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Customer:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {customerInfo.name}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
        >
          Continue with {getOrderTypeInfo(selectedOrderType).title}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderTypeSelector;