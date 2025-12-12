import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  IconButton,
  Chip,
  Alert,
  Slider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minHeight: '400px',
    maxHeight: '80vh',
  },
}));

const TipOption = styled(Box)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: selected ? theme.palette.primary.light : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'center',
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.light : theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const TipManagement = ({
  open,
  onClose,
  onConfirm,
  subtotal = 0,
  initialTip = 0,
  initialPercentage = 0,
  tipOptions = [10, 15, 18, 20, 25],
  allowCustomTip = true,
  allowPercentageInput = true,
  allowAmountInput = true,
  currency = 'USD'
}) => {
  const [tipType, setTipType] = useState('percentage'); // 'percentage', 'amount', 'custom'
  const [selectedPercentage, setSelectedPercentage] = useState(initialPercentage);
  const [customPercentage, setCustomPercentage] = useState(initialPercentage);
  const [tipAmount, setTipAmount] = useState(initialTip);
  const [customAmount, setCustomAmount] = useState(initialTip);
  const [errors, setErrors] = useState({});

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPercentage(initialPercentage);
      setCustomPercentage(initialPercentage);
      setTipAmount(initialTip);
      setCustomAmount(initialTip);
      setTipType(initialPercentage > 0 ? 'percentage' : (initialTip > 0 ? 'amount' : 'percentage'));
      setErrors({});
    }
  }, [open, initialTip, initialPercentage]);

  const calculateTipFromPercentage = (percentage) => {
    return (subtotal * percentage) / 100;
  };

  const calculatePercentageFromAmount = (amount) => {
    return subtotal > 0 ? (amount / subtotal) * 100 : 0;
  };

  const handlePercentageSelect = (percentage) => {
    setSelectedPercentage(percentage);
    setCustomPercentage(percentage);
    setTipAmount(calculateTipFromPercentage(percentage));
    setCustomAmount(calculateTipFromPercentage(percentage));
    setTipType('percentage');
    setErrors(prev => ({ ...prev, tip: '' }));
  };

  const handleCustomPercentageChange = (percentage) => {
    const value = Math.max(0, Math.min(100, parseFloat(percentage) || 0));
    setCustomPercentage(value);
    setSelectedPercentage(value);
    setTipAmount(calculateTipFromPercentage(value));
    setCustomAmount(calculateTipFromPercentage(value));
    setTipType('percentage');
  };

  const handleCustomAmountChange = (amount) => {
    const value = Math.max(0, parseFloat(amount) || 0);
    setCustomAmount(value);
    setTipAmount(value);
    setSelectedPercentage(calculatePercentageFromAmount(value));
    setCustomPercentage(calculatePercentageFromAmount(value));
    setTipType('amount');
  };

  const handleTipTypeChange = (type) => {
    setTipType(type);
    setErrors(prev => ({ ...prev, tip: '' }));
  };

  const handleConfirm = () => {
    const newErrors = {};

    if (tipAmount < 0) {
      newErrors.tip = 'Tip amount cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm?.(tipAmount, selectedPercentage);
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculateTotal = () => {
    return subtotal + tipAmount;
  };

  const getCurrentTipAmount = () => {
    switch (tipType) {
      case 'percentage':
        return calculateTipFromPercentage(selectedPercentage);
      case 'amount':
        return customAmount;
      case 'custom':
        return tipAmount;
      default:
        return tipAmount;
    }
  };

  const getCurrentPercentage = () => {
    switch (tipType) {
      case 'percentage':
        return selectedPercentage;
      case 'amount':
        return calculatePercentageFromAmount(customAmount);
      case 'custom':
        return calculatePercentageFromAmount(tipAmount);
      default:
        return selectedPercentage;
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Add Tip
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Subtotal Display */}
        <Box mb={3} textAlign="center">
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Subtotal
          </Typography>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {formatCurrency(subtotal)}
          </Typography>
        </Box>

        {/* Tip Type Selection */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Tip Type:
          </Typography>
          <RadioGroup
            row
            value={tipType}
            onChange={(e) => handleTipTypeChange(e.target.value)}
          >
            {allowPercentageInput && (
              <FormControlLabel
                value="percentage"
                control={<Radio />}
                label="Percentage"
              />
            )}
            {allowAmountInput && (
              <FormControlLabel
                value="amount"
                control={<Radio />}
                label="Amount"
              />
            )}
            {allowCustomTip && (
              <FormControlLabel
                value="custom"
                control={<Radio />}
                label="Custom"
              />
            )}
          </RadioGroup>
        </Box>

        {/* Percentage Options */}
        {(tipType === 'percentage' || tipType === 'custom') && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Select Tip Percentage:
            </Typography>
            
            <Grid container spacing={2} mb={2}>
              {tipOptions.map((percentage) => (
                <Grid item xs={4} sm={3} key={percentage}>
                  <TipOption
                    selected={selectedPercentage === percentage}
                    onClick={() => handlePercentageSelect(percentage)}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      {percentage}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(calculateTipFromPercentage(percentage))}
                    </Typography>
                  </TipOption>
                </Grid>
              ))}
            </Grid>

            {allowCustomTip && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Custom Percentage:
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    type="number"
                    value={customPercentage}
                    onChange={(e) => handleCustomPercentageChange(e.target.value)}
                    InputProps={{
                      min: 0,
                      max: 100,
                      endAdornment: <PercentIcon />
                    }}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <Slider
                    value={customPercentage}
                    onChange={(e, value) => handleCustomPercentageChange(value)}
                    min={0}
                    max={100}
                    step={1}
                    sx={{ flex: 1 }}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Amount Input */}
        {(tipType === 'amount' || tipType === 'custom') && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Tip Amount:
            </Typography>
            
            {allowCustomTip && tipType === 'custom' ? (
              <TextField
                fullWidth
                type="number"
                value={tipAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                InputProps={{
                  min: 0,
                  startAdornment: <MoneyIcon />
                }}
                label="Custom Tip Amount"
              />
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  InputProps={{
                    min: 0,
                    startAdornment: <MoneyIcon />
                  }}
                  size="small"
                  sx={{ width: 150 }}
                />
                <Typography variant="body2" color="text.secondary">
                  ({calculatePercentageFromAmount(customAmount).toFixed(1)}%)
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Quick Tip Amounts */}
        {tipType === 'amount' && (
          <Box mb={3}>
            <Typography variant="body2" gutterBottom>
              Quick Amounts:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {[1, 2, 5, 10, 20].map((amount) => (
                <Chip
                  key={amount}
                  label={formatCurrency(amount)}
                  clickable
                  onClick={() => handleCustomAmountChange(amount)}
                  color={customAmount === amount ? 'primary' : 'default'}
                  variant={customAmount === amount ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Validation Errors */}
        {errors.tip && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.tip}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Summary */}
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Subtotal:
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="body2">
                {formatCurrency(subtotal)}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Tip ({getCurrentPercentage().toFixed(1)}%):
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="body2" color="success.main">
                {formatCurrency(getCurrentTipAmount())}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(calculateTotal())}
              </Typography>
            </Grid>
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
          startIcon={<CalculateIcon />}
        >
          Add Tip {formatCurrency(getCurrentTipAmount())}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default TipManagement;