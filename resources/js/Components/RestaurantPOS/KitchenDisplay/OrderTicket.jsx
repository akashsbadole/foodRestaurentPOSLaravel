import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  Grid,
  Alert,
  LinearProgress,
  Badge,
  Tooltip
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  PriorityHigh as PriorityHighIcon,
  LocalFireDepartment as FireIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme, priority, status, age }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey.main;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return theme.palette.warning.light;
      case 'preparing': return theme.palette.primary.light;
      case 'ready': return theme.palette.success.light;
      case 'delayed': return theme.palette.error.light;
      default: return theme.palette.background.paper;
    }
  };

  const getAgeColor = (age) => {
    if (age > 30) return theme.palette.error.main; // Over 30 minutes
    if (age > 20) return theme.palette.warning.main; // Over 20 minutes
    if (age > 15) return theme.palette.info.main; // Over 15 minutes
    return theme.palette.success.main; // Under 15 minutes
  };

  return {
    borderLeft: `4px solid ${getPriorityColor(priority)}`,
    backgroundColor: getStatusColor(status),
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'visible',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderWidth: '0 40px 40px 0',
      borderColor: `transparent ${getAgeColor(age)} transparent transparent`,
      opacity: 0.8,
    },
  };
});

const PriorityBadge = styled(Badge)(({ theme, priority }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey.main;
    }
  };

  return {
    '& .MuiBadge-badge': {
      backgroundColor: getPriorityColor(priority),
      color: theme.palette.getContrastText(getPriorityColor(priority)),
    },
  };
});

const OrderTicket = ({
  order,
  onStatusUpdate,
  onPrint,
  onPriorityChange,
  showTimer = true,
  showItems = true,
  compact = false,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [orderAge, setOrderAge] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate order age and elapsed time
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const now = new Date();
      const orderTime = new Date(order.created_at);
      const age = Math.floor((now - orderTime) / 60000); // minutes
      const elapsed = order.start_time ? Math.floor((now - new Date(order.start_time)) / 60000) : 0;
      
      setOrderAge(age);
      setElapsedTime(elapsed);
    }, refreshInterval);

    // Initial calculation
    const now = new Date();
    const orderTime = new Date(order.created_at);
    const age = Math.floor((now - orderTime) / 60000);
    const elapsed = order.start_time ? Math.floor((now - new Date(order.start_time)) / 60000) : 0;
    
    setOrderAge(age);
    setElapsedTime(elapsed);

    return () => clearInterval(interval);
  }, [order.created_at, order.start_time, autoRefresh, refreshInterval]);

  const handleStatusChange = (newStatus) => {
    onStatusUpdate?.(order.id, newStatus);
  };

  const handlePrint = () => {
    onPrint?.(order);
  };

  const handlePriorityChange = (newPriority) => {
    onPriorityChange?.(order.id, newPriority);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <PriorityHighIcon color="error" />;
      case 'medium': return <TimerIcon color="warning" />;
      case 'low': return <CheckCircleIcon color="success" />;
      default: return null;
    }
  };

  const isDelayed = orderAge > (order.estimated_time || 20);

  return (
    <StyledCard
      priority={order.priority}
      status={order.status}
      age={orderAge}
      elevation={compact ? 1 : 3}
    >
      <CardContent sx={{ p: compact ? 1.5 : 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant={compact ? "h6" : "h5"} fontWeight="bold">
                #{order.order_number || order.id}
              </Typography>
              
              <Chip
                label={order.status?.toUpperCase()}
                color={getStatusColor(order.status)}
                size="small"
              />
              
              {isDelayed && (
                <Chip
                  label="DELAYED"
                  color="error"
                  size="small"
                  icon={<FireIcon />}
                />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="body2" color="text.secondary">
                {formatTime(order.created_at)}
              </Typography>
              
              {showTimer && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <AccessTimeIcon fontSize="small" />
                  <Typography variant="body2" color={isDelayed ? 'error' : 'text.secondary'}>
                    {formatDuration(orderAge)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {getPriorityIcon(order.priority)}
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Order Info */}
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          {order.table_name && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <RestaurantIcon fontSize="small" />
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

          {order.order_type && (
            <Chip
              label={order.order_type?.replace('-', ' ').toUpperCase()}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* Special Instructions */}
        {order.special_instructions && !compact && (
          <Alert severity="info" sx={{ mb: 1 }}>
            <Typography variant="body2">
              {order.special_instructions}
            </Typography>
          </Alert>
        )}

        {/* Order Items */}
        {showItems && order.items && order.items.length > 0 && (
          <Box mb={1}>
            <Typography variant="subtitle2" gutterBottom>
              Items ({order.items.length})
            </Typography>
            
            {compact ? (
              <Box>
                {order.items.slice(0, 3).map((item, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography variant="body2">
                      {item.quantity}x {item.name}
                    </Typography>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        +{item.modifiers.length} mods
                      </Typography>
                    )}
                  </Box>
                ))}
                {order.items.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{order.items.length - 3} more items
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                {order.items.map((item, index) => (
                  <Box key={index} mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.quantity}x {item.name}
                        </Typography>
                        
                        {item.modifiers && item.modifiers.length > 0 && (
                          <Box ml={2} mt={0.5}>
                            {item.modifiers.map((modifier, modIndex) => (
                              <Typography key={modIndex} variant="caption" color="text.secondary">
                                • {modifier.name} {modifier.quantity > 1 && `x${modifier.quantity}`}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        {item.notes && (
                          <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
                            Note: {item.notes}
                          </Typography>
                        )}
                      </Box>

                      {item.status && (
                        <Chip
                          label={item.status}
                          size="small"
                          color={getStatusColor(item.status)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Progress Bar for preparing items */}
        {order.status === 'preparing' && !compact && (
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Preparing Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={order.preparation_progress || 0}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={1} mt={1}>
          {order.status === 'pending' && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleStatusChange('preparing')}
              startIcon={<RestaurantIcon />}
            >
              Start Preparing
            </Button>
          )}

          {order.status === 'preparing' && (
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleStatusChange('ready')}
              startIcon={<CheckCircleIcon />}
            >
              Mark Ready
            </Button>
          )}

          {order.status === 'ready' && (
            <Button
              variant="contained"
              color="info"
              size="small"
              onClick={() => handleStatusChange('served')}
              startIcon={<CheckCircleIcon />}
            >
              Mark Served
            </Button>
          )}

          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleStatusChange('cancelled')}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default OrderTicket;