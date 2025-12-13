import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Badge,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CameraAlt as CameraIcon,
  FlashlightOn as FlashlightIcon,
  FlashlightOff as FlashlightOffIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '@/Components/ThemeProvider';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 80,
  right: 20,
  background: theme.palette.primary.gradient,
  boxShadow: theme.shadows[4],
  '&:hover': {
    background: theme.palette.primary.gradientLight,
    transform: 'scale(1.1)',
  },
}));

const MobileInventoryScanner = ({
  inventoryItems = [],
  onScanSuccess,
  onManualEntry,
  onQuickAdjustment,
  user = null,
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [quickAdjustmentOpen, setQuickAdjustmentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isScanning && videoRef.current) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraError(null);
    } catch (err) {
      setCameraError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleScan = (data) => {
    setScanResult(data);
    setIsScanning(false);
    
    // Find matching inventory item
    const item = inventoryItems.find(item => 
      item.barcode === data || item.sku === data || item.id === parseInt(data)
    );
    
    if (item) {
      setSelectedItem(item);
      setManualEntryOpen(true);
    } else {
      // Create new item entry
      setSelectedItem({
        name: data,
        barcode: data,
        quantity: 0,
        alert_quantity: 10,
        unit_type: 'pcs',
        cost: 0,
      });
      setManualEntryOpen(true);
    }
  };

  const handleManualSubmit = () => {
    if (selectedItem) {
      onManualEntry({
        ...selectedItem,
        adjustment_quantity: adjustmentType === 'add' ? adjustmentQuantity : -adjustmentQuantity,
        adjustment_type: adjustmentType,
      });
      
      setManualEntryOpen(false);
      setSelectedItem(null);
      setAdjustmentQuantity(0);
    }
  };

  const handleQuickAdjustment = (itemId, type, quantity) => {
    onQuickAdjustment({
      inventory_item_id: itemId,
      adjustment_type: type,
      quantity: quantity,
      reason: 'Quick mobile adjustment',
    });
  };

  const toggleFlashlight = () => {
    setFlashlightOn(!flashlightOn);
    // Implement flashlight toggle logic
  };

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode?.includes(searchQuery) ||
    item.sku?.includes(searchQuery)
  );

  const getStockStatusColor = (quantity, alertQuantity) => {
    if (quantity <= alertQuantity) return 'error';
    if (quantity <= alertQuantity * 1.5) return 'warning';
    return 'success';
  };

  const getStockStatusIcon = (quantity, alertQuantity) => {
    if (quantity <= alertQuantity) return <ErrorIcon />;
    if (quantity <= alertQuantity * 1.5) return <WarningIcon />;
    return <CheckCircleIcon />;
  };

  return (
    <Box sx={{ p: 1, pb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold" color="primary.main">
          Mobile Inventory Scanner
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            color="primary"
            onClick={() => setIsScanning(!isScanning)}
            sx={{
              background: isScanning ? theme.palette.primary.main : 'transparent',
              color: isScanning ? 'white' : theme.palette.primary.main,
            }}
          >
            <QrCodeIcon />
          </IconButton>
          <IconButton color="primary" onClick={() => setManualEntryOpen(true)}>
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Scanner View */}
      {isScanning && (
        <Box sx={{ mb: 2, position: 'relative' }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: theme.shape.borderRadius,
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {cameraError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cameraError}
            </Alert>
          )}
          
          <IconButton
            sx={{ position: 'absolute', top: 10, right: 10 }}
            onClick={toggleFlashlight}
            color="primary"
          >
            {flashlightOn ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
          </IconButton>
          
          <Box sx={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <TextField
              fullWidth
              placeholder="Enter barcode manually"
              variant="outlined"
              size="small"
              value={scanResult || ''}
              onChange={(e) => setScanResult(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && scanResult) {
                  handleScan(scanResult);
                }
              }}
              InputProps={{
                style: { background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px' },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search inventory items..."
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.disabled' }} />,
        }}
        sx={{ mb: 2 }}
      />

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => {
              setAdjustmentType('add');
              setQuickAdjustmentOpen(true);
            }}
          >
            Quick Add
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            color="warning"
            startIcon={<RemoveIcon />}
            onClick={() => {
              setAdjustmentType('remove');
              setQuickAdjustmentOpen(true);
            }}
          >
            Quick Remove
          </Button>
        </Grid>
      </Grid>

      {/* Inventory List */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
        <List>
          {filteredItems.map((item) => (
            <ListItem
              key={item.id}
              button
              onClick={() => {
                setSelectedItem(item);
                setManualEntryOpen(true);
              }}
              sx={{
                borderLeft: `4px solid ${theme.palette[getStockStatusColor(item.quantity, item.alert_quantity)].main}`,
                mb: 1,
              }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    bgcolor: theme.palette[getStockStatusColor(item.quantity, item.alert_quantity)].main,
                    width: 40,
                    height: 40,
                  }}
                >
                  {getStockStatusIcon(item.quantity, item.alert_quantity)}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {item.name}
                    </Typography>
                    <Chip
                      label={`${item.quantity} ${item.unit_type}`}
                      size="small"
                      color={getStockStatusColor(item.quantity, item.alert_quantity)}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Alert: {item.alert_quantity} {item.unit_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${item.cost || 0}
                    </Typography>
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAdjustment(item.id, 'add', 1);
                  }}
                  color="success"
                >
                  <AddIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAdjustment(item.id, 'remove', 1);
                  }}
                  color="warning"
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Manual Entry Dialog */}
      <Dialog open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem?.id ? 'Adjust Inventory' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Item Name"
                value={selectedItem.name || ''}
                onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Barcode/SKU"
                value={selectedItem.barcode || selectedItem.sku || ''}
                onChange={(e) => setSelectedItem({ ...selectedItem, barcode: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Current Quantity"
                type="number"
                value={selectedItem.quantity || 0}
                margin="normal"
                disabled
              />
              <TextField
                fullWidth
                label="Alert Quantity"
                type="number"
                value={selectedItem.alert_quantity || 10}
                onChange={(e) => setSelectedItem({ ...selectedItem, alert_quantity: parseInt(e.target.value) })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Unit Type"
                value={selectedItem.unit_type || 'pcs'}
                onChange={(e) => setSelectedItem({ ...selectedItem, unit_type: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Cost"
                type="number"
                value={selectedItem.cost || 0}
                onChange={(e) => setSelectedItem({ ...selectedItem, cost: parseFloat(e.target.value) })}
                margin="normal"
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Quick Adjustment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant={adjustmentType === 'add' ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => setAdjustmentType('add')}
                    >
                      Add Stock
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant={adjustmentType === 'remove' ? 'contained' : 'outlined'}
                      color="warning"
                      onClick={() => setAdjustmentType('remove')}
                    >
                      Remove Stock
                    </Button>
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  label="Adjustment Quantity"
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                  margin="normal"
                  sx={{ mt: 2 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualEntryOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSubmit}>
            {selectedItem?.id ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Adjustment Dialog */}
      <Dialog open={quickAdjustmentOpen} onClose={() => setQuickAdjustmentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Quick Stock Adjustment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {adjustmentType === 'add' ? 'Add 1 unit to selected item' : 'Remove 1 unit from selected item'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will create a quick adjustment record with reason "Quick mobile adjustment"
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickAdjustmentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setQuickAdjustmentOpen(false)}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <StyledFab
        color="primary"
        aria-label="scan"
        onClick={() => setIsScanning(!isScanning)}
      >
        <CameraIcon />
      </StyledFab>
    </Box>
  );
};

export default MobileInventoryScanner;