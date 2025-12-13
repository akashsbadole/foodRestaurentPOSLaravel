import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Description as DocumentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  ArrowForward as ArrowForwardIcon,
  Timeline as TimelineIcon
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
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.palette.shadows[8],
  },
}));

const ReportCard = ({ title, description, icon, color, link, stats }) => {
  const theme = useTheme();
  
  return (
    <Link href={link} style={{ textDecoration: 'none' }}>
      <StyledCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundColor: color,
                color: 'white'
              }}
            >
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
            <ArrowForwardIcon color="action" />
          </Box>
          
          {stats && (
            <Grid container spacing={2}>
              {stats.map((stat, index) => (
                <Grid item xs={6} key={index}>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color={stat.color || 'text.primary'}>
                    {stat.value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </StyledCard>
    </Link>
  );
};

const ReportsIndex = ({ reportStats = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    router.reload({ data: { period } });
  };

  const handleExportAll = () => {
    const data = {
      period: selectedPeriod,
      format: 'zip',
      reports: ['monthly', 'employee', 'ytd']
    };
    
    router.get('/payroll/reports/export-all', data);
  };

  const reportCards = [
    {
      title: 'Monthly Payroll Report',
      description: 'Detailed monthly salary breakdown and employee payment history',
      icon: <CalendarIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.primary.main,
      link: '/payroll/reports/monthly',
      stats: [
        {
          label: 'Last Month Total',
          value: numeral(reportStats.last_month_total || 0).format('0,0.00'),
          color: 'primary.main'
        },
        {
          label: 'Employees Paid',
          value: reportStats.last_month_employees || 0,
          color: 'success.main'
        }
      ]
    },
    {
      title: 'Employee Salary Report',
      description: 'Individual employee salary history and balance tracking',
      icon: <PersonIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.success.main,
      link: '/payroll/reports/employee',
      stats: [
        {
          label: 'Total Employees',
          value: reportStats.total_employees || 0,
          color: 'info.main'
        },
        {
          label: 'Active Employees',
          value: reportStats.active_employees || 0,
          color: 'success.main'
        }
      ]
    },
    {
      title: 'Year-to-Date Report',
      description: 'Comprehensive yearly payroll analysis and trends',
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.warning.main,
      link: '/payroll/reports/ytd',
      stats: [
        {
          label: 'YTD Total',
          value: numeral(reportStats.ytd_total || 0).format('0,0.00'),
          color: 'warning.main'
        },
        {
          label: 'Months Processed',
          value: reportStats.months_processed || 0,
          color: 'info.main'
        }
      ]
    },
    {
      title: 'Payroll Analytics',
      description: 'Advanced analytics and insights for payroll optimization',
      icon: <AssessmentIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.info.main,
      link: '/payroll/analytics',
      stats: [
        {
          label: 'Avg Monthly Cost',
          value: numeral(reportStats.avg_monthly_cost || 0).format('0,0.00'),
          color: 'info.main'
        },
        {
          label: 'Cost Trend',
          value: reportStats.cost_trend || 'Stable',
          color: reportStats.cost_trend === 'Increasing' ? 'error.main' : 
                 reportStats.cost_trend === 'Decreasing' ? 'success.main' : 'warning.main'
        }
      ]
    },
    {
      title: 'Custom Reports',
      description: 'Generate custom reports with specific filters and parameters',
      icon: <DocumentIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.secondary.main,
      link: '/payroll/reports/custom',
      stats: [
        {
          label: 'Available Filters',
          value: '8+',
          color: 'secondary.main'
        },
        {
          label: 'Export Formats',
          value: 'PDF, Excel, CSV',
          color: 'text.secondary'
        }
      ]
    },
    {
      title: 'Payroll Timeline',
      description: 'Visual timeline of all payroll transactions and adjustments',
      icon: <TimelineIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.error.main,
      link: '/payroll/reports/timeline',
      stats: [
        {
          label: 'Recent Activity',
          value: reportStats.recent_activity || 0,
          color: 'error.main'
        },
        {
          label: 'Pending Actions',
          value: reportStats.pending_actions || 0,
          color: 'warning.main'
        }
      ]
    }
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Payroll Reports" />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" mb={2}>
          Payroll Reports
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Report Period"
              select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              SelectProps={{ native: false }}
            >
              <MenuItem value="current_month">Current Month</MenuItem>
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="current_quarter">Current Quarter</MenuItem>
              <MenuItem value="current_year">Current Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportAll}
              fullWidth
            >
              Export All Reports
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Payroll (YTD):
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary.main">
                  {numeral(reportStats.ytd_total || 0).format('0,0.00')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Employees:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="success.main">
                  {reportStats.active_employees || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Payment Date:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {reportStats.last_payment_date ? 
                    dayjs(reportStats.last_payment_date).format('MMM DD, YYYY') : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Report Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip
                  label="Monthly Report: Generated"
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label="YTD Report: Up to date"
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label="Tax Reports: Pending"
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Export Options
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Available Formats:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="PDF" size="small" variant="outlined" />
                  <Chip label="Excel" size="small" variant="outlined" />
                  <Chip label="CSV" size="small" variant="outlined" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Scheduled Reports
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Monthly Report: 1st of each month
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  YTD Summary: Quarterly
                </Typography>
                <Button variant="text" size="small" sx={{ p: 0, alignSelf: 'flex-start' }}>
                  Configure Schedule
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Cards Grid */}
      <Grid container spacing={3}>
        {reportCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <ReportCard {...card} />
          </Grid>
        ))}
      </Grid>
    </AuthenticatedLayout>
  );
};

export default ReportsIndex;