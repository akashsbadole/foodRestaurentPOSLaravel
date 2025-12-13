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
  IconButton,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Fab,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Payment as PaymentIcon,
  Assessment as ReportIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import numeral from 'numeral';
import dayjs from 'dayjs';
import PayrollSummaryChart from './Components/PayrollSummaryChart';
import RecentSalaryPayments from './Components/RecentSalaryPayments';
import EmployeeSalaryStatus from './Components/EmployeeSalaryStatus';
import QuickPayrollActions from './Components/QuickPayrollActions';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: theme.palette.background.paperGradient,
  boxShadow: theme.palette.shadows[2],
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: theme.palette.primary.gradient,
    transform: 'translateY(-100%)',
    transition: 'transform 0.3s ease-in-out',
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.palette.shadows[6],
    '&::before': {
      transform: 'translateY(0)',
    }
  }
}));

const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, onClick }) => {
  const theme = useTheme();
  
  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={color || 'primary.main'}>
              {numeral(value).format('0,0.00')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend > 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(trend)}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: color || 'primary.main',
              width: 56,
              height: 56,
              boxShadow: theme.palette.shadows[2]
            }}
          >
            <Icon fontSize="large" />
          </Avatar>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`payroll-tabpanel-${index}`}
    aria-labelledby={`payroll-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PayrollDashboard = ({
  payrollStats = {},
  recentPayments = [],
  employees = [],
  monthlyData = [],
  pendingSalaries = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    handleMenuClose();
    // In a real implementation, this would trigger a data refresh
    router.reload({ data: { period } });
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current_month': return 'Current Month';
      case 'last_month': return 'Last Month';
      case 'current_quarter': return 'Current Quarter';
      case 'current_year': return 'Current Year';
      default: return 'Current Month';
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Payroll Dashboard" />
      
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Payroll Management
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<CalendarIcon />}
              onClick={handleMenuClick}
              size={isMobile ? 'small' : 'medium'}
            >
              {getPeriodLabel()}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handlePeriodChange('current_month')}>
                Current Month
              </MenuItem>
              <MenuItem onClick={() => handlePeriodChange('last_month')}>
                Last Month
              </MenuItem>
              <MenuItem onClick={() => handlePeriodChange('current_quarter')}>
                Current Quarter
              </MenuItem>
              <MenuItem onClick={() => handlePeriodChange('current_year')}>
                Current Year
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.visit('/payroll/process-payment')}
              size={isMobile ? 'small' : 'medium'}
            >
              Process Payment
            </Button>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              background: theme.palette.primary.gradient,
              height: 4,
              borderRadius: '4px 4px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: isMobile ? '0.875rem' : '1rem',
              minHeight: 48,
            }
          }}
        >
          <Tab label="Overview" icon={<WalletIcon />} iconPosition="start" />
          <Tab label="Payments" icon={<PaymentIcon />} iconPosition="start" />
          <Tab label="Employees" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Reports" icon={<ReportIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {/* Payroll Statistics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Payroll"
              value={payrollStats.totalPayroll || 0}
              icon={MoneyIcon}
              color="primary.main"
              trend={payrollStats.payrollTrend || 0}
              subtitle={getPeriodLabel()}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Paid This Month"
              value={payrollStats.paidThisMonth || 0}
              icon={PaymentIcon}
              color="success.main"
              subtitle={`${payrollStats.paidEmployees || 0} employees`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Payments"
              value={payrollStats.pendingPayments || 0}
              icon={TimelineIcon}
              color="warning.main"
              subtitle={`${payrollStats.pendingEmployees || 0} employees`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Average Salary"
              value={payrollStats.averageSalary || 0}
              icon={PeopleIcon}
              color="info.main"
              subtitle="Per employee"
            />
          </Grid>

          {/* Payroll Summary Chart */}
          <Grid item xs={12} md={8}>
            <PayrollSummaryChart data={monthlyData} period={selectedPeriod} />
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <QuickPayrollActions onAction={(action) => {
              switch (action) {
                case 'process_all':
                  router.visit('/payroll/process-payment');
                  break;
                case 'generate_report':
                  router.visit('/payroll/reports');
                  break;
                case 'manage_employees':
                  router.visit('/employees');
                  break;
                case 'salary_adjustments':
                  router.visit('/payroll/adjustments');
                  break;
              }
            }} />
          </Grid>

          {/* Recent Salary Payments */}
          <Grid item xs={12}>
            <RecentSalaryPayments payments={recentPayments} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Salary Payment History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Payment Date</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPayments.map((payment) => (
                        <TableRow key={payment.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {payment.employee_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {payment.role}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {numeral(payment.net_salary).format('0,0.00')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {dayjs(payment.salary_date).format('MMM DD, YYYY')}
                          </TableCell>
                          <TableCell>{payment.salary_from}</TableCell>
                          <TableCell>
                            <Chip
                              label="Paid"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small">
                              <ReceiptIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <EmployeeSalaryStatus employees={employees} pendingSalaries={pendingSalaries} />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payroll Reports
                </Typography>
                <List>
                  <ListItem button onClick={() => router.visit('/payroll/reports/monthly')}>
                    <ListItemAvatar>
                      <Avatar>
                        <CalendarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Monthly Payroll Report"
                      secondary="Detailed monthly salary breakdown"
                    />
                  </ListItem>
                  <ListItem button onClick={() => router.visit('/payroll/reports/yearly')}>
                    <ListItemAvatar>
                      <Avatar>
                        <TrendingUpIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Yearly Payroll Summary"
                      secondary="Annual payroll analysis"
                    />
                  </ListItem>
                  <ListItem button onClick={() => router.visit('/payroll/reports/employee')}>
                    <ListItemAvatar>
                      <Avatar>
                        <PeopleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Employee Salary History"
                      secondary="Individual employee payment records"
                    />
                  </ListItem>
                  <ListItem button onClick={() => router.visit('/employee-balance-log')}>
                    <ListItemAvatar>
                      <Avatar>
                        <ReceiptIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Balance & Payment Log"
                      secondary="Complete balance adjustment history"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Export
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ReceiptIcon />}
                    onClick={() => router.visit('/payroll/export/current-month')}
                  >
                    Export Current Month
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CalendarIcon />}
                    onClick={() => router.visit('/payroll/export/quarterly')}
                  >
                    Export Quarterly Report
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => router.visit('/payroll/export/yearly')}
                  >
                    Export Yearly Summary
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Floating Action Button for Quick Actions */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: theme.palette.primary.gradient,
          '&:hover': {
            background: theme.palette.primary.gradientLight,
          }
        }}
        onClick={() => router.visit('/payroll/process-payment')}
      >
        <PaymentIcon />
      </Fab>
    </AuthenticatedLayout>
  );
};

export default PayrollDashboard;