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
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as OrderIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import CustomPagination from '@/Components/CustomPagination';

const OrdersIndex = ({ orders, pageLabel, filters }) => {
  const theme = useTheme();
  const [dataOrders, setDataOrders] = useState(orders);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerms, setSearchTerms] = useState({
    per_page: 100,
    search: filters?.search || '',
    status: filters?.status || '',
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
  });

  const orderColumns = [
    {
      field: 'order_number',
      headerName: 'Order #',
      width: 120,
      renderCell: (params) => (
        <button
          onClick={() => handleViewClick(params.row)}
          className="text-blue-600 hover:underline font-semibold bg-none border-none cursor-pointer p-0"
        >
          #{params.value}
        </button>
      ),
    },
    {
      field: 'table_name',
      headerName: 'Table',
      width: 120,
      renderCell: (params) => params.value || 'Takeaway',
    },
    {
      field: 'waiter_name',
      headerName: 'Waiter',
      width: 150,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 150,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary.main">
          ${parseFloat(params.value || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value;
        let color = 'default';
        
        if (status === 'completed') {
          color = 'success';
        } else if (status === 'preparing') {
          color = 'warning';
        } else if (status === 'pending') {
          color = 'info';
        } else if (status === 'cancelled') {
          color = 'error';
        }
        
        return (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={color}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'created_at',
      headerName: 'Time',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleTimeString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
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
            onClick={() => handleReceiptClick(params.row)}
            title="Receipt"
          >
            <ReceiptIcon fontSize="small" />
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
    router.get('/restaurant/orders/create');
  };

  const handleViewClick = (order) => {
    router.get(`/restaurant/orders/${order.id}`);
  };

  const handleEditClick = (order) => {
    router.get(`/restaurant/orders/${order.id}/edit`);
  };

  const handleReceiptClick = (order) => {
    window.open(`/restaurant/orders/${order.id}/receipt`, '_blank');
  };

  const handleDeleteClick = (id) => {
    setSelectedOrderId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    router.delete(`/restaurant/orders/${selectedOrderId}`, {
      onSuccess: () => {
        Swal.fire({
          title: "Deleted!",
          text: "Order has been deleted successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        refreshOrders();
      },
      onError: (errors) => {
        const errorMessage = errors.message || "Failed to delete order.";
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
    router.get('/restaurant/orders', searchTerms, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (response) => {
        setDataOrders(response.props.orders);
      },
    });
  };

  const refreshOrders = () => {
    router.reload({
      only: ["orders"],
    });
  };

  useEffect(() => {
    setDataOrders(orders);
  }, [orders]);

  const processedOrders = dataOrders?.data?.map((order) => ({
    id: order.id,
    ...order,
  })) || [];

  const OrderStatusCard = ({ title, count, color, icon: Icon }) => (
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

  const totalOrders = dataOrders?.total || 0;
  const pendingOrders = dataOrders?.data?.filter(o => o.status === 'pending').length || 0;
  const preparingOrders = dataOrders?.data?.filter(o => o.status === 'preparing').length || 0;
  const completedOrders = dataOrders?.data?.filter(o => o.status === 'completed').length || 0;
  const totalRevenue = dataOrders?.data?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;

  return (
    <AuthenticatedLayout>
      <Head title="Restaurant Orders" />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Restaurant Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track restaurant orders
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2.4}>
            <OrderStatusCard
              title="Total Orders"
              count={totalOrders}
              color={theme.palette.primary.main}
              icon={OrderIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <OrderStatusCard
              title="Pending"
              count={pendingOrders}
              color={theme.palette.info.main}
              icon={TimeIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <OrderStatusCard
              title="Preparing"
              count={preparingOrders}
              color={theme.palette.warning.main}
              icon={TimeIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <OrderStatusCard
              title="Completed"
              count={completedOrders}
              color={theme.palette.success.main}
              icon={TimeIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <OrderStatusCard
              title="Revenue"
              count={`$${totalRevenue.toFixed(2)}`}
              color={theme.palette.success.main}
              icon={MoneyIcon}
            />
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search orders..."
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
              <option value="preparing">Preparing</option>
              <option value="completed">Completed</option>
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
              New Order
            </Button>
          </Grid>
        </Grid>

        {/* Orders Table */}
        <Paper sx={{ height: 'calc(100vh - 450px)', display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flexGrow: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Order #</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Table</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Waiter</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedOrders.length > 0 ? (
                  processedOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <button
                          onClick={() => handleViewClick(order)}
                          className="text-blue-600 hover:underline font-semibold bg-none border-none cursor-pointer p-0"
                        >
                          #{order.order_number}
                        </button>
                      </TableCell>
                      <TableCell>{order.table_name || 'Takeaway'}</TableCell>
                      <TableCell>{order.waiter_name || '-'}</TableCell>
                      <TableCell>{order.customer_name || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          ${parseFloat(order.total || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = order.status;
                          let color = 'default';
                          
                          if (status === 'completed') {
                            color = 'success';
                          } else if (status === 'preparing') {
                            color = 'warning';
                          } else if (status === 'pending') {
                            color = 'info';
                          } else if (status === 'cancelled') {
                            color = 'error';
                          }
                          
                          return (
                            <Chip
                              label={status.charAt(0).toUpperCase() + status.slice(1)}
                              color={color}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleViewClick(order)}
                            title="View"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(order)}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleReceiptClick(order)}
                            title="Receipt"
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(order.id)}
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
                        No orders found
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
                only: ["orders"],
                onSuccess: (response) => {
                  setDataOrders(response.props.orders);
                },
              });
            }}
            setSearchTerms={setSearchTerms}
            searchTerms={searchTerms}
            data={dataOrders}
          />
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Order?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this order? This action cannot be undone.
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

export default OrdersIndex;