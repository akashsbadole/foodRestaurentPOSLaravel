import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
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
  alpha
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as OrderIcon,
  TableRestaurant as TableIcon,
  AccessTime as TimeIcon,
  EventSeat as ReservationIcon,
  CheckCircle as AvailableIcon,
  RadioButtonUnchecked as OccupiedIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const RestaurantDashboard = ({
  todayStats,
  recentOrders,
  upcomingReservations,
  tableSections
}) => {
  const theme = useTheme();

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

  const OrderCard = ({ order }) => (
    <Card sx={{ mb: 2, transition: 'all 0.2s ease' }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight="medium">
              Order #{order.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Table: {order.table_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Waiter: {order.waiter_name}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Chip
              label={order.status}
              size="small"
              color={
                order.status === 'completed' ? 'success' :
                order.status === 'preparing' ? 'warning' :
                order.status === 'pending' ? 'info' : 'default'
              }
              sx={{ mb: 1 }}
            />
            <Typography variant="h6" color="primary.main">
              ${parseFloat(order.total).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(order.created_at).toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ReservationCard = ({ reservation }) => (
    <ListItem sx={{ px: 0 }}>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
          <ReservationIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight="medium">
              {reservation.customer_name}
            </Typography>
            <Chip
              label={`${reservation.guest_count} guests`}
              size="small"
              variant="outlined"
            />
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {new Date(reservation.reservation_time).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Table: {reservation.table_name || 'Not assigned'}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );

  const TableStatusCard = ({ section }) => {
    const totalTables = section.tables.length;
    const availableTables = section.tables.filter(t => t.status === 'available').length;
    const occupiedTables = totalTables - availableTables;
    const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="medium" gutterBottom>
            {section.name}
          </Typography>
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Occupancy
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {occupiedTables}/{totalTables} tables
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={occupancyRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.grey[500], 0.2)
              }}
            />
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <AvailableIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                <Typography variant="caption">
                  {availableTables} Available
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <OccupiedIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
                <Typography variant="caption">
                  {occupiedTables} Occupied
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title="Restaurant Dashboard" />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Restaurant Management Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of today's restaurant operations
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={OrderIcon}
              title="Today's Orders"
              value={todayStats.orders || 0}
              color={theme.palette.primary.main}
              subtitle="Total orders processed"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={MoneyIcon}
              title="Today's Revenue"
              value={`$${parseFloat(todayStats.revenue || 0).toFixed(2)}`}
              color={theme.palette.success.main}
              subtitle="Total sales today"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={RestaurantIcon}
              title="Active Orders"
              value={todayStats.active_orders || 0}
              color={theme.palette.warning.main}
              subtitle="Orders in progress"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={TableIcon}
              title="Table Status"
              value={`${todayStats.available_tables || 0}/${todayStats.total_tables || 0}`}
              color={theme.palette.info.main}
              subtitle="Available/Total tables"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Orders */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Recent Orders
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.slice(0, 5).map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.secondary">
                      No recent orders
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Upcoming Reservations */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Upcoming Reservations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {upcomingReservations && upcomingReservations.length > 0 ? (
                  <List>
                    {upcomingReservations.slice(0, 5).map((reservation, index) => (
                      <React.Fragment key={reservation.id}>
                        <ReservationCard reservation={reservation} />
                        {index < upcomingReservations.slice(0, 5).length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.secondary">
                      No upcoming reservations
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Table Sections Status */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Table Status by Sections
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                {tableSections && tableSections.length > 0 ? (
                  tableSections.map((section) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={section.id}>
                      <TableStatusCard section={section} />
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Box textAlign="center" py={4}>
                      <Typography variant="body2" color="text.secondary">
                        No table sections configured
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AuthenticatedLayout>
  );
};

export default RestaurantDashboard;