import React from 'react';
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
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import numeral from 'numeral';
import dayjs from 'dayjs';

const RecentSalaryPayments = ({ payments = [] }) => {
  const theme = useTheme();

  // Sample data if not provided
  const recentPayments = payments.length > 0 ? payments : [
    {
      id: 1,
      employee_name: 'John Doe',
      role: 'Chef',
      net_salary: 3500,
      salary_date: '2024-12-10',
      salary_from: 'Bank Transfer',
      status: 'paid'
    },
    {
      id: 2,
      employee_name: 'Jane Smith',
      role: 'Waitress',
      net_salary: 2800,
      salary_date: '2024-12-10',
      salary_from: 'Cash Drawer',
      status: 'paid'
    },
    {
      id: 3,
      employee_name: 'Mike Johnson',
      role: 'Kitchen Staff',
      net_salary: 2500,
      salary_date: '2024-12-09',
      salary_from: 'Bank Transfer',
      status: 'paid'
    },
    {
      id: 4,
      employee_name: 'Sarah Williams',
      role: 'Manager',
      net_salary: 4200,
      salary_date: '2024-12-08',
      salary_from: 'Bank Transfer',
      status: 'paid'
    },
    {
      id: 5,
      employee_name: 'Tom Brown',
      role: 'Cleaner',
      net_salary: 1800,
      salary_date: '2024-12-08',
      salary_from: 'Cash Drawer',
      status: 'paid'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Bank Transfer': return 'primary';
      case 'Cash Drawer': return 'secondary';
      case 'Check': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Recent Salary Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last 7 days
          </Typography>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPayments.map((payment) => (
                <TableRow 
                  key={payment.id} 
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
                          {payment.employee_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.role}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {numeral(payment.net_salary).format('0,0.00')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {dayjs(payment.salary_date).format('MMM DD, YYYY')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.salary_from}
                      color={getPaymentMethodColor(payment.salary_from)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" title="View Details">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title="Download Receipt">
                      <ReceiptIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {recentPayments.length === 0 && (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            py={4}
          >
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No recent salary payments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Process salary payments to see them here
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSalaryPayments;