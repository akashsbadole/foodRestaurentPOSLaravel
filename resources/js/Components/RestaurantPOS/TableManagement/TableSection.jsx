import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Collapse,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Table from './Table';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const TableSection = ({
  section,
  tables = [],
  onTableSelect,
  onTableStatusChange,
  onTableEdit,
  onSectionEdit,
  onSectionDelete,
  onAddTable,
  expanded: controlledExpanded,
  onExpandedChange,
  showActions = true,
  compact = false
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggleExpanded = () => {
    const newExpanded = !expanded;
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const getTableStats = () => {
    const total = tables.length;
    const occupied = tables.filter(table => table.status === 'occupied').length;
    const available = tables.filter(table => table.status === 'available').length;
    const reserved = tables.filter(table => table.status === 'reserved').length;
    const cleaning = tables.filter(table => table.status === 'cleaning').length;

    return { total, occupied, available, reserved, cleaning };
  };

  const stats = getTableStats();

  const getStatusColor = (count) => {
    if (count === 0) return 'default';
    if (count > 0 && count <= 2) return 'warning';
    return 'error';
  };

  return (
    <StyledCard>
      <SectionHeader onClick={handleToggleExpanded}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {section.name}
            </Typography>
            {section.description && (
              <Typography variant="body2" color="text.secondary">
                {section.description}
              </Typography>
            )}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={`${stats.available}/${stats.total} available`}
            color={stats.available > 0 ? 'success' : 'default'}
            size="small"
          />
          
          {stats.occupied > 0 && (
            <Chip
              label={`${stats.occupied} occupied`}
              color={getStatusColor(stats.occupied)}
              size="small"
            />
          )}

          {showActions && (
            <Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTable?.(section.id);
                }}
                title="Add Table"
              >
                <AddIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionEdit?.(section);
                }}
                title="Edit Section"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionDelete?.(section.id);
                }}
                title="Delete Section"
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </SectionHeader>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          {tables.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              py={4}
              color="text.secondary"
            >
              <Typography variant="body1" gutterBottom>
                No tables in this section
              </Typography>
              {showActions && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => onAddTable?.(section.id)}
                  size="small"
                >
                  Add First Table
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {tables.map((table) => (
                <Grid
                  key={table.id}
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  xl={2}
                >
                  <Table
                    table={table}
                    onSelect={onTableSelect}
                    onStatusChange={onTableStatusChange}
                    onEdit={onTableEdit}
                    showMenu={showActions}
                    compact={compact}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Section Statistics */}
          {!compact && tables.length > 0 && (
            <Box mt={3} pt={2} borderTop="1px solid">
              <Typography variant="subtitle2" gutterBottom>
                Section Statistics
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {stats.available}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="error.main">
                      {stats.occupied}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Occupied
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main">
                      {stats.reserved}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reserved
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="info.main">
                      {stats.cleaning}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cleaning
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </StyledCard>
  );
};

export default TableSection;