import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import numeral from 'numeral';

const PayrollSummaryChart = ({ data = [], period = 'current_month' }) => {
  const theme = useTheme();

  // Generate sample data if not provided
  const chartData = data.length > 0 ? data : [
    { month: 'Jan', amount: 45000, employees: 12 },
    { month: 'Feb', amount: 48000, employees: 13 },
    { month: 'Mar', amount: 46000, employees: 12 },
    { month: 'Apr', amount: 52000, employees: 14 },
    { month: 'May', amount: 49000, employees: 13 },
    { month: 'Jun', amount: 53000, employees: 15 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            boxShadow: theme.palette.shadows[2]
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {numeral(entry.value).format('0,0.00')}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const getChartTitle = () => {
    switch (period) {
      case 'current_month': return 'Monthly Payroll Trend';
      case 'last_month': return 'Last Month Payroll';
      case 'current_quarter': return 'Quarterly Payroll Overview';
      case 'current_year': return 'Yearly Payroll Summary';
      default: return 'Payroll Overview';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {getChartTitle()}
        </Typography>
        <Box sx={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="month" 
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
                tickFormatter={(value) => numeral(value).format('0a')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PayrollSummaryChart;