import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon
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

const EmployeeReport = ({ employee = {}, salaryHistory = [], balanceLogs = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    // In a real implementation, this would filter the data
    router.reload({ data: { period } });
  };

  const handleExport = () => {
    const data = {
      employee_id: employee.id,
      period: selectedPeriod,
      format: 'csv'
    };
    
    router.get('/payroll/reports/employee', data);
  };

  const handlePrint = () => {
    window.print();
  };

  const getFilteredSalaryHistory = () => {
    if (selectedPeriod === 'all') return salaryHistory;
    
    const now = dayjs();
    let startDate;
    
    switch (selectedPeriod) {
      case '3months':
        startDate = now.subtract(3, 'month');
        break;
      case '6months':
        startDate = now.subtract(6, 'month');
        break;
      case '1year':
        startDate = now.subtract(1, 'year');
        break;
      default:
        return salaryHistory;
    }
    
    return salaryHistory.filter(salary => 
      dayjs(salary.salary_date).isAfter(startDate)
    );
  };

  const getFilteredBalanceLogs = () => {
    if (selectedPeriod === 'all') return balanceLogs;
    
    const now = dayjs();
    let startDate;
    
    switch (selectedPeriod) {
      case '3months':
        startDate = now.subtract(3, 'month');
        break;
      case '6months':
        startDate = now.subtract(6, 'month');
        break;
      case '1year':
        startDate = now.subtract(1, 'year');
        break;
      default:
        return balanceLogs;
    }
    
    return balanceLogs.filter(log => 
      dayjs(log.log_date).isAfter(startDate)
    );
  };

  const calculateStats = () => {
    const filteredSalary = getFilteredSalaryHistory();
    const filteredBalance = getFilteredBalanceLogs();
    
    const totalSalary = filteredSalary.reduce((sum, s) => sum + (s.net_salary || 0), 0);
    const totalBalanceChanges = filteredBalance.reduce((sum, log) => sum + (log.amount || 0), 0);
    const averageSalary = filteredSalary.length > 0 ? totalSalary / filteredSalary.length : 0;
    
    return {
      totalPayments: filteredSalary.length,
      totalSalary,
      averageSalary,
      totalBalanceChanges,
      currentBalance: employee.balance || 0
    };
  };

  const stats = calculateStats();

  return (
    <AuthenticatedLayout>
      <Head title={`Employee Salary Report - ${employee?.name || ''}`} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>
          Employee Salary Report - {employee?.name || ''}
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Filter Period"
              select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              SelectProps={{ native: false }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="3months">Last 3 Months</MenuItem>
              <MenuItem value="6months">Last 6 Months</MenuItem>
              <MenuItem value="1year">Last Year</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                fullWidth
              >
                Export
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                fullWidth
              >
                Print
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Employee Info Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Employee Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {employee?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {employee?.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {employee?.contact_number}
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Employee ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {employee?.id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    <Chip
                      label={employee?.status}
                      color={employee?.status === 'Active' ? 'success' : 'error'}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Join Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {employee?.joined_at ? dayjs(employee.joined_at).format('MMM DD, YYYY') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Current Salary
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {numeral(employee?.salary || 0).format('0,0.00')} / {employee?.salary_frequency || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Current Balance
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color={employee?.balance >= 0 ? 'success.main' : 'error.main'}>
                    {numeral(employee?.balance || 0).format('0,0.00')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Salary Statistics ({selectedPeriod === 'all' ? 'All Time' : selectedPeriod})
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {stats.totalPayments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Payments
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {numeral(stats.totalSalary).format('0,0.00')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Salary Paid
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {numeral(stats.averageSalary).format('0,0.00')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Salary
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {numeral(Math.abs(stats.totalBalanceChanges)).format('0,0.00')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Balance Changes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Salary History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Salary Payment History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment Date</TableCell>
                  <TableCell align="right">Basic Salary</TableCell>
                  <TableCell align="right">Allowances</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Gross Salary</TableCell>
                  <TableCell align="right">Net Salary</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredSalaryHistory().map((salary) => (
                  <TableRow key={salary.id} hover>
                    <TableCell>
                      {dayjs(salary.salary_date).format('MMM DD, YYYY')}
                    </TableCell>
                    <TableCell align="right">
                      {numeral(salary.basic_salary).format('0,0.00')}
                    </TableCell>
                    <TableCell align="right">
                      {numeral(salary.allowances || 0).format('0,0.00')}
                    </TableCell>
                    <TableCell align="right">
                      {numeral(salary.deductions || 0).format('0,0.00')}
                    </TableCell>
                    <TableCell align="right">
                      {numeral(salary.gross_salary).format('0,0.00')}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {numeral(salary.net_salary).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={salary.salary_from}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {salary.store_name}
                    </TableCell>
                    <TableCell>
                      {salary.remarks || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {getFilteredSalaryHistory().length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No salary records found for the selected period
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Balance Log Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Balance Adjustment History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Running Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredBalanceLogs().map((log, index) => {
                  const runningBalance = getFilteredBalanceLogs()
                    .slice(0, index + 1)
                    .reduce((sum, l) => sum + (l.amount || 0), 0) + (employee?.balance || 0);
                  
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        {dayjs(log.log_date).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        {log.description}
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={log.amount >= 0 ? 'success.main' : 'error.main'}
                        >
                          {numeral(Math.abs(log.amount)).format('0,0.00')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={runningBalance >= 0 ? 'success.main' : 'error.main'}
                        >
                          {numeral(runningBalance).format('0,0.00')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {getFilteredBalanceLogs().length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No balance adjustments found for the selected period
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default EmployeeReport;