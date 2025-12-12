import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Collapse,
  Button,
  Grid,
  Divider,
  Menu,
  MenuItem,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const ItemHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  cursor: 'pointer',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const QuantityControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ModifierChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  fontSize: '0.75rem',
  height: '24px',
}));

const OrderItem = ({
  item,
  onQuantityChange,
  onEdit,
  onDelete,
  onModifierAdd,
  onModifierRemove,
  showModifiers = true,
  showControls = true,
  compact = false,
  expanded: controlledExpanded = false
}) => {
  const [expanded, setExpanded] = useState(controlledExpanded);
  const [anchorEl, setAnchorEl] = useState(null);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : expanded;
  const open = Boolean(anchorEl);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQuantityIncrease = () => {
    onQuantityChange?.(item.id, item.quantity + 1);
  };

  const handleQuantityDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange?.(item.id, item.quantity - 1);
    }
  };

  const handleEdit = () => {
    onEdit?.(item);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(item.id);
    handleMenuClose();
  };

  const calculateItemTotal = () => {
    const baseTotal = item.price * item.quantity;
    const modifiersTotal = item.modifiers?.reduce((total, modifier) => {
      return total + (modifier.price * modifier.quantity * item.quantity);
    }, 0) || 0;
    return baseTotal + modifiersTotal;
  };

  const calculateModifierTotal = (modifier) => {
    return modifier.price * modifier.quantity * item.quantity;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'success';
      case 'served': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <StyledCard elevation={compact ? 1 : 2}>
      <CardContent sx={{ p: compact ? 1 : 2 }}>
        <ItemHeader onClick={handleToggleExpanded}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant={compact ? "body2" : "h6"} fontWeight="bold">
                {item.name}
              </Typography>
              {item.status && (
                <Chip
                  label={item.status}
                  color={getStatusColor(item.status)}
                  size="small"
                />
              )}
              {item.is_special && (
                <Chip label="Special" color="secondary" size="small" />
              )}
            </Box>

            {!compact && item.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {item.description}
              </Typography>
            )}

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" color="primary" fontWeight="bold">
                {formatCurrency(calculateItemTotal())}
              </Typography>

              {showControls && (
                <QuantityControls>
                  <IconButton
                    size="small"
                    onClick={handleQuantityDecrease}
                    disabled={item.quantity <= 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography variant="body1" sx={{ minWidth: '30px', textAlign: 'center' }}>
                    {item.quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleQuantityIncrease}
                  >
                    <AddIcon />
                  </IconButton>
                </QuantityControls>
              )}
            </Box>

            {item.modifiers && item.modifiers.length > 0 && (
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  {item.modifiers.length} modifier{item.modifiers.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>

          {showControls && (
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          )}
        </ItemHeader>

        {/* Modifiers Section */}
        {showModifiers && item.modifiers && item.modifiers.length > 0 && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Modifiers:
              </Typography>
              <Grid container spacing={1}>
                {item.modifiers.map((modifier, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <ModifierChip
                          label={`${modifier.name} x${modifier.quantity}`}
                          size="small"
                          variant="outlined"
                        />
                        {onModifierRemove && (
                          <IconButton
                            size="small"
                            onClick={() => onModifierRemove(item.id, modifier.id)}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(calculateModifierTotal(modifier))}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {onModifierAdd && (
                <Box mt={1}>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => onModifierAdd(item.id)}
                  >
                    Add Modifier
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        )}

        {/* Item Details */}
        {isExpanded && !compact && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Unit Price:
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(item.price)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Quantity:
                </Typography>
                <Typography variant="body2">
                  {item.quantity}
                </Typography>
              </Grid>
              {item.category_name && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Category:
                  </Typography>
                  <Typography variant="body2">
                    {item.category_name}
                  </Typography>
                </Grid>
              )}
              {item.sku && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    SKU:
                  </Typography>
                  <Typography variant="body2">
                    {item.sku}
                  </Typography>
                </Grid>
              )}
              {item.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Notes:
                  </Typography>
                  <Typography variant="body2">
                    {item.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Collapse>
        )}

        {/* Expand/Collapse Button */}
        {(showModifiers && item.modifiers && item.modifiers.length > 0) || !compact ? (
          <Box display="flex" justifyContent="center" mt={1}>
            <IconButton size="small" onClick={handleToggleExpanded}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        ) : null}
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Item
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Remove Item
        </MenuItem>
      </Menu>
    </StyledCard>
  );
};

export default OrderItem;