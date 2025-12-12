import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Restaurant as RestaurantIcon,
  LocalDining as LocalDiningIcon,
  DoneAll as DoneAllIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minHeight: '400px',
    maxHeight: '80vh',
  },
}));

const StatusOption = styled(Box)(({ theme, status, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: selected ? theme.palette.primary.light : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.light : theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const OrderStatusUpdate = ({
  open,
  onClose,
  onConfirm,
  order = null,
  availableStatuses = [],
  requireNotes = false,
  showProgress = true,
  allowPriorityChange = true
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [priority, setPriority] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && order) {
      setSelectedStatus('');
      setNotes('');
      setEstimatedTime(order.estimated_time || '');
      setPriority(order.priority || '');
      setErrors({});
    }
  }, [open, order]);

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setErrors(prev => ({ ...prev, status: '' }));
  };

  const handleConfirm = () => {
    const newErrors = {};

    if (!selectedStatus) {
      newErrors.status = 'Please select a status';
    }

    if (requireNotes && !notes.trim()) {
      newErrors.notes = 'Notes are required for this status change';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm?.({
      orderId: order.id,
      status: selectedStatus,
      notes: notes.trim(),
      estimatedTime: estimatedTime.trim(),
      priority: priority.trim()
    });

    onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <TimerIcon />;
      case 'confirmed': return <CheckCircleIcon />;
      case 'preparing': return <RestaurantIcon />;
      case 'ready': return <LocalDiningIcon />;
      case 'served': return <DoneAllIcon />;
      case 'completed': return <DoneAllIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <TimerIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'served': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending': return 'Order received and waiting to be confirmed';
      case 'confirmed': return 'Order confirmed and sent to kitchen';
      case 'preparing': return 'Kitchen is preparing the order';
      case 'ready': return 'Order is ready to be served';
      case 'served': return 'Order has been served to the customer';
      case 'completed': return 'Order is completed and paid';
      case 'cancelled': return 'Order has been cancelled';
      default: return '';
    }
  };

  const getStatusTimeEstimate = (status) => {
    switch (status) {
      case 'confirmed': return '5-10 minutes';
      case 'preparing': return '15-25 minutes';
      case 'ready': return '25-30 minutes';
      case 'served': return '30-35 minutes';
      default: return '';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const calculateOrderAge = () => {
    if (!order?.created_at) return 0;
    const now = new Date();
    const orderTime = new Date(order.created_at);
    return Math.floor((now - orderTime) / 60000); // minutes
  };

  const orderAge = calculateOrderAge();

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              Update Order Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order #{order?.order_number || order?.id}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Order Information */}
        {order && (
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Status:
                </Typography>
                <Chip
                  label={order.status?.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(order.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Order Age:
                </Typography>
                <Typography variant="body2">
                  {orderAge} minutes
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Created:
                </Typography>
                <Typography variant="body2">
                  {formatTime(order.created_at)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Table:
                </Typography>
                <Typography variant="body2">
                  {order.table_name || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Status Selection */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Select New Status:
          </Typography>
          
          <Grid container spacing={2}>
            {availableStatuses.map((status) => (
              <Grid item xs={12} sm={6} key={status}>
                <StatusOption
                  status={status}
                  selected={selectedStatus === status}
                  onClick={() => handleStatusSelect(status)}
                >
                  {getStatusIcon(status)}
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {status?.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getStatusDescription(status)}
                    </Typography>
                    {getStatusTimeEstimate(status) && (
                      <Typography variant="caption" color="primary" display="block">
                        Est. {getStatusTimeEstimate(status)}
                      </Typography>
                    )}
                  </Box>
                </StatusOption>
              </Grid>
            ))}
          </Grid>

          {errors.status && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {errors.status}
            </Alert>
          )}
        </Box>

        {/* Progress Bar */}
        {showProgress && order && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Order Progress:
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(orderAge / 30) * 100} // Assuming 30 minutes as full progress
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary">
              {orderAge} minutes elapsed
            </Typography>
          </Box>
        )}

        {/* Priority Change */}
        {allowPriorityChange && (
          <Box mb={3}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Estimated Time */}
        <Box mb={3}>
          <TextField
            fullWidth
            label="Estimated Time (minutes)"
            type="number"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            placeholder="e.g., 20"
            helperText="Estimated time for order completion"
          />
        </Box>

        {/* Notes */}
        <Box mb={2}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this status change..."
            required={requireNotes}
            error={!!errors.notes}
            helperText={errors.notes || 'Optional notes for kitchen staff'}
          />
        </Box>

        {/* Warning for cancellation */}
        {selectedStatus === 'cancelled' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Warning: Order Cancellation
            </Typography>
            <Typography variant="body2">
              This action cannot be undone. Please ensure you have proper authorization before cancelling an order.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={selectedStatus === 'cancelled' ? 'error' : 'primary'}
          disabled={!selectedStatus}
        >
          {selectedStatus === 'cancelled' ? 'Cancel Order' : 'Update Status'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default OrderStatusUpdate;