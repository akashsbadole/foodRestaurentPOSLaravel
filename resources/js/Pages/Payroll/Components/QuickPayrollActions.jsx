import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Assessment as ReportIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useNavigate } from '@inertiajs/react';

const QuickPayrollActions = ({ onAction }) => {
  const theme = useTheme();

  const actions = [
    {
      id: 'process_all',
      title: 'Process All Salaries',
      description: 'Process salary payments for all employees',
      icon: <PaymentIcon />,
      color: 'primary',
      gradient: theme.palette.primary.gradient
    },
    {
      id: 'generate_report',
      title: 'Generate Reports',
      description: 'Create payroll and salary reports',
      icon: <ReportIcon />,
      color: 'success',
      gradient: theme.palette.success.gradient
    },
    {
      id: 'manage_employees',
      title: 'Manage Employees',
      description: 'Add, edit, or manage employee information',
      icon: <PeopleIcon />,
      color: 'info',
      gradient: theme.palette.info.gradient
    },
    {
      id: 'salary_adjustments',
      title: 'Salary Adjustments',
      description: 'Manage salary adjustments and bonuses',
      icon: <TrendingUpIcon />,
      color: 'warning',
      gradient: theme.palette.warning.gradient
    }
  ];

  const quickStats = [
    {
      label: 'Pending Payments',
      value: '5',
      icon: <ScheduleIcon />,
      color: 'warning.main'
    },
    {
      label: 'Processed Today',
      value: '12',
      icon: <SpeedIcon />,
      color: 'success.main'
    },
    {
      label: 'Total Balance',
      value: '$8,450',
      icon: <AccountBalanceIcon />,
      color: 'primary.main'
    }
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Quick Actions
        </Typography>
        
        {/* Quick Stats */}
        <Box sx={{ mb: 3 }}>
          {quickStats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 2,
                mb: 1,
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  transform: 'translateX(4px)',
                }
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: stat.color,
                    color: 'white'
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="bold" color={stat.color}>
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Action Buttons */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Common Tasks
        </Typography>
        <List sx={{ p: 0 }}>
          {actions.map((action) => (
            <ListItem
              key={action.id}
              button
              onClick={() => onAction(action.id)}
              sx={{
                borderRadius: 2,
                mb: 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  transform: 'translateX(4px)',
                  '& .MuiListItemIcon-root': {
                    color: action.color,
                  }
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'text.secondary',
                  minWidth: 40,
                  '& svg': {
                    fontSize: 20,
                  }
                }}
              >
                {action.icon}
              </ListItemIcon>
              <ListItemText
                primary={action.title}
                secondary={action.description}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                }}
              />
            </ListItem>
          ))}
        </List>

        {/* Additional Quick Links */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Quick Links
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="text"
              size="small"
              startIcon={<ReceiptIcon />}
              onClick={() => onAction('payment_history')}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              Payment History
            </Button>
            <Button
              variant="text"
              size="small"
              startIcon={<TrendingUpIcon />}
              onClick={() => onAction('salary_trends')}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              Salary Trends
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickPayrollActions;