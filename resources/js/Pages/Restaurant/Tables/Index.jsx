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
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableRestaurant as TableIcon,
  CheckCircle as AvailableIcon,
  RadioButtonUnchecked as OccupiedIcon,
  Block as ReservedIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import CustomPagination from '@/Components/CustomPagination';

const TablesIndex = ({ tables, tableSections, pageLabel }) => {
  const theme = useTheme();
  const [dataTables, setDataTables] = useState(tables);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [searchTerms, setSearchTerms] = useState({
    per_page: 100,
  });

  const tableColumns = [
    {
      field: 'table_number',
      headerName: 'Table Number',
      width: 150,
      renderCell: (params) => (
        <button
          onClick={() => handleEditClick(params.row)}
          className="text-blue-600 hover:underline font-semibold bg-none border-none cursor-pointer p-0"
        >
          {params.value}
        </button>
      ),
    },
    {
      field: 'name',
      headerName: 'Table Name',
      width: 200,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'section_name',
      headerName: 'Section',
      width: 150,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'capacity',
      headerName: 'Capacity',
      width: 100,
      renderCell: (params) => `${params.value} seats`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value;
        let color = 'default';
        let icon = <AvailableIcon />;
        
        if (status === 'available') {
          color = 'success';
          icon = <AvailableIcon />;
        } else if (status === 'occupied') {
          color = 'warning';
          icon = <OccupiedIcon />;
        } else if (status === 'reserved') {
          color = 'info';
          icon = <ReservedIcon />;
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
    router.get('/restaurant/tables/create');
  };

  const handleEditClick = (table) => {
    router.get(`/tables/${table.id}/edit`);
  };

  const handleDeleteClick = (id) => {
    setSelectedTableId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    router.delete(`/tables/${selectedTableId}`, {
      onSuccess: () => {
        Swal.fire({
          title: "Deleted!",
          text: "Table has been deleted successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        refreshTables();
      },
      onError: (errors) => {
        const errorMessage = errors.message || "Failed to delete table.";
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

  const refreshTables = () => {
    router.reload({
      only: ["tables"],
    });
  };

  useEffect(() => {
    setDataTables(tables);
  }, [tables]);

  const processedTables = dataTables?.data?.map((table) => ({
    id: table.id,
    ...table,
  })) || [];

  const TableStatusCard = ({ title, count, color, icon: Icon }) => (
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

  const totalTables = dataTables?.total || 0;
  const availableTables = dataTables?.data?.filter(t => t.status === 'available').length || 0;
  const occupiedTables = dataTables?.data?.filter(t => t.status === 'occupied').length || 0;
  const reservedTables = dataTables?.data?.filter(t => t.status === 'reserved').length || 0;

  return (
    <AuthenticatedLayout>
      <Head title="Restaurant Tables" />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Restaurant Tables
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage restaurant tables and their status
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <TableStatusCard
              title="Total Tables"
              count={totalTables}
              color={theme.palette.primary.main}
              icon={TableIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TableStatusCard
              title="Available"
              count={availableTables}
              color={theme.palette.success.main}
              icon={AvailableIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TableStatusCard
              title="Occupied"
              count={occupiedTables}
              color={theme.palette.warning.main}
              icon={OccupiedIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TableStatusCard
              title="Reserved"
              count={reservedTables}
              color={theme.palette.info.main}
              icon={ReservedIcon}
            />
          </Grid>
        </Grid>

        {/* Action Button */}
        <Grid container spacing={2} alignItems="center" sx={{ width: "100%" }} justifyContent={"end"} size={12}>
          <Grid size={{ xs: 12, sm: "auto" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Add Table
            </Button>
          </Grid>
        </Grid>

        {/* Tables Table */}
        <Box
          className="py-6 w-full"
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            height: "calc(100vh - 400px)",
          }}
        >
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Table Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Table Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedTables.length > 0 ? (
                    processedTables.map((table) => (
                      <TableRow key={table.id} hover>
                        <TableCell>
                          <button
                            onClick={() => handleEditClick(table)}
                            className="text-blue-600 hover:underline font-semibold bg-none border-none cursor-pointer p-0"
                          >
                            {table.table_number}
                          </button>
                        </TableCell>
                        <TableCell>{table.name || '-'}</TableCell>
                        <TableCell>{table.section_name || '-'}</TableCell>
                        <TableCell>{table.capacity} seats</TableCell>
                        <TableCell>
                          {(() => {
                            const status = table.status;
                            let color = 'default';
                            let icon = <AvailableIcon />;
                            
                            if (status === 'available') {
                              color = 'success';
                              icon = <AvailableIcon />;
                            } else if (status === 'occupied') {
                              color = 'warning';
                              icon = <OccupiedIcon />;
                            } else if (status === 'reserved') {
                              color = 'info';
                              icon = <ReservedIcon />;
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
                              onClick={() => handleEditClick(table)}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(table.id)}
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
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No tables found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Pagination */}
        <Grid size={12} container justifyContent={"end"} spacing={2} alignItems={"center"}>
          <CustomPagination
            refreshTable={(url) => {
              router.get(url, searchTerms, {
                preserveState: true,
                preserveScroll: true,
                only: ["tables"],
                onSuccess: (response) => {
                  setDataTables(response.props.tables);
                },
              });
            }}
            setSearchTerms={setSearchTerms}
            searchTerms={searchTerms}
            data={dataTables}
          />
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Table?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this table? This action cannot be undone.
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

export default TablesIndex;