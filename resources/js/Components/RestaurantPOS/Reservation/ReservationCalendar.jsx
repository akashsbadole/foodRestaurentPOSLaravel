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
  useMediaQuery
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
  Event as EventIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ReservationForm from './ReservationForm';

const CalendarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: '600px',
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[2],
}));

const CalendarGrid = styled(Grid)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
}));

const DayCard = styled(Card)(({ theme, isCurrentMonth, hasReservations, isSelected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  backgroundColor: isSelected 
    ? theme.palette.primary.light 
    : isCurrentMonth 
      ? theme.palette.background.paper 
      : theme.palette.action.disabledBackground,
  opacity: isCurrentMonth ? 1 : 0.6,
  height: '100px',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    backgroundColor: isSelected 
      ? theme.palette.primary.light 
      : theme.palette.action.hover,
  },
}));

const ReservationChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      case 'completed': return theme.palette.grey.main;
      default: return theme.palette.grey.main;
    }
  };

  return {
    backgroundColor: getStatusColor(status),
    color: theme.palette.getContrastText(getStatusColor(status)),
    fontSize: '0.7rem',
    height: '20px',
    margin: theme.spacing(0.25),
  };
});

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
  firstDayOfWeek = 0 // 0 = Sunday, 1 = Monday, etc.
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit'
  const [selectedReservation, setSelectedReservation] = useState(null);

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
    
    // Add days of the month
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

  const calendarDays = getCalendarDays();
  const monthName = formatMonthName(currentDate);

  return (
    <CalendarContainer>
      {/* Calendar Header */}
      <CalendarHeader>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={previousMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={nextMonth}>
            <ChevronRightIcon />
          </IconButton>
          <IconButton onClick={goToToday}>
            <TodayIcon />
          </IconButton>
        </Box>

        <Typography variant="h5" fontWeight="bold">
          {monthName}
        </Typography>

        <Box display="flex" gap={1}>
          <Button
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'day' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
        </Box>
      </CalendarHeader>

      {/* Calendar Grid */}
      <CalendarGrid container spacing={1}>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid item xs={12/7} key={day}>
            <Typography variant="subtitle2" align="center" fontWeight="bold">
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

          return (
            <Grid item xs={12/7} key={index}>
              <DayCard
                isCurrentMonth={isCurrentMonthDate}
                hasReservations={hasReservations}
                isSelected={isSelectedDate}
                onClick={() => date && handleDateSelect(date)}
                elevation={isTodayDate ? 3 : 1}
              >
                <CardContent sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography 
                      variant="body2" 
                      fontWeight={isTodayDate ? 'bold' : 'normal'}
                      color={isTodayDate ? 'primary.main' : 'text.primary'}
                    >
                      {date?.getDate()}
                    </Typography>
                    {hasReservations && (
                      <Badge badgeContent={dayReservations.length} color="primary" showZero>
                        <EventIcon fontSize="small" />
                      </Badge>
                    )}
                  </Box>

                  {/* Reservation indicators */}
                  <Box flex={1} overflow="hidden">
                    {dayReservations.slice(0, 2).map((reservation, resIndex) => (
                      <ReservationChip
                        key={resIndex}
                        status={reservation.status}
                        label={`${reservation.guest_count} guests`}
                        size="small"
                      />
                    ))}
                    {dayReservations.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayReservations.length - 2} more
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
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Reservations for {internalSelectedDate.toLocaleDateString()}
                </Typography>
                {allowCreate && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddReservation(selectedDate)}
                    size="small"
                  >
                    Add Reservation
                  </Button>
                )}
              </Box>

              <List>
                {getReservationsForDate(internalSelectedDate).map((reservation) => (
                  <ListItem key={reservation.id}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">
                            {reservation.customer_name}
                          </Typography>
                          <ReservationChip
                            status={reservation.status}
                            label={reservation.status}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <PeopleIcon fontSize="small" />
                            <Typography variant="body2">
                              {reservation.guest_count} guests
                            </Typography>
                            <TimeIcon fontSize="small" />
                            <Typography variant="body2">
                              {new Date(reservation.date_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                          {reservation.table_name && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <RestaurantIcon fontSize="small" />
                              <Typography variant="body2">
                                Table: {reservation.table_name}
                              </Typography>
                            </Box>
                          )}
                          {reservation.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon fontSize="small" />
                              <Typography variant="body2">
                                {reservation.phone}
                              </Typography>
                            </Box>
                          )}
                          {reservation.notes && (
                            <Typography variant="body2" color="text.secondary">
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
                  <Typography variant="h6" color="text.secondary">
                    No reservations for this date
                  </Typography>
                  {allowCreate && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddReservation(internalSelectedDate)}
                      sx={{ mt: 2 }}
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
      >
        <ReservationForm
          reservation={selectedReservation}
          selectedDate={internalSelectedDate}
          onSubmit={handleReservationConfirm}
          onCancel={handleReservationDialogClose}
          mode={dialogMode}
        />
      </Dialog>
    </CalendarContainer>
  );
};

export default ReservationCalendar;