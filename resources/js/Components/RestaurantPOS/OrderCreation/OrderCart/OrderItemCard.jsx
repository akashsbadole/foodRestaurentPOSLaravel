import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  MoreVert as MoreVertIcon,
  LocalOffer as DiscountIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import TouchCard from '../Shared/TouchCard';
import { useThemeContext } from '../../../../Components/ThemeProvider';

const StyledOrderItemCard = styled(Box, {
  shouldForwardProp: (prop) => !['isEditing'].includes(prop)
})(({ theme, isEditing, isDarkMode }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    borderColor: isDarkMode ? '#475569' : '#cbd5e1',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const QuantityControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 100,
}));

const OrderItemCard = ({
  item,
  onQuantityChange,
  onPriceChange,
  onModifierChange,
  onRemove,
  onEdit,
  compact = false,
  showControls = true,
  currency = 'USD'
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity);
  const [editPrice, setEditPrice] = useState(item.unit_price);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setEditQuantity(item.quantity);
    setEditPrice(item.unit_price);
    handleMenuClose();
  };

  const handleQuantityChange = (newQuantity) => {
    setEditQuantity(newQuantity);
    if (newQuantity >= 0.01) {
      onQuantityChange?.(item.id, newQuantity);
    }
  };

  const handlePriceChange = (newPrice) => {
    setEditPrice(newPrice);
    if (newPrice >= 0) {
      onPriceChange?.(item.id, newPrice);
    }
  };

  const handleSave = () => {
    onQuantityChange?.(item.id, editQuantity);
    onPriceChange?.(item.id, editPrice);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditQuantity(item.quantity);
    setEditPrice(item.unit_price);
    setIsEditing(false);
  };

  const handleRemove = () => {
    onRemove?.(item.id);
    handleMenuClose();
  };

  const handleModifierEdit = () => {
    onModifierChange?.(item);
    handleMenuClose();
  };

  const calculateSubtotal = () => {
    const itemTotal = item.quantity * item.unit_price;
    const modifiersTotal = item.modifiers?.reduce((total, modifier) => {
      return total + (modifier.price * modifier.quantity * item.quantity);
    }, 0) || 0;
    return itemTotal + modifiersTotal;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const hasModifiers = item.modifiers && item.modifiers.length > 0;
  const hasDiscount = item.discount && item.discount > 0;

  return (
    <StyledOrderItemCard isEditing={isEditing} isDarkMode={isDarkMode}>
      {/* Main Content */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
        {/* Item Details */}
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography
              variant={compact ? "body1" : "h6"}
              fontWeight="bold"
              color="text.primary"
              sx={{ lineHeight: 1.2 }}
            >
              {item.quantity}x {item.product_name}
            </Typography>
            
            {hasDiscount && (
              <Chip
                icon={<DiscountIcon />}
                label={`${item.discount}% off`}
                size="small"
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  color: isDarkMode ? '#f87171' : '#dc2626',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            )}
          </Box>

          {/* Modifiers */}
          {hasModifiers && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Modifiers:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {item.modifiers.map((modifier, index) => (
                  <Chip
                    key={index}
                    label={`${modifier.name} x${modifier.quantity}`}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)',
                      color: isDarkMode ? '#90caf9' : '#1e3a5f',
                      fontSize: '0.65rem',
                      height: 20,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Special Instructions */}
          {item.special_instructions && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Notes:
              </Typography>
              <Typography
                variant="body2"
                color="primary.main"
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontStyle: 'italic',
                }}
              >
                {item.special_instructions}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price and Actions */}
        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
          {/* Price */}
          <Box textAlign="right">
            {isEditing ? (
              <TextField
                value={editPrice}
                onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                type="number"
                size="small"
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ width: 100 }}
                startAdornment="$"
              />
            ) : (
              <Typography
                variant="h6"
                fontWeight="bold"
                color="primary.main"
                sx={{
                  background: isDarkMode
                    ? 'linear-gradient(45deg, #60a5fa, #90caf9)'
                    : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatCurrency(calculateSubtotal())}
              </Typography>
            )}
            
            {item.unit_price !== item.product?.price && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(item.product?.price || item.unit_price)}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          {showControls && !isEditing && (
            <Box display="flex" gap={0.5}>
              {/* Edit Button */}
              <IconButton
                size="small"
                onClick={handleEditToggle}
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>

              {/* Menu Button */}
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)',
                  },
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Edit Controls */}
      {isEditing && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          {/* Quantity Control */}
          <QuantityControl>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Quantity:
            </Typography>
            <Box display="flex" alignItems="center">
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(Math.max(0.01, editQuantity - 1))}
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <TextField
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0.01)}
                type="number"
                size="small"
                inputProps={{ min: 0.01, step: 0.01 }}
                sx={{ width: 70, mx: 1 }}
              />
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(editQuantity + 1)}
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  color: isDarkMode ? '#90caf9' : '#1e3a5f',
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </QuantityControl>

          {/* Action Buttons */}
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancel}
              sx={{
                borderColor: isDarkMode ? '#475569' : '#94a3b8',
                color: isDarkMode ? '#cbd5e1' : '#475569',
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              sx={{
                background: isDarkMode
                  ? 'linear-gradient(45deg, #2c5282, #3182ce)'
                  : 'linear-gradient(45deg, #1e3a5f, #2563eb)',
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            boxShadow: theme.shadows[4],
          }
        }}
      >
        <MenuItem onClick={handleEditToggle}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Item
        </MenuItem>
        {hasModifiers && (
          <MenuItem onClick={handleModifierEdit}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Modifiers
          </MenuItem>
        )}
        <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Remove Item
        </MenuItem>
      </Menu>
    </StyledOrderItemCard>
  );
};

export default OrderItemCard;