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
  CircularProgress,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
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
  Assessment as StatsIcon,
  Restaurant as RestaurantIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '@/Components/ThemeProvider';
import { useRestaurantPOS } from '@/Context/RestaurantPOSContext';
import TableFloorPlan from '@/Components/RestaurantPOS/TableManagement/TableFloorPlan';
import TableSelectionDialog from '@/Components/RestaurantPOS/TableManagement/TableSelectionDialog';
import RestaurantOrder from '@/Components/RestaurantPOS/OrderManagement/RestaurantOrder';
import OrderStatusTracker from '@/Components/RestaurantPOS/OrderManagement/OrderStatusTracker';
import KitchenDisplay from '@/Components/RestaurantPOS/KitchenDisplay/KitchenDisplay';
import RestaurantCheckout from '@/Components/RestaurantPOS/Checkout/RestaurantCheckout';
import ReservationCalendar from '@/Components/RestaurantPOS/Reservation/ReservationCalendar';
import ReservationList from '@/Components/RestaurantPOS/Reservation/ReservationList';

const MainContainer = styled(Box)(({ theme, isMobile, isTablet }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  backgroundImage: theme.palette.mode === 'dark'
    ? theme.palette.background.defaultGradient || `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
    : theme.palette.background.defaultGradient || `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.divider} 100%)`,
  overflow: isMobile ? 'hidden' : 'auto',
  transition: 'all 0.3s ease-in-out',
  // Enhanced responsive design
  '@media (max-width: 480px)': {
    '&': {
      fontSize: '0.8rem',
    },
  },
  '@media (min-width: 1280px)': {
    '&': {
      maxWidth: '1600px',
      margin: '0 auto',
    },
  },
  // Touch optimization
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  // Smooth scrolling
  scrollBehavior: 'smooth',
}));

const HeaderBar = styled(Box)(({ theme, isMobile, isTablet }) => ({
  backgroundColor: theme.palette.background.paper,
  backgroundImage: theme.palette.background.paperGradient,
  padding: isMobile ? theme.spacing(1.5) : theme.spacing(2.5),
  boxShadow: theme.shadows[2],
  borderBottom: `1px solid ${theme.palette.divider}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  minHeight: isMobile ? '64px' : 'auto',
  transition: 'all 0.3s ease-in-out',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
  // Enhanced responsive design
  '@media (max-width: 480px)': {
    padding: theme.spacing(1),
    minHeight: '56px',
  },
  '@media (min-width: 1920px)': {
    padding: theme.spacing(3),
  },
}));

const ContentArea = styled(Box)(({ theme, isMobile, isTablet }) => ({
  flex: 1,
  padding: isMobile ? theme.spacing(1.5) : isTablet ? theme.spacing(2) : theme.spacing(3),
  overflow: 'auto',
  backgroundColor: 'transparent',
  paddingBottom: isMobile ? '80px' : '0', // Space for bottom navigation
  transition: 'all 0.3s ease-in-out',
  // Enhanced responsive design
  '@media (max-width: 480px)': {
    padding: theme.spacing(1),
  },
  '@media (min-width: 1920px)': {
    padding: theme.spacing(4),
  },
  // Touch optimization
  touchAction: 'pan-y pinch-zoom',
  WebkitOverflowScrolling: 'touch',
}));

const TouchFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 90, // Above bottom navigation
  right: 20,
  background: theme.palette.primary.gradient,
  boxShadow: theme.shadows[4],
  width: 60,
  height: 60,
  borderRadius: '50%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: theme.palette.primary.gradientLight,
    transform: 'scale(1.1) rotate(90deg)',
    boxShadow: theme.shadows[8],
  },
  '&:active': {
    transform: 'scale(0.95) rotate(90deg)',
  },
  // Enhanced responsive design
  '@media (max-width: 480px)': {
    bottom: 85,
    right: 16,
    width: 56,
    height: 56,
  },
  '@media (min-width: 600px)': {
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
  },
  '@media (min-width: 1920px)': {
    bottom: 32,
    right: 32,
    width: 64,
    height: 64,
  },
  // Touch optimization
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`restaurant-pos-tabpanel-${index}`}
    aria-labelledby={`restaurant-pos-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: { xs: 1, sm: 2 } }}>{children}</Box>}
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
  const { isDarkMode } = useThemeContext();
  // Enhanced responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 767px)'); // Tailwind 'md' breakpoint
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)'); // Tailwind 'md' to 'lg' breakpoint
  const isLargeTablet = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)'); // Tailwind 'lg' to 'xl' breakpoint
  const isSmallMobile = useMediaQuery('(max-width: 480px)'); // Extra small mobile
  const isLargeDesktop = useMediaQuery('(min-width: 1920px)'); // Large desktop
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isLandscape, setIsLandscape] = useState(false);

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

  // Detect orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  // Touch gesture handlers for swipe navigation
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeTab < 4) {
      setActiveTab(activeTab + 1);
    }
    if (isRightSwipe && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

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
    if (isMobile) return ''; // Hide labels on mobile for bottom nav
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
        return (contextOrders || []).filter(o => o.status === 'pending' || o.status === 'preparing').length;
      case 2:
        return (contextOrders || []).filter(o => o.status === 'preparing').length;
      case 4:
        return reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').length;
      default:
        return 0;
    }
  };

  const renderDashboard = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 3, lg: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Box
          textAlign="center"
          p={{ xs: 2, sm: 3, md: 4 }}
          borderRadius={3}
          sx={{
            background: theme.palette.background.paperGradient,
            boxShadow: theme.shadows[2],
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: theme.palette.primary.gradient,
              transform: 'translateY(-100%)',
              transition: 'transform 0.3s ease-in-out',
            },
            '&:hover': {
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: theme.shadows[6],
              '&::before': {
                transform: 'translateY(0)',
              }
            },
            '&:active': {
              transform: 'translateY(-2px) scale(1.01)',
            }
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              borderRadius: '50%',
              background: theme.palette.primary.gradient,
              mb: 2,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <TableIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'primary.contrastText' }} />
          </Box>
          <Typography variant={{ xs: 'h5', sm: 'h4' }} color="primary.main" fontWeight="700" sx={{ mb: 1 }}>
            {tables.length}
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight="500">
            Total Tables
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Box
          textAlign="center"
          p={{ xs: 2, sm: 3, md: 4 }}
          borderRadius={3}
          sx={{
            background: theme.palette.background.paperGradient,
            boxShadow: theme.shadows[2],
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: theme.palette.success.gradient,
              transform: 'translateY(-100%)',
              transition: 'transform 0.3s ease-in-out',
            },
            '&:hover': {
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: theme.shadows[6],
              '&::before': {
                transform: 'translateY(0)',
              }
            },
            '&:active': {
              transform: 'translateY(-2px) scale(1.01)',
            }
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              borderRadius: '50%',
              background: theme.palette.success.gradient,
              mb: 2,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <DashboardIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'success.contrastText' }} />
          </Box>
          <Typography variant={{ xs: 'h5', sm: 'h4' }} color="success.main" fontWeight="700" sx={{ mb: 1 }}>
            {getAvailableTables().length}
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight="500">
            Available Tables
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Box
          textAlign="center"
          p={{ xs: 2, sm: 3, md: 4 }}
          borderRadius={3}
          sx={{
            background: theme.palette.background.paperGradient,
            boxShadow: theme.shadows[2],
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: theme.palette.warning.gradient,
              transform: 'translateY(-100%)',
              transition: 'transform 0.3s ease-in-out',
            },
            '&:hover': {
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: theme.shadows[6],
              '&::before': {
                transform: 'translateY(0)',
              }
            },
            '&:active': {
              transform: 'translateY(-2px) scale(1.01)',
            }
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              borderRadius: '50%',
              background: theme.palette.warning.gradient,
              mb: 2,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <RestaurantIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'warning.contrastText' }} />
          </Box>
          <Typography variant={{ xs: 'h5', sm: 'h4' }} color="warning.main" fontWeight="700" sx={{ mb: 1 }}>
            {getOccupiedTables().length}
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight="500">
            Occupied Tables
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Box
          textAlign="center"
          p={{ xs: 2, sm: 3, md: 4 }}
          borderRadius={3}
          sx={{
            background: theme.palette.background.paperGradient,
            boxShadow: theme.shadows[2],
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: theme.palette.info.gradient,
              transform: 'translateY(-100%)',
              transition: 'transform 0.3s ease-in-out',
            },
            '&:hover': {
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: theme.shadows[6],
              '&::before': {
                transform: 'translateY(0)',
              }
            },
            '&:active': {
              transform: 'translateY(-2px) scale(1.01)',
            }
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              borderRadius: '50%',
              background: theme.palette.info.gradient,
              mb: 2,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <OrderIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'info.contrastText' }} />
          </Box>
          <Typography variant={{ xs: 'h5', sm: 'h4' }} color="info.main" fontWeight="700" sx={{ mb: 1 }}>
            {(contextOrders || []).length}
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight="500">
            Active Orders
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{
            color: 'text.primary',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <OrderIcon sx={{ color: 'primary.main' }} />
            Recent Orders
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {(contextOrders || []).slice(0, isSmallMobile ? 2 : isMobile ? 3 : 6).map((order, index) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <Box
                sx={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                  '@keyframes fadeInUp': {
                    from: {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    to: {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                <RestaurantOrder
                  order={order}
                  onStatusUpdate={onOrderUpdate}
                  onPayment={handleCheckout}
                  compact={isMobile}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <>
      <Head title="Restaurant POS" />
      <MainContainer
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <HeaderBar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <RestaurantIcon
                  sx={{
                    color: 'primary.main',
                    fontSize: { xs: 24, sm: 28, md: 32 },
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(10deg)',
                    }
                  }}
                />
                <Typography
                  variant={{ xs: 'h6', sm: 'h5', md: 'h4' }}
                  fontWeight="bold"
                  sx={{
                    background: theme.palette.primary.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.025em',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  Restaurant POS
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} flexWrap="wrap">
                {selectedTable && (
                  <Box
                    sx={{
                      background: theme.palette.primary.gradient,
                      color: 'primary.contrastText',
                      px: { xs: 1.5, sm: 2 },
                      py: 1,
                      borderRadius: 3,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      }
                    }}
                  >
                    <TableIcon fontSize="small" />
                    {isSmallMobile ? `T:${selectedTable.name}` : `Table: ${selectedTable.name}`}
                  </Box>
                )}
                {currentOrder && (
                  <Box
                    sx={{
                      background: theme.palette.secondary.gradient,
                      color: 'secondary.contrastText',
                      px: { xs: 1.5, sm: 2 },
                      py: 1,
                      borderRadius: 3,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      }
                    }}
                  >
                    <OrderIcon fontSize="small" />
                    {isSmallMobile ? `#${currentOrder.id}` : `Order: #${currentOrder.id}`}
                  </Box>
                )}
                {user && !isMobile && (
                  <Box
                    sx={{
                      background: theme.palette.background.paperGradient,
                      border: `1px solid ${theme.palette.divider}`,
                      px: 2,
                      py: 1,
                      borderRadius: 3,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <DashboardIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    {user.name}
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" gap={1.5}>
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading}
                  size={isSmallMobile ? 'small' : isMobile ? 'medium' : 'large'}
                  sx={{
                    background: theme.palette.background.paperGradient,
                    color: theme.palette.primary.main,
                    boxShadow: theme.shadows[1],
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      background: theme.palette.primary.gradient,
                      color: 'primary.contrastText',
                      transform: 'translateY(-2px) rotate(180deg)',
                      boxShadow: theme.shadows[3],
                    },
                    '&:active': {
                      transform: 'translateY(0) rotate(180deg)',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={isSmallMobile ? 20 : 24} /> : <RefreshIcon />}
                </IconButton>

                <Badge badgeContent={0} color="error" sx={{
                  '& .MuiBadge-badge': {
                    animation: 'pulse 2s infinite',
                  }
                }}>
                  <IconButton
                    size={isSmallMobile ? 'small' : isMobile ? 'medium' : 'large'}
                    sx={{
                      background: theme.palette.background.paperGradient,
                      color: theme.palette.primary.main,
                      boxShadow: theme.shadows[1],
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: theme.palette.primary.gradient,
                        color: 'primary.contrastText',
                        transform: 'translateY(-2px) scale(1.1)',
                        boxShadow: theme.shadows[3],
                      }
                    }}
                  >
                    <NotificationsIcon />
                  </IconButton>
                </Badge>

                {!isMobile && (
                  <IconButton
                    onClick={() => router.get('/settings')}
                    size="large"
                    sx={{
                      background: theme.palette.background.paperGradient,
                      color: theme.palette.primary.main,
                      boxShadow: theme.shadows[1],
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: theme.palette.primary.gradient,
                        color: 'primary.contrastText',
                        transform: 'translateY(-2px) rotate(15deg)',
                        boxShadow: theme.shadows[3],
                      }
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                )}

                {isMobile && (
                  <IconButton
                    onClick={() => setMobileMenuOpen(true)}
                    size="large"
                    sx={{
                      background: theme.palette.primary.gradient,
                      color: 'primary.contrastText',
                      boxShadow: theme.shadows[2],
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: theme.palette.primary.gradientLight,
                        transform: 'translateY(-2px) scale(1.1)',
                        boxShadow: theme.shadows[4],
                      }
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        </HeaderBar>

        {/* Mobile Navigation Drawer */}
        <SwipeableDrawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onOpen={() => setMobileMenuOpen(true)}
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
              backgroundImage: theme.palette.background.paperGradient,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              width: { xs: 280, sm: 320 },
              transition: 'all 0.3s ease-in-out',
            }
          }}
        >
          <Box sx={{ width: '100%' }} role="presentation">
            <Box
              sx={{
                p: 3,
                borderBottom: `1px solid ${theme.palette.divider}`,
                background: theme.palette.primary.gradient,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <RestaurantIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                Restaurant POS
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'primary.contrastText',
                  opacity: 0.8,
                  mt: 0.5,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {selectedTable ? `Table: ${selectedTable.name}` : 'Select a table to begin'}
              </Typography>
            </Box>
            <List sx={{ py: 2 }}>
              {[0, 1, 2, 3, 4].map((index) => (
                <ListItem
                  key={index}
                  button={true}
                  selected={activeTab === index}
                  onClick={() => {
                    setActiveTab(index);
                    setMobileMenuOpen(false);
                  }}
                  sx={{
                    mx: 2,
                    my: 0.5,
                    borderRadius: 2,
                    minHeight: { xs: 48, sm: 56 }, // Touch-friendly height
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      background: theme.palette.primary.gradient,
                      color: 'primary.contrastText',
                      transform: 'translateX(4px)',
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        background: theme.palette.primary.gradientLight,
                        transform: 'translateX(6px)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 600,
                      },
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Badge
                      badgeContent={getTabBadge(index)}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          height: 16,
                          minWidth: 16,
                        }
                      }}
                    >
                      {getTabIcon(index)}
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={getTabLabel(index)}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: 500,
                        fontSize: '0.95rem',
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </SwipeableDrawer>

        {/* Main Content */}
        <ContentArea>
          {/* Desktop/Tablet Tabs */}
          {!isMobile && (
            <Box
              sx={{
                mb: 3,
                background: theme.palette.background.paperGradient,
                borderRadius: 3,
                p: 1.5,
                boxShadow: theme.shadows[2],
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-indicator': {
                    background: theme.palette.primary.gradient,
                    height: 4,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease-in-out',
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    borderRadius: 2,
                    mx: 0.5,
                    minHeight: { xs: 48, sm: 56 }, // Touch-friendly height
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      transform: 'translateY(-1px)',
                    },
                    '&.Mui-selected': {
                      background: theme.palette.primary.gradient,
                      color: 'primary.contrastText',
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[2],
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 20,
                        height: 3,
                        backgroundColor: 'primary.contrastText',
                        borderRadius: '3px 3px 0 0',
                      }
                    },
                  }
                }}
              >
                {[0, 1, 2, 3, 4].map((index) => (
                  <Tab
                    key={index}
                    icon={
                      <Badge
                        badgeContent={getTabBadge(index)}
                        color="error"
                        showZero={false}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.65rem',
                            height: 18,
                            minWidth: 18,
                            animation: getTabBadge(index) > 0 ? 'pulse 2s infinite' : 'none',
                          }
                        }}
                      >
                        {getTabIcon(index)}
                      </Badge>
                    }
                    label={getTabLabel(index)}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <TableFloorPlan
              tables={contextTables || []}
              sections={sections}
              onTableSelect={handleTableSelect}
              onTableStatusChange={(tableId, status) => {
                // Handle table status update
                const updatedTables = (contextTables || []).map(table =>
                  table.id === tableId ? { ...table, status } : table
                );
                setTables(updatedTables);
              }}
              onAddTable={() => setShowTableDialog(true)}
              compact={isMobile}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={{ xs: 0.5, sm: 1, md: 2 }}>
              {(contextOrders || []).map((order) => (
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

            {!(contextOrders || []).length && (
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
              orders={contextOrders || []}
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

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <Paper
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: theme.palette.background.paperGradient,
              borderTop: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              transition: 'all 0.3s ease-in-out',
            }}
            elevation={3}
          >
            <BottomNavigation
              value={activeTab}
              onChange={(event, newValue) => {
                setActiveTab(newValue);
                setActiveView(getTabViewName(newValue));
              }}
              sx={{
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 0,
                  paddingTop: 1.5,
                  paddingBottom: 1.5,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateY(-2px)',
                  },
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    transform: 'translateY(-4px)',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    transition: 'all 0.2s ease-in-out',
                  },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    fontWeight: 600,
                    transition: 'all 0.2s ease-in-out',
                  },
                },
              }}
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <BottomNavigationAction
                  key={index}
                  icon={
                    <Badge
                      badgeContent={getTabBadge(index)}
                      color="error"
                      showZero={false}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          height: 14,
                          minWidth: 14,
                          animation: getTabBadge(index) > 0 ? 'pulse 2s infinite' : 'none',
                        }
                      }}
                    >
                      {getTabIcon(index)}
                    </Badge>
                  }
                  label={getTabLabel(index)}
                />
              ))}
            </BottomNavigation>
          </Paper>
        )}

        {/* Floating Action Button */}
        <TouchFab
          color="primary"
          onClick={() => setShowTableDialog(true)}
          aria-label="Add table"
        >
          <AddIcon />
        </TouchFab>
      </MainContainer>

      {/* Table Selection Dialog */}
      <TableSelectionDialog
        open={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onTableSelect={handleTableSelect}
        tables={contextTables || []}
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
    </>
  );
};

export default RestaurantPOS;
