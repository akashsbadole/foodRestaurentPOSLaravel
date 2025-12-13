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
import { useCustomTheme } from '@/Components/ThemeProvider';
import { getOrderStatusColor } from '../../../lib/statusColors';

const StyledCard = styled(Card)(({ theme, priority, status, age }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)';
      case 'preparing': return theme.palette.mode === 'dark' ? 'rgba(49, 130, 206, 0.1)' : 'rgba(49, 130, 206, 0.05)';
      case 'ready': return theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)';
      case 'delayed': return theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)';
      default: return theme.palette.mode === 'dark' ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)';
    }
  };

  const getAgeColor = (age) => {
    if (age > 30) return '#ef4444'; // Over 30 minutes
    if (age > 20) return '#f59e0b'; // Over 20 minutes
    if (age > 15) return '#3182ce'; // Over 15 minutes
    return '#10b981'; // Under 15 minutes
  };

  return {
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    backgroundColor: getStatusColor(status),
    borderLeft: `4px solid ${getPriorityColor(priority)}`,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 20px rgba(0, 0, 0, 0.3)'
      : '0 4px 20px rgba(30, 58, 95, 0.15)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.palette.mode === 'dark'
        ? '0 8px 30px rgba(0, 0, 0, 0.4)'
        : '0 8px 30px rgba(30, 58, 95, 0.2)',
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
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af';
    }
  };

  return {
    '& .MuiBadge-badge': {
      backgroundColor: getPriorityColor(priority),
      color: '#ffffff',
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
  const { isDarkMode } = useCustomTheme();
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
              <Typography
                variant={compact ? "h6" : "h5"}
                fontWeight="bold"
                sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f' }}
              >
                #{order.order_number || order.id}
              </Typography>

              <Chip
                label={order.status?.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: getOrderStatusColor(order.status, isDarkMode),
                  color: '#ffffff',
                  fontWeight: 'bold',
                }}
              />

              {isDelayed && (
                <Chip
                  label="DELAYED"
                  size="small"
                  icon={<FireIcon />}
                  sx={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography
                variant="body2"
                sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
              >
                {formatTime(order.created_at)}
              </Typography>

              {showTimer && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <AccessTimeIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDelayed
                        ? '#ef4444'
                        : isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                    }}
                  >
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
              <RestaurantIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
              <Typography
                variant="body2"
                sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
              >
                Table: {order.table_name}
              </Typography>
            </Box>
          )}

          {order.guest_count && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <PeopleIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
              <Typography
                variant="body2"
                sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
              >
                {order.guest_count} guests
              </Typography>
            </Box>
          )}

          {order.order_type && (
            <Chip
              label={order.order_type?.replace('-', ' ').toUpperCase()}
              size="small"
              variant="outlined"
              sx={{
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(30, 58, 95, 0.3)',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              }}
            />
          )}
        </Box>

        {/* Special Instructions */}
        {order.special_instructions && !compact && (
          <Alert
            severity="info"
            sx={{
              mb: 1,
              backgroundColor: isDarkMode ? 'rgba(49, 130, 206, 0.1)' : 'rgba(49, 130, 206, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(49, 130, 206, 0.3)' : 'rgba(49, 130, 206, 0.2)'}`,
              '& .MuiAlert-message': {
                color: isDarkMode ? '#ffffff' : '#1e3a5f',
              },
              '& .MuiAlert-icon': {
                color: isDarkMode ? '#90caf9' : '#3182ce',
              },
            }}
          >
            <Typography variant="body2">
              {order.special_instructions}
            </Typography>
          </Alert>
        )}

        {/* Order Items */}
        {showItems && order.items && order.items.length > 0 && (
          <Box mb={1}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f', fontWeight: 'bold' }}
            >
              Items ({order.items.length})
            </Typography>

            {compact ? (
              <Box>
                {order.items.slice(0, 3).map((item, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography
                      variant="body2"
                      sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                    >
                      {item.quantity}x {item.name}
                    </Typography>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                      >
                        +{item.modifiers.length} mods
                      </Typography>
                    )}
                  </Box>
                ))}
                {order.items.length > 3 && (
                  <Typography
                    variant="caption"
                    sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >
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
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }}
                        >
                          {item.quantity}x {item.name}
                        </Typography>

                        {item.modifiers && item.modifiers.length > 0 && (
                          <Box ml={2} mt={0.5}>
                            {item.modifiers.map((modifier, modIndex) => (
                              <Typography
                                key={modIndex}
                                variant="caption"
                                sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                              >
                                • {modifier.name} {modifier.quantity > 1 && `x${modifier.quantity}`}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        {item.notes && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontStyle: 'italic',
                              color: isDarkMode ? '#90caf9' : '#3182ce',
                            }}
                          >
                            Note: {item.notes}
                          </Typography>
                        )}
                      </Box>

                      {item.status && (
                        <Chip
                          label={item.status}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: getOrderStatusColor(item.status, isDarkMode),
                            color: getOrderStatusColor(item.status, isDarkMode),
                          }}
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
            <Typography
              variant="caption"
              gutterBottom
              sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
            >
              Preparing Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={order.preparation_progress || 0}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #1e3a5f 0%, #3182ce 100%)',
                },
              }}
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={1} mt={1}>
          {order.status === 'pending' && (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleStatusChange('preparing')}
              startIcon={<RestaurantIcon />}
              sx={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)'
                  : 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                color: '#ffffff',
                '&:hover': {
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)'
                    : 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
                },
              }}
            >
              Start Preparing
            </Button>
          )}

          {order.status === 'preparing' && (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleStatusChange('ready')}
              startIcon={<CheckCircleIcon />}
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              Mark Ready
            </Button>
          )}

          {order.status === 'ready' && (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleStatusChange('served')}
              startIcon={<CheckCircleIcon />}
              sx={{
                background: 'linear-gradient(135deg, #3182ce 0%, #2563eb 100%)',
                color: '#ffffff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                },
              }}
            >
              Mark Served
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            onClick={() => handleStatusChange('cancelled')}
            startIcon={<CancelIcon />}
            sx={{
              borderColor: '#ef4444',
              color: '#ef4444',
              '&:hover': {
                borderColor: '#dc2626',
                color: '#dc2626',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default OrderTicket;