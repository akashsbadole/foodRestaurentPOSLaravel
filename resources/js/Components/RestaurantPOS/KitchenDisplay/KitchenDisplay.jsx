import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  SwipeableDrawer,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
  ViewAgenda as ViewAgendaIcon,
  ViewList as ViewListIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as PriorityHighIcon,
  TouchApp as TouchAppIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Dashboard as DashboardIcon,
  Kitchen as KitchenIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useCustomTheme } from '@/Components/ThemeProvider';
import { getOrderStatusColor } from '../../../lib/statusColors';
import KitchenStation from './KitchenStation';
import OrderTicket from './OrderTicket';

const DisplayContainer = styled(Box)(({ theme, fullscreen, isMobile, isTablet }) => ({
  padding: fullscreen ? 0 : (isMobile ? theme.spacing(1) : theme.spacing(2)),
  background: fullscreen
    ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.action.hover} 100%)`
    : theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.action.hover} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
  minHeight: '100vh',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  fontSize: isMobile ? '0.875rem' : '1rem',
  touchAction: 'manipulation',
  position: 'relative',
  '&:before': {
    content: '""',
    position: fullscreen ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%)',
    backgroundSize: '200% 100%',
    animation: 'gradientShift 3s ease infinite',
    zIndex: 1000,
  },
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const HeaderBar = styled(Paper)(({ theme, isMobile, isTablet }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1a2332 0%, #243447 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  padding: isMobile ? theme.spacing(1.5) : theme.spacing(2.5),
  borderRadius: 16,
  marginBottom: theme.spacing(isMobile ? 1.5 : 2.5),
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(30, 58, 95, 0.3)'
    : '0 8px 32px rgba(30, 58, 95, 0.15)',
  border: `1px solid ${theme.palette.mode === 'dark' ? '#2c3e50' : '#e2e8f0'}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(30, 58, 95, 0.4)'
      : '0 12px 40px rgba(30, 58, 95, 0.2)',
  },
}));

const StationTab = styled(Tab)(({ theme, alertCount, isMobile }) => ({
  minHeight: isMobile ? 60 : 80,
  fontSize: isMobile ? '0.75rem' : '0.875rem',
  borderRadius: 12,
  margin: '0 4px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(44, 82, 130, 0.03) 100%)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.08)'}`,
  '& .MuiTab-wrapper': {
    flexDirection: isMobile ? 'row' : 'column',
    gap: theme.spacing(isMobile ? 0.5 : 1),
    alignItems: 'center',
  },
  '&.Mui-selected': {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
    color: 'white',
    fontWeight: 'bold',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)',
  },
  '&:not(.Mui-selected)': {
    color: theme.palette.text.secondary,
    '&:hover': {
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.2) 0%, rgba(44, 82, 130, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(30, 58, 95, 0.08) 0%, rgba(44, 82, 130, 0.08) 100%)',
      transform: 'scale(1.02)',
    },
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`kitchen-tabpanel-${index}`}
    aria-labelledby={`kitchen-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

const TouchFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 80,
  right: 16,
  background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
  boxShadow: '0 8px 25px rgba(30, 58, 95, 0.4)',
  width: 64,
  height: 64,
  zIndex: 1000,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #2c5282 0%, #1e3a5f 100%)',
    transform: 'scale(1.1) rotate(90deg)',
    boxShadow: '0 12px 35px rgba(30, 58, 95, 0.5)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const OrderCard = styled(Card)(({ theme, status, isMobile, isUrgent }) => {
  const statusColor = getOrderStatusColor(status, theme.palette.mode === 'dark');

  return {
    borderLeft: `4px solid ${statusColor}`,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
    cursor: 'pointer',
    touchAction: 'manipulation',
    transform: isUrgent ? 'scale(1.02)' : 'scale(1)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: isUrgent
      ? '0 8px 25px rgba(239, 68, 68, 0.3)'
      : '0 4px 15px rgba(30, 58, 95, 0.15)',
    '&:before': isUrgent ? {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #ef4444 100%)',
      backgroundSize: '200% 100%',
      animation: 'urgentPulse 2s ease infinite',
    } : {},
    '&:hover': {
      transform: 'scale(1.03)',
      boxShadow: isUrgent
        ? '0 12px 35px rgba(239, 68, 68, 0.4)'
        : '0 8px 25px rgba(30, 58, 95, 0.25)',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '@keyframes urgentPulse': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
  };
});

const StatsCard = styled(Paper)(({ theme, color, isMobile }) => ({
  padding: isMobile ? theme.spacing(1.5) : theme.spacing(2),
  borderRadius: 16,
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1a2332 0%, #243447 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: `1px solid ${theme.palette.mode === 'dark' ? '#2c3e50' : '#e2e8f0'}`,
  boxShadow: '0 4px 15px rgba(30, 58, 95, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${color} 0%, ${color}dd 50%, ${color} 100%)`,
    backgroundSize: '200% 100%',
    animation: 'statsGradient 3s ease infinite',
  },
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: '0 8px 25px rgba(30, 58, 95, 0.2)',
  },
  '@keyframes statsGradient': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const KitchenDisplay = ({
  stations = [],
  orders = [],
  onOrderStatusUpdate,
  onOrderPrint,
  onStationSettings,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000,
  compact = false,
  showAllStations = true,
  defaultView = 'stations',
  isTablet = false,
  isLandscape = false
}) => {
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState(defaultView);
  const [fullscreen, setFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [fontSize, setFontSize] = useState(isMobile ? 'small' : 'medium');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [refreshSpeed, setRefreshSpeed] = useState(30);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      onRefresh?.();
      setLastRefresh(new Date());
    }, refreshSpeed * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshSpeed, onRefresh]);

  const stationStats = useMemo(() => {
    return stations.map(station => {
      const stationOrders = orders.filter(order => order.station_id === station.id);

      return {
        ...station,
        total: stationOrders.length,
        pending: stationOrders.filter(order => order.status === 'pending').length,
        preparing: stationOrders.filter(order => order.status === 'preparing').length,
        ready: stationOrders.filter(order => order.status === 'ready').length,
        delayed: stationOrders.filter(order => {
          const orderAge = (new Date() - new Date(order.created_at)) / 60000;
          return orderAge > (order.estimated_time || 20);
        }).length,
        highPriority: stationOrders.filter(order => order.priority === 'high').length
      };
    });
  }, [stations, orders]);

  const kitchenStats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const preparingOrders = orders.filter(order => order.status === 'preparing').length;
    const readyOrders = orders.filter(order => order.status === 'ready').length;
    const delayedOrders = orders.filter(order => {
      const orderAge = (new Date() - new Date(order.created_at)) / 60000;
      return orderAge > (order.estimated_time || 20);
    }).length;
    const highPriorityOrders = orders.filter(order => order.priority === 'high').length;

    return {
      total: totalOrders,
      pending: pendingOrders,
      preparing: preparingOrders,
      ready: readyOrders,
      delayed: delayedOrders,
      highPriority: highPriorityOrders
    };
  }, [orders]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    onRefresh?.();
    setLastRefresh(new Date());
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const isOrderUrgent = (order) => {
    const orderAge = (new Date() - new Date(order.created_at)) / 60000;
    return order.priority === 'high' || orderAge > 20;
  };

  const renderStationView = () => (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(90deg, #1e3a5f 0%, #2c5282 100%)',
            height: 3,
            borderRadius: 2,
          },
          '& .MuiTabs-flexContainer': {
            gap: isMobile ? 0.5 : 1,
          }
        }}
      >
        {stationStats.map((station, index) => (
          <StationTab
            key={station.id}
            label={
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                  {isMobile ? station.name.substring(0, 8) : station.name}
                </Typography>
                <Box display="flex" gap={0.5}>
                  <Badge 
                    badgeContent={station.pending} 
                    color="warning" 
                    showZero
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>P</Typography>
                  </Badge>
                  <Badge 
                    badgeContent={station.preparing} 
                    color="primary" 
                    showZero
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>PR</Typography>
                  </Badge>
                  <Badge 
                    badgeContent={station.ready} 
                    color="success" 
                    showZero
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>R</Typography>
                  </Badge>
                  {station.delayed > 0 && (
                    <Badge 
                      badgeContent={station.delayed} 
                      color="error"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
                    >
                      <WarningIcon fontSize="small" />
                    </Badge>
                  )}
                </Box>
              </Box>
            }
            alertCount={station.delayed}
            isMobile={isMobile}
          />
        ))}
      </Tabs>

      {stationStats.map((station, index) => (
        <TabPanel key={station.id} value={tabValue} index={index}>
          <KitchenStation
            station={station}
            orders={orders}
            onOrderStatusUpdate={onOrderStatusUpdate}
            onOrderPrint={onOrderPrint}
            onStationSettings={() => onStationSettings?.(station)}
            onRefresh={handleRefresh}
            autoRefresh={autoRefreshEnabled}
            compact={compact}
            isMobile={isMobile}
            fontSize={fontSize}
          />
        </TabPanel>
      ))}
    </Box>
  );

  const renderOrderView = () => {
    let filteredOrders = orders.filter(order => {
      if (showUrgentOnly && !isOrderUrgent(order)) return false;
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
      if (filterPriority !== 'all' && order.priority !== filterPriority) return false;
      return true;
    });

    return (
      <Box>
        <Box 
          display="flex" 
          gap={2} 
          mb={3} 
          flexWrap="wrap"
          sx={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(44, 82, 130, 0.03) 100%)',
            p: 2,
            borderRadius: 12,
            border: `1px solid ${isDarkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(30, 58, 95, 0.08)'}`,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                },
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="preparing">Preparing</MenuItem>
              <MenuItem value="ready">Ready</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              label="Priority"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                },
              }}
            >
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant={showUrgentOnly ? 'contained' : 'outlined'}
            color="error"
            size="small"
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            startIcon={<PriorityHighIcon />}
            sx={{
              borderRadius: 20,
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            {isMobile ? '' : 'Urgent Only'}
          </Button>
        </Box>

        <Grid container spacing={isMobile ? 1.5 : 2.5}>
          {filteredOrders.map((order) => (
            <Grid
              key={order.id}
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
            >
              <OrderCard
                status={order.status}
                isMobile={isMobile}
                isUrgent={isOrderUrgent(order)}
                onClick={() => onOrderStatusUpdate?.(order.id, 'preparing')}
              >
                <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      noWrap
                      sx={{
                        background: isDarkMode
                          ? 'linear-gradient(45deg, #64b5f6, #90caf9)'
                          : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      #{order.order_number || order.id}
                    </Typography>
                    <Box display="flex" gap={0.5}>
                      {order.priority === 'high' && (
                        <Chip 
                          label="High" 
                          color="error" 
                          size="small"
                          sx={{
                            borderRadius: 20,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                      {isOrderUrgent(order) && (
                        <Chip 
                          label="Urgent" 
                          color="warning" 
                          size="small"
                          sx={{
                            borderRadius: 20,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontWeight: 500 }}
                  >
                    {order.table_name} • {order.customer_name}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: isDarkMode ? '#90caf9' : '#1e3a5f',
                    }}
                  >
                    {formatTime(order.created_at)}
                  </Typography>

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => onOrderStatusUpdate?.(order.id, 'preparing')}
                      sx={{ 
                        flex: 1,
                        borderRadius: 20,
                        fontWeight: 600,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      Start
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => onOrderStatusUpdate?.(order.id, 'ready')}
                      sx={{ 
                        flex: 1,
                        borderRadius: 20,
                        fontWeight: 600,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      Ready
                    </Button>
                  </Box>
                </CardContent>
              </OrderCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <DisplayContainer
      fullscreen={fullscreen}
      isMobile={isMobile}
      isTablet={isTablet}
      ref={containerRef}
    >
      {/* Header */}
      <HeaderBar isMobile={isMobile} isTablet={isTablet}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              fontWeight="bold"
              gutterBottom
              sx={{
                background: isDarkMode
                  ? 'linear-gradient(45deg, #64b5f6, #90caf9)'
                  : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}
            >
              Kitchen Display System
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <TimerIcon fontSize="small" />
              Last refresh: {formatTime(lastRefresh)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={1} flexWrap="wrap">
              <Button
                variant={viewMode === 'stations' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('stations')}
                startIcon={<ViewAgendaIcon />}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  borderRadius: 20,
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                {isMobile ? '' : 'Stations'}
              </Button>
              <Button
                variant={viewMode === 'orders' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('orders')}
                startIcon={<ViewListIcon />}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  borderRadius: 20,
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                {isMobile ? '' : 'Orders'}
              </Button>

              <Tooltip title="Refresh">
                <IconButton 
                  onClick={handleRefresh} 
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                    borderRadius: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Print All">
                <IconButton 
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                    borderRadius: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton 
                  onClick={() => setSettingsDrawerOpen(true)} 
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                    borderRadius: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <IconButton 
                  onClick={toggleFullscreen} 
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(44, 82, 130, 0.05) 100%)',
                    borderRadius: 12,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.1) 0%, rgba(44, 82, 130, 0.1) 100%)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Kitchen Statistics */}
        <Grid container spacing={isMobile ? 1.5 : 2.5} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={2}>
            <StatsCard color="#1e3a5f" isMobile={isMobile}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: isDarkMode ? '#90caf9' : '#1e3a5f', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                }}
              >
                {kitchenStats.total}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                }}
              >
                Total Orders
              </Typography>
            </StatsCard>
          </Grid>
          <Grid item xs={6} sm={2}>
            <StatsCard color="#f59e0b" isMobile={isMobile}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#f59e0b', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                }}
              >
                {kitchenStats.pending}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                }}
              >
                Pending
              </Typography>
            </StatsCard>
          </Grid>
          <Grid item xs={6} sm={2}>
            <StatsCard color="#3182ce" isMobile={isMobile}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#3182ce', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                }}
              >
                {kitchenStats.preparing}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                }}
              >
                Preparing
              </Typography>
            </StatsCard>
          </Grid>
          <Grid item xs={6} sm={2}>
            <StatsCard color="#10b981" isMobile={isMobile}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#10b981', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                }}
              >
                {kitchenStats.ready}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                }}
              >
                Ready
              </Typography>
            </StatsCard>
          </Grid>
          <Grid item xs={6} sm={2}>
            <StatsCard color="#ef4444" isMobile={isMobile}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#ef4444', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                }}
              >
                {kitchenStats.delayed}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                }}
              >
                Delayed
              </Typography>
            </StatsCard>
          </Grid>
          <Grid item xs={6} sm={2}>
            <StatsCard color="#ef4444" isMobile={isMobile}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#ef4444', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                }}
              >
                {kitchenStats.highPriority}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                }}
              >
                High Priority
              </Typography>
            </StatsCard>
          </Grid>
        </Grid>

        {/* Alerts */}
        {kitchenStats.highPriority > 0 && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 12,
              fontWeight: 500,
            }}
          >
            {kitchenStats.highPriority} high priority order{kitchenStats.highPriority > 1 ? 's' : ''} require immediate attention!
          </Alert>
        )}

        {kitchenStats.delayed > 0 && (
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 2,
              borderRadius: 12,
              fontWeight: 500,
            }}
          >
            {kitchenStats.delayed} order{kitchenStats.delayed > 1 ? 's' : ''} are delayed!
          </Alert>
        )}
      </HeaderBar>

      {/* Main Content */}
      {viewMode === 'stations' && renderStationView()}
      {viewMode === 'orders' && renderOrderView()}

      {/* Settings Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        onOpen={() => setSettingsDrawerOpen(true)}
        PaperProps={{
          sx: {
            width: isMobile ? 280 : 320,
            backgroundColor: 'background.paper',
            borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          }
        }}
      >
        <Box
          sx={{
            p: 2,
            background: isDarkMode
              ? 'linear-gradient(135deg, #1a2f4a 0%, #2c5282 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            height: '100%',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: isDarkMode ? '#ffffff' : '#1e3a5f',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            Display Settings
          </Typography>

          <List>
            <ListItem
              sx={{
                mb: 1,
                borderRadius: 12,
                background: isDarkMode
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(30, 58, 95, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(30, 58, 95, 0.1)',
                  transform: 'scale(1.02)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }}>
                <TimerIcon />
              </ListItemIcon>
              <ListItemText
                primary="Auto Refresh"
                secondary={`Refresh orders every ${refreshSpeed}s`}
                primaryTypographyProps={{
                  color: isDarkMode ? '#ffffff' : '#1e3a5f',
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                }}
              />
              <Switch
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#1e3a5f',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(30, 58, 95, 0.3)',
                  },
                }}
              />
            </ListItem>

            <ListItem sx={{ pt: 0 }}>
              <ListItemText
                primary="Refresh Speed"
                secondary={`${refreshSpeed} seconds`}
                primaryTypographyProps={{
                  color: isDarkMode ? '#ffffff' : '#1e3a5f',
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                }}
              />
            </ListItem>
            <ListItem sx={{ pt: 0 }}>
              <Slider
                value={refreshSpeed}
                min={10}
                max={120}
                step={10}
                onChange={(e, value) => setRefreshSpeed(value)}
                valueLabelDisplay="auto"
                marks={[
                  { value: 10, label: '10s' },
                  { value: 30, label: '30s' },
                  { value: 60, label: '1m' },
                  { value: 120, label: '2m' },
                ]}
                sx={{
                  '& .MuiSlider-thumb': {
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                  },
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(90deg, #1e3a5f 0%, #2c5282 100%)',
                  },
                }}
              />
            </ListItem>

            <Divider />

            <ListItem
              sx={{
                mb: 1,
                borderRadius: 12,
                background: isDarkMode
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(30, 58, 95, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(30, 58, 95, 0.1)',
                  transform: 'scale(1.02)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }}>
                {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </ListItemIcon>
              <ListItemText
                primary="Sound Alerts"
                secondary="Play sound for new orders"
                primaryTypographyProps={{
                  color: isDarkMode ? '#ffffff' : '#1e3a5f',
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                }}
              />
              <Switch
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#1e3a5f',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(30, 58, 95, 0.3)',
                  },
                }}
              />
            </ListItem>

            <ListItem
              sx={{
                mb: 1,
                borderRadius: 12,
                background: isDarkMode
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(30, 58, 95, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(30, 58, 95, 0.1)',
                  transform: 'scale(1.02)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }}>
                <ViewAgendaIcon />
              </ListItemIcon>
              <ListItemText
                primary="Compact View"
                secondary="Show condensed order tickets"
                primaryTypographyProps={{
                  color: isDarkMode ? '#ffffff' : '#1e3a5f',
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                }}
              />
              <Switch
                checked={compact}
                onChange={(e) => { }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#1e3a5f',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(30, 58, 95, 0.3)',
                  },
                }}
              />
            </ListItem>

            <Divider />

            <ListItem sx={{ pt: 0 }}>
              <ListItemText
                primary="Font Size"
                secondary={`${fontSize === 'small' ? 'Small' : fontSize === 'large' ? 'Large' : 'Medium'}`}
                primaryTypographyProps={{
                  color: isDarkMode ? '#ffffff' : '#1e3a5f',
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                }}
              />
            </ListItem>
            <ListItem sx={{ pt: 0 }}>
              <Slider
                value={fontSize === 'small' ? 0 : fontSize === 'large' ? 2 : 1}
                min={0}
                max={2}
                step={1}
                onChange={(e, value) => setFontSize(['small', 'medium', 'large'][value])}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: 'Small' },
                  { value: 1, label: 'Medium' },
                  { value: 2, label: 'Large' },
                ]}
                sx={{
                  '& .MuiSlider-thumb': {
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                  },
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(90deg, #1e3a5f 0%, #2c5282 100%)',
                  },
                }}
              />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>

      {/* Floating Action Button for Quick Refresh */}
      <TouchFab
        color="primary"
        onClick={handleRefresh}
        aria-label="Quick refresh"
      >
        <RefreshIcon />
      </TouchFab>
    </DisplayContainer>
  );
};

export default KitchenDisplay;