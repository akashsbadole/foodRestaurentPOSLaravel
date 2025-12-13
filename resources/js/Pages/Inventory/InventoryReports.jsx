import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  TextField,
  DatePicker,
  Chart,
  ChartTooltip,
  ChartLegend,
  ChartContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ResponsiveContainer,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachFile as AttachFileIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '@/Components/ThemeProvider';
import {
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer as RechartsResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell,
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
} from 'recharts';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`report-tabpanel-${index}`}
    aria-labelledby={`report-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const InventoryReports = ({
  inventoryValue = 0,
  totalItems = 0,
  lowStockItems = [],
  expiringItems = [],
  fastMovingItems = [],
  slowMovingItems = [],
  valuationData = [],
  movementData = [],
  forecastData = [],
  suppliers = [],
  stores = [],
  user = null,
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('30days');
  const [selectedStore, setSelectedStore] = useState('all');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await router.reload({ only: ['valuationData', 'movementData', 'forecastData'] });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format) => {
    // Implement export functionality
    console.log(`Exporting report in ${format} format`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <StyledCard>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
            }}
          >
            <Icon />
          </Avatar>
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {trend > 0 ? (
                <TrendingUpIcon color="success" />
              ) : (
                <TrendingDownIcon color="error" />
              )}
              <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </StyledCard>
  );

  return (
    <>
      <Head title="Inventory Reports" />
      <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
            Inventory Reports
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={loading}>
                {loading ? <LinearProgress /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setReportDialogOpen(true)}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Inventory Value"
              value={formatCurrency(inventoryValue)}
              icon={InventoryIcon}
              color={theme.palette.primary.main}
              trend={5.2}
              subtitle="Last 30 days"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Items"
              value={totalItems}
              icon={AnalyticsIcon}
              color={theme.palette.success.main}
              trend={2.1}
              subtitle="Unique products"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Low Stock Items"
              value={lowStockItems.length}
              icon={WarningIcon}
              color={theme.palette.warning.main}
              subtitle="Needs attention"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Expiring Items"
              value={expiringItems.length}
              icon={ScheduleIcon}
              color={theme.palette.error.main}
              subtitle="Within 30 days"
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="1year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Store</InputLabel>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              label="Store"
            >
              <MenuItem value="all">All Stores</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Valuation" icon={<PieChartIcon />} />
            <Tab label="Movement Analysis" icon={<BarChartIcon />} />
            <Tab label="Forecasting" icon={<LineChartIcon />} />
            <Tab label="Performance" icon={<SpeedIcon />} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Inventory Value by Category
                  </Typography>
                  <RechartsResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <RechartsPie
                        data={valuationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {valuationData.map((entry, index) => (
                          <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </RechartsPie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    </RechartsPieChart>
                  </RechartsResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Value Breakdown
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Value</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {valuationData.map((category, index) => (
                          <TableRow key={category.name}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: COLORS[index % COLORS.length],
                                  }}
                                />
                                {category.name}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(category.value)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {((category.value / inventoryValue) * 100).toFixed(1)}%
                              </Typography>
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

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Inventory Movement Trends
                  </Typography>
                  <RechartsResponsiveContainer width="100%" height={400}>
                    <RechartsAreaChart data={movementData}>
                      <RechartsCartesianGrid strokeDasharray="3 3" />
                      <RechartsXAxis dataKey="date" />
                      <RechartsYAxis />
                      <RechartsTooltip />
                      <RechartsLegend />
                      <RechartsArea
                        type="monotone"
                        dataKey="in"
                        stackId="1"
                        stroke="#00C49F"
                        fill="#00C49F"
                        name="Stock In"
                      />
                      <RechartsArea
                        type="monotone"
                        dataKey="out"
                        stackId="2"
                        stroke="#FF8042"
                        fill="#FF8042"
                        name="Stock Out"
                      />
                    </RechartsAreaChart>
                  </RechartsResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Fast Moving Items
                  </Typography>
                  <List dense>
                    {fastMovingItems.slice(0, 5).map((item, index) => (
                      <ListItem key={item.id}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.turnover_rate}x turnover rate`}
                        />
                        <Typography variant="body2" color="success.main">
                          +{item.movement_percentage}%
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Slow Moving Items
                  </Typography>
                  <List dense>
                    {slowMovingItems.slice(0, 5).map((item, index) => (
                      <ListItem key={item.id}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.days_in_stock} days in stock`}
                        />
                        <Typography variant="body2" color="warning.main">
                          {item.movement_percentage}%
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Inventory Forecast (Next 90 Days)
                  </Typography>
                  <RechartsResponsiveContainer width="100%" height={400}>
                    <RechartsLineChart data={forecastData}>
                      <RechartsCartesianGrid strokeDasharray="3 3" />
                      <RechartsXAxis dataKey="date" />
                      <RechartsYAxis />
                      <RechartsTooltip />
                      <RechartsLegend />
                      <RechartsLine
                        type="monotone"
                        dataKey="projected"
                        stroke="#0088FE"
                        strokeWidth={2}
                        name="Projected Stock"
                      />
                      <RechartsLine
                        type="monotone"
                        dataKey="optimal"
                        stroke="#00C49F"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Optimal Level"
                      />
                      <RechartsLine
                        type="monotone"
                        dataKey="critical"
                        stroke="#FF8042"
                        strokeWidth={2}
                        name="Critical Level"
                      />
                    </RechartsLineChart>
                  </RechartsResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Forecast Summary
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Items Needing Reorder" />
                      <Typography variant="h6" color="warning.main">
                        {forecastData.filter(d => d.projected <= d.critical).length}
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Projected Shortages" />
                      <Typography variant="h6" color="error.main">
                        {forecastData.filter(d => d.projected < 0).length}
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Optimal Stock Items" />
                      <Typography variant="h6" color="success.main">
                        {forecastData.filter(d => d.projected >= d.optimal).length}
                      </Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommended Actions
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Current</TableCell>
                          <TableCell>Projected</TableCell>
                          <TableCell>Recommended Action</TableCell>
                          <TableCell>Priority</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {forecastData.slice(0, 5).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.current}</TableCell>
                            <TableCell>
                              <Typography color={item.projected < 0 ? 'error.main' : 'text.primary'}>
                                {item.projected}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.recommended_action}
                                color={item.priority === 'urgent' ? 'error' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.priority}
                                color={item.priority === 'urgent' ? 'error' : 'warning'}
                                size="small"
                              />
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

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Performance Indicators
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Inventory Turnover Rate" />
                      <Typography variant="h6" color="primary.main">
                        8.5x
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Days Sales of Inventory" />
                      <Typography variant="h6" color="success.main">
                        42 days
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Stock Accuracy" />
                      <Typography variant="h6" color="info.main">
                        94.5%
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Carrying Cost" />
                      <Typography variant="h6" color="warning.main">
                        12.3%
                      </Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Supplier Performance
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Supplier</TableCell>
                          <TableCell align="right">On-Time Delivery</TableCell>
                          <TableCell align="right">Quality Score</TableCell>
                          <TableCell align="right">Total Orders</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {suppliers.slice(0, 5).map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell>{supplier.name}</TableCell>
                            <TableCell align="right">
                              <Typography color={supplier.on_time_delivery >= 90 ? 'success.main' : 'warning.main'}>
                                {supplier.on_time_delivery}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color={supplier.quality_score >= 4 ? 'success.main' : 'warning.main'}>
                                {supplier.quality_score}/5
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{supplier.total_orders}</TableCell>
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

        {/* Export Dialog */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Report</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom>
              Choose the format and date range for your report export.
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Report Type</InputLabel>
              <Select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                label="Report Type"
              >
                <MenuItem value={0}>Valuation Report</MenuItem>
                <MenuItem value={1}>Movement Analysis</MenuItem>
                <MenuItem value={2}>Forecast Report</MenuItem>
                <MenuItem value={3}>Performance Report</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Export Format</InputLabel>
              <Select defaultValue="pdf" label="Export Format">
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => handleExportReport('pdf')}>
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default InventoryReports;