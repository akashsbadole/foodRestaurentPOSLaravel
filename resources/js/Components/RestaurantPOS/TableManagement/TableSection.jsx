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
import { useThemeContext } from '../../../Components/ThemeProvider';
import Table from './Table';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
  border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark'
      ? '0 6px 16px rgba(30, 58, 95, 0.3)'
      : '0 6px 16px rgba(30, 58, 95, 0.15)',
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(96, 165, 250, 0.1)'
      : 'rgba(30, 58, 95, 0.1)',
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
  const { isDarkMode } = useThemeContext();
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
          <IconButton
            size="small"
            sx={{
              backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)',
              }
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          
          <Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #60a5fa 0%, #3182ce 100%)'
                  : 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
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
            sx={{
              backgroundColor: stats.available > 0
                ? isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'
                : isDarkMode ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)',
              color: stats.available > 0 ? 'success.contrastText' : 'text.secondary',
            }}
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
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  color: 'success.main',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  }
                }}
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
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.1)',
                  }
                }}
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
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </SectionHeader>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />
        <CardContent sx={{ pt: 2 }}>
          {tables.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              py={4}
              color="text.secondary"
              sx={{
                backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.05)' : 'rgba(30, 58, 95, 0.02)',
                borderRadius: 2,
                border: `1px dashed ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              }}
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
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                    }
                  }}
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
            <Box
              mt={3}
              pt={2}
              borderTop={`1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`}
              sx={{
                backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.05)' : 'rgba(30, 58, 95, 0.02)',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #60a5fa 0%, #3182ce 100%)'
                    : 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600
                }}
              >
                Section Statistics
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Box
                    textAlign="center"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                    }}
                  >
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {stats.available}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    textAlign="center"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                    }}
                  >
                    <Typography variant="h6" color="error.main" fontWeight="bold">
                      {stats.occupied}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Occupied
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    textAlign="center"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
                    }}
                  >
                    <Typography variant="h6" color="warning.main" fontWeight="bold">
                      {stats.reserved}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reserved
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    textAlign="center"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    }}
                  >
                    <Typography variant="h6" color="info.main" fontWeight="bold">
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