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
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import numeral from 'numeral';
import dayjs from 'dayjs';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: theme.palette.background.paperGradient,
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const SalaryPayment = ({ employees = [], stores = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [paymentData, setPaymentData] = useState({
    payment_date: dayjs().format('YYYY-MM-DD'),
    payment_method: 'Bank Transfer',
    store_id: stores[0]?.id || '',
    remarks: '',
    adjust_balance: true
  });
  const [calculatedSalaries, setCalculatedSalaries] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Sample data if not provided
  const employeeData = employees.length > 0 ? employees : [
    {
      id: 1,
      name: 'John Doe',
      role: 'Chef',
      salary: 3500,
      salary_frequency: 'Monthly',
      balance: 0,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      role: 'Waitress',
      salary: 2800,
      salary_frequency: 'Monthly',
      balance: 500,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      role: 'Kitchen Staff',
      salary: 2500,
      salary_frequency: 'Monthly',
      balance: -200,
      status: 'Active'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      role: 'Manager',
      salary: 4200,
      salary_frequency: 'Monthly',
      balance: 0,
      status: 'Active'
    },
    {
      id: 5,
      name: 'Tom Brown',
      role: 'Cleaner',
      salary: 1800,
      salary_frequency: 'Monthly',
      balance: 150,
      status: 'Active'
    }
  ];

  const calculateSalary = (employee) => {
    const baseSalary = employee.salary || 0;
    const allowances = 0; // Could be calculated based on hours, bonuses, etc.
    const deductions = 0; // Could be calculated based on taxes, advances, etc.
    const grossSalary = baseSalary + allowances;
    const netSalary = grossSalary - deductions;

    return {
      basic_salary: baseSalary,
      allowances: allowances,
      deductions: deductions,
      gross_salary: grossSalary,
      net_salary: netSalary
    };
  };

  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.includes(employeeId);
      if (isSelected) {
        return prev.filter(id => id !== employeeId);
      } else {
        const employee = employeeData.find(emp => emp.id === employeeId);
        if (employee) {
          const calculated = calculateSalary(employee);
          setCalculatedSalaries(prev => ({
            ...prev,
            [employeeId]: calculated
          }));
        }
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allEmployeeIds = employeeData.map(emp => emp.id);
      setSelectedEmployees(allEmployeeIds);
      
      // Calculate salaries for all employees
      const allCalculations = {};
      employeeData.forEach(employee => {
        allCalculations[employee.id] = calculateSalary(employee);
      });
      setCalculatedSalaries(allCalculations);
    } else {
      setSelectedEmployees([]);
      setCalculatedSalaries({});
    }
  };

  const updateEmployeeCalculation = (employeeId, field, value) => {
    setCalculatedSalaries(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const recalculateNetSalary = (employeeId) => {
    const current = calculatedSalaries[employeeId];
    if (current) {
      const grossSalary = current.basic_salary + current.allowances;
      const netSalary = grossSalary - current.deductions;
      
      setCalculatedSalaries(prev => ({
        ...prev,
        [employeeId]: {
          ...current,
          gross_salary: grossSalary,
          net_salary: netSalary
        }
      }));
    }
  };

  const getTotalPaymentAmount = () => {
    return selectedEmployees.reduce((total, employeeId) => {
      const calculation = calculatedSalaries[employeeId];
      return total + (calculation?.net_salary || 0);
    }, 0);
  };

  const handleProcessPayment = () => {
    if (selectedEmployees.length === 0) {
      return;
    }
    setConfirmDialogOpen(true);
  };

  const confirmPayment = async () => {
    setProcessingPayment(true);
    
    try {
      const paymentPromises = selectedEmployees.map(employeeId => {
        const employee = employeeData.find(emp => emp.id === employeeId);
        const calculation = calculatedSalaries[employeeId];
        
        return axios.post('/salary-records', {
          employee_id: employeeId,
          salary_date: paymentData.payment_date,
          basic_salary: calculation.basic_salary,
          allowances: calculation.allowances,
          deductions: calculation.deductions,
          gross_salary: calculation.gross_salary,
          net_salary: calculation.net_salary,
          salary_from: paymentData.payment_method,
          store_id: paymentData.store_id,
          adjusts_balance: paymentData.adjust_balance,
          remarks: paymentData.remarks
        });
      });

      await Promise.all(paymentPromises);
      
      setConfirmDialogOpen(false);
      setSelectedEmployees([]);
      setCalculatedSalaries({});
      
      // Show success message
      Swal.fire({
        title: 'Success!',
        text: `Successfully processed ${selectedEmployees.length} salary payments`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        router.visit('/payroll');
      });
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to process salary payments. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Process Salary Payments" />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>
          Process Salary Payments
        </Typography>
        
        <Grid container spacing={3}>
          {/* Payment Settings */}
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Settings
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Payment Date"
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentData.payment_method}
                      label="Payment Method"
                      onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                    >
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Cash Drawer">Cash Drawer</MenuItem>
                      <MenuItem value="Check">Check</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Store</InputLabel>
                    <Select
                      value={paymentData.store_id}
                      label="Store"
                      onChange={(e) => setPaymentData({...paymentData, store_id: e.target.value})}
                    >
                      {stores.map(store => (
                        <MenuItem key={store.id} value={store.id}>
                          {store.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={3}
                    value={paymentData.remarks}
                    onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
                    placeholder="Optional payment notes..."
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={paymentData.adjust_balance}
                      onChange={(e) => setPaymentData({...paymentData, adjust_balance: e.target.checked})}
                    />
                    <Typography variant="body2">
                      Adjust employee balance
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Summary Card */}
          <Grid item xs={12} md={8}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {employeeData.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Employees
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {selectedEmployees.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Selected
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {employeeData.filter(emp => emp.balance > 0).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Have Balance
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {numeral(getTotalPaymentAmount()).format('0,0')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="text.primary">
                    Total Payment: {numeral(getTotalPaymentAmount()).format('0,0.00')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PaymentIcon />}
                    onClick={handleProcessPayment}
                    disabled={selectedEmployees.length === 0 || processingPayment}
                    size="large"
                  >
                    Process Payment
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>

      {/* Employee Selection Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Select Employees for Payment
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Checkbox
                checked={selectedEmployees.length === employeeData.length}
                indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employeeData.length}
                onChange={handleSelectAll}
              />
              <Typography variant="body2">
                Select All ({selectedEmployees.length} selected)
              </Typography>
            </Box>
          </Box>

          {selectedEmployees.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedEmployees.length} employee(s) selected for payment. Total amount: {numeral(getTotalPaymentAmount()).format('0,0.00')}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedEmployees.length === employeeData.length}
                      indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employeeData.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Basic Salary</TableCell>
                  <TableCell align="right">Allowances</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Gross Salary</TableCell>
                  <TableCell align="right">Net Salary</TableCell>
                  <TableCell>Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeData.map((employee) => {
                  const isSelected = selectedEmployees.includes(employee.id);
                  const calculation = calculatedSalaries[employee.id];
                  
                  return (
                    <TableRow 
                      key={employee.id}
                      hover
                      selected={isSelected}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.action.selected,
                        }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleEmployeeSelection(employee.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {employee.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.role}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {isSelected ? (
                          <TextField
                            type="number"
                            size="small"
                            value={calculation?.basic_salary || 0}
                            onChange={(e) => {
                              updateEmployeeCalculation(employee.id, 'basic_salary', e.target.value);
                              recalculateNetSalary(employee.id);
                            }}
                            sx={{ width: 120 }}
                            InputProps={{
                              startAdornment: '$'
                            }}
                          />
                        ) : (
                          <Typography variant="body2">
                            {numeral(employee.salary).format('0,0.00')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isSelected ? (
                          <TextField
                            type="number"
                            size="small"
                            value={calculation?.allowances || 0}
                            onChange={(e) => {
                              updateEmployeeCalculation(employee.id, 'allowances', e.target.value);
                              recalculateNetSalary(employee.id);
                            }}
                            sx={{ width: 120 }}
                            InputProps={{
                              startAdornment: '$'
                            }}
                          />
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isSelected ? (
                          <TextField
                            type="number"
                            size="small"
                            value={calculation?.deductions || 0}
                            onChange={(e) => {
                              updateEmployeeCalculation(employee.id, 'deductions', e.target.value);
                              recalculateNetSalary(employee.id);
                            }}
                            sx={{ width: 120 }}
                            InputProps={{
                              startAdornment: '$'
                            }}
                          />
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isSelected && calculation ? (
                          <Typography variant="body2" fontWeight="bold">
                            {numeral(calculation.gross_salary).format('0,0.00')}
                          </Typography>
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isSelected && calculation ? (
                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                            {numeral(calculation.net_salary).format('0,0.00')}
                          </Typography>
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={numeral(Math.abs(employee.balance)).format('0,0.00')}
                          color={employee.balance >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Salary Payment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to process salary payments for {selectedEmployees.length} employee(s)?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total amount to be paid: {numeral(getTotalPaymentAmount()).format('0,0.00')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Payment method: {paymentData.payment_method}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Payment date: {dayjs(paymentData.payment_date).format('MMMM DD, YYYY')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            disabled={processingPayment}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={confirmPayment}
            disabled={processingPayment}
            startIcon={processingPayment ? null : <CheckIcon />}
          >
            {processingPayment ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </AuthenticatedLayout>
  );
};

export default SalaryPayment;