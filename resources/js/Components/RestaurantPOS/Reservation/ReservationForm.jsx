import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Slider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  Restaurant as RestaurantIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minHeight: '600px',
    maxHeight: '90vh',
  },
}));

const TimeSlot = styled(Box)(({ theme, selected, available }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: selected 
    ? theme.palette.primary.light 
    : available 
      ? theme.palette.background.paper 
      : theme.palette.action.disabledBackground,
  cursor: available ? 'pointer' : 'not-allowed',
  transition: 'all 0.3s ease',
  textAlign: 'center',
  minWidth: '80px',
  '&:hover': {
    backgroundColor: available 
      ? (selected ? theme.palette.primary.light : theme.palette.action.hover)
      : theme.palette.action.disabledBackground,
  },
}));

const ReservationForm = ({
  open,
  onClose,
  onSubmit,
  reservation = null,
  selectedDate = null,
  mode = 'create', // 'create', 'edit'
  tables = [],
  timeSlots = [],
  allowTableSelection = true,
  allowSpecialRequests = true,
  requirePhone = true,
  requireEmail = false,
  minGuests = 1,
  maxGuests = 20,
  defaultDuration = 120 // minutes
}) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    guest_count: 2,
    date_time: '',
    table_id: '',
    duration: defaultDuration,
    status: 'pending',
    notes: '',
    special_requests: '',
    occasion: '',
    is_recurring: false,
    recurring_frequency: 'weekly'
  });

  const [errors, setErrors] = useState({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableTables, setAvailableTables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize form when dialog opens or reservation changes
  useEffect(() => {
    if (open) {
      if (reservation && mode === 'edit') {
        setFormData({
          customer_name: reservation.customer_name || '',
          phone: reservation.phone || '',
          email: reservation.email || '',
          guest_count: reservation.guest_count || 2,
          date_time: reservation.date_time || '',
          table_id: reservation.table_id || '',
          duration: reservation.duration || defaultDuration,
          status: reservation.status || 'pending',
          notes: reservation.notes || '',
          special_requests: reservation.special_requests || '',
          occasion: reservation.occasion || '',
          is_recurring: reservation.is_recurring || false,
          recurring_frequency: reservation.recurring_frequency || 'weekly'
        });
        
        const reservationTime = new Date(reservation.date_time);
        setSelectedTimeSlot(reservationTime.toTimeString().slice(0, 5));
      } else {
        const dateTime = selectedDate || new Date();
        setFormData(prev => ({
          ...prev,
          date_time: dateTime.toISOString().slice(0, 16)
        }));
        setSelectedTimeSlot('');
      }
      setErrors({});
    }
  }, [open, reservation, mode, selectedDate, defaultDuration]);

  // Filter available tables based on guest count and date
  useEffect(() => {
    if (allowTableSelection && formData.guest_count) {
      const available = tables.filter(table => 
        table.capacity >= formData.guest_count && table.status === 'available'
      );
      setAvailableTables(available);
    }
  }, [formData.guest_count, tables, allowTableSelection]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    const [hours, minutes] = timeSlot.split(':');
    const dateTime = new Date(formData.date_time);
    dateTime.setHours(parseInt(hours));
    dateTime.setMinutes(parseInt(minutes));
    handleInputChange('date_time', dateTime.toISOString().slice(0, 16));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (requirePhone && !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (requireEmail && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.guest_count || formData.guest_count < minGuests) {
      newErrors.guest_count = `Minimum ${minGuests} guest${minGuests > 1 ? 's' : ''} required`;
    }

    if (formData.guest_count > maxGuests) {
      newErrors.guest_count = `Maximum ${maxGuests} guests allowed`;
    }

    if (!formData.date_time) {
      newErrors.date_time = 'Date and time are required';
    } else {
      const reservationDate = new Date(formData.date_time);
      const now = new Date();
      if (reservationDate < now) {
        newErrors.date_time = 'Reservation cannot be in the past';
      }
    }

    if (allowTableSelection && !formData.table_id) {
      newErrors.table_id = 'Please select a table';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setLoading(true);
    
    const submissionData = {
      ...formData,
      guest_count: parseInt(formData.guest_count),
      duration: parseInt(formData.duration),
      table_id: allowTableSelection ? formData.table_id : null
    };

    onSubmit?.(submissionData);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1000);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvailableTimeSlots = () => {
    if (!formData.date_time) return [];
    
    const selectedDate = new Date(formData.date_time).toDateString();
    return timeSlots.filter(slot => {
      const slotDate = new Date(slot.time).toDateString();
      return slotDate === selectedDate && slot.available;
    });
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {mode === 'create' ? 'Create Reservation' : 'Edit Reservation'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Customer Information */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Customer Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                error={!!errors.customer_name}
                helperText={errors.customer_name}
                InputProps={{
                  startAdornment: <PersonIcon />
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: <PhoneIcon />
                }}
                required={requirePhone}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: <EmailIcon />
                }}
                required={requireEmail}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Reservation Details */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Reservation Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date_time ? formData.date_time.split('T')[0] : ''}
                onChange={(e) => {
                  const newDateTime = `${e.target.value}T${formData.date_time ? formData.date_time.split('T')[1] : '12:00'}`;
                  handleInputChange('date_time', newDateTime);
                }}
                error={!!errors.date_time}
                helperText={errors.date_time}
                InputProps={{
                  startAdornment: <EventIcon />
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={formData.date_time ? formData.date_time.split('T')[1] : ''}
                onChange={(e) => {
                  const newDateTime = `${formData.date_time ? formData.date_time.split('T')[0] : new Date().toISOString().split('T')[0]}T${e.target.value}`;
                  handleInputChange('date_time', newDateTime);
                }}
                error={!!errors.date_time}
                helperText={errors.date_time}
                InputProps={{
                  startAdornment: <TimeIcon />
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Guests"
                type="number"
                value={formData.guest_count}
                onChange={(e) => handleInputChange('guest_count', e.target.value)}
                error={!!errors.guest_count}
                helperText={errors.guest_count}
                InputProps={{
                  min: minGuests,
                  max: maxGuests,
                  startAdornment: <PersonIcon />
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                InputProps={{
                  min: 30,
                  max: 480,
                  step: 15
                }}
              />
            </Grid>

            {allowTableSelection && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Table</InputLabel>
                  <Select
                    value={formData.table_id}
                    onChange={(e) => handleInputChange('table_id', e.target.value)}
                    error={!!errors.table_id}
                    label="Table"
                  >
                    <MenuItem value="">Select a table</MenuItem>
                    {availableTables.map((table) => (
                      <MenuItem key={table.id} value={table.id}>
                        {table.name} (Capacity: {table.capacity})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {errors.table_id && (
                  <Typography variant="caption" color="error">
                    {errors.table_id}
                  </Typography>
                )}
              </Grid>
            )}

            {mode === 'edit' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Time Slots */}
        {timeSlots.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Available Time Slots
            </Typography>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              {getAvailableTimeSlots().map((slot) => (
                <TimeSlot
                  key={slot.time}
                  selected={selectedTimeSlot === slot.time}
                  available={slot.available}
                  onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                >
                  <Typography variant="body2">
                    {formatTime(slot.time)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {slot.available ? 'Available' : 'Booked'}
                  </Typography>
                </TimeSlot>
              ))}
            </Box>
          </Box>
        )}

        {/* Special Requests */}
        {allowSpecialRequests && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Special Requests
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Occasion</InputLabel>
                  <Select
                    value={formData.occasion}
                    onChange={(e) => handleInputChange('occasion', e.target.value)}
                    label="Occasion"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="birthday">Birthday</MenuItem>
                    <MenuItem value="anniversary">Anniversary</MenuItem>
                    <MenuItem value="business">Business</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="celebration">Celebration</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Special Requests"
                  multiline
                  rows={3}
                  value={formData.special_requests}
                  onChange={(e) => handleInputChange('special_requests', e.target.value)}
                  placeholder="Any special dietary requirements, preferences, or requests..."
                  InputProps={{
                    startAdornment: <NotesIcon />
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Internal Notes"
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Internal notes for staff..."
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Recurring Reservation */}
        {mode === 'create' && (
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_recurring}
                  onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                />
              }
              label="Recurring Reservation"
            />
            
            {formData.is_recurring && (
              <Box mt={2}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.recurring_frequency}
                    onChange={(e) => handleInputChange('recurring_frequency', e.target.value)}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        )}

        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Please correct the following errors:
            <ul>
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Summary */}
        <Box p={2} bgcolor="background.paper" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            Reservation Summary
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Customer:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                {formData.customer_name}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Date & Time:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                {formData.date_time ? `${formatDate(formData.date_time)} at ${formatTime(formData.date_time.split('T')[1])}` : 'Not set'}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Guests:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                {formData.guest_count}
              </Typography>
            </Grid>
            
            {formData.table_id && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Table:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {tables.find(t => t.id === formData.table_id)?.name || 'Selected table'}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : (mode === 'create' ? 'Create Reservation' : 'Update Reservation')}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ReservationForm;