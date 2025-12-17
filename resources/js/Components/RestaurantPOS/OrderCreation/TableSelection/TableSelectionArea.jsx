import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as ViewGridIcon,
  ViewList as ViewListIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../../Components/ThemeProvider';
import TableCard from './TableCard';

const StyledContainer = styled(Box)(({ theme, isDarkMode }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  overflow: 'hidden',
}));

const StyledHeader = styled(Box)(({ theme, isDarkMode }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  backgroundColor: isDarkMode 
    ? 'rgba(30, 58, 95, 0.1)'
    : 'rgba(30, 58, 95, 0.02)',
}));

const StyledContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const FilterChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active, isDarkMode }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: active 
    ? (isDarkMode ? '#2c5282' : '#1e3a5f')
    : (isDarkMode ? 'rgba(148, 163, 184, 0.2)' : '#f1f5f9'),
  color: active 
    ? '#ffffff'
    : (isDarkMode ? '#cbd5e1' : '#475569'),
  fontWeight: 600,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: active 
      ? (isDarkMode ? '#3182ce' : '#2563eb')
      : (isDarkMode ? 'rgba(148, 163, 184, 0.3)' : '#e2e8f0'),
    transform: 'scale(1.02)',
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`table-selection-tabpanel-${index}`}
    aria-labelledby={`table-selection-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
  </div>
);

const TableSelectionArea = ({
  tables = [],
  sections = [],
  selectedTable = null,
  onTableSelect,
  onTableDetails,
  loading = false,
  error = null,
  viewMode = 'grid', // 'grid' or 'list'
  onViewModeChange
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('available');
  const [selectedSection, setSelectedSection] = useState('all');
  const [tabValue, setTabValue] = useState(0);

  // Filter tables based on search and filters
  const filteredTables = useMemo(() => {
    let filtered = tables;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(table => table.status === selectedStatus);
    }

    // Filter by section
    if (selectedSection !== 'all') {
      filtered = filtered.filter(table => table.section_id === selectedSection);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(table =>
        table.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.table_number?.toString().includes(searchTerm.toLowerCase()) ||
        (table.section_name && table.section_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [tables, selectedStatus, selectedSection, searchTerm]);

  // Group tables by section
  const tablesBySection = useMemo(() => {
    if (!Array.isArray(sections) || sections.length === 0) {
      return {};
    }
    return sections.reduce((acc, section) => {
      acc[section.id] = filteredTables.filter(table => table.section_id === section.id);
      return acc;
    }, {});
  }, [sections, filteredTables]);

  // Get unassigned tables
  const unassignedTables = useMemo(() => {
    return filteredTables.filter(table => !table.section_id);
  }, [filteredTables]);

  // Get status count
  const getStatusCount = (status) => {
    if (status === 'all') return tables.length;
    return tables.filter(table => table.status === status).length;
  };

  const handleTableSelect = (table) => {
    onTableSelect?.(table);
  };

  const handleTableLongPress = (table) => {
    onTableDetails?.(table);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewModeToggle = () => {
    onViewModeChange?.(viewMode === 'grid' ? 'list' : 'grid');
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <StyledContainer isDarkMode={isDarkMode}>
      {/* Header */}
      <StyledHeader isDarkMode={isDarkMode}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Select Table
        </Typography>
        
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search tables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Status Filters */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Status:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            <FilterChip
              label={`All (${getStatusCount('all')})`}
              active={selectedStatus === 'all'}
              onClick={() => setSelectedStatus('all')}
              icon={<CheckCircleIcon />}
              isDarkMode={isDarkMode}
            />
            <FilterChip
              label={`Available (${getStatusCount('available')})`}
              active={selectedStatus === 'available'}
              onClick={() => setSelectedStatus('available')}
              isDarkMode={isDarkMode}
            />
            <FilterChip
              label={`Occupied (${getStatusCount('occupied')})`}
              active={selectedStatus === 'occupied'}
              onClick={() => setSelectedStatus('occupied')}
              isDarkMode={isDarkMode}
            />
            <FilterChip
              label={`Reserved (${getStatusCount('reserved')})`}
              active={selectedStatus === 'reserved'}
              onClick={() => setSelectedStatus('reserved')}
              isDarkMode={isDarkMode}
            />
          </Box>
        </Box>

        {/* Section Filter and View Mode */}
        <Box display="flex" gap={1} alignItems="center">
          {Array.isArray(sections) && sections.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel>Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                label="Section"
              >
                <MenuItem value="all">All Sections</MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* View Mode Toggle */}
          <Box
            sx={{
              display: 'flex',
              borderRadius: 1,
              border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 1,
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid' 
                  ? (isDarkMode ? '#2c5282' : '#1e3a5f')
                  : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
                transition: 'all 0.2s ease',
              }}
              onClick={handleViewModeToggle}
            >
              <ViewGridIcon fontSize="small" />
            </Box>
            <Box
              sx={{
                p: 1,
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' 
                  ? (isDarkMode ? '#2c5282' : '#1e3a5f')
                  : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
                transition: 'all 0.2s ease',
              }}
              onClick={handleViewModeToggle}
            >
              <ViewListIcon fontSize="small" />
            </Box>
          </Box>
        </Box>
      </StyledHeader>

      {/* Content */}
      <StyledContent>
        {/* Tabs for different views */}
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="By Sections" />
          <Tab label={`${viewMode === 'grid' ? 'Grid' : 'List'} View`} />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {Array.isArray(sections) && sections.length > 0 ? (
            <Box>
              {sections.map((section) => (
                <Box key={section.id} mb={3}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {section.name} ({tablesBySection[section.id]?.length || 0})
                  </Typography>
                  <Grid container spacing={2}>
                    {tablesBySection[section.id]?.map((table) => (
                      <Grid
                        key={table.id}
                        item
                        xs={12}
                        sm={6}
                        md={viewMode === 'grid' ? 6 : 12}
                        lg={viewMode === 'grid' ? 4 : 12}
                      >
                        <TableCard
                          table={table}
                          isSelected={selectedTable?.id === table.id}
                          onClick={handleTableSelect}
                          onLongPress={handleTableLongPress}
                          compact={viewMode === 'list'}
                          showDetails={!isMobile}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
              
              {unassignedTables.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Unassigned Tables ({unassignedTables.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {unassignedTables.map((table) => (
                      <Grid
                        key={table.id}
                        item
                        xs={12}
                        sm={6}
                        md={viewMode === 'grid' ? 6 : 12}
                        lg={viewMode === 'grid' ? 4 : 12}
                      >
                        <TableCard
                          table={table}
                          isSelected={selectedTable?.id === table.id}
                          onClick={handleTableSelect}
                          onLongPress={handleTableLongPress}
                          compact={viewMode === 'list'}
                          showDetails={!isMobile}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">
              No sections available. Use Grid or List view to see all tables.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {filteredTables.map((table) => (
              <Grid
                key={table.id}
                item
                xs={12}
                sm={6}
                md={viewMode === 'grid' ? 6 : 12}
                lg={viewMode === 'grid' ? 4 : 12}
              >
                <TableCard
                  table={table}
                  isSelected={selectedTable?.id === table.id}
                  onClick={handleTableSelect}
                  onLongPress={handleTableLongPress}
                  compact={viewMode === 'list'}
                  showDetails={!isMobile}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* No tables found */}
        {filteredTables.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tables found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search criteria
            </Typography>
          </Box>
        )}
      </StyledContent>
    </StyledContainer>
  );
};

export default TableSelectionArea;