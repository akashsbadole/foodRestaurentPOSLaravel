import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minHeight: '60vh',
    maxHeight: '80vh',
  },
}));

const ModifierGroup = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  '&:before': {
    display: 'none',
  },
}));

const ModifierItem = styled(Box)(({ theme, selected }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: selected ? theme.palette.primary.light : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.light : theme.palette.action.hover,
  },
}));

const PriceChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.success.light,
  color: theme.palette.success.contrastText,
}));

const ModifierSelectionDialog = ({
  open,
  onClose,
  onConfirm,
  item = null,
  modifierGroups = [],
  selectedModifiers = [],
  maxSelections = null,
  minSelections = 0,
  allowQuantity = true,
  showPrices = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedModifiers, setTempSelectedModifiers] = useState(selectedModifiers);
  const [expandedGroups, setExpandedGroups] = useState([]);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchTerm('');
      setTempSelectedModifiers(selectedModifiers);
      // Expand all groups by default
      setExpandedGroups(modifierGroups.map(group => group.id));
    }
  }, [open, selectedModifiers, modifierGroups]);

  // Filter modifier groups and items based on search
  const filteredModifierGroups = useMemo(() => {
    if (!searchTerm) return modifierGroups;

    return modifierGroups.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })).filter(group => group.items.length > 0);
  }, [modifierGroups, searchTerm]);

  const handleGroupToggle = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleModifierChange = (groupId, modifier, selectionType) => {
    const newSelectedModifiers = [...tempSelectedModifiers];
    const existingIndex = newSelectedModifiers.findIndex(
      m => m.modifier_id === modifier.id && m.group_id === groupId
    );

    if (selectionType === 'single') {
      // For radio groups, replace existing selection
      const groupModifiers = newSelectedModifiers.filter(m => m.group_id === groupId);
      groupModifiers.forEach(m => {
        const index = newSelectedModifiers.indexOf(m);
        if (index > -1) newSelectedModifiers.splice(index, 1);
      });

      if (existingIndex === -1) {
        newSelectedModifiers.push({
          modifier_id: modifier.id,
          group_id: groupId,
          name: modifier.name,
          price: modifier.price,
          quantity: 1
        });
      }
    } else {
      // For checkbox groups, toggle selection
      if (existingIndex > -1) {
        newSelectedModifiers.splice(existingIndex, 1);
      } else {
        newSelectedModifiers.push({
          modifier_id: modifier.id,
          group_id: groupId,
          name: modifier.name,
          price: modifier.price,
          quantity: 1
        });
      }
    }

    setTempSelectedModifiers(newSelectedModifiers);
  };

  const handleQuantityChange = (groupId, modifierId, change) => {
    const newSelectedModifiers = [...tempSelectedModifiers];
    const modifierIndex = newSelectedModifiers.findIndex(
      m => m.modifier_id === modifierId && m.group_id === groupId
    );

    if (modifierIndex > -1) {
      const newQuantity = Math.max(1, newSelectedModifiers[modifierIndex].quantity + change);
      newSelectedModifiers[modifierIndex].quantity = newQuantity;
      setTempSelectedModifiers(newSelectedModifiers);
    }
  };

  const calculateTotal = () => {
    return tempSelectedModifiers.reduce((total, modifier) => {
      return total + (modifier.price * modifier.quantity);
    }, 0);
  };

  const validateSelections = () => {
    const validationErrors = [];

    modifierGroups.forEach(group => {
      const groupSelections = tempSelectedModifiers.filter(m => m.group_id === group.id);
      const selectionCount = groupSelections.length;

      if (group.min_selections && selectionCount < group.min_selections) {
        validationErrors.push(`${group.name}: Minimum ${group.min_selections} selection(s) required`);
      }

      if (group.max_selections && selectionCount > group.max_selections) {
        validationErrors.push(`${group.name}: Maximum ${group.max_selections} selection(s) allowed`);
      }
    });

    return validationErrors;
  };

  const handleConfirm = () => {
    const errors = validateSelections();
    if (errors.length === 0) {
      onConfirm(tempSelectedModifiers);
      onClose();
    }
  };

  const validationErrors = validateSelections();
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              {item ? `Customize ${item.name}` : 'Select Modifiers'}
            </Typography>
            {item && (
              <Typography variant="body2" color="text.secondary">
                Base Price: {formatCurrency(item.price)}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Search */}
        <Box mb={2}>
          <TextField
            fullWidth
            placeholder="Search modifiers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {/* Modifier Groups */}
        {filteredModifierGroups.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No modifiers found' : 'No modifiers available'}
            </Typography>
          </Box>
        ) : (
          filteredModifierGroups.map((group) => {
            const groupSelections = tempSelectedModifiers.filter(m => m.group_id === group.id);
            const isExpanded = expandedGroups.includes(group.id);

            return (
              <ModifierGroup
                key={group.id}
                expanded={isExpanded}
                onChange={() => handleGroupToggle(group.id)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {group.name}
                      </Typography>
                      {group.description && (
                        <Typography variant="body2" color="text.secondary">
                          {group.description}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${groupSelections.length} selected`}
                        size="small"
                        color={groupSelections.length > 0 ? 'primary' : 'default'}
                      />
                      {(group.min_selections || group.max_selections) && (
                        <Typography variant="caption" color="text.secondary">
                          {group.min_selections && `Min: ${group.min_selections}`}
                          {group.min_selections && group.max_selections && ' • '}
                          {group.max_selections && `Max: ${group.max_selections}`}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <Grid container spacing={2}>
                    {group.items.map((modifier) => {
                      const isSelected = tempSelectedModifiers.some(
                        m => m.modifier_id === modifier.id && m.group_id === group.id
                      );
                      const selectedModifier = tempSelectedModifiers.find(
                        m => m.modifier_id === modifier.id && m.group_id === group.id
                      );

                      return (
                        <Grid item xs={12} sm={6} key={modifier.id}>
                          <ModifierItem
                            selected={isSelected}
                            onClick={() => handleModifierChange(group.id, modifier, group.selection_type)}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box flex={1}>
                                <FormControlLabel
                                  control={
                                    group.selection_type === 'single' ? (
                                      <Radio
                                        checked={isSelected}
                                        onChange={() => handleModifierChange(group.id, modifier, 'single')}
                                      />
                                    ) : (
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={() => handleModifierChange(group.id, modifier, 'multiple')}
                                      />
                                    )
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {modifier.name}
                                      </Typography>
                                      {modifier.description && (
                                        <Typography variant="caption" color="text.secondary">
                                          {modifier.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                              </Box>

                              <Box display="flex" alignItems="center" gap={1}>
                                {showPrices && modifier.price > 0 && (
                                  <PriceChip
                                    label={formatCurrency(modifier.price)}
                                    size="small"
                                  />
                                )}

                                {allowQuantity && isSelected && (
                                  <Box display="flex" alignItems="center">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(group.id, modifier.id, -1);
                                      }}
                                    >
                                      <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <Typography variant="body2" sx={{ minWidth: '20px', textAlign: 'center' }}>
                                      {selectedModifier?.quantity || 1}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(group.id, modifier.id, 1);
                                      }}
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </ModifierItem>
                        </Grid>
                      );
                    })}
                  </Grid>
                </AccordionDetails>
              </ModifierGroup>
            );
          })
        )}

        {/* Total */}
        {showPrices && tempSelectedModifiers.length > 0 && (
          <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
            <Typography variant="h6" align="right">
              Modifier Total: {formatCurrency(calculateTotal())}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={validationErrors.length > 0}
        >
          Confirm {tempSelectedModifiers.length} Modifier{tempSelectedModifiers.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ModifierSelectionDialog;