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
  Avatar,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Fab,
  Divider,
  List,
  ListItem,
  LinearProgress,
  Rating,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  LocalShipping as SupplierIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  ShoppingCart as OrderIcon,
  Assessment as ReportIcon,
  History as HistoryIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  AttachFile as AttachFileIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '@/Components/ThemeProvider';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
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
    id={`supplier-tabpanel-${index}`}
    aria-labelledby={`supplier-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const SupplierManagement = ({
  suppliers = [],
  purchaseOrders = [],
  products = [],
  stores = [],
  user = null,
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    tax_id: '',
    payment_terms: 'net30',
    rating: 5,
    notes: '',
    is_active: true,
  });

  const [orderForm, setOrderForm] = useState({
    supplier_id: '',
    store_id: '',
    expected_delivery_date: '',
    order_items: [],
    notes: '',
    priority: 'normal',
    total_amount: 0,
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event, supplier) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
  };

  const handleSupplierSubmit = () => {
    router.post('/inventory/suppliers', supplierForm, {
      onSuccess: () => {
        setSupplierDialogOpen(false);
        setSupplierForm({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postal_code: '',
          tax_id: '',
          payment_terms: 'net30',
          rating: 5,
          notes: '',
          is_active: true,
        });
      },
    });
  };

  const handleOrderSubmit = () => {
    router.post('/inventory/purchase-orders', orderForm, {
      onSuccess: () => {
        setOrderDialogOpen(false);
        setOrderForm({
          supplier_id: '',
          store_id: '',
          expected_delivery_date: '',
          order_items: [],
          notes: '',
          priority: 'normal',
          total_amount: 0,
        });
      },
    });
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'ordered': return 'primary';
      case 'received': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'approved': return <CheckCircleIcon />;
      case 'ordered': return <OrderIcon />;
      case 'received': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <ScheduleIcon />;
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

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
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
      <Head title="Supplier Management" />
      <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
            Supplier Management
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<OrderIcon />}
              onClick={() => setOrderDialogOpen(true)}
            >
              New Purchase Order
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSupplierDialogOpen(true)}
            >
              Add Supplier
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Suppliers"
              value={suppliers.length}
              icon={SupplierIcon}
              color={theme.palette.primary.main}
              subtitle="Active vendors"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Orders"
              value={purchaseOrders.filter(o => o.status === 'pending').length}
              icon={PendingIcon}
              color={theme.palette.warning.main}
              subtitle="Awaiting approval"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Orders"
              value={purchaseOrders.filter(o => ['approved', 'ordered'].includes(o.status)).length}
              icon={OrderIcon}
              color={theme.palette.info.main}
              subtitle="In progress"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Received Today"
              value={purchaseOrders.filter(o => o.status === 'received').length}
              icon={CheckCircleIcon}
              color={theme.palette.success.main}
              subtitle="Completed deliveries"
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Suppliers" icon={<SupplierIcon />} />
            <Tab label="Purchase Orders" icon={<OrderIcon />} />
            <Tab label="Order History" icon={<HistoryIcon />} />
          </Tabs>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search suppliers..."
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
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {filteredSuppliers.map((supplier) => (
              <Grid item xs={12} sm={6} md={4} key={supplier.id}>
                <StyledCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        <BusinessIcon />
                      </Avatar>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, supplier)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      {supplier.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {supplier.contact_person}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="caption">{supplier.phone}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="caption">{supplier.email}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="caption">{supplier.city}, {supplier.state}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Rating value={supplier.rating || 5} size="small" readOnly />
                      <Chip
                        label={supplier.is_active ? 'Active' : 'Inactive'}
                        color={supplier.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Expected Delivery</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        #{order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.supplier?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={order.items_count || 0} color="primary">
                        <Typography variant="body2">
                          {order.items_count} items
                        </Typography>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ${order.total_amount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.expected_delivery_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getOrderStatusIcon(order.status)}
                        label={order.status}
                        color={getOrderStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.priority}
                        color={getPriorityColor(order.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedOrder(order);
                          setOrderDialogOpen(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Order History Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Orders This Month
                      </Typography>
                      <Typography variant="h4" color="primary.main">
                        {purchaseOrders.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Spend
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        ${purchaseOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Average Delivery Time
                      </Typography>
                      <Typography variant="h4" color="info.main">
                        3.5 days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Supplier Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            setSupplierForm(selectedSupplier);
            setSupplierDialogOpen(true);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => router.visit(`/inventory/suppliers/${selectedSupplier?.id}/orders`)}>
            <ListItemIcon>
              <OrderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Orders</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => router.visit(`/inventory/suppliers/${selectedSupplier?.id}/performance`)}>
            <ListItemIcon>
              <ReportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Performance</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add/Edit Supplier Dialog */}
        <Dialog open={supplierDialogOpen} onClose={() => setSupplierDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {supplierForm.id ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={supplierForm.city}
                  onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={supplierForm.state}
                  onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={supplierForm.postal_code}
                  onChange={(e) => setSupplierForm({ ...supplierForm, postal_code: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tax ID"
                  value={supplierForm.tax_id}
                  onChange={(e) => setSupplierForm({ ...supplierForm, tax_id: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Terms</InputLabel>
                  <Select
                    value={supplierForm.payment_terms}
                    onChange={(e) => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })}
                    label="Payment Terms"
                  >
                    <MenuItem value="net15">Net 15</MenuItem>
                    <MenuItem value="net30">Net 30</MenuItem>
                    <MenuItem value="net45">Net 45</MenuItem>
                    <MenuItem value="net60">Net 60</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography component="legend">Rating</Typography>
                <Rating
                  value={supplierForm.rating}
                  onChange={(event, newValue) => {
                    setSupplierForm({ ...supplierForm, rating: newValue });
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSupplierDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSupplierSubmit}>
              {supplierForm.id ? 'Update' : 'Add'} Supplier
            </Button>
          </DialogActions>
        </Dialog>

        {/* Purchase Order Dialog */}
        <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            {selectedOrder ? 'View Purchase Order' : 'Create Purchase Order'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={orderForm.supplier_id}
                    onChange={(e) => setOrderForm({ ...orderForm, supplier_id: e.target.value })}
                    label="Supplier"
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Store</InputLabel>
                  <Select
                    value={orderForm.store_id}
                    onChange={(e) => setOrderForm({ ...orderForm, store_id: e.target.value })}
                    label="Store"
                  >
                    {stores.map((store) => (
                      <MenuItem key={store.id} value={store.id}>
                        {store.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expected Delivery Date"
                  type="date"
                  value={orderForm.expected_delivery_date}
                  onChange={(e) => setOrderForm({ ...orderForm, expected_delivery_date: e.target.value })}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleOrderSubmit}>
              {selectedOrder ? 'Update' : 'Create'} Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        <StyledFab
          color="primary"
          aria-label="add"
          onClick={() => setSupplierDialogOpen(true)}
        >
          <AddIcon />
        </StyledFab>
      </Box>
    </>
  );
};

export default SupplierManagement;