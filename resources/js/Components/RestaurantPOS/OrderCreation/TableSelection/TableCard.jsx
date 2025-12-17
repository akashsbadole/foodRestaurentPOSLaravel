import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  AccessTime as AccessTimeIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import TouchCard from '../Shared/TouchCard';
import { useThemeContext } from '../../../../Components/ThemeProvider';

const StyledTableCard = styled(Box, {
  shouldForwardProp: (prop) => !['isSelected', 'status'].includes(prop)
})(({ theme, isSelected, status, isDarkMode }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return isDarkMode ? '#22c55e' : '#10b981';
      case 'occupied': return isDarkMode ? '#f87171' : '#ef4444';
      case 'reserved': return isDarkMode ? '#f59e0b' : '#f59e0b';
      case 'cleaning': return isDarkMode ? '#94a3b8' : '#6b7280';
      default: return isDarkMode ? '#64748b' : '#475569';
    }
  };

  const statusColor = getStatusColor(status);

  return {
    height: 120,
    position: 'relative',
    borderRadius: theme.shape.borderRadius * 2,
    overflow: 'hidden',
    border: isSelected ? `3px solid ${statusColor}` : `2px solid ${statusColor}`,
    backgroundColor: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isSelected 
      ? `0 8px 25px ${statusColor}40, 0 4px 12px ${statusColor}20`
      : theme.shadows[2],
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: `0 6px 20px ${statusColor}30, 0 3px 8px ${statusColor}15`,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    // Status indicator bar
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: statusColor,
      transition: 'height 0.3s ease-in-out',
    },
    '&:hover::before': {
      height: 6,
    }
  };
});

const TableCard = ({
  table,
  isSelected = false,
  onClick,
  onLongPress,
  compact = false,
  showDetails = true
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'occupied': return <PeopleIcon />;
      case 'reserved': return <RestaurantIcon />;
      case 'cleaning': return <AccessTimeIcon />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      case 'cleaning': return 'Cleaning';
      default: return 'Unknown';
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

  const handleCardClick = () => {
    onClick?.(table);
  };

  const handleCardLongPress = () => {
    onLongPress?.(table);
  };

  return (
    <TouchCard
      onClick={handleCardClick}
      onLongPress={handleCardLongPress}
      disabled={table.status === 'cleaning'}
      minHeight={compact ? 80 : 120}
    >
      <StyledTableCard
        isSelected={isSelected}
        status={table.status}
        isDarkMode={isDarkMode}
        p={compact ? 1 : 2}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        {/* Table Number and Status */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant={compact ? "body1" : "h6"}
              fontWeight="bold"
              color="text.primary"
              gutterBottom={false}
            >
              {table.name || `T${table.table_number}`}
            </Typography>
            {!compact && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="flex"
                alignItems="center"
                gap={0.5}
              >
                <PeopleIcon fontSize="small" />
                Capacity: {table.capacity}
              </Typography>
            )}
          </Box>
          
          <Chip
            label={getStatusText(table.status)}
            size="small"
            icon={getStatusIcon(table.status)}
            sx={{
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
            }}
          />
        </Box>

        {/* Table Details */}
        {showDetails && !compact && (
          <Box>
            {/* Section Name */}
            {table.section && table.section.name && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block',
                  mb: 0.5,
                }}
              >
                {table.section.name}
              </Typography>
            )}

            {/* Current Order Info */}
            {table.current_order && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)'}`,
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    <ReceiptIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    #{table.current_order}
                  </Typography>
                  {table.guest_count && (
                    <Badge
                      badgeContent={table.guest_count}
                      color="primary"
                      max={table.capacity}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          height: 16,
                          minWidth: 16,
                        }
                      }}
                    >
                      <PeopleIcon fontSize="small" />
                    </Badge>
                  )}
                </Box>
                {table.order_total && (
                  <Typography
                    variant="caption"
                    color="primary.main"
                    fontWeight="bold"
                    display="block"
                  >
                    ${table.order_total.toFixed(2)}
                  </Typography>
                )}
                {table.order_time && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <AccessTimeIcon fontSize="small" />
                    {formatTime(table.order_time)}
                  </Typography>
                )}
              </Box>
            )}

            {/* Reservation Info */}
            {table.reservation_time && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'}`,
                }}
              >
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <RestaurantIcon fontSize="small" />
                  Reserved: {formatTime(table.reservation_time)}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Compact Mode Info */}
        {compact && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {table.capacity} seats
            </Typography>
            {table.guest_count && (
              <Badge
                badgeContent={table.guest_count}
                color="primary"
                max={table.capacity}
              >
                <PeopleIcon fontSize="small" />
              </Badge>
            )}
          </Box>
        )}
      </StyledTableCard>
    </TouchCard>
  );
};

export default TableCard;