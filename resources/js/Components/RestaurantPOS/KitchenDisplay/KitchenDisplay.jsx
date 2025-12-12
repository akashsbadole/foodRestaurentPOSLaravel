import React, { useState, useEffect, useMemo } from 'react';
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
  InputLabel
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
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import KitchenStation from './KitchenStation';
import OrderTicket from './OrderTicket';

const DisplayContainer = styled(Box)(({ theme, fullscreen }) => ({
  padding: fullscreen ? 0 : theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
  transition: 'all 0.3s ease',
}));

const HeaderBar = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[2],
  position: 'sticky',
  top: 0,
  zIndex: 100,
}));

const StationTab = styled(Tab)(({ theme, alertCount }) => ({
  minHeight: 80,
  '& .MuiTab-wrapper': {
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
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

const KitchenDisplay = ({
  stations = [],
  orders = [],
  onOrderStatusUpdate,
  onOrderPrint,
  onStationSettings,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  compact = false,
  showAllStations = true,
  defaultView = 'stations' // 'stations', 'orders', 'timeline'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState(defaultView);
  const [fullscreen, setFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      onRefresh?.();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, onRefresh]);

  // Calculate station statistics
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

  // Overall kitchen statistics
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

  const renderStationView = () => (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {stationStats.map((station, index) => (
          <StationTab
            key={station.id}
            label={
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {station.name}
                </Typography>
                <Box display="flex" gap={1}>
                  <Badge badgeContent={station.pending} color="warning" showZero>
                    <Typography variant="caption">P</Typography>
                  </Badge>
                  <Badge badgeContent={station.preparing} color="primary" showZero>
                    <Typography variant="caption">PR</Typography>
                  </Badge>
                  <Badge badgeContent={station.ready} color="success" showZero>
                    <Typography variant="caption">R</Typography>
                  </Badge>
                  {station.delayed > 0 && (
                    <Badge badgeContent={station.delayed} color="error">
                      <WarningIcon fontSize="small" />
                    </Badge>
                  )}
                </Box>
              </Box>
            }
            alertCount={station.delayed}
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
          />
        </TabPanel>
      ))}
    </Box>
  );

  const renderOrderView = () => {
    const filteredOrders = orders.filter(order => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
      if (filterPriority !== 'all' && order.priority !== filterPriority) return false;
      return true;
    });

    return (
      <Box>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
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
            >
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={2}>
          {filteredOrders.map((order) => (
            <Grid 
              key={order.id} 
              item 
              xs={12} 
              sm={6} 
              md={4}
              lg={3}
            >
              <OrderTicket
                order={order}
                onStatusUpdate={onOrderStatusUpdate}
                onPrint={onOrderPrint}
                compact={compact}
                autoRefresh={autoRefreshEnabled}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <DisplayContainer fullscreen={fullscreen}>
      {/* Header */}
      <HeaderBar>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Kitchen Display System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last refresh: {formatTime(lastRefresh)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={1} flexWrap="wrap">
              <Button
                variant={viewMode === 'stations' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('stations')}
                startIcon={<ViewAgendaIcon />}
                size="small"
              >
                Stations
              </Button>
              <Button
                variant={viewMode === 'orders' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('orders')}
                startIcon={<ViewListIcon />}
                size="small"
              >
                Orders
              </Button>
              
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Print All">
                <IconButton>
                  <PrintIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton onClick={() => setSettingsDrawerOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <IconButton onClick={toggleFullscreen}>
                  {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Kitchen Statistics */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary.main">
                {kitchenStats.total}
              </Typography>
              <Typography variant="caption">Total Orders</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">
                {kitchenStats.pending}
              </Typography>
              <Typography variant="caption">Pending</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="info.main">
                {kitchenStats.preparing}
              </Typography>
              <Typography variant="caption">Preparing</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                {kitchenStats.ready}
              </Typography>
              <Typography variant="caption">Ready</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="error.main">
                {kitchenStats.delayed}
              </Typography>
              <Typography variant="caption">Delayed</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="error.main">
                {kitchenStats.highPriority}
              </Typography>
              <Typography variant="caption">High Priority</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Alerts */}
        {kitchenStats.highPriority > 0 && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {kitchenStats.highPriority} high priority order{kitchenStats.highPriority > 1 ? 's' : ''} require immediate attention!
          </Alert>
        )}

        {kitchenStats.delayed > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {kitchenStats.delayed} order{kitchenStats.delayed > 1 ? 's' : ''} are delayed!
          </Alert>
        )}
      </HeaderBar>

      {/* Main Content */}
      {viewMode === 'stations' && renderStationView()}
      {viewMode === 'orders' && renderOrderView()}

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Display Settings
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <TimerIcon />
              </ListItemIcon>
              <ListItemText
                primary="Auto Refresh"
                secondary="Refresh orders automatically"
              />
              <Switch
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {soundEnabled ? <NotificationsActiveIcon /> : <NotificationsIcon />}
              </ListItemIcon>
              <ListItemText
                primary="Sound Alerts"
                secondary="Play sound for new orders"
              />
              <Switch
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ViewAgendaIcon />
              </ListItemIcon>
              <ListItemText
                primary="Compact View"
                secondary="Show condensed order tickets"
              />
              <Switch
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Floating Action Button for Quick Refresh */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleRefresh}
      >
        <RefreshIcon />
      </Fab>
    </DisplayContainer>
  );
};

export default KitchenDisplay;