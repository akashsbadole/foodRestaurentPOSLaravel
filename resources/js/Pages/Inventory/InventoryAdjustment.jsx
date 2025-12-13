import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as ReportIcon,
  Timeline as TimelineIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '@/Components/ThemeProvider';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const AdjustmentStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root .Mui-active .MuiStepIcon-text': {
    fill: 'white',
  },
  '& .MuiStepLabel-root .Mui-completed .MuiStepIcon-text': {
    fill: 'white',
  },
}));

const InventoryAdjustment = ({
  inventoryItems = [],
  pendingAdjustments = [],
  approvedAdjustments = [],
  rejectedAdjustments = [],
  stores = [],
  user = null,
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeStep, setActiveStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [adjustmentData, setAdjustmentData] = useState({
    reason: '',
    type: 'manual',
    priority: 'normal',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);

  const steps = ['Select Items', 'Set Adjustments', 'Review & Submit'];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStore === 'all' || item.store_id === parseInt(selectedStore);
    return matchesSearch && matchesStore;
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmitAdjustment();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedItems([]);
    setAdjustmentData({
      reason: '',
      type: 'manual',
      priority: 'normal',
      notes: '',
    });
  };

  const handleItemSelect = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, {
        ...item,
        adjustmentQuantity: 0,
        adjustmentType: 'add',
        newQuantity: item.quantity,
      }]);
    }
  };

  const handleItemAdjustment = (itemId, field, value) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'adjustmentQuantity' || field === 'adjustmentType') {
          const adjustment = updatedItem.adjustmentType === 'add' 
            ? updatedItem.adjustmentQuantity 
            : -updatedItem.adjustmentQuantity;
          updatedItem.newQuantity = item.quantity + adjustment;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmitAdjustment = () => {
    const adjustmentRequest = {
      items: selectedItems.map(item => ({
        inventory_item_id: item.id,
        adjustment_quantity: item.adjustmentType === 'add' ? item.adjustmentQuantity : -item.adjustmentQuantity,
        adjustment_type: item.adjustmentType,
        current_quantity: item.quantity,
        new_quantity: item.newQuantity,
        reason: item.adjustmentReason || adjustmentData.reason,
      })),
      ...adjustmentData,
      status: 'pending',
      requested_by: user.id,
      requested_at: new Date().toISOString(),
    };

    router.post('/inventory/adjustments', adjustmentRequest, {
      onSuccess: () => {
        handleReset();
        setPreviewDialogOpen(false);
      },
    });
  };

  const getAdjustmentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getAdjustmentStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'approved': return <CheckCircleIcon />;
      case 'rejected': return <CancelIcon />;
      default: return <InfoIcon />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Items for Adjustment
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search items..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon />,
                }}
                sx={{ minWidth: 250, flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Store</InputLabel>
                <Select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  label="Store"
                >
                  <MenuItem value="all">All Stores</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Select</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Alert Level</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      selected={selectedItems.some(selected => selected.id === item.id)}
                      onClick={() => handleItemSelect(item)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedItems.some(selected => selected.id === item.id)}
                          onChange={() => handleItemSelect(item)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {item.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {item.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.quantity || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.alert_quantity || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.quantity <= item.alert_quantity ? 'Low' : 'OK'}
                          color={item.quantity <= item.alert_quantity ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Set Adjustment Values
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Adjustment Reason"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={adjustmentData.priority}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Adjustment Type</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>New Stock</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <FormControl size="small">
                          <Select
                            value={item.adjustmentType}
                            onChange={(e) => handleItemAdjustment(item.id, 'adjustmentType', e.target.value)}
                          >
                            <MenuItem value="add">Add Stock</MenuItem>
                            <MenuItem value="remove">Remove Stock</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.adjustmentQuantity}
                          onChange={(e) => handleItemAdjustment(item.id, 'adjustmentQuantity', parseInt(e.target.value) || 0)}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                          {item.newQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Specific reason..."
                          value={item.adjustmentReason || ''}
                          onChange={(e) => handleItemAdjustment(item.id, 'adjustmentReason', e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit Adjustment Request
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This adjustment request will be sent for approval. You will be notified when it's reviewed.
              </Typography>
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Adjustment Summary
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><InventoryIcon /></ListItemIcon>
                        <ListItemText primary="Items to Adjust" secondary={selectedItems.length} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><ScheduleIcon /></ListItemIcon>
                        <ListItemText primary="Priority" secondary={adjustmentData.priority} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText primary="Requested By" secondary={user?.name} />
                      </ListItem>
                    </List>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Items Summary
                    </Typography>
                    {selectedItems.map((item) => (
                      <Box key={item.id} sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.adjustmentType === 'add' ? '+' : '-'}{item.adjustmentQuantity} 
                          {' '}({item.quantity} → {item.newQuantity})
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Head title="Inventory Adjustment" />
      <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main" gutterBottom>
          Inventory Adjustment
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <AdjustmentStepper activeStep={activeStep} orientation="vertical">
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                      <StepContent>
                        <Box sx={{ py: 2 }}>
                          {renderStepContent(index)}
                        </Box>
                        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                            variant="outlined"
                          >
                            Back
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={selectedItems.length === 0}
                          >
                            {index === steps.length - 1 ? 'Submit for Approval' : 'Next'}
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </AdjustmentStepper>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Approvals
                </Typography>
                {pendingAdjustments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No pending adjustments
                  </Typography>
                ) : (
                  <List dense>
                    {pendingAdjustments.slice(0, 3).map((adjustment) => (
                      <ListItem key={adjustment.id} button>
                        <ListItemIcon>
                          <Badge badgeContent={adjustment.items_count} color="primary">
                            <PendingIcon />
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={adjustment.reason}
                          secondary={`Priority: ${adjustment.priority}`}
                        />
                        <Chip
                          label={adjustment.status}
                          color={getAdjustmentStatusColor(adjustment.status)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                {pendingAdjustments.length > 3 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setHistoryDialogOpen(true)}
                  >
                    View All ({pendingAdjustments.length})
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                    <ListItemText primary="Approved Today" secondary="0" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PendingIcon color="warning" /></ListItemIcon>
                    <ListItemText primary="Pending Review" secondary={pendingAdjustments.length} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CancelIcon color="error" /></ListItemIcon>
                    <ListItemText primary="Rejected Today" secondary="0" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Adjustments */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Adjustments
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...approvedAdjustments, ...rejectedAdjustments].slice(0, 5).map((adjustment) => (
                    <TableRow key={adjustment.id} hover>
                      <TableCell>#{adjustment.id}</TableCell>
                      <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{adjustment.items_count}</TableCell>
                      <TableCell>{adjustment.reason}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getAdjustmentStatusIcon(adjustment.status)}
                          label={adjustment.status}
                          color={getAdjustmentStatusColor(adjustment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={adjustment.priority}
                          color={getPriorityColor(adjustment.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => {
                          setSelectedAdjustment(adjustment);
                          setPreviewDialogOpen(true);
                        }}>
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Adjustment Details</DialogTitle>
          <DialogContent>
            {selectedAdjustment && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Request ID</Typography>
                    <Typography variant="body1" fontWeight="medium">#{selectedAdjustment.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      icon={getAdjustmentStatusIcon(selectedAdjustment.status)}
                      label={selectedAdjustment.status}
                      color={getAdjustmentStatusColor(selectedAdjustment.status)}
                      size="small"
                    />
                  </Grid>
                </Grid>
                <Typography variant="h6" gutterBottom>Items</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Current</TableCell>
                        <TableCell>Adjustment</TableCell>
                        <TableCell>New</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedAdjustment.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.current_quantity}</TableCell>
                          <TableCell>
                            <Typography color={item.adjustment_quantity > 0 ? 'success.main' : 'error.main'}>
                              {item.adjustment_quantity > 0 ? '+' : ''}{item.adjustment_quantity}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.new_quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default InventoryAdjustment;