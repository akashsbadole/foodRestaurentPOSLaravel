import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Restaurant as RestaurantIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Table from './Table';
import TableSection from './TableSection';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minHeight: '70vh',
    maxHeight: '90vh',
  },
}));

const SearchBox = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const FilterChip = styled(Chip)(({ theme, active }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[200],
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.grey[300],
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
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

const TableSelectionDialog = ({
  open,
  onClose,
  onTableSelect,
  tables = [],
  sections = [],
  selectedTable = null,
  orderType = 'dine-in',
  guestCount = 1,
  showFilters = true,
  showSections = true,
  multipleSelection = false,
  selectedTables = [],
  onMultipleTableSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('available');
  const [selectedSection, setSelectedSection] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [tempSelectedTables, setTempSelectedTables] = useState(selectedTables);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedStatus('available');
      setSelectedSection('all');
      setTempSelectedTables(selectedTables);
    }
  }, [open, selectedTables]);

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
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (table.section_name && table.section_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by capacity for dine-in
    if (orderType === 'dine-in' && guestCount > 0) {
      filtered = filtered.filter(table => table.capacity >= guestCount);
    }

    return filtered;
  }, [tables, selectedStatus, selectedSection, searchTerm, orderType, guestCount]);

  // Group tables by section
  const tablesBySection = useMemo(() => {
    return sections.reduce((acc, section) => {
      acc[section.id] = filteredTables.filter(table => table.section_id === section.id);
      return acc;
    }, {});
  }, [sections, filteredTables]);

  // Get unassigned tables
  const unassignedTables = useMemo(() => {
    return filteredTables.filter(table => !table.section_id);
  }, [filteredTables]);

  const handleTableSelect = (table) => {
    if (multipleSelection) {
      const isSelected = tempSelectedTables.some(t => t.id === table.id);
      if (isSelected) {
        setTempSelectedTables(tempSelectedTables.filter(t => t.id !== table.id));
      } else {
        setTempSelectedTables([...tempSelectedTables, table]);
      }
    } else {
      onTableSelect?.(table);
      onClose();
    }
  };

  const handleConfirmMultipleSelection = () => {
    onMultipleTableSelect?.(tempSelectedTables);
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'reserved': return 'warning';
      case 'cleaning': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'occupied': return <PeopleIcon />;
      case 'reserved': return <RestaurantIcon />;
      case 'cleaning': return <AccessTimeIcon />;
      default: return null;
    }
  };

  const getStatusCount = (status) => {
    if (status === 'all') return tables.length;
    return tables.filter(table => table.status === status).length;
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Select Table {multipleSelection && `(Selected: ${tempSelectedTables.length})`}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {orderType === 'dine-in' && (
          <Typography variant="body2" color="text.secondary">
            For {guestCount} guest{guestCount > 1 ? 's' : ''}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Search and Filters */}
        {showFilters && (
          <Box>
            <SearchBox
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
                />
                <FilterChip
                  label={`Available (${getStatusCount('available')})`}
                  active={selectedStatus === 'available'}
                  onClick={() => setSelectedStatus('available')}
                  color="success"
                />
                <FilterChip
                  label={`Occupied (${getStatusCount('occupied')})`}
                  active={selectedStatus === 'occupied'}
                  onClick={() => setSelectedStatus('occupied')}
                  color="error"
                />
                <FilterChip
                  label={`Reserved (${getStatusCount('reserved')})`}
                  active={selectedStatus === 'reserved'}
                  onClick={() => setSelectedStatus('reserved')}
                  color="warning"
                />
              </Box>
            </Box>

            {/* Section Filter */}
            {showSections && sections.length > 0 && (
              <Box mb={2}>
                <FormControl fullWidth size="small">
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
              </Box>
            )}
          </Box>
        )}

        {/* Tabs for different views */}
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="By Sections" />
          <Tab label="Grid View" />
          <Tab label="List View" />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {showSections ? (
            <Box>
              {sections.map((section) => (
                <TableSection
                  key={section.id}
                  section={section}
                  tables={tablesBySection[section.id] || []}
                  onTableSelect={handleTableSelect}
                  compact={true}
                  showActions={false}
                />
              ))}
              {unassignedTables.length > 0 && (
                <TableSection
                  section={{ id: 'unassigned', name: 'Unassigned Tables' }}
                  tables={unassignedTables}
                  onTableSelect={handleTableSelect}
                  compact={true}
                  showActions={false}
                />
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
                md={4}
                lg={3}
              >
                <Table
                  table={table}
                  onSelect={handleTableSelect}
                  compact={true}
                  showMenu={false}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box>
            {filteredTables.map((table) => (
              <Box
                key={table.id}
                sx={{
                  p: 2,
                  mb: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                onClick={() => handleTableSelect(table)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {table.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Capacity: {table.capacity} seats
                      {table.section_name && ` • ${table.section_name}`}
                    </Typography>
                  </Box>
                  <Chip
                    label={table.status}
                    color={getStatusColor(table.status)}
                    size="small"
                    icon={getStatusIcon(table.status)}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* No tables found */}
        {filteredTables.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tables found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search criteria
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        {multipleSelection && (
          <Button
            onClick={handleConfirmMultipleSelection}
            variant="contained"
            disabled={tempSelectedTables.length === 0}
          >
            Select {tempSelectedTables.length} Table{tempSelectedTables.length !== 1 ? 's' : ''}
          </Button>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default TableSelectionDialog;