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
import { styled, alpha } from '@mui/material/styles';
import { useCustomTheme } from '@/Components/ThemeProvider';
import { getReservationStatusColor } from '../../../lib/statusColors';

const ListContainer = styled(Box)(({ theme }) => ({
  maxHeight: '70vh',
  overflow: 'auto',
  paddingRight: theme.spacing(1),
}));

const ReservationCard = styled(Card)(({ theme, status }) => {
  return {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
    borderLeft: `4px solid ${theme.palette[getStatusColor(status)]?.main || theme.palette.grey[500]}`,
    transition: 'all 0.3s ease',
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 20px rgba(0, 0, 0, 0.3)'
      : '0 4px 20px rgba(30, 58, 95, 0.15)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.palette.mode === 'dark'
        ? '0 8px 30px rgba(0, 0, 0, 0.4)'
        : '0 8px 30px rgba(30, 58, 95, 0.2)',
    },
  };
});

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af';
      case 'no-show': return '#dc2626';
      default: return theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af';
    }
  };

  return {
    backgroundColor: getStatusColor(status),
    color: '#ffffff',
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
  const { isDarkMode } = useCustomTheme();
  // Using Tailwind breakpoint values for consistency
  const isMobile = useMediaQuery('(max-width: 767px)'); // Tailwind 'md' breakpoint
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
                  <Typography
                    variant={compact ? "h6" : "h5"}
                    fontWeight="bold"
                    sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f' }}
                  >
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
                      variant="outlined"
                      sx={{
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(30, 58, 95, 0.3)',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                      }}
                    />
                  )}
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <EventIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                      <Typography
                        variant="body2"
                        sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                      >
                        {formatDateTime(reservation.date_time)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PeopleIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                      <Typography
                        variant="body2"
                        sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                      >
                        {reservation.guest_count} guests
                      </Typography>
                    </Box>
                  </Grid>

                  {reservation.table_name && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <RestaurantIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                        <Typography
                          variant="body2"
                          sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                        >
                          Table: {reservation.table_name}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {reservation.phone && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PhoneIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                        <Typography
                          variant="body2"
                          sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                        >
                          {reservation.phone}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {reservation.email && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmailIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                        <Typography
                          variant="body2"
                          sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                        >
                          {reservation.email}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {reservation.occasion && (
                    <Grid item xs={12}>
                      <Typography
                        variant="body2"
                        sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                      >
                        Occasion: {reservation.occasion}
                      </Typography>
                    </Grid>
                  )}

                  {reservation.special_requests && (
                    <Grid item xs={12}>
                      <Typography
                        variant="body2"
                        sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                      >
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
                      onClick={() => onReservationConfirm?.(reservation.id)}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        },
                      }}
                    >
                      Confirm
                    </Button>
                  </Tooltip>
                )}

                {allowStatusChange && reservation.status === 'confirmed' && (
                  <Tooltip title="Cancel Reservation">
                    <Button
                      size="small"
                      onClick={() => onReservationCancel?.(reservation.id)}
                      sx={{
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(30, 58, 95, 0.3)',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        '&:hover': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(30, 58, 95, 0.5)',
                          backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        },
                      }}
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
                      sx={{
                        color: isDarkMode ? '#90caf9' : '#1e3a5f',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 95, 0.05)',
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {allowDelete && (
                  <Tooltip title="Delete Reservation">
                    <IconButton
                      size="small"
                      onClick={() => onReservationDelete?.(reservation.id)}
                      sx={{
                        color: '#ef4444',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        },
                      }}
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
          <Typography
            variant="h6"
            sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
          >
            No reservations found
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
          >
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
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f' }}
        >
          Reservations
        </Typography>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Box
              textAlign="center"
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
                boxShadow: '0 2px 8px rgba(30, 58, 95, 0.1)',
              }}
            >
              <Badge
                badgeContent={stats.total}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#3182ce',
                    color: '#ffffff',
                  },
                }}
                showZero
              >
                <Typography
                  variant="h6"
                  sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f', fontWeight: 'bold' }}
                >
                  Total
                </Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              textAlign="center"
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
                boxShadow: '0 2px 8px rgba(30, 58, 95, 0.1)',
              }}
            >
              <Badge
                badgeContent={stats.today}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                  },
                }}
                showZero
              >
                <Typography
                  variant="h6"
                  sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f', fontWeight: 'bold' }}
                >
                  Today
                </Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              textAlign="center"
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
                boxShadow: '0 2px 8px rgba(30, 58, 95, 0.1)',
              }}
            >
              <Badge
                badgeContent={stats.confirmed}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#3182ce',
                    color: '#ffffff',
                  },
                }}
                showZero
              >
                <Typography
                  variant="h6"
                  sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f', fontWeight: 'bold' }}
                >
                  Confirmed
                </Typography>
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              textAlign="center"
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
                boxShadow: '0 2px 8px rgba(30, 58, 95, 0.1)',
              }}
            >
              <Badge
                badgeContent={stats.pending}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                  },
                }}
                showZero
              >
                <Typography
                  variant="h6"
                  sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f', fontWeight: 'bold' }}
                >
                  Pending
                </Typography>
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
                  sx={{
                    ...(viewMode === 'list' ? {
                      background: isDarkMode
                        ? 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)'
                        : 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                      color: '#ffffff',
                      '&:hover': {
                        background: isDarkMode
                          ? 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)'
                          : 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
                      },
                    } : {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(30, 58, 95, 0.3)',
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                      '&:hover': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(30, 58, 95, 0.5)',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 95, 0.05)',
                      },
                    }),
                  }}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setViewMode('grid')}
                  startIcon={<CalendarIcon />}
                  sx={{
                    ...(viewMode === 'grid' ? {
                      background: isDarkMode
                        ? 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)'
                        : 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                      color: '#ffffff',
                      '&:hover': {
                        background: isDarkMode
                          ? 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)'
                          : 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
                      },
                    } : {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(30, 58, 95, 0.3)',
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                      '&:hover': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(30, 58, 95, 0.5)',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 95, 0.05)',
                      },
                    }),
                  }}
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