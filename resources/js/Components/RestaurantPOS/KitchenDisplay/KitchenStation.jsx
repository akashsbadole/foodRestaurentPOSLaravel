import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Alert,
  LinearProgress,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Fastfood as FastfoodIcon,
  LocalBar as LocalBarIcon,
  BakeryDining as BakeryDiningIcon,
  OutdoorGrill as OutdoorGrillIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import OrderTicket from './OrderTicket';

const StationCard = styled(Card)(({ theme, stationType }) => {
  const getStationColor = (type) => {
    switch (type) {
      case 'hot_kitchen': return theme.palette.error.light;
      case 'cold_kitchen': return theme.palette.info.light;
      case 'bar': return theme.palette.primary.light;
      case 'dessert': return theme.palette.secondary.light;
      case 'grill': return theme.palette.warning.light;
      default: return theme.palette.background.paper;
    }
  };

  return {
    backgroundColor: getStationColor(stationType),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[6],
    },
  };
});

const StationHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`station-tabpanel-${index}`}
    aria-labelledby={`station-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
  </div>
);

const KitchenStation = ({
  station,
  orders = [],
  onOrderStatusUpdate,
  onOrderPrint,
  onStationSettings,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  compact = false,
  showFilters = true,
  maxOrdersPerRow = 3
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      onRefresh?.();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => order.station_id === station.id);

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(order => order.priority === filterPriority);
    }

    // Sort by priority and time
    filtered.sort((a, b) => {
      // First sort by priority (high to low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then sort by creation time (oldest first)
      return new Date(a.created_at) - new Date(b.created_at);
    });

    return filtered;
  }, [orders, station.id, filterStatus, filterPriority]);

  // Get station statistics
  const stationStats = useMemo(() => {
    const stationOrders = orders.filter(order => order.station_id === station.id);
    
    return {
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
  }, [orders, station.id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    onRefresh?.();
    setLastRefresh(new Date());
  };

  const getStationIcon = (stationType) => {
    switch (stationType) {
      case 'hot_kitchen': return <OutdoorGrillIcon />;
      case 'cold_kitchen': return <FastfoodIcon />;
      case 'bar': return <LocalBarIcon />;
      case 'dessert': return <BakeryDiningIcon />;
      default: return <FastfoodIcon />;
    }
  };

  const getStationColor = (stationType) => {
    switch (stationType) {
      case 'hot_kitchen': return 'error';
      case 'cold_kitchen': return 'info';
      case 'bar': return 'primary';
      case 'dessert': return 'secondary';
      case 'grill': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <StationCard stationType={station.type} elevation={3}>
      <CardContent sx={{ p: 2 }}>
        {/* Station Header */}
        <StationHeader>
          <Box display="flex" alignItems="center" gap={1}>
            {getStationIcon(station.type)}
            <Typography variant="h5" fontWeight="bold">
              {station.name}
            </Typography>
            <Chip
              label={station.type?.replace('_', ' ').toUpperCase()}
              color={getStationColor(station.type)}
              size="small"
            />
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              Last: {formatTime(lastRefresh)}
            </Typography>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print All">
              <IconButton size="small">
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Station Settings">
              <IconButton size="small" onClick={onStationSettings}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </StationHeader>

        {/* Station Statistics */}
        <Grid container spacing={1} mb={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stationStats.pending} color="warning">
                <Typography variant="h6">Pending</Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stationStats.preparing} color="primary">
                <Typography variant="h6">Preparing</Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stationStats.ready} color="success">
                <Typography variant="h6">Ready</Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stationStats.delayed} color="error">
                <Typography variant="h6">Delayed</Typography>
              </Badge>
            </Box>
          </Grid>
        </Grid>

        {/* Alerts */}
        {stationStats.highPriority > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {stationStats.highPriority} high priority order{stationStats.highPriority > 1 ? 's' : ''} waiting!
          </Alert>
        )}

        {stationStats.delayed > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {stationStats.delayed} order{stationStats.delayed > 1 ? 's' : ''} delayed!
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <Box mb={2}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab 
                label={
                  <Badge badgeContent={stationStats.total} color="primary">
                    All ({stationStats.total})
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stationStats.pending} color="warning">
                    Pending ({stationStats.pending})
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stationStats.preparing} color="primary">
                    Preparing ({stationStats.preparing})
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stationStats.ready} color="success">
                    Ready ({stationStats.ready})
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stationStats.delayed} color="error">
                    Delayed ({stationStats.delayed})
                  </Badge>
                } 
              />
            </Tabs>
          </Box>
        )}

        {/* Order Tickets */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {filteredOrders.map((order) => (
              <Grid 
                key={order.id} 
                item 
                xs={12} 
                sm={compact ? 12 : 6} 
                md={compact ? 6 : 4}
                lg={compact ? 4 : 3}
                xl={compact ? 3 : 2}
              >
                <OrderTicket
                  order={order}
                  onStatusUpdate={onOrderStatusUpdate}
                  onPrint={onOrderPrint}
                  compact={compact}
                  autoRefresh={autoRefresh}
                />
              </Grid>
            ))}
          </Grid>

          {filteredOrders.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No orders in this station
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Orders will appear here when assigned to {station.name}
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {filteredOrders.filter(order => order.status === 'pending').map((order) => (
              <Grid 
                key={order.id} 
                item 
                xs={12} 
                sm={compact ? 12 : 6} 
                md={compact ? 6 : 4}
                lg={compact ? 4 : 3}
                xl={compact ? 3 : 2}
              >
                <OrderTicket
                  order={order}
                  onStatusUpdate={onOrderStatusUpdate}
                  onPrint={onOrderPrint}
                  compact={compact}
                  autoRefresh={autoRefresh}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {filteredOrders.filter(order => order.status === 'preparing').map((order) => (
              <Grid 
                key={order.id} 
                item 
                xs={12} 
                sm={compact ? 12 : 6} 
                md={compact ? 6 : 4}
                lg={compact ? 4 : 3}
                xl={compact ? 3 : 2}
              >
                <OrderTicket
                  order={order}
                  onStatusUpdate={onOrderStatusUpdate}
                  onPrint={onOrderPrint}
                  compact={compact}
                  autoRefresh={autoRefresh}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            {filteredOrders.filter(order => order.status === 'ready').map((order) => (
              <Grid 
                key={order.id} 
                item 
                xs={12} 
                sm={compact ? 12 : 6} 
                md={compact ? 6 : 4}
                lg={compact ? 4 : 3}
                xl={compact ? 3 : 2}
              >
                <OrderTicket
                  order={order}
                  onStatusUpdate={onOrderStatusUpdate}
                  onPrint={onOrderPrint}
                  compact={compact}
                  autoRefresh={autoRefresh}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={2}>
            {filteredOrders.filter(order => {
              const orderAge = (new Date() - new Date(order.created_at)) / 60000;
              return orderAge > (order.estimated_time || 20);
            }).map((order) => (
              <Grid 
                key={order.id} 
                item 
                xs={12} 
                sm={compact ? 12 : 6} 
                md={compact ? 6 : 4}
                lg={compact ? 4 : 3}
                xl={compact ? 3 : 2}
              >
                <OrderTicket
                  order={order}
                  onStatusUpdate={onOrderStatusUpdate}
                  onPrint={onOrderPrint}
                  compact={compact}
                  autoRefresh={autoRefresh}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </CardContent>
    </StationCard>
  );
};

export default KitchenStation;