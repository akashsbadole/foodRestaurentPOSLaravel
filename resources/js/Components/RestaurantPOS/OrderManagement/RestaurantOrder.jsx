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
  Badge,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Slider,
  useTheme,
  useMediaQuery,
  Fab,
  Tooltip
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
  Cancel as CancelIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Timer as TimerIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  TouchApp as TouchAppIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../Components/ThemeProvider';
import {
  getOrderStatusColor,
  getOrderStatusLabel,
  getOrderStatusMuiVariant
} from '../../../lib/statusColors';
import OrderItem from './OrderItem';
import OrderStatusTracker from './OrderStatusTracker';

const StyledCard = styled(Card)(({ theme, status, isDarkMode, isMobile, isTablet }) => {
  const statusColor = getOrderStatusColor(status, isDarkMode);
  
  return {
    borderLeft: `4px solid ${statusColor}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: theme.palette.background.paperGradient,
    border: `1px solid ${theme.palette.divider}`,
    cursor: isMobile ? 'pointer' : 'default',
    touchAction: 'manipulation', // Improve touch performance
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.palette.shadows[2],
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: statusColor,
      transform: 'translateY(-100%)',
      transition: 'transform 0.3s ease-in-out',
    },
    '&:hover': {
      boxShadow: theme.palette.shadows[6],
      transform: isMobile ? 'scale(1.02)' : 'translateY(-4px)',
      '&::before': {
        transform: 'translateY(0)',
      }
    },
    '&:active': {
      transform: isMobile ? 'scale(0.98)' : 'translateY(-2px)',
    }
  };
});

const OrderHeader = styled(Box)(({ theme, isMobile }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(3),
  flexDirection: isMobile ? 'column' : 'row',
  gap: isMobile ? theme.spacing(1.5) : 2,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paperGradient,
  border: `1px solid ${theme.palette.divider}`,
  position: 'relative',
  overflow: 'hidden',
}));

const TouchFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 90,
  right: 20,
  background: theme.palette.primary.gradient,
  boxShadow: theme.palette.shadows[4],
  width: 60,
  height: 60,
  zIndex: 1000,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: theme.palette.primary.gradientLight,
    transform: 'scale(1.1) rotate(90deg)',
    boxShadow: theme.palette.shadows[8],
  },
  '&:active': {
    transform: 'scale(0.95) rotate(90deg)',
  },
}));

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
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  // Using Tailwind breakpoint values for consistency
  const isMobile = useMediaQuery('(max-width: 767px)'); // Tailwind 'md' breakpoint
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)'); // Tailwind 'md' to 'lg' breakpoint
  const [expanded, setExpanded] = useState(controlledExpanded);
  const [anchorEl, setAnchorEl] = useState(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [itemEditOpen, setItemEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
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

  const handleQuickAction = (action) => {
    switch (action) {
      case 'mark-ready':
        onStatusUpdate?.(order.id, 'ready');
        break;
      case 'mark-served':
        onStatusUpdate?.(order.id, 'served');
        break;
      case 'priority-high':
        onItemUpdate?.(order.id, order.id, { priority: 'high' });
        break;
      case 'add-note':
        setItemEditOpen(true);
        setSelectedItem({ id: 'note', name: '', notes: '' });
        break;
    }
    setQuickActionsOpen(false);
  };

  const handleItemEdit = (item) => {
    setSelectedItem(item);
    setQuantity(item.quantity);
    setItemEditOpen(true);
  };

  const handleQuantityUpdate = (newQuantity) => {
    if (selectedItem) {
      onItemUpdate?.(order.id, selectedItem.id, { quantity: newQuantity });
    }
    setItemEditOpen(false);
    setSelectedItem(null);
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

  const getUrgencyColor = () => {
    if (!order.created_at) return 'default';
    const orderAge = (new Date() - new Date(order.created_at)) / 60000; // minutes
    if (orderAge > 30) return 'error';
    if (orderAge > 20) return 'warning';
    if (orderAge > 15) return 'info';
    return 'success';
  };

  const urgencyColor = getUrgencyColor();

  return (
    <>
      <StyledCard
        status={order.status}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
        isTablet={isTablet}
        elevation={compact ? 1 : 3}
        onClick={() => isMobile && setExpanded(!expanded)}
      >
        <CardContent sx={{ p: compact ? (isMobile ? 1.5 : 2) : 3 }}>
          <OrderHeader isMobile={isMobile}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography
                  variant={compact ? (isMobile ? "body1" : "h6") : (isMobile ? "h6" : "h5")}
                  fontWeight="bold"
                  sx={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #60a5fa 0%, #3182ce 100%)'
                      : 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Order #{order.order_number || order.id}
                </Typography>
                <Chip
                  variant={getOrderStatusMuiVariant(order.status)}
                  label={getOrderStatusLabel(order.status)}
                  size="small"
                />
                {order.priority === 'high' && (
                  <Chip
                    label="High Priority"
                    color="error"
                    size="small"
                    icon={<FireIcon />}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                    }}
                  />
                )}
                {urgencyColor !== 'default' && (
                  <Chip
                    label={urgencyColor === 'error' ? 'Urgent' : urgencyColor === 'warning' ? 'Attention' : 'Check'}
                    color={urgencyColor}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode ? `rgba(${theme.palette[urgencyColor].main}, 0.2)` : `rgba(${theme.palette[urgencyColor].main}, 0.1)`,
                      border: `1px solid ${isDarkMode ? `rgba(${theme.palette[urgencyColor].main}, 0.3)` : `rgba(${theme.palette[urgencyColor].main}, 0.2)`}`,
                    }}
                  />
                )}
              </Box>

              <Box display="flex" alignItems="center" gap={2} mb={1} flexWrap="wrap">
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {getOrderTypeIcon(order.order_type)}
                  <Typography variant="body2">
                    {getOrderTypeText(order.order_type)}
                  </Typography>
                </Box>

                {order.table_name && (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <RestaurantMenuIcon fontSize="small" />
                    <Typography variant="body2">
                      Table: {order.table_name}
                    </Typography>
                  </Box>
                )}

                {order.guest_count && (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <PeopleIcon fontSize="small" />
                    <Typography variant="body2">
                      {order.guest_count} guests
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box display="flex" alignItems="center" gap={2} color="text.secondary" flexWrap="wrap">
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
              <IconButton
                onClick={handleMenuClick}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)',
                  }
                }}
              >
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
                isMobile={isMobile}
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
                  {order.items.slice(0, isMobile ? 2 : 3).map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" py={0.5}>
                      <Typography variant="body2">
                        {item.quantity}x {item.name}
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                  {order.items.length > (isMobile ? 2 : 3) && (
                    <Typography variant="caption" color="text.secondary">
                      +{order.items.length - (isMobile ? 2 : 3)} more items
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
                      onEdit={() => handleItemEdit(item)}
                      onDelete={(itemId) => onItemRemove?.(order.id, itemId)}
                      compact={compact}
                      isMobile={isMobile}
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
                  sx={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background: isDarkMode
                        ? 'linear-gradient(135deg, #047857 0%, #065f46 100%)'
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    }
                  }}
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
                  sx={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    '&:hover': {
                      background: isDarkMode
                        ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
                        : 'linear-gradient(135deg, #2563eb 0%, #1e3a5f 100%)',
                    }
                  }}
                >
                  Process Payment
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  }
                }}
              >
                {isMobile ? '' : 'Print'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  }
                }}
              >
                {isMobile ? '' : 'Share'}
              </Button>

              {(order.status === 'pending' || order.status === 'confirmed') && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    }
                  }}
                >
                  {isMobile ? '' : 'Cancel'}
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </StyledCard>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
          }
        }}
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

      {/* Mobile Quick Actions */}
      {isMobile && (
        <TouchFab
          color="primary"
          onClick={() => setQuickActionsOpen(true)}
          aria-label="Quick actions"
        >
          <TouchAppIcon />
        </TouchFab>
      )}

      {/* Quick Actions Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onOpen={() => setQuickActionsOpen(true)}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          }
        }}
      >
        <Box sx={{ p: 2, pb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <List>
            {order.status === 'preparing' && (
              <ListItem button onClick={() => handleQuickAction('mark-ready')}>
                <ListItemIcon>
                  <ReceiptIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Mark as Ready" />
              </ListItem>
            )}
            {order.status === 'ready' && (
              <ListItem button onClick={() => handleQuickAction('mark-served')}>
                <ListItemIcon>
                  <PeopleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Mark as Served" />
              </ListItem>
            )}
            <ListItem button onClick={() => handleQuickAction('priority-high')}>
              <ListItemIcon>
                <StarIcon color="warning" />
              </ListItemIcon>
              <ListItemText primary="Set High Priority" />
            </ListItem>
            <ListItem button onClick={() => handleQuickAction('add-note')}>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText primary="Add Note" />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>

      {/* Item Edit Dialog */}
      <Dialog
        open={itemEditOpen}
        onClose={() => setItemEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedItem?.id === 'note' ? 'Add Note' : 'Edit Item'}
        </DialogTitle>
        <DialogContent>
          {selectedItem?.id === 'note' ? (
            <TextField
              autoFocus
              margin="dense"
              label="Note"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
            />
          ) : (
            <>
              <TextField
                margin="dense"
                label="Item"
                type="text"
                fullWidth
                value={selectedItem?.name || ''}
                variant="outlined"
                disabled
              />
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>
                  Quantity: {quantity}
                </Typography>
                <Slider
                  value={quantity}
                  onChange={(e, value) => setQuantity(value)}
                  min={1}
                  max={20}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                  ]}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemEditOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleQuantityUpdate(quantity)}
            variant="contained"
            color="primary"
          >
            {selectedItem?.id === 'note' ? 'Add Note' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RestaurantOrder;