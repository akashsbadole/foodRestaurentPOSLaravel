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
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as PurchaseIcon,
  Assessment as ReportIcon,
  Timeline as TimelineIcon,
  LocalShipping as SupplierIcon,
  Barcode as BarcodeIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Alert as AlertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '@/Components/ThemeProvider';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 24,
  right: 24,
  background: theme.palette.primary.gradient,
  boxShadow: theme.shadows[4],
  '&:hover': {
    background: theme.palette.primary.gradientLight,
    transform: 'scale(1.1)',
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`inventory-tabpanel-${index}`}
    aria-labelledby={`inventory-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const InventoryDashboard = ({
  inventoryItems = [],
  lowStockItems = [],
  expiringItems = [],
  totalValue = 0,
  totalItems = 0,
  lowStockCount = 0,
  expiringCount = 0,
  recentTransactions = [],
  stores = [],
  user = null,
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await router.reload({ only: ['inventoryItems', 'lowStockItems', 'expiringItems', 'recentTransactions'] });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleStockAdjustment = () => {
    setAdjustmentDialogOpen(true);
    handleMenuClose();
  };

  const getStockStatusColor = (quantity, alertQuantity) => {
    if (quantity <= alertQuantity) return 'error';
    if (quantity <= alertQuantity * 1.5) return 'warning';
    return 'success';
  };

  const getStockStatusIcon = (quantity, alertQuantity) => {
    if (quantity <= alertQuantity) return <WarningIcon />;
    if (quantity <= alertQuantity * 1.5) return <PendingIcon />;
    return <CheckCircleIcon />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStore === 'all' || item.store_id === parseInt(selectedStore);
    return matchesSearch && matchesStore;
  });

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <StyledCard>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
            }}
          >
            <Icon />
          </Avatar>
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {trend > 0 ? (
                <TrendingUpIcon color="success" />
              ) : (
                <TrendingDownIcon color="error" />
              )}
              <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </StyledCard>
  );

  return (
    <>
      <Head title="Inventory Management" />
      <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
            Inventory Management
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Inventory Reports">
              <IconButton>
                <ReportIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Alerts Section */}
        {(lowStockCount > 0 || expiringCount > 0) && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              {lowStockCount > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      {lowStockCount} items are running low on stock
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {expiringCount > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      {expiringCount} items are expiring soon
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Inventory Value"
              value={formatCurrency(totalValue)}
              icon={InventoryIcon}
              color={theme.palette.primary.main}
              trend={5.2}
              subtitle="Last 30 days"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Items"
              value={totalItems}
              icon={DashboardIcon}
              color={theme.palette.success.main}
              trend={2.1}
              subtitle="Unique products"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Low Stock Items"
              value={lowStockCount}
              icon={WarningIcon}
              color={theme.palette.warning.main}
              subtitle="Needs attention"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Expiring Items"
              value={expiringCount}
              icon={AlertIcon}
              color={theme.palette.error.main}
              subtitle="Within 30 days"
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Inventory Items" icon={<InventoryIcon />} />
            <Tab label="Low Stock Alerts" icon={<WarningIcon />} />
            <Tab label="Expiring Items" icon={<AlertIcon />} />
            <Tab label="Recent Transactions" icon={<TimelineIcon />} />
          </Tabs>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search inventory..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
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

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Alert Level</TableCell>
                  <TableCell>Unit Type</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                      <Chip label={item.unit_type || 'pcs'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatCurrency(item.cost || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency((item.quantity || 0) * (item.cost || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStockStatusIcon(item.quantity, item.alert_quantity)}
                        label={item.quantity <= item.alert_quantity ? 'Low' : 'OK'}
                        color={getStockStatusColor(item.quantity, item.alert_quantity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, item)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            {lowStockItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <WarningIcon />
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6" fontWeight="medium">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current: {item.quantity} | Alert at: {item.alert_quantity}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(item.quantity / item.alert_quantity) * 100}
                        color="warning"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            {expiringItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <AlertIcon />
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6" fontWeight="medium">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {item.quantity} {item.unit_type}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.transaction_type}
                        color={transaction.transaction_type === 'purchase' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.name}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.user?.name || 'System'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => router.visit(`/inventory/${selectedItem?.id}/edit`)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleStockAdjustment}>
            <ListItemIcon>
              <TimelineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Adjust Stock</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => router.visit(`/inventory/${selectedItem?.id}/history`)}>
            <ListItemIcon>
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View History</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => router.visit(`/inventory/${selectedItem?.id}/barcode`)}>
            <ListItemIcon>
              <BarcodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Print Barcode</ListItemText>
          </MenuItem>
        </Menu>

        {/* Stock Adjustment Dialog */}
        <Dialog open={adjustmentDialogOpen} onClose={() => setAdjustmentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Adjust Stock - {selectedItem?.name}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Adjustment Quantity"
              type="number"
              margin="normal"
              helperText="Use positive numbers to add stock, negative to remove"
            />
            <TextField
              fullWidth
              label="Reason"
              margin="normal"
              multiline
              rows={3}
              placeholder="Reason for adjustment..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjustmentDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setAdjustmentDialogOpen(false)}>
              Save Adjustment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        <StyledFab
          color="primary"
          aria-label="add"
          onClick={() => router.visit('/inventory/create')}
        >
          <AddIcon />
        </StyledFab>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default InventoryDashboard;