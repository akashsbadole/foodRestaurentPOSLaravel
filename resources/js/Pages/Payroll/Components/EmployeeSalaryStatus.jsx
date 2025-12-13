import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Grid
} from '@mui/material';
import {
  Person as PersonIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as PaidIcon,
  Pending as PendingIcon,
  Error as OverdueIcon
} from '@mui/icons-material';
import numeral from 'numeral';
import dayjs from 'dayjs';

const EmployeeSalaryStatus = ({ employees = [], pendingSalaries = [] }) => {
  const theme = useTheme();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'Bank Transfer',
    payment_date: dayjs().format('YYYY-MM-DD'),
    remarks: ''
  });

  // Sample data if not provided
  const employeeData = employees.length > 0 ? employees : [
    {
      id: 1,
      name: 'John Doe',
      role: 'Chef',
      salary: 3500,
      salary_frequency: 'Monthly',
      balance: 0,
      status: 'Active',
      last_payment_date: '2024-11-30',
      next_payment_date: '2024-12-31',
      payment_status: 'pending'
    },
    {
      id: 2,
      name: 'Jane Smith',
      role: 'Waitress',
      salary: 2800,
      salary_frequency: 'Monthly',
      balance: 500,
      status: 'Active',
      last_payment_date: '2024-12-10',
      next_payment_date: '2024-12-31',
      payment_status: 'paid'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      role: 'Kitchen Staff',
      salary: 2500,
      salary_frequency: 'Monthly',
      balance: -200,
      status: 'Active',
      last_payment_date: '2024-11-30',
      next_payment_date: '2024-12-31',
      payment_status: 'overdue'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      role: 'Manager',
      salary: 4200,
      salary_frequency: 'Monthly',
      balance: 0,
      status: 'Active',
      last_payment_date: '2024-12-10',
      next_payment_date: '2024-12-31',
      payment_status: 'paid'
    },
    {
      id: 5,
      name: 'Tom Brown',
      role: 'Cleaner',
      salary: 1800,
      salary_frequency: 'Monthly',
      balance: 150,
      status: 'Active',
      last_payment_date: '2024-12-08',
      next_payment_date: '2024-12-31',
      payment_status: 'paid'
    }
  ];

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <PaidIcon color="success" />;
      case 'pending': return <PendingIcon color="warning" />;
      case 'overdue': return <OverdueIcon color="error" />;
      default: return <PendingIcon color="disabled" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getBalanceTrend = (balance) => {
    if (balance > 0) {
      return {
        icon: <TrendingUpIcon color="success" fontSize="small" />,
        color: 'success.main',
        text: 'Credit'
      };
    } else if (balance < 0) {
      return {
        icon: <TrendingDownIcon color="error" fontSize="small" />,
        color: 'error.main',
        text: 'Debit'
      };
    }
    return {
      icon: null,
      color: 'text.secondary',
      text: 'Settled'
    };
  };

  const handleProcessPayment = (employee) => {
    setSelectedEmployee(employee);
    setPaymentData({
      amount: employee.salary,
      payment_method: 'Bank Transfer',
      payment_date: dayjs().format('YYYY-MM-DD'),
      remarks: `Salary payment for ${dayjs().format('MMMM YYYY')}`
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    // In a real implementation, this would submit to the backend
    console.log('Processing payment:', {
      employee: selectedEmployee,
      payment: paymentData
    });
    setPaymentDialogOpen(false);
    setSelectedEmployee(null);
  };

  const balanceStats = {
    totalCredit: employeeData.filter(emp => emp.balance > 0).reduce((sum, emp) => sum + emp.balance, 0),
    totalDebit: Math.abs(employeeData.filter(emp => emp.balance < 0).reduce((sum, emp) => sum + emp.balance, 0)),
    pendingPayments: employeeData.filter(emp => emp.payment_status === 'pending').length,
    paidThisMonth: employeeData.filter(emp => emp.payment_status === 'paid').length
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {numeral(balanceStats.totalCredit).format('0,0.00')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Credit Balance
                  </Typography>
                </Box>
                <WalletIcon sx={{ color: 'success.main', fontSize: 32 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {numeral(balanceStats.totalDebit).format('0,0.00')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Debit Balance
                  </Typography>
                </Box>
                <WalletIcon sx={{ color: 'error.main', fontSize: 32 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="warning.main" fontWeight="bold">
                    {balanceStats.pendingPayments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                </Box>
                <PendingIcon sx={{ color: 'warning.main', fontSize: 32 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {balanceStats.paidThisMonth}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid This Month
                  </Typography>
                </Box>
                <PaidIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Employee Salary Status Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Employee Salary Status
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Salary</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Last Payment</TableCell>
                  <TableCell>Next Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeData.map((employee) => {
                  const balanceTrend = getBalanceTrend(employee.balance);
                  return (
                    <TableRow 
                      key={employee.id} 
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: theme.palette.primary.main
                            }}
                          >
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
                        <Typography variant="body2" fontWeight="bold">
                          {numeral(employee.salary).format('0,0.00')} / {employee.salary_frequency}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={balanceTrend.color}
                          >
                            {numeral(Math.abs(employee.balance)).format('0,0.00')}
                          </Typography>
                          {balanceTrend.icon}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {balanceTrend.text}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.last_payment_date ? dayjs(employee.last_payment_date).format('MMM DD, YYYY') : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(employee.next_payment_date).format('MMM DD, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPaymentStatusIcon(employee.payment_status)}
                          <Chip
                            label={employee.payment_status}
                            color={getPaymentStatusColor(employee.payment_status)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {employee.payment_status === 'pending' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={() => handleProcessPayment(employee)}
                          >
                            Pay Now
                          </Button>
                        )}
                        {employee.payment_status === 'paid' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleProcessPayment(employee)}
                          >
                            Adjust
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Process Salary Payment - {selectedEmployee?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={3}
                value={paymentData.remarks}
                onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePaymentSubmit}
            disabled={!paymentData.amount || !paymentData.payment_date}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSalaryStatus;