import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Alert,
  useTheme,
  useMediaQuery,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TableRestaurant as TableIcon,
  RestaurantMenu as OrderIcon,
  Kitchen as KitchenIcon,
  PointOfSale as POSIcon,
  Event as ReservationIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { RestaurantPOSProvider, useRestaurantPOS } from '@/Context/RestaurantPOSContext';
import TableFloorPlan from '@/Components/RestaurantPOS/TableManagement/TableFloorPlan';
import TableSelectionDialog from '@/Components/RestaurantPOS/TableManagement/TableSelectionDialog';
import RestaurantOrder from '@/Components/RestaurantPOS/OrderManagement/RestaurantOrder';
import OrderStatusTracker from '@/Components/RestaurantPOS/OrderManagement/OrderStatusTracker';
import KitchenDisplay from '@/Components/RestaurantPOS/KitchenDisplay/KitchenDisplay';
import RestaurantCheckout from '@/Components/RestaurantPOS/Checkout/RestaurantCheckout';
import ReservationCalendar from '@/Components/RestaurantPOS/Reservation/ReservationCalendar';
import ReservationList from '@/Components/RestaurantPOS/Reservation/ReservationList';

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const HeaderBar = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  boxShadow: theme.shadows[2],
  position: 'sticky',
  top: 0,
  zIndex: 100,
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  overflow: 'auto',
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`restaurant-pos-tabpanel-${index}`}
    aria-labelledby={`restaurant-pos-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

const RestaurantPOS = ({
  tables = [],
  sections = [],
  orders = [],
  kitchenStations = [],
  reservations = [],
  products = [],
  customers = [],
  user = null,
  onRefresh,
  onTableSelect,
  onOrderCreate,
  onOrderUpdate,
  onReservationCreate,
  onCheckout
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    tables: contextTables,
    orders: contextOrders,
    selectedTable,
    currentOrder,
    orderType,
    setTables,
    selectTable,
    setOrders,
    setCurrentOrder,
    setOrderType,
    setActiveView,
    getAvailableTables,
    getOccupiedTables,
    calculateOrderTotal
  } = useRestaurantPOS();

  // Initialize context with props data
  useEffect(() => {
    setTables(tables);
    setOrders(orders);
  }, [tables, orders, setTables, setOrders]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setActiveView(getTabViewName(newValue));
  };

  const getTabViewName = (tabIndex) => {
    switch (tabIndex) {
      case 0: return 'tables';
      case 1: return 'orders';
      case 2: return 'kitchen';
      case 3: return 'checkout';
      case 4: return 'reservations';
      default: return 'tables';
    }
  };

  const handleTableSelect = (table) => {
    selectTable(table);
    setShowTableDialog(false);
    
    // Create new order for selected table
    if (table.status === 'available') {
      const newOrder = {
        table_id: table.id,
        table_name: table.name,
        order_type: 'dine-in',
        status: 'pending',
        items: [],
        created_at: new Date().toISOString()
      };
      
      setCurrentOrder(newOrder);
      setActiveTab(1); // Switch to orders tab
      onOrderCreate?.(newOrder);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setCurrentOrder(order);
  };

  const handleCheckout = (order) => {
    setSelectedOrder(order);
    setShowCheckoutDialog(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tabIndex) => {
    switch (tabIndex) {
      case 0: return <TableIcon />;
      case 1: return <OrderIcon />;
      case 2: return <KitchenIcon />;
      case 3: return <POSIcon />;
      case 4: return <ReservationIcon />;
      default: return <DashboardIcon />;
    }
  };

  const getTabLabel = (tabIndex) => {
    switch (tabIndex) {
      case 0: return 'Tables';
      case 1: return 'Orders';
      case 2: return 'Kitchen';
      case 3: return 'Checkout';
      case 4: return 'Reservations';
      default: return 'Dashboard';
    }
  };

  const getTabBadge = (tabIndex) => {
    switch (tabIndex) {
      case 0:
        return getOccupiedTables().length;
      case 1:
        return contextOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
      case 2:
        return contextOrders.filter(o => o.status === 'preparing').length;
      case 4:
        return reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').length;
      default:
        return 0;
    }
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Box textAlign="center" p={3} bgcolor="background.paper" borderRadius={2}>
          <Typography variant="h4" color="primary.main">
            {tables.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Tables
          </Typography>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Box textAlign="center" p={3} bgcolor="background.paper" borderRadius={2}>
          <Typography variant="h4" color="success.main">
            {getAvailableTables().length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Available Tables
          </Typography>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Box textAlign="center" p={3} bgcolor="background.paper" borderRadius={2}>
          <Typography variant="h4" color="warning.main">
            {getOccupiedTables().length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Occupied Tables
          </Typography>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Box textAlign="center" p={3} bgcolor="background.paper" borderRadius={2}>
          <Typography variant="h4" color="info.main">
            {contextOrders.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Orders
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Recent Orders
        </Typography>
        <Grid container spacing={2}>
          {contextOrders.slice(0, 6).map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <RestaurantOrder
                order={order}
                onStatusUpdate={onOrderUpdate}
                onPayment={handleCheckout}
                compact={true}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <RestaurantPOSProvider>
      <Head title="Restaurant POS" />
      <MainContainer>
        {/* Header */}
        <HeaderBar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <RestaurantIcon color="primary" />
                <Typography variant="h5" fontWeight="bold">
                  Restaurant POS
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                {selectedTable && (
                  <Typography variant="body2">
                    Table: {selectedTable.name}
                  </Typography>
                )}
                {currentOrder && (
                  <Typography variant="body2">
                    Order: #{currentOrder.id}
                  </Typography>
                )}
                {user && (
                  <Typography variant="body2" color="text.secondary">
                    {user.name}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" gap={1}>
                <IconButton onClick={handleRefresh} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
                
                <Badge badgeContent={0} color="error">
                  <IconButton>
                    <NotificationsIcon />
                  </IconButton>
                </Badge>

                {!isMobile && (
                  <IconButton onClick={() => router.get('/settings')}>
                    <SettingsIcon />
                  </IconButton>
                )}

                {isMobile && (
                  <IconButton onClick={() => setMobileMenuOpen(true)}>
                    <MenuIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        </HeaderBar>

        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          <Box sx={{ width: 250 }} role="presentation">
            <List>
              {[0, 1, 2, 3, 4].map((index) => (
                <ListItem
                  key={index}
                  button
                  selected={activeTab === index}
                  onClick={() => {
                    setActiveTab(index);
                    setMobileMenuOpen(false);
                  }}
                >
                  <ListItemIcon>
                    <Badge badgeContent={getTabBadge(index)} color="primary">
                      {getTabIcon(index)}
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary={getTabLabel(index)} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <ContentArea>
          {/* Tabs */}
          {!isMobile && (
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <Tab
                  key={index}
                  icon={
                    <Badge badgeContent={getTabBadge(index)} color="primary" showZero={false}>
                      {getTabIcon(index)}
                    </Badge>
                  }
                  label={getTabLabel(index)}
                />
              ))}
            </Tabs>
          )}

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <TableFloorPlan
              tables={contextTables}
              sections={sections}
              onTableSelect={handleTableSelect}
              onTableStatusChange={(tableId, status) => {
                // Handle table status update
                const updatedTables = contextTables.map(table =>
                  table.id === tableId ? { ...table, status } : table
                );
                setTables(updatedTables);
              }}
              onAddTable={() => setShowTableDialog(true)}
              compact={isMobile}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={2}>
              {contextOrders.map((order) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
                  <RestaurantOrder
                    order={order}
                    onStatusUpdate={onOrderUpdate}
                    onEdit={handleOrderSelect}
                    onPayment={handleCheckout}
                    compact={isMobile}
                  />
                </Grid>
              ))}
            </Grid>

            {contextOrders.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No orders yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a table to create an order
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <KitchenDisplay
              stations={kitchenStations}
              orders={contextOrders}
              onOrderStatusUpdate={onOrderUpdate}
              onOrderPrint={(order) => {
                // Handle order printing
                console.log('Print order:', order);
              }}
              onRefresh={handleRefresh}
              compact={isMobile}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <Typography variant="h6" color="text.secondary">
                Select an order to checkout
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <ReservationCalendar
              reservations={reservations}
              onReservationSelect={(reservation) => {
                // Handle reservation selection
                console.log('Selected reservation:', reservation);
              }}
              onReservationEdit={(reservation) => {
                // Handle reservation edit
                console.log('Edit reservation:', reservation);
              }}
              onReservationDelete={(reservationId) => {
                // Handle reservation delete
                console.log('Delete reservation:', reservationId);
              }}
              onReservationAdd={(reservation) => {
                // Handle reservation add
                console.log('Add reservation:', reservation);
              }}
              compact={isMobile}
            />
          </TabPanel>
        </ContentArea>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setShowTableDialog(true)}
        >
          <AddIcon />
        </Fab>
      </MainContainer>

      {/* Table Selection Dialog */}
      <TableSelectionDialog
        open={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onTableSelect={handleTableSelect}
        tables={contextTables}
        sections={sections}
        orderType={orderType}
      />

      {/* Checkout Dialog */}
      {selectedOrder && (
        <RestaurantCheckout
          open={showCheckoutDialog}
          onClose={() => {
            setShowCheckoutDialog(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onPaymentProcess={(paymentData) => {
            onCheckout?.(selectedOrder.id, paymentData);
            setShowCheckoutDialog(false);
            setSelectedOrder(null);
          }}
          onPrintReceipt={(order) => {
            console.log('Print receipt:', order);
          }}
          onShareReceipt={(order) => {
            console.log('Share receipt:', order);
          }}
        />
      )}
    </RestaurantPOSProvider>
  );
};

export default RestaurantPOS;