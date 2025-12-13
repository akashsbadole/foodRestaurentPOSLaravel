import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Kitchen as KitchenIcon,
  Restaurant as FoodIcon,
  AccessTime as TimeIcon,
  CheckCircle as ReadyIcon,
  PlayArrow as StartIcon,
  Done as CompleteIcon,
  PriorityHigh as PriorityIcon,
  LocalFireDepartment as UrgentIcon,
  RoomService as ServeIcon
} from '@mui/icons-material';

const KitchenDashboard = ({ currentStore, stations, readyItems, stats }) => {
  const theme = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    router.reload({
      only: ['stations', 'readyItems', 'stats'],
    });
  };

  const handleStartPreparation = (queueId) => {
    router.post(`/kitchen/start-preparation/${queueId}`, {}, {
      onSuccess: () => {
        handleRefresh();
      },
      onError: (errors) => {
        console.error('Failed to start preparation:', errors);
      }
    });
  };

  const handleMarkAsReady = (queueId) => {
    router.post(`/kitchen/mark-as-ready/${queueId}`, {}, {
      onSuccess: () => {
        handleRefresh();
      },
      onError: (errors) => {
        console.error('Failed to mark as ready:', errors);
      }
    });
  };

  const handleCompleteItem = (queueId) => {
    router.post(`/kitchen/complete/${queueId}`, {}, {
      onSuccess: () => {
        handleRefresh();
      },
      onError: (errors) => {
        console.error('Failed to complete item:', errors);
      }
    });
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.2),
              color: color,
              width: 56,
              height: 56
            }}
          >
            <Icon fontSize="large" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const QueueItemCard = ({ item, stationId }) => {
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'urgent': return 'error';
        case 'high': return 'warning';
        case 'normal': return 'info';
        case 'low': return 'default';
        default: return 'default';
      }
    };

    const getPriorityIcon = (priority) => {
      switch (priority) {
        case 'urgent': return <UrgentIcon />;
        case 'high': return <PriorityIcon />;
        default: return null;
      }
    };

    return (
      <Card sx={{ mb: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" fontWeight="medium">
                  {item.orderItem.product.name}
                </Typography>
                {getPriorityIcon(item.priority) && (
                  <Chip
                    icon={getPriorityIcon(item.priority)}
                    label={item.priority}
                    size="small"
                    color={getPriorityColor(item.priority)}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Order #{item.orderItem.order.order_number} • Table {item.orderItem.order.table_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quantity: {item.orderItem.quantity}
              </Typography>
              {item.orderItem.special_instructions && (
                <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic' }}>
                  Note: {item.orderItem.special_instructions}
                </Typography>
              )}
            </Box>
            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
              <Chip
                label={item.status}
                size="small"
                color={
                  item.status === 'ready' ? 'success' :
                  item.status === 'in_progress' ? 'warning' :
                  'info'
                }
              />
              <Typography variant="caption" color="text.secondary">
                {new Date(item.created_at).toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} mt={2}>
            {item.status === 'queued' && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<StartIcon />}
                onClick={() => handleStartPreparation(item.id)}
              >
                Start
              </Button>
            )}
            {item.status === 'in_progress' && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<ReadyIcon />}
                onClick={() => handleMarkAsReady(item.id)}
              >
                Mark Ready
              </Button>
            )}
            {item.status === 'ready' && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CompleteIcon />}
                onClick={() => handleCompleteItem(item.id)}
              >
                Complete
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const ReadyItemCard = ({ item }) => (
    <ListItem sx={{ px: 0 }}>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.2) }}>
          <ReadyIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight="medium">
              {item.orderItem.product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(item.completed_at).toLocaleTimeString()}
            </Typography>
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              Order #{item.orderItem.order.order_number} • Table {item.orderItem.order.table_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quantity: {item.orderItem.quantity}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );

  return (
    <AuthenticatedLayout>
      <Head title="Kitchen Dashboard" />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Kitchen Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage kitchen orders and station operations
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<TimeIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={FoodIcon}
              title="Total Items"
              value={stats.totalItems || 0}
              color={theme.palette.primary.main}
              subtitle="Items today"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={<PlayArrow />}
              title="In Progress"
              value={stats.inProgressItems || 0}
              color={theme.palette.warning.main}
              subtitle="Being prepared"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={ReadyIcon}
              title="Ready"
              value={stats.readyItems || 0}
              color={theme.palette.success.main}
              subtitle="Waiting to serve"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={<TimeIcon />}
              title="Queued"
              value={stats.queuedItems || 0}
              color={theme.palette.info.main}
              subtitle="Waiting to start"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={CompleteIcon}
              title="Completed"
              value={stats.completedItems || 0}
              color={theme.palette.success.main}
              subtitle="Finished today"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Kitchen Stations */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Kitchen Stations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                {stations && stations.length > 0 ? (
                  stations.map((station) => (
                    <Grid item xs={12} md={6} key={station.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="h6" fontWeight="medium" gutterBottom>
                            {station.name}
                          </Typography>
                          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {station.queueItems && station.queueItems.length > 0 ? (
                              station.queueItems.map((item) => (
                                <QueueItemCard
                                  key={item.id}
                                  item={item}
                                  stationId={station.id}
                                />
                              ))
                            ) : (
                              <Box textAlign="center" py={4}>
                                <Typography variant="body2" color="text.secondary">
                                  No items in queue
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Box textAlign="center" py={4}>
                      <Typography variant="body2" color="text.secondary">
                        No kitchen stations configured
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Ready Items */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Ready for Service
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                {readyItems && readyItems.length > 0 ? (
                  <List>
                    {readyItems.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <ReadyItemCard item={item} />
                        {index < readyItems.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.secondary">
                      No items ready for service
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AuthenticatedLayout>
  );
};

export default KitchenDashboard;