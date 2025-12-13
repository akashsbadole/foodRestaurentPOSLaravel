import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Badge
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../Components/ThemeProvider';
import {
  getTableStatusColor,
  getTableStatusLabel,
  getTableStatusMuiVariant
} from '../../../lib/statusColors';

const StyledCard = styled(Card)(({ theme, status, isDarkMode }) => {
  const statusColor = getTableStatusColor(status, isDarkMode);
  
  return {
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `2px solid ${statusColor}`,
    backgroundColor: theme.palette?.background?.paper || '#ffffff',
    backgroundImage: theme.palette?.background?.paperGradient || 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    borderRadius: theme.shape?.borderRadius ? theme.shape.borderRadius * 2 : 16,
    overflow: 'hidden',
    boxShadow: theme.shadows?.[2] || '0 4px 12px rgba(30, 58, 95, 0.1), 0 2px 6px rgba(30, 58, 95, 0.06)',
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
      transform: 'translateY(-6px) scale(1.02)',
      boxShadow: theme.shadows?.[6] || '0 16px 48px rgba(30, 58, 95, 0.15), 0 8px 16px rgba(30, 58, 95, 0.1)',
      '&::before': {
        transform: 'translateY(0)',
      }
    },
    '&:active': {
      transform: 'translateY(-2px) scale(1.01)',
    }
  };
});

const Table = ({
  table,
  onSelect,
  onStatusChange,
  onEdit,
  showMenu = true,
  compact = false
}) => {
  const { isDarkMode } = useThemeContext();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange?.(table.id, newStatus);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit?.(table);
    handleMenuClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'occupied':
        return <PeopleIcon />;
      case 'reserved':
        return <RestaurantIcon />;
      case 'cleaning':
        return <AccessTimeIcon />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    return getTableStatusLabel(status);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCardClick = () => {
    if (table.status === 'available' || table.status === 'occupied') {
      onSelect?.(table);
    }
  };

  return (
    <StyledCard
      status={table.status}
      isDarkMode={isDarkMode}
      onClick={handleCardClick}
      className="table-card"
    >
      <CardContent sx={{ flex: 1, padding: compact ? 1 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography
              variant={compact ? "body2" : "h6"}
              fontWeight="bold"
              gutterBottom
              sx={{
                color: 'text.primary',
              }}
            >
              {table.name}
            </Typography>
            
            {!compact && (
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <PeopleIcon fontSize="small" />
                Capacity: {table.capacity} seats
              </Typography>
            )}

            {table.section_name && !compact && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block'
                }}
              >
                {table.section_name}
              </Typography>
            )}
          </Box>

          {showMenu && (
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                ml: 1,
                backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)',
                }
              }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Chip
            variant={getTableStatusMuiVariant(table.status)}
            size="small"
            label={getStatusText(table.status)}
            icon={getStatusIcon(table.status)}
          />

          {table.status === 'occupied' && table.order_time && !compact && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <AccessTimeIcon fontSize="small" />
              {formatTime(table.order_time)}
            </Typography>
          )}

          {table.status === 'occupied' && table.guest_count && (
            <Badge
              badgeContent={table.guest_count}
              color="primary"
              max={table.capacity}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }
              }}
            >
              <PeopleIcon fontSize="small" />
            </Badge>
          )}
        </Box>

        {table.current_order && !compact && (
          <Box
            mt={1}
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)'}`,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Order #{table.current_order}
            </Typography>
            {table.order_total && (
              <Typography
                variant="caption"
                display="block"
                color="primary.main"
                fontWeight="bold"
              >
                Total: ${table.order_total.toFixed(2)}
              </Typography>
            )}
          </Box>
        )}

        {table.reservation_time && !compact && (
          <Box
            mt={1}
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
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
          }
        }}
      >
        <MenuItem onClick={() => handleStatusChange('available')}>
          Mark as Available
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('occupied')}>
          Mark as Occupied
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('reserved')}>
          Mark as Reserved
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('cleaning')}>
          Mark as Cleaning
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          Edit Table
        </MenuItem>
      </Menu>
    </StyledCard>
  );
};

export default Table;