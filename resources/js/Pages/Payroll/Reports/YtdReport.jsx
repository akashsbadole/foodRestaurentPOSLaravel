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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import numeral from 'numeral';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: theme.palette.background.paperGradient,
  boxShadow: theme.palette.shadows[2],
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const YtdReport = ({ ytdData = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const handleYearChange = (year) => {
    setSelectedYear(year);
    router.reload({ data: { year } });
  };

  const handleExport = () => {
    const data = {
      year: selectedYear,
      format: 'csv'
    };
    
    router.get('/payroll/reports/ytd', data);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate month data for the selected year
  const getMonthlyData = () => {
    const months = [];
    const currentMonth = dayjs().month();
    
    for (let i = 0; i <= currentMonth; i++) {
      const monthName = dayjs().month(i).format('MMM');
      const monthData = ytdData.monthly_data?.[monthName] || {};
      
      months.push({
        month: monthName,
        totalSalary: monthData.total_salary || 0,
        totalEmployees: monthData.total_employees || 0,
        averageSalary: monthData.average_salary || 0
      });
    }
    
    return months;
  };

  // Generate department distribution data
  const getDepartmentData = () => {
    const departments = ytdData.department_breakdown || {};
    
    return Object.entries(departments).map(([dept, data]) => ({
      name: dept,
      value: data.total_salary || 0,
      employees: data.total_employees || 0
    }));
  };

  // Calculate YTD statistics
  const getYtdStats = () => {
    const monthlyData = getMonthlyData();
    const departmentData = getDepartmentData();
    
    const totalSalary = monthlyData.reduce((sum, month) => sum + month.totalSalary, 0);
    const totalEmployees = ytdData.total_employees || 0;
    const averageMonthlySalary = monthlyData.length > 0 ? totalSalary / monthlyData.length : 0;
    const highestPaidMonth = monthlyData.reduce((max, month) => 
      month.totalSalary > max.totalSalary ? month : max, { totalSalary: 0 });
    
    return {
      totalSalary,
      totalEmployees,
      averageMonthlySalary,
      highestPaidMonth,
      monthsProcessed: monthlyData.length
    };
  };

  const stats = getYtdStats();
  const monthlyData = getMonthlyData();
  const departmentData = getDepartmentData();

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  return (
    <AuthenticatedLayout>
      <Head title={`Year-to-Date Payroll Report - ${selectedYear}`} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>
          Year-to-Date Payroll Report - {selectedYear}
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                label="Year"
              >
                {[2023, 2024, 2025].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
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

      {/* YTD Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white'
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {numeral(stats.totalSalary).format('0,0.00')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total YTD Salary
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: theme.palette.success.main,
                    color: 'white'
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {stats.totalEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: theme.palette.warning.main,
                    color: 'white'
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {numeral(stats.averageMonthlySalary).format('0,0.00')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Monthly Salary
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: theme.palette.info.main,
                    color: 'white'
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {stats.monthsProcessed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Months Processed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Monthly Salary Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => numeral(value).format('0.0a')} />
                  <Tooltip 
                    formatter={(value) => numeral(value).format('0,0.00')}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="totalSalary" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Department Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => numeral(value).format('0,0.00')} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Monthly Breakdown
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Total Salary</TableCell>
                  <TableCell align="right">Employees Paid</TableCell>
                  <TableCell align="right">Average Salary</TableCell>
                  <TableCell align="right">% of YTD Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyData.map((month) => {
                  const percentage = stats.totalSalary > 0 
                    ? (month.totalSalary / stats.totalSalary * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <TableRow key={month.month} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {month.month}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {numeral(month.totalSalary).format('0,0.00')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {month.totalEmployees}
                      </TableCell>
                      <TableCell align="right">
                        {numeral(month.averageSalary).format('0,0.00')}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${percentage}%`}
                          color="primary"
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

      {/* Department Breakdown Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Department Breakdown
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Total Salary</TableCell>
                  <TableCell align="right">Employees</TableCell>
                  <TableCell align="right">Average Salary</TableCell>
                  <TableCell align="right">% of YTD Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentData.map((dept, index) => {
                  const percentage = stats.totalSalary > 0 
                    ? (dept.value / stats.totalSalary * 100).toFixed(1)
                    : 0;
                  const avgSalary = dept.employees > 0 ? dept.value / dept.employees : 0;
                  
                  return (
                    <TableRow key={dept.name} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {dept.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {numeral(dept.value).format('0,0.00')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {dept.employees}
                      </TableCell>
                      <TableCell align="right">
                        {numeral(avgSalary).format('0,0.00')}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${percentage}%`}
                          color="primary"
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
    </AuthenticatedLayout>
  );
};

export default YtdReport;