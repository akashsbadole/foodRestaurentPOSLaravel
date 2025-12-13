import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  useTheme,
  alpha,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  EventSeat as ReservationIcon,
  TableRestaurant as TableIcon,
  Person as CustomerIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ReservationsCreate = ({ currentStore, tables, customers }) => {
  const theme = useTheme();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [timeSlotsDialogOpen, setTimeSlotsDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    table_id: '',
    contact_id: '',
    customer_name: '',
    customer_phone: '',
    reservation_date: new Date(),
    reservation_time: new Date(),
    duration_minutes: 120,
    party_size: 2,
    special_requests: '',
    deposit_amount: 0,
    deposit_paid: false,
    notes: ''
  });

  useEffect(() => {
    // Set minimum date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.reservation_date < today) {
      setData('reservation_date', today);
    }
  }, []);

  const handleCustomerSearch = () => {
    if (customerSearchTerm.trim()) {
      // This would typically be an API call to search customers
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phone.includes(customerSearchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
      );
      setAvailableCustomers(filtered);
      setCustomerDialogOpen(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setData('contact_id', customer.id);
    setData('customer_name', customer.name);
    setData('customer_phone', customer.phone);
    setCustomerDialogOpen(false);
    setCustomerSearchTerm('');
  };

  const handleTableChange = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    setSelectedTable(table);
    setData('table_id', tableId);
    
    // Check if party size exceeds table capacity
    if (table && data.party_size > table.capacity) {
      Swal.fire({
        title: "Warning!",
        text: `Party size (${data.party_size}) exceeds table capacity (${table.capacity}).`,
        icon: "warning",
      });
    }
  };

  const handleCheckAvailability = () => {
    if (!data.table_id || !data.reservation_date) {
      Swal.fire({
        title: "Missing Information!",
        text: "Please select a table and date first.",
        icon: "warning",
      });
      return;
    }

    // This would typically be an API call to get available time slots
    // For now, we'll generate mock time slots
    const mockTimeSlots = [
      { start_time: '10:00', end_time: '12:00', available: true },
      { start_time: '12:00', end_time: '14:00', available: true },
      { start_time: '14:00', end_time: '16:00', available: false },
      { start_time: '16:00', end_time: '18:00', available: true },
      { start_time: '18:00', end_time: '20:00', available: true },
      { start_time: '20:00', end_time: '22:00', available: true }
    ];
    setAvailableTimeSlots(mockTimeSlots);
    setTimeSlotsDialogOpen(true);
  };

  const handleSelectTimeSlot = (slot) => {
    if (!slot.available) {
      Swal.fire({
        title: "Not Available!",
        text: "This time slot is already booked.",
        icon: "warning",
      });
      return;
    }

    const [hours, minutes] = slot.start_time.split(':');
    const newTime = new Date(data.reservation_date);
    newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    setData('reservation_time', newTime);
    setTimeSlotsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!data.table_id) {
      Swal.fire({
        title: "Missing Table!",
        text: "Please select a table for the reservation.",
        icon: "warning",
      });
      return;
    }

    if (!data.customer_name.trim()) {
      Swal.fire({
        title: "Missing Customer!",
        text: "Please enter customer name or select an existing customer.",
        icon: "warning",
      });
      return;
    }

    if (!data.customer_phone.trim()) {
      Swal.fire({
        title: "Missing Phone!",
        text: "Please enter customer phone number.",
        icon: "warning",
      });
      return;
    }

    const reservationData = {
      ...data,
      reservation_date: data.reservation_date.toISOString().split('T')[0],
      reservation_time: data.reservation_time.toISOString()
    };

    post('/restaurant/reservations', reservationData, {
      onSuccess: () => {
        Swal.fire({
          title: "Success!",
          text: "Reservation created successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        reset();
        setSelectedCustomer(null);
        setSelectedTable(null);
      },
      onError: (errors) => {
        const errorMessage = errors.message || "Failed to create reservation.";
        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
        });
      },
    });
  };

  const handleCancel = () => {
    router.get('/restaurant/reservations');
  };

  const handlePartySizeChange = (partySize) => {
    setData('party_size', partySize);
    
    // Check if selected table can accommodate the party size
    if (selectedTable && partySize > selectedTable.capacity) {
      Swal.fire({
        title: "Warning!",
        text: `Party size (${partySize}) exceeds selected table capacity (${selectedTable.capacity}). Please select a larger table.`,
        icon: "warning",
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthenticatedLayout>
        <Head title="Create Restaurant Reservation" />
        
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Create Restaurant Reservation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Add a new table reservation with customer and booking details
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Reservation Details */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Reservation Details
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Table</InputLabel>
                        <Select
                          value={data.table_id}
                          label="Table"
                          onChange={(e) => handleTableChange(e.target.value)}
                        >
                          {tables && tables.map((table) => (
                            <MenuItem key={table.id} value={table.id}>
                              {table.name || `Table ${table.table_number}`} 
                              {table.section && ` - ${table.section.name}`} 
                              (Capacity: {table.capacity})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {selectedTable && (
                        <Box mt={1}>
                          <Chip
                            label={`Capacity: ${selectedTable.capacity} guests`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Party Size"
                        type="number"
                        value={data.party_size}
                        onChange={(e) => handlePartySizeChange(parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1, max: 50 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Reservation Date"
                        value={data.reservation_date}
                        onChange={(newValue) => setData('reservation_date', newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                        minDate={new Date()}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box display="flex" gap={1}>
                        <TimePicker
                          label="Reservation Time"
                          value={data.reservation_time}
                          onChange={(newValue) => setData('reservation_time', newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleCheckAvailability}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Check Availability
                        </Button>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Duration (minutes)"
                        type="number"
                        value={data.duration_minutes}
                        onChange={(e) => setData('duration_minutes', e.target.value)}
                        inputProps={{ min: 15, max: 480 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TimeIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Deposit Amount"
                        type="number"
                        value={data.deposit_amount}
                        onChange={(e) => setData('deposit_amount', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MoneyIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Special Requests"
                        multiline
                        rows={3}
                        value={data.special_requests}
                        onChange={(e) => setData('special_requests', e.target.value)}
                        placeholder="Any special dietary requirements, seating preferences, etc."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={2}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder="Internal notes about this reservation"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Customer Information */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Customer Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box mb={2}>
                    <TextField
                      fullWidth
                      placeholder="Search customers..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      startIcon={<SearchIcon />}
                      onClick={handleCustomerSearch}
                      sx={{ mt: 1 }}
                      fullWidth
                    >
                      Search Customer
                    </Button>
                  </Box>

                  {selectedCustomer && (
                    <Box mt={2} p={2} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedCustomer.name}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {selectedCustomer.phone}
                        </Typography>
                      </Box>
                      {selectedCustomer.email && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {selectedCustomer.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={data.customer_name}
                    onChange={(e) => setData('customer_name', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Customer Phone"
                    value={data.customer_phone}
                    onChange={(e) => setData('customer_phone', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Deposit Status</InputLabel>
                    <Select
                      value={data.deposit_paid}
                      label="Deposit Status"
                      onChange={(e) => setData('deposit_paid', e.target.value)}
                    >
                      <MenuItem value={false}>Not Paid</MenuItem>
                      <MenuItem value={true}>Paid</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>

                {/* Actions */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Actions
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      fullWidth
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={processing}
                      fullWidth
                    >
                      Create Reservation
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </form>

          {/* Customer Search Dialog */}
          <Dialog open={customerDialogOpen} onClose={() => setCustomerDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogContent>
              <List>
                {customers && customers.map((customer) => (
                  <ListItem key={customer.id}>
                    <ListItemButton onClick={() => handleSelectCustomer(customer)}>
                      <ListItemText
                        primary={customer.name}
                        secondary={customer.phone}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
            </DialogActions>
          </Dialog>

          {/* Time Slots Dialog */}
          <Dialog open={timeSlotsDialogOpen} onClose={() => setTimeSlotsDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Available Time Slots</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                {availableTimeSlots.map((slot, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: slot.available ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.error.main}`,
                        bgcolor: slot.available ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.error.main, 0.05),
                        '&:hover': {
                          bgcolor: slot.available ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1)
                        }
                      }}
                      onClick={() => handleSelectTimeSlot(slot)}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="medium">
                          {slot.start_time} - {slot.end_time}
                        </Typography>
                        <Chip
                          label={slot.available ? 'Available' : 'Booked'}
                          color={slot.available ? 'success' : 'error'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTimeSlotsDialogOpen(false)}>Cancel</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </AuthenticatedLayout>
    </LocalizationProvider>
  );
};

export default ReservationsCreate;