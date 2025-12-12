import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Zoom,
  Fab,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import TableSection from './TableSection';
import Table from './Table';

const FloorPlanContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  minHeight: '600px',
  transition: 'all 0.3s ease',
}));

const FloorPlanCanvas = styled(Box)(({ theme, scale, showGrid }) => ({
  transform: `scale(${scale})`,
  transformOrigin: 'top left',
  transition: 'transform 0.3s ease',
  position: 'relative',
  minHeight: '600px',
  backgroundImage: showGrid
    ? `repeating-linear-gradient(
        0deg,
        ${theme.palette.divider},
        ${theme.palette.divider} 1px,
        transparent 1px,
        transparent 40px
      ),
      repeating-linear-gradient(
        90deg,
        ${theme.palette.divider},
        ${theme.palette.divider} 1px,
        transparent 1px,
        transparent 40px
      )`
    : 'none',
  backgroundSize: '40px 40px',
  padding: theme.spacing(2),
}));

const ZoomControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  zIndex: 1000,
}));

const TablePosition = styled(Box)(({ theme, x, y }) => ({
  position: 'absolute',
  left: `${x}px`,
  top: `${y}px`,
  transform: 'translate(-50%, -50%)',
}));

const TableFloorPlan = ({
  sections = [],
  tables = [],
  onTableSelect,
  onTableStatusChange,
  onTableEdit,
  onSectionEdit,
  onAddTable,
  onEditLayout,
  viewMode = 'sections', // 'sections', 'grid', 'list'
  showControls = true,
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [scale, setScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Group tables by section
  const tablesBySection = useMemo(() => {
    return sections.reduce((acc, section) => {
      acc[section.id] = tables.filter(table => table.section_id === section.id);
      return acc;
    }, {});
  }, [sections, tables]);

  // Get tables without sections (unassigned)
  const unassignedTables = useMemo(() => {
    return tables.filter(table => !table.section_id);
  }, [tables]);

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const getFloorPlanStats = () => {
    const totalTables = tables.length;
    const occupiedTables = tables.filter(table => table.status === 'occupied').length;
    const availableTables = tables.filter(table => table.status === 'available').length;
    const reservedTables = tables.filter(table => table.status === 'reserved').length;
    const totalCapacity = tables.reduce((sum, table) => sum + (table.capacity || 0), 0);
    const occupiedSeats = tables
      .filter(table => table.status === 'occupied')
      .reduce((sum, table) => sum + (table.guest_count || 0), 0);

    return {
      totalTables,
      occupiedTables,
      availableTables,
      reservedTables,
      totalCapacity,
      occupiedSeats,
      occupancyRate: totalCapacity > 0 ? (occupiedSeats / totalCapacity * 100).toFixed(1) : 0
    };
  };

  const stats = getFloorPlanStats();

  // Render different view modes
  const renderView = () => {
    switch (viewMode) {
      case 'grid':
        return (
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
                  compact={compact}
                />
              </Grid>
            ))}
          </Grid>
        );

      case 'list':
        return (
          <Box>
            {sections.map((section) => (
              <TableSection
                key={section.id}
                section={section}
                tables={tablesBySection[section.id] || []}
                onTableSelect={onTableSelect}
                onTableStatusChange={onTableStatusChange}
                onTableEdit={onTableEdit}
                onSectionEdit={onSectionEdit}
                onAddTable={onAddTable}
                compact={compact}
                showActions={false}
              />
            ))}
            {unassignedTables.length > 0 && (
              <TableSection
                section={{ id: 'unassigned', name: 'Unassigned Tables', description: 'Tables not assigned to any section' }}
                tables={unassignedTables}
                onTableSelect={onTableSelect}
                onTableStatusChange={onTableStatusChange}
                onTableEdit={onTableEdit}
                compact={compact}
                showActions={false}
              />
            )}
          </Box>
        );

      case 'sections':
      default:
        return (
          <Box>
            {sections.map((section) => (
              <TableSection
                key={section.id}
                section={section}
                tables={tablesBySection[section.id] || []}
                onTableSelect={onTableSelect}
                onTableStatusChange={onTableStatusChange}
                onTableEdit={onTableEdit}
                onSectionEdit={onSectionEdit}
                onAddTable={onAddTable}
                compact={compact}
              />
            ))}
            {unassignedTables.length > 0 && (
              <TableSection
                section={{ id: 'unassigned', name: 'Unassigned Tables', description: 'Tables not assigned to any section' }}
                tables={unassignedTables}
                onTableSelect={onTableSelect}
                onTableStatusChange={onTableStatusChange}
                onTableEdit={onTableEdit}
                onAddTable={onAddTable}
                compact={compact}
              />
            )}
          </Box>
        );
    }
  };

  return (
    <FloorPlanContainer
      elevation={isFullscreen ? 0 : 2}
      sx={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : 'auto',
        height: isFullscreen ? '100vh' : 'auto',
        zIndex: isFullscreen ? theme.zIndex.modal : 'auto',
      }}
    >
      {/* Header with stats */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight="bold">
              Restaurant Floor Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.totalTables} tables • {stats.occupiedTables} occupied • {stats.availableTables} available
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant={viewMode === 'sections' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {}}
              >
                Sections
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {}}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {}}
              >
                List
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Quick stats */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                {stats.occupancyRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Occupancy Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary.main">
                {stats.occupiedSeats}/{stats.totalCapacity}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Seats Occupied
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">
                {stats.reservedTables}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Reserved
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="info.main">
                {stats.totalTables}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Tables
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Zoom controls */}
      {showControls && (
        <ZoomControls>
          <Tooltip title="Zoom In">
            <Fab size="small" onClick={handleZoomIn}>
              <ZoomInIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <Fab size="small" onClick={handleZoomOut}>
              <ZoomOutIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <Fab size="small" onClick={handleResetZoom}>
              <RefreshIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Toggle Grid">
            <Fab size="small" onClick={toggleGrid} color={showGrid ? 'primary' : 'default'}>
              {showGrid ? <GridOnIcon /> : <GridOffIcon />}
            </Fab>
          </Tooltip>
          <Tooltip title="Toggle Fullscreen">
            <Fab size="small" onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </Fab>
          </Tooltip>
          {onEditLayout && (
            <Tooltip title="Edit Layout">
              <Fab size="small" onClick={onEditLayout} color="secondary">
                <EditIcon />
              </Fab>
            </Tooltip>
          )}
        </ZoomControls>
      )}

      {/* Floor plan canvas */}
      <FloorPlanCanvas scale={scale} showGrid={showGrid}>
        {renderView()}
      </FloorPlanCanvas>

      {/* Exit fullscreen button */}
      {isFullscreen && (
        <Box
          sx={{
            position: 'absolute',
            bottom: theme.spacing(2),
            right: theme.spacing(2),
          }}
        >
          <Button
            variant="contained"
            startIcon={<FullscreenExitIcon />}
            onClick={toggleFullscreen}
          >
            Exit Fullscreen
          </Button>
        </Box>
      )}
    </FloorPlanContainer>
  );
};

export default TableFloorPlan;