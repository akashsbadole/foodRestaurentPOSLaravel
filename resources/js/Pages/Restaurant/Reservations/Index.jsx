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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  EventSeat as ReservationIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  CheckCircle as ConfirmedIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import CustomPagination from '@/Components/CustomPagination';

const ReservationsIndex = ({ reservations, pageLabel, filters }) => {
  const theme = useTheme();
  const [dataReservations, setDataReservations] = useState(reservations);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [searchTerms, setSearchTerms] = useState({
    per_page: 100,
    search: filters?.search || '',
    status: filters?.status || '',
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
  });

  const reservationColumns = [
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <button
            onClick={() => handleViewClick(params.row)}
            className="text-blue-600 hover:underline font-semibold bg-none border-none cursor-pointer p-0 text-left"
          >
            {params.value}
          </button>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'guest_count',
      headerName: 'Guests',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={`${params.value} guests`}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: 'table_name',
      headerName: 'Table',
      width: 100,
      renderCell: (params) => params.value || 'Not assigned',
    },
    {
      field: 'reservation_time',
      headerName: 'Date & Time',
      width: 180,
      renderCell: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value;
        let color = 'default';
        let icon = <PendingIcon />;
        
        if (status === 'confirmed') {
          color = 'success';
          icon = <ConfirmedIcon />;
        } else if (status === 'pending') {
          color = 'warning';
          icon = <PendingIcon />;
        } else if (status === 'cancelled') {
          color = 'error';
          icon = <CancelledIcon />;
        }
        
        return (
          <Chip
            icon={icon}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={color}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleViewClick(params.row)}
            title="View"
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditClick(params.row)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row.id)}
            title="Delete"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleCreateClick = () => {
    router.get('/restaurant/reservations/create');
  };

  const handleViewClick = (reservation) => {
    router.get(`/restaurant/reservations/${reservation.id}`);
  };

  const handleEditClick = (reservation) => {
    router.get(`/restaurant/reservations/${reservation.id}/edit`);
  };

  const handleDeleteClick = (id) => {
    setSelectedReservationId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    router.delete(`/restaurant/reservations/${selectedReservationId}`, {
      onSuccess: () => {
        Swal.fire({
          title: "Deleted!",
          text: "Reservation has been deleted successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        refreshReservations();
      },
      onError: (errors) => {
        const errorMessage = errors.message || "Failed to delete reservation.";
        Swal.fire({
          title: "Cannot Delete!",
          text: errorMessage,
          icon: "warning",
        });
      },
    });
    setOpenDeleteDialog(false);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
  };

  const handleSearchChange = (field) => (event) => {
    setSearchTerms(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSearchSubmit = () => {
    router.get('/restaurant/reservations', searchTerms, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (response) => {
        setDataReservations(response.props.reservations);
      },
    });
  };

  const refreshReservations = () => {
    router.reload({
      only: ["reservations"],
    });
  };

  useEffect(() => {
    setDataReservations(reservations);
  }, [reservations]);

  const processedReservations = dataReservations?.data?.map((reservation) => ({
    id: reservation.id,
    ...reservation,
  })) || [];

  const ReservationStatusCard = ({ title, count, color, icon: Icon }) => (
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
              {count}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: alpha(color, 0.2),
              color: color,
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon fontSize="large" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const totalReservations = dataReservations?.total || 0;
  const confirmedReservations = dataReservations?.data?.filter(r => r.status === 'confirmed').length || 0;
  const pendingReservations = dataReservations?.data?.filter(r => r.status === 'pending').length || 0;
  const cancelledReservations = dataReservations?.data?.filter(r => r.status === 'cancelled').length || 0;
  const todayReservations = dataReservations?.data?.filter(r => {
    const reservationDate = new Date(r.reservation_time).toDateString();
    const today = new Date().toDateString();
    return reservationDate === today;
  }).length || 0;

  return (
    <AuthenticatedLayout>
      <Head title="Restaurant Reservations" />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Restaurant Reservations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage table reservations and booking requests
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2.4}>
            <ReservationStatusCard
              title="Total Reservations"
              count={totalReservations}
              color={theme.palette.primary.main}
              icon={ReservationIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <ReservationStatusCard
              title="Today"
              count={todayReservations}
              color={theme.palette.info.main}
              icon={TimeIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <ReservationStatusCard
              title="Confirmed"
              count={confirmedReservations}
              color={theme.palette.success.main}
              icon={ConfirmedIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <ReservationStatusCard
              title="Pending"
              count={pendingReservations}
              color={theme.palette.warning.main}
              icon={PendingIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <ReservationStatusCard
              title="Cancelled"
              count={cancelledReservations}
              color={theme.palette.error.main}
              icon={CancelledIcon}
            />
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search reservations..."
              value={searchTerms.search}
              onChange={handleSearchChange('search')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Status"
              value={searchTerms.status}
              onChange={handleSearchChange('status')}
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="From"
              value={searchTerms.date_from}
              onChange={handleSearchChange('date_from')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="To"
              value={searchTerms.date_to}
              onChange={handleSearchChange('date_to')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              variant="contained"
              onClick={handleSearchSubmit}
              fullWidth
            >
              Filter
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              fullWidth
            >
              New Reservation
            </Button>
          </Grid>
        </Grid>

        {/* Reservations Table */}
        <Paper sx={{ height: 'calc(100vh - 450px)', display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flexGrow: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Guests</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Table</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedReservations.length > 0 ? (
                  processedReservations.map((reservation) => (
                    <TableRow key={reservation.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <button
                            onClick={() => handleViewClick(reservation)}
                            className="text-blue-600 hover:underline font-semibold bg-none border-none cursor-pointer p-0 text-left"
                          >
                            {reservation.customer_name}
                          </button>
                        </Box>
                      </TableCell>
                      <TableCell>{reservation.phone || '-'}</TableCell>
                      <TableCell>{reservation.email || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${reservation.guest_count} guests`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{reservation.table_name || 'Not assigned'}</TableCell>
                      <TableCell>{new Date(reservation.reservation_time).toLocaleString()}</TableCell>
                      <TableCell>
                        {(() => {
                          const status = reservation.status;
                          let color = 'default';
                          let icon = <PendingIcon />;
                          
                          if (status === 'confirmed') {
                            color = 'success';
                            icon = <ConfirmedIcon />;
                          } else if (status === 'pending') {
                            color = 'warning';
                            icon = <PendingIcon />;
                          } else if (status === 'cancelled') {
                            color = 'error';
                            icon = <CancelledIcon />;
                          }
                          
                          return (
                            <Chip
                              icon={icon}
                              label={status.charAt(0).toUpperCase() + status.slice(1)}
                              color={color}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleViewClick(reservation)}
                            title="View"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(reservation)}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(reservation.id)}
                            title="Delete"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No reservations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pagination */}
        <Grid container justifyContent={"end"} spacing={2} alignItems={"center"} sx={{ mt: 2 }}>
          <CustomPagination
            refreshTable={(url) => {
              router.get(url, searchTerms, {
                preserveState: true,
                preserveScroll: true,
                only: ["reservations"],
                onSuccess: (response) => {
                  setDataReservations(response.props.reservations);
                },
              });
            }}
            setSearchTerms={setSearchTerms}
            searchTerms={searchTerms}
            data={dataReservations}
          />
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Reservation?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this reservation? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AuthenticatedLayout>
  );
};

export default ReservationsIndex;