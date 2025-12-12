import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Alert,
  Badge
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import OrderItem from './OrderItem';
import OrderStatusTracker from './OrderStatusTracker';

const StyledCard = styled(Card)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return theme.palette.warning.main;
      case 'confirmed': return theme.palette.info.main;
      case 'preparing': return theme.palette.primary.main;
      case 'ready': return theme.palette.success.main;
      case 'served': return theme.palette.success.dark;
      case 'completed': return theme.palette.grey[600];
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.grey.main;
    }
  };

  return {
    borderLeft: `4px solid ${getStatusColor(status)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: theme.shadows[6],
      transform: 'translateY(-2px)',
    },
  };
});

const OrderHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
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

  return {
    backgroundColor: theme.palette[getStatusColor(status)].main,
    color: theme.palette[getStatusColor(status)].contrastastText,
    fontWeight: 'bold',
  };
});

const RestaurantOrder = ({
  order,
  onStatusUpdate,
  onEdit,
  onPrint,
  onShare,
  onPayment,
  onCancel,
  onItemUpdate,
  onItemRemove,
  showItems = true,
  showStatusTracker = true,
  showActions = true,
  compact = false,
  expanded: controlledExpanded = false
}) => {
  const [expanded, setExpanded] = useState(controlledExpanded);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : expanded;

  useEffect(() => {
    setExpanded(controlledExpanded);
  }, [controlledExpanded]);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus) => {
    onStatusUpdate?.(order.id, newStatus);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit?.(order);
    handleMenuClose();
  };

  const handlePrint = () => {
    onPrint?.(order);
    handleMenuClose();
  };

  const handleShare = () => {
    onShare?.(order);
    handleMenuClose();
  };

  const handlePayment = () => {
    onPayment?.(order);
    handleMenuClose();
  };

  const handleCancel = () => {
    onCancel?.(order);
    handleMenuClose();
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

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (order.tax_rate || 0.08); // Default 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + (order.service_charge || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getOrderTypeIcon = (type) => {
    switch (type) {
      case 'dine-in': return <PeopleIcon />;
      case 'takeaway': return <RestaurantMenuIcon />;
      case 'delivery': return <ShareIcon />;
      default: return <RestaurantMenuIcon />;
    }
  };

  const getOrderTypeText = (type) => {
    switch (type) {
      case 'dine-in': return 'Dine In';
      case 'takeaway': return 'Takeaway';
      case 'delivery': return 'Delivery';
      default: return 'Unknown';
    }
  };

  const getEstimatedTime = () => {
    if (!order.estimated_time) return null;
    const now = new Date();
    const estimated = new Date(order.estimated_time);
    const diff = estimated - now;
    
    if (diff <= 0) return 'Ready';
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <StyledCard status={order.status} elevation={compact ? 1 : 3}>
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        <OrderHeader>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant={compact ? "h6" : "h5"} fontWeight="bold">
                Order #{order.order_number || order.id}
              </Typography>
              <StatusChip
                status={order.status}
                label={order.status?.replace('_', ' ').toUpperCase()}
                size="small"
              />
              {order.priority === 'high' && (
                <Chip label="High Priority" color="error" size="small" />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Box display="flex" alignItems="center" gap={0.5}>
                {getOrderTypeIcon(order.order_type)}
                <Typography variant="body2">
                  {getOrderTypeText(order.order_type)}
                </Typography>
              </Box>

              {order.table_name && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <RestaurantMenuIcon fontSize="small" />
                  <Typography variant="body2">
                    Table: {order.table_name}
                  </Typography>
                </Box>
              )}

              {order.guest_count && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PeopleIcon fontSize="small" />
                  <Typography variant="body2">
                    {order.guest_count} guests
                  </Typography>
                </Box>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={2} color="text.secondary">
              <Box display="flex" alignItems="center" gap={0.5}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">
                  {formatTime(order.created_at)}
                </Typography>
              </Box>

              {order.estimated_time && (
                <Typography variant="body2">
                  Est. {getEstimatedTime()}
                </Typography>
              )}

              {order.created_at && (
                <Typography variant="body2">
                  {formatDate(order.created_at)}
                </Typography>
              )}
            </Box>
          </Box>

          {showActions && (
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          )}
        </OrderHeader>

        {/* Order Status Tracker */}
        {showStatusTracker && (
          <Box mb={2}>
            <OrderStatusTracker
              currentStatus={order.status}
              onStatusChange={(status) => onStatusUpdate?.(order.id, status)}
              compact={compact}
            />
          </Box>
        )}

        {/* Customer Information */}
        {order.customer_name && !compact && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Customer: {order.customer_name}
              {order.customer_phone && ` • ${order.customer_phone}`}
            </Typography>
            {order.customer_notes && (
              <Typography variant="body2" color="text.secondary">
                Notes: {order.customer_notes}
              </Typography>
            )}
          </Box>
        )}

        {/* Order Items */}
        {showItems && order.items && order.items.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Order Items ({order.items.length})
            </Typography>
            
            {compact ? (
              <Box>
                {order.items.slice(0, 3).map((item, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography variant="body2">
                      {item.quantity}x {item.name}
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>
                  </Box>
                ))}
                {order.items.length > 3 && (
                  <Typography variant="body2" color="text.secondary">
                    +{order.items.length - 3} more items
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                {order.items.map((item) => (
                  <OrderItem
                    key={item.id}
                    item={item}
                    onQuantityChange={(itemId, quantity) => onItemUpdate?.(order.id, itemId, { quantity })}
                    onEdit={(item) => onItemUpdate?.(order.id, item.id, item)}
                    onDelete={(itemId) => onItemRemove?.(order.id, itemId)}
                    compact={true}
                    showControls={order.status === 'pending' || order.status === 'confirmed'}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Order Summary */}
        {!compact && (
          <Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
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

              {order.service_charge > 0 && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Service Charge:
                    </Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="body2">
                      {formatCurrency(order.service_charge)}
                    </Typography>
                  </Grid>
                </>
              )}

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
        )}

        {/* Special Instructions */}
        {order.special_instructions && !compact && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Special Instructions:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.special_instructions}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        {!compact && showActions && (
          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
            {order.status === 'ready' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<ReceiptIcon />}
                onClick={() => onStatusUpdate?.(order.id, 'served')}
              >
                Mark Served
              </Button>
            )}
            
            {order.status === 'served' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PaymentIcon />}
                onClick={handlePayment}
              >
                Process Payment
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>

            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
            >
              Share
            </Button>

            {(order.status === 'pending' || order.status === 'confirmed') && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                Cancel Order
              </Button>
            )}
          </Box>
        )}
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Order
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <PrintIcon sx={{ mr: 1 }} />
          Print Order
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <ShareIcon sx={{ mr: 1 }} />
          Share Order
        </MenuItem>
        {order.status === 'served' && (
          <MenuItem onClick={handlePayment}>
            <PaymentIcon sx={{ mr: 1 }} />
            Process Payment
          </MenuItem>
        )}
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel Order
          </MenuItem>
        )}
      </Menu>
    </StyledCard>
  );
};

export default RestaurantOrder;