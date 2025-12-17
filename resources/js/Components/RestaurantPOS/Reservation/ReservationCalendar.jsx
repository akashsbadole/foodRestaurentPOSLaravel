import React, { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Fab,
  Paper,
  Slide,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  useScrollTrigger
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  CalendarViewMonth as ViewMonthIcon,
  TouchApp as TouchAppIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  PersonAdd as PersonAddIcon,
  FastForward as FastForwardIcon,
  FastRewind as FastRewindIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useCustomTheme } from '@/Components/ThemeProvider';
import { getReservationStatusColor } from '../../../lib/statusColors';
import ReservationForm from './ReservationForm';

const CalendarContainer = styled(Box, {
  shouldForwardProp: (prop) => !['isMobile', 'isTablet'].includes(prop),
})(({ theme, isMobile, isTablet }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: isMobile ? '500px' : '600px',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1a2f4a 0%, #2c5282 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  touchAction: 'manipulation', // Improve touch performance
}));

const CalendarHeader = styled(Box, {
  shouldForwardProp: (prop) => !['isMobile'].includes(prop),
})(({ theme, isMobile }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: isMobile ? theme.spacing(1) : theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(isMobile ? 1 : 2),
  boxShadow: '0 4px 20px rgba(30, 58, 95, 0.15)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  flexDirection: isMobile ? 'column' : 'row',
  gap: isMobile ? theme.spacing(1) : 0,
}));

const CalendarGrid = styled(Grid, {
  shouldForwardProp: (prop) => !['isMobile'].includes(prop),
})(({ theme, isMobile }) => ({
  flex: 1,
  overflow: 'auto',
  touchAction: 'pan-y', // Allow vertical scrolling on touch
}));

const DayCard = styled(Card, {
  shouldForwardProp: (prop) => !['isCurrentMonth', 'hasReservations', 'isSelected', 'isMobile', 'isUrgent'].includes(prop),
})(({ theme, isCurrentMonth, hasReservations, isSelected, isMobile, isUrgent }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: isSelected ? `2px solid #3182ce` : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
  background: isSelected
    ? theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'
    : isCurrentMonth
      ? theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'
      : theme.palette.mode === 'dark'
        ? 'rgba(30, 58, 95, 0.3)'
        : 'rgba(30, 58, 95, 0.05)',
  opacity: isCurrentMonth ? 1 : 0.6,
  height: isMobile ? '70px' : '100px',
  minHeight: isMobile ? '70px' : '100px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 2px 8px rgba(30, 58, 95, 0.1)',
  transform: isUrgent ? 'scale(1.05)' : 'scale(1)',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 30px rgba(0, 0, 0, 0.4)'
      : '0 8px 30px rgba(30, 58, 95, 0.2)',
    background: isSelected
      ? theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)'
        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
      : theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)'
        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  },
  touchAction: 'manipulation',
}));

const ReservationChip = styled(Chip, {
  shouldForwardProp: (prop) => !['isMobile'].includes(prop),
})(({ theme, status, isMobile }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af';
      default: return theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af';
    }
  };

  return {
    backgroundColor: getStatusColor(status),
    color: '#ffffff',
    fontSize: isMobile ? '0.6rem' : '0.7rem',
    height: isMobile ? '18px' : '20px',
    margin: theme.spacing(0.25),
    fontWeight: 'bold',
    touchAction: 'manipulation',
  };
});

const TouchFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 80,
  right: 16,
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  width: 56,
  height: 56,
  zIndex: 1000,
  '&:hover': {
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
      : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
  },
}));

const ReservationCalendar = ({
  reservations = [],
  onReservationSelect,
  onReservationEdit,
  onReservationDelete,
  onReservationAdd,
  onDateSelect,
  selectedDate = null,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  showWeekNumbers = false,
  firstDayOfWeek = 0, // 0 = Sunday, 1 = Monday, etc.
  isTablet = false,
  isLandscape = false
}) => {
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  // Using Tailwind breakpoint values for consistency
  const isMobile = useMediaQuery('(max-width: 767px)'); // Tailwind 'md' breakpoint
  const [currentDate, setCurrentDate] = useState(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit'
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const calendarRef = useRef(null);
  const [trigger, setTrigger] = useState(false);

  // Handle scroll trigger for loading more data
  useScrollTrigger({
    threshold: 0.8,
    onEnter: () => setTrigger(true),
    onExit: () => setTrigger(false),
  });

  // Calculate calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get reservations for a specific date
  const getReservationsForDate = (date) => {
    if (!date) return [];

    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date_time).toISOString().split('T')[0];
      return reservationDate === dateStr;
    });
  };

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setInternalSelectedDate(today);
    onDateSelect?.(today);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    if (!date) return;

    setInternalSelectedDate(date);
    onDateSelect?.(date);

    const dayReservations = getReservationsForDate(date);
    if (dayReservations.length === 1) {
      // If only one reservation, select it
      onReservationSelect?.(dayReservations[0]);
    } else if (dayReservations.length > 1) {
      // If multiple reservations, could show a list dialog
      onReservationSelect?.(dayReservations[0]);
    }
  };

  // Handle reservation actions
  const handleReservationEdit = (reservation) => {
    setSelectedReservation(reservation);
    setDialogMode('edit');
    setShowReservationDialog(true);
  };

  const handleReservationDelete = (reservation) => {
    onReservationDelete?.(reservation.id);
  };

  const handleAddReservation = (date = null) => {
    setSelectedReservation(null);
    setDialogMode('create');
    setShowReservationDialog(true);
  };

  const handleReservationDialogClose = () => {
    setShowReservationDialog(false);
    setSelectedReservation(null);
  };

  const handleReservationConfirm = (reservationData) => {
    if (dialogMode === 'create') {
      onReservationAdd?.(reservationData);
    } else {
      onReservationEdit?.(reservationData);
    }
    handleReservationDialogClose();
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'today':
        goToToday();
        break;
      case 'add-today':
        handleAddReservation(new Date());
        break;
      case 'week-view':
        setViewMode('week');
        break;
      case 'month-view':
        setViewMode('month');
        break;
    }
    setQuickActionsOpen(false);
  };

  // Format month name
  const formatMonthName = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if date is selected
  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.getDate() === internalSelectedDate.getDate() &&
      date.getMonth() === internalSelectedDate.getMonth() &&
      date.getFullYear() === internalSelectedDate.getFullYear();
  };

  // Check if date is in current month
  const isCurrentMonth = (date) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  // Check if reservation is urgent (today or tomorrow)
  const isReservationUrgent = (reservation) => {
    const reservationDate = new Date(reservation.date_time);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reservationDate <= tomorrow;
  };

  const calendarDays = getCalendarDays();
  const monthName = formatMonthName(currentDate);

  // Filter reservations based on status
  const filteredReservations = reservations.filter(reservation => {
    if (filterStatus === 'all') return true;
    return reservation.status === filterStatus;
  });

  return (
    <CalendarContainer isMobile={isMobile} isTablet={isTablet}>
      {/* Calendar Header */}
      <CalendarHeader isMobile={isMobile}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={previousMonth} size={isMobile ? 'small' : 'medium'}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={nextMonth} size={isMobile ? 'small' : 'medium'}>
            <ChevronRightIcon />
          </IconButton>
          <IconButton onClick={goToToday} size={isMobile ? 'small' : 'medium'}>
            <TodayIcon />
          </IconButton>
        </Box>

        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          fontWeight="bold"
          sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f' }}
        >
          {monthName}
        </Typography>

        <Box display="flex" gap={1}>
          <Button
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('month')}
            startIcon={<ViewMonthIcon />}
            sx={{
              ...(viewMode === 'month' ? {
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
            {isMobile ? '' : 'Month'}
          </Button>
          <Button
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('week')}
            startIcon={<ViewWeekIcon />}
            sx={{
              ...(viewMode === 'week' ? {
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
            {isMobile ? '' : 'Week'}
          </Button>
          <Button
            variant={viewMode === 'day' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('day')}
            startIcon={<ViewDayIcon />}
            sx={{
              ...(viewMode === 'day' ? {
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
            {isMobile ? '' : 'Day'}
          </Button>
        </Box>
      </CalendarHeader>

      {/* Calendar Grid */}
      <CalendarGrid container spacing={1} isMobile={isMobile} ref={calendarRef}>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid item xs={12 / 7} key={day}>
            <Typography
              variant="subtitle2"
              align="center"
              fontWeight="bold"
              sx={{
                color: isDarkMode ? '#90caf9' : '#1e3a5f',
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dayReservations = date ? getReservationsForDate(date) : [];
          const hasReservations = dayReservations.length > 0;
          const isTodayDate = isToday(date);
          const isSelectedDate = isDateSelected(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const hasUrgentReservation = dayReservations.some(isReservationUrgent);

          return (
            <Grid item xs={12 / 7} key={index}>
              <DayCard
                isCurrentMonth={isCurrentMonthDate}
                hasReservations={hasReservations}
                isSelected={isSelectedDate}
                isMobile={isMobile}
                isUrgent={hasUrgentReservation}
                onClick={() => date && handleDateSelect(date)}
                elevation={isTodayDate ? 3 : 1}
              >
                <CardContent sx={{ p: isMobile ? 0.5 : 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography
                      variant="body2"
                      fontWeight={isTodayDate ? 'bold' : 'normal'}
                      sx={{
                        color: isTodayDate
                          ? '#3182ce'
                          : isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }}
                    >
                      {date?.getDate()}
                    </Typography>
                    {hasReservations && (
                      <Badge
                        badgeContent={dayReservations.length}
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: '#3182ce',
                            color: '#ffffff',
                            fontSize: isMobile ? '0.6rem' : '0.7rem',
                          },
                        }}
                        showZero
                      >
                        <EventIcon fontSize={isMobile ? 'small' : 'medium'} sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                      </Badge>
                    )}
                  </Box>

                  {/* Reservation indicators */}
                  <Box flex={1} overflow="hidden" display="flex" flexDirection="column" gap={0.25}>
                    {dayReservations.slice(0, isMobile ? 1 : 2).map((reservation, resIndex) => (
                      <ReservationChip
                        key={resIndex}
                        status={reservation.status}
                        label={`${reservation.guest_count} guests`}
                        size="small"
                        isMobile={isMobile}
                      />
                    ))}
                    {dayReservations.length > (isMobile ? 1 : 2) && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayReservations.length - (isMobile ? 1 : 2)} more
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </DayCard>
            </Grid>
          );
        })}
      </CalendarGrid>

      {/* Selected Date Reservations */}
      {internalSelectedDate && (
        <Box mt={2}>
          <Card
            sx={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 95, 0.1)'}`,
              boxShadow: '0 4px 20px rgba(30, 58, 95, 0.15)',
            }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography
                  variant="h6"
                  sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f', fontWeight: 'bold' }}
                >
                  Reservations for {internalSelectedDate.toLocaleDateString()}
                </Typography>
                {allowCreate && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddReservation(selectedDate)}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      background: isDarkMode
                        ? 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)'
                        : 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
                      color: '#ffffff',
                      '&:hover': {
                        background: isDarkMode
                          ? 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)'
                          : 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)',
                      },
                    }}
                  >
                    {isMobile ? '' : 'Add Reservation'}
                  </Button>
                )}
              </Box>

              <List>
                {getReservationsForDate(internalSelectedDate).map((reservation) => (
                  <ListItem key={reservation.id}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="subtitle2"
                            sx={{ color: isDarkMode ? '#ffffff' : '#1e3a5f', fontWeight: 'bold' }}
                          >
                            {reservation.customer_name}
                          </Typography>
                          <ReservationChip
                            status={reservation.status}
                            label={reservation.status}
                            size="small"
                            isMobile={isMobile}
                          />
                          {isReservationUrgent(reservation) && (
                            <Chip
                              label="Urgent"
                              color="error"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <PeopleIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                            <Typography
                              variant="body2"
                              sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                            >
                              {reservation.guest_count} guests
                            </Typography>
                            <TimeIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                            <Typography
                              variant="body2"
                              sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                            >
                              {new Date(reservation.date_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                          {reservation.table_name && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <RestaurantIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                              <Typography
                                variant="body2"
                                sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                              >
                                Table: {reservation.table_name}
                              </Typography>
                            </Box>
                          )}
                          {reservation.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon fontSize="small" sx={{ color: isDarkMode ? '#90caf9' : '#1e3a5f' }} />
                              <Typography
                                variant="body2"
                                sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
                              >
                                {reservation.phone}
                              </Typography>
                            </Box>
                          )}
                          {reservation.notes && (
                            <Typography
                              variant="body2"
                              sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                            >
                              Notes: {reservation.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {allowEdit && (
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleReservationEdit(reservation)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {allowDelete && (
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleReservationDelete(reservation)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {getReservationsForDate(internalSelectedDate).length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography
                    variant="h6"
                    sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
                  >
                    No reservations for this date
                  </Typography>
                  {allowCreate && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddReservation(internalSelectedDate)}
                      sx={{
                        mt: 2,
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(30, 58, 95, 0.3)',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        '&:hover': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(30, 58, 95, 0.5)',
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 95, 0.05)',
                        },
                      }}
                    >
                      Add First Reservation
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Reservation Dialog */}
      <Dialog
        open={showReservationDialog}
        onClose={handleReservationDialogClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <ReservationForm
          reservation={selectedReservation}
          selectedDate={internalSelectedDate}
          onSubmit={handleReservationConfirm}
          onCancel={handleReservationDialogClose}
          mode={dialogMode}
          isMobile={isMobile}
        />
      </Dialog>

      {/* Filter Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onOpen={() => setFilterDrawerOpen(true)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: 'background.paper',
            borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filter Reservations
          </Typography>
          <List>
            <ListItem button onClick={() => setFilterStatus('all')}>
              <ListItemText primary="All Reservations" />
            </ListItem>
            <ListItem button onClick={() => setFilterStatus('confirmed')}>
              <ListItemText primary="Confirmed" />
            </ListItem>
            <ListItem button onClick={() => setFilterStatus('pending')}>
              <ListItemText primary="Pending" />
            </ListItem>
            <ListItem button onClick={() => setFilterStatus('cancelled')}>
              <ListItemText primary="Cancelled" />
            </ListItem>
            <ListItem button onClick={() => setFilterStatus('completed')}>
              <ListItemText primary="Completed" />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>

      {/* Mobile Quick Actions */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Quick actions"
          sx={{ position: 'fixed', bottom: 80, left: 16 }}
          icon={<TouchAppIcon />}
          direction="right"
          open={quickActionsOpen}
          onOpen={() => setQuickActionsOpen(true)}
          onClose={() => setQuickActionsOpen(false)}
        >
          <SpeedDialAction
            icon={<TodayIcon />}
            tooltipTitle="Go to Today"
            onClick={() => handleQuickAction('today')}
          />
          <SpeedDialAction
            icon={<CalendarTodayIcon />}
            tooltipTitle="Add Reservation for Today"
            onClick={() => handleQuickAction('add-today')}
          />
          <SpeedDialAction
            icon={<FilterIcon />}
            tooltipTitle="Filter Reservations"
            onClick={() => setFilterDrawerOpen(true)}
          />
        </SpeedDial>
      )}

      {/* Floating Action Button */}
      <TouchFab
        color="primary"
        onClick={() => handleAddReservation()}
        aria-label="Add reservation"
      >
        <AddIcon />
      </TouchFab>

      {/* Load more indicator */}
      {trigger && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Load more data
              setTrigger(false);
            }}
          >
            Load More
          </Button>
        </Box>
      )}
    </CalendarContainer>
  );
};

export default ReservationCalendar;
