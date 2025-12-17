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
  Download as DownloadIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
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

const MonthlyReport = ({ salaries = {}, employees = [], filters = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [localFilters, setLocalFilters] = useState({
    start_date: filters.start_date || dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: filters.end_date || dayjs().endOf('month').format('YYYY-MM-DD'),
    employee_id: filters.employee_id || ''
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    
    const queryParams = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => v !== '')
    );
    
    router.get('/payroll/reports/monthly', queryParams);
  };

  const handleExport = () => {
    const queryParams = Object.fromEntries(
      Object.entries(localFilters).filter(([_, v]) => v !== '')
    );
    
    router.get('/payroll/export/current-month', queryParams);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTotalAmount = (field) => {
    return salaries.data?.reduce((total, salary) => total + (salary[field] || 0), 0);
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Bank Transfer': return 'primary';
      case 'Cash Drawer': return 'secondary';
      case 'Check': return 'info';
      default: return 'default';
    }
  };

  const summaryStats = {
    totalEmployees: salaries.data?.length || 0,
    totalAmount: getTotalAmount('net_salary'),
    averageSalary: salaries.data?.length ? getTotalAmount('net_salary') / salaries.data.length : 0,
    totalBasicSalary: getTotalAmount('basic_salary'),
    totalAllowances: getTotalAmount('allowances'),
    totalDeductions: getTotalAmount('deductions')
  };

  return (
    <AuthenticatedLayout>
      <Head title="Monthly Payroll Report" />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>
          Monthly Payroll Report
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={localFilters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={localFilters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={localFilters.employee_id}
                label="Employee"
                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
              >
                <MenuItem value="">All Employees</MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => router.reload()}
                fullWidth
              >
                Refresh
              </Button>
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="primary.main" fontWeight="bold">
                  {summaryStats.totalEmployees}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Employees
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {numeral(summaryStats.totalAmount).format('0,0.00')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Amount Paid
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="info.main" fontWeight="bold">
                  {numeral(summaryStats.averageSalary).format('0,0.00')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Salary
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="warning.main" fontWeight="bold">
                  {numeral(summaryStats.totalAllowances).format('0,0.00')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Allowances
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="error.main" fontWeight="bold">
                  {numeral(summaryStats.totalDeductions).format('0,0.00')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Deductions
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Detailed Salary Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Salary Payment Details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Basic Salary</TableCell>
                  <TableCell align="right">Allowances</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Gross Salary</TableCell>
                  <TableCell align="right">Net Salary</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Store</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaries.data?.map((salary) => (
                  <TableRow key={salary.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {salary.employee_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {salary.employee_role}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {numeral(salary.basic_salary).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {numeral(salary.allowances || 0).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {numeral(salary.deductions || 0).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {numeral(salary.gross_salary).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {numeral(salary.net_salary).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(salary.salary_date).format('MMM DD, YYYY')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={salary.salary_from}
                        color={getPaymentMethodColor(salary.salary_from)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {salary.store_name}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {(!salaries.data || salaries.data.length === 0) && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No salary records found for the selected period
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default MonthlyReport;