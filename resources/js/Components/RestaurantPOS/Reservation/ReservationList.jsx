import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  Event as EventIcon,
  Today as TodayIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ListContainer = styled(Box)(({ theme }) => ({
  maxHeight: '70vh',
  overflow: 'auto',
  paddingRight: theme.spacing(1),
}));

const ReservationCard = styled(Card)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      case 'completed': return theme.palette.grey.main;
      case 'no-show': return theme.palette.error.dark;
      default: return theme.palette.grey.main;
    }
  };

  return {
    borderLeft: `4px solid ${getStatusColor(status)}`,
    transition: 'all 0.3s ease',
    marginBottom: theme.spacing(2),
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[6],
    },
  };
});

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'default';
      case 'no-show': return 'error';
      default: return 'default';
    }
  };

  return {
    backgroundColor: theme.palette[getStatusColor(status)].main,
    color: theme.palette[getStatusColor(status)].contrastText,
    fontWeight: 'bold',
  };
});

const ReservationList = ({
  reservations = [],
  onReservationSelect,
  onReservationEdit,
  onReservationDelete,
  onReservationConfirm,
  onReservationCancel,
  allowEdit = true,
  allowDelete = true,
  allowStatusChange = true,
  showFilters = true,
  showSearch = true,
  defaultView = 'list', // 'list', 'grid', 'calendar'
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = useState(defaultView);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState('date_time');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort reservations
  const filteredReservations = React.useMemo(() => {
    let filtered = [...reservations];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.phone?.includes(searchTerm) ||
        reservation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === filterStatus);
    }

    // Filter by date
    if (filterDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(reservation => {
        const reservationDate = new Date(reservation.date_time);
        reservationDate.setHours(0, 0, 0, 0);

        switch (filterDate) {
          case 'today':
            return reservationDate.getTime() === today.getTime();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return reservationDate.getTime() === tomorrow.getTime();
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return reservationDate >= today && reservationDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            return reservationDate >= today && reservationDate <= monthFromNow;
          default:
            return true;
        }
      });
    }

    // Sort reservations
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'date_time') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [reservations, searchTerm, filterStatus, filterDate, sortBy, sortOrder]);

  // Get reservation statistics
  const getReservationStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: reservations.length,
      today: reservations.filter(r => {
        const rDate = new Date(r.date_time);
        rDate.setHours(0, 0, 0, 0);
        return rDate.getTime() === today.getTime();
      }).length,
      upcoming: reservations.filter(r => new Date(r.date_time) > new Date()).length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      pending: reservations.filter(r => r.status === 'pending').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
    };
  };

  const stats = getReservationStats();

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'default';
      case 'no-show': return 'error';
      default: return 'default';
    }
  };

  const renderListView = () => (
    <ListContainer>
      {filteredReservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          status={reservation.status}
          elevation={compact ? 1 : 2}
        >
          <CardContent sx={{ p: compact ? 1.5 : 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant={compact ? "h6" : "h5"} fontWeight="bold">
                    {reservation.customer_name}
                  </Typography>
                  <StatusChip
                    status={reservation.status}
                    label={reservation.status?.replace('-', ' ').toUpperCase()}
                    size="small"
                  />
                  {reservation.is_recurring && (
                    <Chip
                      label="Recurring"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatDateTime(reservation.date_time)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {reservation.guest_count} guests
                      </Typography>
                    </Box>
                  </Grid>

                  {reservation.table_name && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <RestaurantIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Table: {reservation.table_name}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {reservation.phone && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {reservation.phone}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {reservation.email && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {reservation.email}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {reservation.occasion && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Occasion: {reservation.occasion}
                      </Typography>
                    </Grid>
                  )}

                  {reservation.special_requests && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Special: {reservation.special_requests}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Box display="flex" flexDirection="column" gap={0.5}>
                {allowStatusChange && reservation.status === 'pending' && (
                  <Tooltip title="Confirm Reservation">
                    <Button
                      size="small"
                      color="success"
                      onClick={() => onReservationConfirm?.(reservation.id)}
                    >
                      Confirm
                    </Button>
                  </Tooltip>
                )}
                
                {allowStatusChange && reservation.status === 'confirmed' && (
                  <Tooltip title="Cancel Reservation">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => onReservationCancel?.(reservation.id)}
                    >
                      Cancel
                    </Button>
                  </Tooltip>
                )}

                {allowEdit && (
                  <Tooltip title="Edit Reservation">
                    <IconButton
                      size="small"
                      onClick={() => onReservationEdit?.(reservation)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {allowDelete && (
                  <Tooltip title="Delete Reservation">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onReservationDelete?.(reservation.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </CardContent>
        </ReservationCard>
      ))}

      {filteredReservations.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No reservations found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or search criteria
          </Typography>
        </Box>
      )}
    </ListContainer>
  );

  const renderGridView = () => (
    <Grid container spacing={2}>
      {filteredReservations.map((reservation) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={reservation.id}>
          <ReservationCard
            status={reservation.status}
            onClick={() => onReservationSelect?.(reservation)}
            sx={{ cursor: 'pointer' }}
          >
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {reservation.customer_name}
                </Typography>
                
                <StatusChip
                  status={reservation.status}
                  label={reservation.status?.replace('-', ' ').toUpperCase()}
                  size="small"
                  sx={{ mb: 1 }}
                />

                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(reservation.date_time)}
                  </Typography>
                  <Typography variant="body2">
                    {reservation.guest_count} guests
                  </Typography>
                  {reservation.table_name && (
                    <Typography variant="body2">
                      Table: {reservation.table_name}
                    </Typography>
                  )}
                </Box>

                <Box display="flex" justifyContent="center" gap={0.5}>
                  {allowEdit && (
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      onReservationEdit?.(reservation);
                    }}>
                      <EditIcon />
                    </IconButton>
                  )}
                  {allowDelete && (
                    <IconButton size="small" color="error" onClick={(e) => {
                      e.stopPropagation();
                      onReservationDelete?.(reservation.id);
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </CardContent>
          </ReservationCard>
        </Grid>
      ))}

      {filteredReservations.length === 0 && (
        <Grid item xs={12}>
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No reservations found
            </Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box>
      {/* Header with Statistics */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Reservations
        </Typography>
        
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stats.total} color="primary" showZero>
                <Typography variant="h6">Total</Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stats.today} color="success" showZero>
                <Typography variant="h6">Today</Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stats.confirmed} color="info" showZero>
                <Typography variant="h6">Confirmed</Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Badge badgeContent={stats.pending} color="warning" showZero>
                <Typography variant="h6">Pending</Typography>
              </Badge>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Filters and Search */}
      {(showFilters || showSearch) && (
        <Box mb={2}>
          <Grid container spacing={2} alignItems="center">
            {showSearch && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search reservations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon />
                  }}
                  size="small"
                />
              </Grid>
            )}

            {showFilters && (
              <>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="no-show">No Show</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      label="Date"
                    >
                      <MenuItem value="all">All Dates</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="tomorrow">Tomorrow</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => handleSort(e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="date_time">Date & Time</MenuItem>
                      <MenuItem value="customer_name">Customer Name</MenuItem>
                      <MenuItem value="guest_count">Guest Count</MenuItem>
                      <MenuItem value="status">Status</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={2}>
              <Box display="flex" gap={1}>
                <Button
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setViewMode('list')}
                  startIcon={<ScheduleIcon />}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setViewMode('grid')}
                  startIcon={<CalendarIcon />}
                >
                  Grid
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Reservations Display */}
      {viewMode === 'list' ? renderListView() : renderGridView()}
    </Box>
  );
};

export default ReservationList;