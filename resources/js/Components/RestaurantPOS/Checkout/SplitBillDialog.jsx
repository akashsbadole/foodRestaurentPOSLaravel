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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Equalizer as EqualizerIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minHeight: '70vh',
    maxHeight: '90vh',
  },
}));

const SplitMethodCard = styled(Box)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: selected ? theme.palette.primary.light : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(2),
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.light : theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const PersonCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

const SplitBillDialog = ({
  open,
  onClose,
  onConfirm,
  order = null,
  initialSplitItems = [],
  splitMethods = ['equal', 'item', 'amount', 'percentage']
}) => {
  const [splitMethod, setSplitMethod] = useState('equal');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [splitItems, setSplitItems] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [customPercentages, setCustomPercentages] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize state when dialog opens
  useEffect(() => {
    if (open && order) {
      setSplitMethod('equal');
      setNumberOfPeople(Math.max(2, order.guest_count || 2));
      setSplitItems(initialSplitItems.length > 0 ? initialSplitItems : generateEqualSplit());
      setCustomAmounts({});
      setCustomPercentages({});
      setErrors({});
    }
  }, [open, order, initialSplitItems]);

  const generateEqualSplit = () => {
    const people = Math.max(2, order.guest_count || 2);
    return Array.from({ length: people }, (_, index) => ({
      id: `person_${index + 1}`,
      name: `Person ${index + 1}`,
      items: [],
      amount: 0,
      percentage: 0
    }));
  };

  const generateItemBasedSplit = () => {
    if (!order.items) return [];
    
    return order.items.map((item, index) => ({
      id: `item_${index}`,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      assignedTo: [],
      modifiers: item.modifiers || []
    }));
  };

  const handleSplitMethodChange = (method) => {
    setSplitMethod(method);
    setErrors({});

    switch (method) {
      case 'equal':
        setSplitItems(generateEqualSplit());
        break;
      case 'item':
        setSplitItems(generateItemBasedSplit());
        break;
      case 'amount':
        setSplitItems(generateEqualSplit());
        break;
      case 'percentage':
        setSplitItems(generateEqualSplit());
        break;
    }
  };

  const handleNumberOfPeopleChange = (num) => {
    const newNum = Math.max(1, Math.min(20, num));
    setNumberOfPeople(newNum);
    
    if (splitMethod === 'equal') {
      setSplitItems(generateEqualSplit());
    }
  };

  const handlePersonNameChange = (personId, name) => {
    setSplitItems(prev => 
      prev.map(person => 
        person.id === personId ? { ...person, name } : person
      )
    );
  };

  const handleItemAssignment = (itemId, personId) => {
    if (splitMethod !== 'item') return;

    setSplitItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const assignedTo = item.assignedTo.includes(personId)
            ? item.assignedTo.filter(id => id !== personId)
            : [...item.assignedTo, personId];
          return { ...item, assignedTo };
        }
        return item;
      })
    );
  };

  const handleCustomAmountChange = (personId, amount) => {
    setCustomAmounts(prev => ({
      ...prev,
      [personId]: parseFloat(amount) || 0
    }));
  };

  const handleCustomPercentageChange = (personId, percentage) => {
    const value = Math.max(0, Math.min(100, parseFloat(percentage) || 0));
    setCustomPercentages(prev => ({
      ...prev,
      [personId]: value
    }));
  };

  const calculateSubtotal = () => {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const modifiersTotal = item.modifiers?.reduce((modTotal, modifier) => {
        return modTotal + (modifier.price * modifier.quantity * item.quantity);
      }, 0) || 0;
      return total + itemTotal + modifiersTotal;
    }, 0);
  };

  const calculatePersonTotal = (personId) => {
    const subtotal = calculateSubtotal();
    
    switch (splitMethod) {
      case 'equal':
        return subtotal / numberOfPeople;
      
      case 'item':
        const items = splitItems.filter(item => item.assignedTo.includes(personId));
        return items.reduce((total, item) => {
          const itemTotal = item.total / item.assignedTo.length;
          return total + itemTotal;
        }, 0);
      
      case 'amount':
        return customAmounts[personId] || 0;
      
      case 'percentage':
        return subtotal * ((customPercentages[personId] || 0) / 100);
      
      default:
        return 0;
    }
  };

  const validateSplit = () => {
    const newErrors = {};
    const subtotal = calculateSubtotal();

    if (splitMethod === 'amount') {
      const totalAmount = Object.values(customAmounts).reduce((sum, amount) => sum + amount, 0);
      if (Math.abs(totalAmount - subtotal) > 0.01) {
        newErrors.amount = `Total amount (${formatCurrency(totalAmount)}) must equal order total (${formatCurrency(subtotal)})`;
      }
    }

    if (splitMethod === 'percentage') {
      const totalPercentage = Object.values(customPercentages).reduce((sum, percentage) => sum + percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        newErrors.percentage = `Total percentage (${totalPercentage}%) must equal 100%`;
      }
    }

    if (splitMethod === 'item') {
      const unassignedItems = splitItems.filter(item => item.assignedTo.length === 0);
      if (unassignedItems.length > 0) {
        newErrors.items = `${unassignedItems.length} item(s) not assigned to anyone`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateSplit()) return;

    const finalSplitItems = splitItems.map(person => ({
      ...person,
      amount: calculatePersonTotal(person.id)
    }));

    onConfirm(finalSplitItems);
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPersonIcon = (index) => {
    return <PersonIcon />;
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Split Bill
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Order Summary */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Order Total: {formatCurrency(calculateSubtotal())}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.items?.length || 0} items • {order.guest_count || 0} guests
          </Typography>
        </Box>

        {/* Split Method Selection */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Split Method:
          </Typography>
          
          <Grid container spacing={2}>
            {splitMethods.includes('equal') && (
              <Grid item xs={12} sm={6}>
                <SplitMethodCard
                  selected={splitMethod === 'equal'}
                  onClick={() => handleSplitMethodChange('equal')}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <EqualizerIcon />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Equal Split
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Divide total equally
                      </Typography>
                    </Box>
                  </Box>
                </SplitMethodCard>
              </Grid>
            )}

            {splitMethods.includes('item') && (
              <Grid item xs={12} sm={6}>
                <SplitMethodCard
                  selected={splitMethod === 'item'}
                  onClick={() => handleSplitMethodChange('item')}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <RestaurantIcon />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Split by Items
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Assign items to people
                      </Typography>
                    </Box>
                  </Box>
                </SplitMethodCard>
              </Grid>
            )}

            {splitMethods.includes('amount') && (
              <Grid item xs={12} sm={6}>
                <SplitMethodCard
                  selected={splitMethod === 'amount'}
                  onClick={() => handleSplitMethodChange('amount')}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Custom Amounts
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Set specific amounts
                      </Typography>
                    </Box>
                  </Box>
                </SplitMethodCard>
              </Grid>
            )}

            {splitMethods.includes('percentage') && (
              <Grid item xs={12} sm={6}>
                <SplitMethodCard
                  selected={splitMethod === 'percentage'}
                  onClick={() => handleSplitMethodChange('percentage')}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <EqualizerIcon />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        By Percentage
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Set percentage for each person
                      </Typography>
                    </Box>
                  </Box>
                </SplitMethodCard>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Number of People (for equal split) */}
        {splitMethod === 'equal' && (
          <Box mb={3}>
            <TextField
              label="Number of People"
              type="number"
              value={numberOfPeople}
              onChange={(e) => handleNumberOfPeopleChange(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1, max: 20 }}
              fullWidth
            />
          </Box>
        )}

        {/* Split Details */}
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Split Details:
          </Typography>

          {splitMethod === 'equal' && (
            <Box>
              {splitItems.map((person, index) => (
                <PersonCard key={person.id}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      {getPersonIcon(index)}
                      <TextField
                        value={person.name}
                        onChange={(e) => handlePersonNameChange(person.id, e.target.value)}
                        variant="standard"
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(calculatePersonTotal(person.id))}
                    </Typography>
                  </Box>
                </PersonCard>
              ))}
            </Box>
          )}

          {splitMethod === 'item' && (
            <Box>
              {splitItems.map((item) => (
                <PersonCard key={item.id}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.quantity}x {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(item.total)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Assigned to:
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {splitItems.map((person, index) => (
                          <Chip
                            key={person.id}
                            label={person.name}
                            size="small"
                            color={item.assignedTo.includes(person.id) ? 'primary' : 'default'}
                            clickable
                            onClick={() => handleItemAssignment(item.id, person.id)}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </PersonCard>
              ))}
            </Box>
          )}

          {splitMethod === 'amount' && (
            <Box>
              {splitItems.map((person, index) => (
                <PersonCard key={person.id}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      {getPersonIcon(index)}
                      <TextField
                        value={person.name}
                        onChange={(e) => handlePersonNameChange(person.id, e.target.value)}
                        variant="standard"
                        size="small"
                      />
                    </Box>
                    <TextField
                      label="Amount"
                      type="number"
                      value={customAmounts[person.id] || ''}
                      onChange={(e) => handleCustomAmountChange(person.id, e.target.value)}
                      InputProps={{
                        startAdornment: '$'
                      }}
                      size="small"
                      sx={{ width: 120 }}
                    />
                  </Box>
                </PersonCard>
              ))}
            </Box>
          )}

          {splitMethod === 'percentage' && (
            <Box>
              {splitItems.map((person, index) => (
                <PersonCard key={person.id}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      {getPersonIcon(index)}
                      <TextField
                        value={person.name}
                        onChange={(e) => handlePersonNameChange(person.id, e.target.value)}
                        variant="standard"
                        size="small"
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TextField
                        label="%"
                        type="number"
                        value={customPercentages[person.id] || ''}
                        onChange={(e) => handleCustomPercentageChange(person.id, e.target.value)}
                        InputProps={{
                          min: 0,
                          max: 100
                        }}
                        size="small"
                        sx={{ width: 80 }}
                      />
                      <Typography variant="h6" color="primary">
                        {formatCurrency(calculatePersonTotal(person.id))}
                      </Typography>
                    </Box>
                  </Box>
                </PersonCard>
              ))}
            </Box>
          )}
        </Box>

        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {Object.values(errors).map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {/* Summary */}
        <Box p={2} bgcolor="background.paper" borderRadius={1}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2">
                People:
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="subtitle2">
                {splitItems.length}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">
                Total:
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="h6" color="primary">
                {formatCurrency(calculateSubtotal())}
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
        >
          Split Bill ({splitItems.length} ways)
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default SplitBillDialog;