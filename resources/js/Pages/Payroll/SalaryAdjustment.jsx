import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncreaseIcon,
  TrendingDown as DecreaseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import numeral from 'numeral';
import dayjs from 'dayjs';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: theme.palette.background.paperGradient,
  boxShadow: theme.palette.shadows[2],
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const SalaryAdjustment = ({ employees = [], adjustments = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'increase',
    amount: '',
    reason: '',
    effective_date: dayjs().format('YYYY-MM-DD'),
    is_permanent: true,
    adjustment_type: 'salary'
  });

  // Sample data if not provided
  const employeeData = employees.length > 0 ? employees : [
    {
      id: 1,
      name: 'John Doe',
      role: 'Chef',
      current_salary: 3500,
      salary_frequency: 'Monthly',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      role: 'Waitress',
      current_salary: 2800,
      salary_frequency: 'Monthly',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      role: 'Kitchen Staff',
      current_salary: 2500,
      salary_frequency: 'Monthly',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      role: 'Manager',
      current_salary: 4200,
      salary_frequency: 'Monthly',
      status: 'Active'
    }
  ];

  const adjustmentHistory = adjustments.length > 0 ? adjustments : [
    {
      id: 1,
      employee_name: 'John Doe',
      employee_role: 'Chef',
      type: 'increase',
      amount: 500,
      reason: 'Performance bonus',
      effective_date: '2024-12-01',
      is_permanent: true,
      adjustment_type: 'salary',
      created_at: '2024-11-28'
    },
    {
      id: 2,
      employee_name: 'Jane Smith',
      employee_role: 'Waitress',
      type: 'increase',
      amount: 200,
      reason: 'Overtime compensation',
      effective_date: '2024-12-01',
      is_permanent: false,
      adjustment_type: 'bonus',
      created_at: '2024-11-25'
    },
    {
      id: 3,
      employee_name: 'Mike Johnson',
      employee_role: 'Kitchen Staff',
      type: 'decrease',
      amount: 150,
      reason: 'Advance deduction',
      effective_date: '2024-12-01',
      is_permanent: false,
      adjustment_type: 'deduction',
      created_at: '2024-11-20'
    }
  ];

  const handleAddAdjustment = () => {
    if (!selectedEmployee) {
      return;
    }
    
    const employee = employeeData.find(emp => emp.id === parseInt(selectedEmployee));
    if (employee) {
      setAdjustmentData({
        ...adjustmentData,
        employee_id: employee.id,
        employee_name: employee.name,
        current_salary: employee.current_salary
      });
      setAdjustmentDialogOpen(true);
    }
  };

  const handleEditAdjustment = (adjustment) => {
    setEditingAdjustment(adjustment);
    setAdjustmentData({
      type: adjustment.type,
      amount: Math.abs(adjustment.amount),
      reason: adjustment.reason,
      effective_date: adjustment.effective_date,
      is_permanent: adjustment.is_permanent,
      adjustment_type: adjustment.adjustment_type
    });
    setAdjustmentDialogOpen(true);
  };

  const handleSaveAdjustment = () => {
    const payload = {
      ...adjustmentData,
      amount: adjustmentData.type === 'decrease' ? -Math.abs(adjustmentData.amount) : Math.abs(adjustmentData.amount)
    };

    if (editingAdjustment) {
      // Update existing adjustment
      router.put(`/salary-adjustments/${editingAdjustment.id}`, payload, {
        onSuccess: () => {
          setAdjustmentDialogOpen(false);
          setEditingAdjustment(null);
          resetForm();
        }
      });
    } else {
      // Create new adjustment
      router.post('/salary-adjustments', payload, {
        onSuccess: () => {
          setAdjustmentDialogOpen(false);
          resetForm();
        }
      });
    }
  };

  const handleDeleteAdjustment = (adjustmentId) => {
    if (confirm('Are you sure you want to delete this adjustment?')) {
      router.delete(`/salary-adjustments/${adjustmentId}`, {
        onSuccess: () => {
          // Refresh the page or update state
        }
      });
    }
  };

  const resetForm = () => {
    setAdjustmentData({
      type: 'increase',
      amount: '',
      reason: '',
      effective_date: dayjs().format('YYYY-MM-DD'),
      is_permanent: true,
      adjustment_type: 'salary'
    });
    setSelectedEmployee('');
    setEditingAdjustment(null);
  };

  const calculateNewSalary = (currentSalary, type, amount, isPermanent) => {
    if (!isPermanent || type === 'bonus' || type === 'deduction') {
      return currentSalary; // No permanent change
    }
    
    return type === 'increase' ? currentSalary + amount : currentSalary - amount;
  };

  const getAdjustmentTypeColor = (type) => {
    switch (type) {
      case 'increase': return 'success';
      case 'decrease': return 'error';
      case 'bonus': return 'primary';
      case 'deduction': return 'warning';
      default: return 'default';
    }
  };

  const getAdjustmentTypeIcon = (type) => {
    switch (type) {
      case 'increase': return <IncreaseIcon color="success" />;
      case 'decrease': return <DecreaseIcon color="error" />;
      case 'bonus': return <AddIcon color="primary" />;
      case 'deduction': return <DeleteIcon color="warning" />;
      default: return <CalculateIcon />;
    }
  };

  const adjustmentStats = {
    totalIncreases: adjustmentHistory.filter(adj => adj.type === 'increase').length,
    totalDecreases: adjustmentHistory.filter(adj => adj.type === 'decrease').length,
    totalBonuses: adjustmentHistory.filter(adj => adj.adjustment_type === 'bonus').length,
    thisMonth: adjustmentHistory.filter(adj => 
      dayjs(adj.effective_date).isSame(dayjs(), 'month')
    ).length
  };

  return (
    <AuthenticatedLayout>
      <Head title="Salary Adjustments" />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>
          Salary Adjustments
        </Typography>
        
        <Grid container spacing={3}>
          {/* Adjustment Form */}
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add Adjustment
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Employee</InputLabel>
                    <Select
                      value={selectedEmployee}
                      label="Select Employee"
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      {employeeData.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.role} ({numeral(employee.current_salary).format('0,0.00')})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddAdjustment}
                    disabled={!selectedEmployee}
                    fullWidth
                  >
                    Add Adjustment
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={8}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Adjustment Statistics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {adjustmentStats.totalIncreases}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Increases
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main" fontWeight="bold">
                        {adjustmentStats.totalDecreases}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Decreases
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {adjustmentStats.totalBonuses}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bonuses
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {adjustmentStats.thisMonth}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This Month
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>

      {/* Adjustment History */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Adjustment History
            </Typography>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => router.visit('/payroll/adjustments/history')}
            >
              View Full History
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Effective Date</TableCell>
                  <TableCell>Permanent</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adjustmentHistory.map((adjustment) => {
                  const employee = employeeData.find(emp => emp.name === adjustment.employee_name);
                  const newSalary = employee ? 
                    calculateNewSalary(
                      employee.current_salary,
                      adjustment.type,
                      Math.abs(adjustment.amount),
                      adjustment.is_permanent
                    ) : null;
                  
                  return (
                    <TableRow key={adjustment.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {adjustment.employee_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {adjustment.employee_role}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getAdjustmentTypeIcon(adjustment.adjustment_type)}
                          <Chip
                            label={adjustment.adjustment_type}
                            color={getAdjustmentTypeColor(adjustment.adjustment_type)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" 
                          color={adjustment.type === 'increase' ? 'success.main' : 'error.main'}>
                          {adjustment.type === 'increase' ? '+' : '-'}
                          {numeral(Math.abs(adjustment.amount)).format('0,0.00')}
                        </Typography>
                        {newSalary && adjustment.is_permanent && (
                          <Typography variant="caption" color="text.secondary">
                            New: {numeral(newSalary).format('0,0.00')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {adjustment.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(adjustment.effective_date).format('MMM DD, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={adjustment.is_permanent ? 'Yes' : 'No'}
                          color={adjustment.is_permanent ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEditAdjustment(adjustment)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteAdjustment(adjustment.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {adjustmentHistory.length === 0 && (
            <Box textAlign="center" py={4}>
              <CalculateIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No salary adjustments found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add your first salary adjustment to get started
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog 
        open={adjustmentDialogOpen} 
        onClose={() => setAdjustmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingAdjustment ? 'Edit Adjustment' : 'Add Salary Adjustment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={adjustmentData.adjustment_type}
                label="Adjustment Type"
                onChange={(e) => setAdjustmentData({...adjustmentData, adjustment_type: e.target.value})}
              >
                <MenuItem value="salary">Salary Adjustment</MenuItem>
                <MenuItem value="bonus">Bonus</MenuItem>
                <MenuItem value="deduction">Deduction</MenuItem>
                <MenuItem value="allowance">Allowance</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Change Type</InputLabel>
              <Select
                value={adjustmentData.type}
                label="Change Type"
                onChange={(e) => setAdjustmentData({...adjustmentData, type: e.target.value})}
              >
                <MenuItem value="increase">Increase</MenuItem>
                <MenuItem value="decrease">Decrease</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={adjustmentData.amount}
              onChange={(e) => setAdjustmentData({...adjustmentData, amount: e.target.value})}
              InputProps={{
                startAdornment: '$'
              }}
            />
            
            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={3}
              value={adjustmentData.reason}
              onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
              placeholder="Enter reason for adjustment..."
            />
            
            <TextField
              fullWidth
              label="Effective Date"
              type="date"
              value={adjustmentData.effective_date}
              onChange={(e) => setAdjustmentData({...adjustmentData, effective_date: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            
            {adjustmentData.adjustment_type === 'salary' && (
              <Alert severity="info">
                <Typography variant="body2">
                  {adjustmentData.is_permanent ? 
                    'This will permanently change the employee\'s base salary.' :
                    'This is a temporary adjustment and will not affect the base salary.'}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAdjustmentDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveAdjustment}
            disabled={!adjustmentData.amount || !adjustmentData.reason}
            startIcon={<SaveIcon />}
          >
            {editingAdjustment ? 'Update' : 'Save'} Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </AuthenticatedLayout>
  );
};

export default SalaryAdjustment;