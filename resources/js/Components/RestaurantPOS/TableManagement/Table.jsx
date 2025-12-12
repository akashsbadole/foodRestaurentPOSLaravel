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

const StyledCard = styled(Card)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return theme.palette.success.main;
      case 'occupied':
        return theme.palette.error.main;
      case 'reserved':
        return theme.palette.warning.main;
      case 'cleaning':
        return theme.palette.info.main;
      default:
        return theme.palette.grey.main;
    }
  };

  return {
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: `2px solid ${getStatusColor(status)}`,
    backgroundColor: status === 'available' ? theme.palette.success.light : theme.palette.background.paper,
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  };
});

const TableStatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return { backgroundColor: theme.palette.success.main, color: theme.palette.success.contrastText };
      case 'occupied':
        return { backgroundColor: theme.palette.error.main, color: theme.palette.error.contrastText };
      case 'reserved':
        return { backgroundColor: theme.palette.warning.main, color: theme.palette.warning.contrastText };
      case 'cleaning':
        return { backgroundColor: theme.palette.info.main, color: theme.palette.info.contrastText };
      default:
        return { backgroundColor: theme.palette.grey.main, color: theme.palette.grey.contrastText };
    }
  };

  return getStatusColor(status);
});

const Table = ({
  table,
  onSelect,
  onStatusChange,
  onEdit,
  showMenu = true,
  compact = false
}) => {
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
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      case 'cleaning':
        return 'Cleaning';
      default:
        return 'Unknown';
    }
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
      onClick={handleCardClick}
      className="table-card"
    >
      <CardContent sx={{ flex: 1, padding: compact ? 1 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant={compact ? "body2" : "h6"} fontWeight="bold" gutterBottom>
              {table.name}
            </Typography>
            
            {!compact && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Capacity: {table.capacity} seats
              </Typography>
            )}

            {table.section_name && !compact && (
              <Typography variant="caption" color="text.secondary">
                {table.section_name}
              </Typography>
            )}
          </Box>

          {showMenu && (
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <TableStatusChip
            status={table.status}
            size="small"
            label={getStatusText(table.status)}
            icon={getStatusIcon(table.status)}
          />

          {table.status === 'occupied' && table.order_time && !compact && (
            <Typography variant="caption" color="text.secondary">
              {formatTime(table.order_time)}
            </Typography>
          )}

          {table.status === 'occupied' && table.guest_count && (
            <Badge
              badgeContent={table.guest_count}
              color="primary"
              max={table.capacity}
            >
              <PeopleIcon fontSize="small" />
            </Badge>
          )}
        </Box>

        {table.current_order && !compact && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Order #{table.current_order}
            </Typography>
            {table.order_total && (
              <Typography variant="caption" display="block" color="text.secondary">
                Total: ${table.order_total.toFixed(2)}
              </Typography>
            )}
          </Box>
        )}

        {table.reservation_time && !compact && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
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