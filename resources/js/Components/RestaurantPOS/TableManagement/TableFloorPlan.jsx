import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  useMediaQuery,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ViewComfy as ViewComfyIcon,
  TouchApp as TouchAppIcon,
  PanTool as PanToolIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../../../Components/ThemeProvider';
import TableSection from './TableSection';
import Table from './Table';

const FloorPlanContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  backgroundImage: theme.palette.background.defaultGradient,
  minHeight: '400px',
  height: 'auto',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  touchAction: 'manipulation', // Improve touch performance
  boxShadow: theme.shadows?.[2] || '0 4px 12px rgba(30, 58, 95, 0.1), 0 2px 6px rgba(30, 58, 95, 0.06)',
  '&:hover': {
    boxShadow: theme.shadows?.[4] || '0 8px 24px rgba(30, 58, 95, 0.12), 0 4px 8px rgba(30, 58, 95, 0.08)',
  }
}));

const FloorPlanCanvas = styled(Box, {
  shouldForwardProp: (prop) => !['showGrid', 'isDragging'].includes(prop),
})(({ theme, scale, showGrid, isDragging }) => ({
  transform: `scale(${scale})`,
  transformOrigin: 'top left',
  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  minHeight: '600px',
  cursor: isDragging ? 'grabbing' : 'grab',
  userSelect: 'none', // Prevent text selection during drag
  touchAction: 'none', // Allow touch manipulation
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
  padding: theme.spacing(3),
  borderRadius: theme.shape?.borderRadius || 8,
}));

const ZoomControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing?.(2) || 8,
  right: theme.spacing?.(2) || 8,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing?.(1) || 4,
  zIndex: 1000,
  '& .MuiFab-root': {
    background: theme.palette?.mode === 'dark'
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    color: theme.palette?.primary?.main || '#1976d2',
    boxShadow: '0 2px 8px rgba(30, 58, 95, 0.15)',
    border: `1px solid ${theme.palette?.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
    width: 48,
    height: 48,
    '&:hover': {
      background: theme.palette?.mode === 'dark'
        ? 'linear-gradient(135deg, #334155 0%, #475569 100%)'
        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)',
    }
  }
}));

const TablePosition = styled(Box)(({ theme, x, y, isDragging }) => ({
  position: 'absolute',
  left: `${x}px`,
  top: `${y}px`,
  transform: 'translate(-50%, -50%)',
  cursor: isDragging ? 'grabbing' : 'grab',
  touchAction: 'manipulation',
  '&:hover': {
    transform: 'translate(-50%, -50%) scale(1.05)',
    zIndex: 10,
  },
  transition: isDragging ? 'none' : 'transform 0.2s ease',
}));

const TouchIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: 'rgba(49, 130, 206, 0.2)',
  border: '2px solid #3182ce',
  pointerEvents: 'none',
  opacity: 0,
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'translate(-50%, -50%) scale(0.8)',
      opacity: 0.8,
    },
    '50%': {
      transform: 'translate(-50%, -50%) scale(1.2)',
      opacity: 0.4,
    },
    '100%': {
      transform: 'translate(-50%, -50%) scale(0.8)',
      opacity: 0.8,
    },
  },
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
  const { isDarkMode } = useThemeContext();
  // Using Tailwind breakpoint values for consistency
  const isMobile = useMediaQuery('(max-width: 767px)'); // Tailwind 'md' breakpoint
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [touchEnabled, setTouchEnabled] = useState(true);
  const [autoZoom, setAutoZoom] = useState(false);
  const [tableSize, setTableSize] = useState(isMobile ? 'small' : 'medium');

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

  // Auto-zoom to fit content
  useEffect(() => {
    if (!autoZoom || !canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    const canvas = canvasRef.current;

    if (container && canvas) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const canvasWidth = canvas.scrollWidth;
      const canvasHeight = canvas.scrollHeight;

      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;
      const newScale = Math.min(scaleX, scaleY, 1.5); // Max 1.5x zoom

      setScale(newScale);
    }
  }, [autoZoom, tables, sections]);

  // Touch gesture handlers
  const handleTouchStart = (e) => {
    if (!touchEnabled) return;

    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - canvasOffset.x,
      y: touch.clientY - canvasOffset.y
    });
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !touchEnabled) return;

    e.preventDefault();
    const touch = e.touches[0];
    const newOffset = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    };

    setCanvasOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e) => {
    if (e.target.closest('.MuiButtonBase-root') || e.target.closest('.MuiIconButton-root')) return;

    setDragStart({
      x: e.clientX - canvasOffset.x,
      y: e.clientY - canvasOffset.y
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };

    setCanvasOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Global mouse event listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, canvasOffset]);

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
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
                  size={tableSize}
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
                size={tableSize}
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
                size={tableSize}
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
        zIndex: isFullscreen ? theme.zIndex?.modal || 1300 : 'auto',
      }}
    >
      {/* Header with stats */}
      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          backgroundColor: 'background.paper',
          background: isDarkMode
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          boxShadow: '0 2px 8px rgba(30, 58, 95, 0.15)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant={{ xs: 'h6', sm: 'h5' }}
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
                onClick={() => { }}
                sx={{
                  borderColor: 'primary.main',
                  color: viewMode === 'sections' ? 'primary.contrastText' : 'primary.main',
                  backgroundColor: viewMode === 'sections' ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: viewMode === 'sections' ? 'primary.dark' : 'rgba(30, 58, 95, 0.1)',
                  }
                }}
              >
                <ViewModuleIcon sx={{ mr: 0.5 }} />
                {isMobile ? '' : 'Sections'}
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => { }}
                sx={{
                  borderColor: 'primary.main',
                  color: viewMode === 'grid' ? 'primary.contrastText' : 'primary.main',
                  backgroundColor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: viewMode === 'grid' ? 'primary.dark' : 'rgba(30, 58, 95, 0.1)',
                  }
                }}
              >
                <GridOnIcon sx={{ mr: 0.5 }} />
                {isMobile ? '' : 'Grid'}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => { }}
                sx={{
                  borderColor: 'primary.main',
                  color: viewMode === 'list' ? 'primary.contrastText' : 'primary.main',
                  backgroundColor: viewMode === 'list' ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: viewMode === 'list' ? 'primary.dark' : 'rgba(30, 58, 95, 0.1)',
                  }
                }}
              >
                <ViewListIcon sx={{ mr: 0.5 }} />
                {isMobile ? '' : 'List'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Quick stats */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
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
                {stats.occupancyRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Occupancy Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              textAlign="center"
              sx={{
                p: 1,
                borderRadius: 1,
                backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.1)' : 'rgba(30, 58, 95, 0.05)',
                border: `1px solid ${isDarkMode ? 'rgba(30, 58, 95, 0.3)' : 'rgba(30, 58, 95, 0.2)'}`,
              }}
            >
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {stats.occupiedSeats}/{stats.totalCapacity}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Seats Occupied
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
                {stats.reservedTables}
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
          <Tooltip title="Settings">
            <Fab size="small" onClick={() => setSettingsDrawerOpen(true)} color="secondary">
              <FilterIcon />
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

      {/* Touch indicator for mobile */}
      {isMobile && touchEnabled && (
        <TouchIndicator />
      )}

      {/* Floor plan canvas */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          touchAction: touchEnabled ? 'pan-x pan-y pinch-zoom' : 'auto',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <FloorPlanCanvas
          ref={canvasRef}
          scale={scale}
          showGrid={showGrid}
          isDragging={isDragging}
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`,
          }}
        >
          {renderView()}
        </FloorPlanCanvas>
      </Box>

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
            sx={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%)'
                : 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
              '&:hover': {
                background: isDarkMode
                  ? 'linear-gradient(135deg, #2c5282 0%, #3182ce 100%)'
                  : 'linear-gradient(135deg, #2c5282 0%, #1e3a5f 100%)',
              }
            }}
          >
            Exit Fullscreen
          </Button>
        </Box>
      )}

      {/* Settings Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        onOpen={() => setSettingsDrawerOpen(true)}
        PaperProps={{
          sx: {
            width: 300,
            backgroundColor: 'background.paper',
            borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Floor Plan Settings
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <TouchAppIcon />
              </ListItemIcon>
              <ListItemText
                primary="Touch Gestures"
                secondary="Enable touch interactions"
              />
              <Switch
                checked={touchEnabled}
                onChange={(e) => setTouchEnabled(e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ZoomInIcon />
              </ListItemIcon>
              <ListItemText
                primary="Auto Zoom"
                secondary="Fit content to screen"
              />
              <Switch
                checked={autoZoom}
                onChange={(e) => setAutoZoom(e.target.checked)}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="Table Size"
                secondary="Adjust table display size"
              />
            </ListItem>
            <ListItem sx={{ pt: 0 }}>
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={tableSize}
                  label="Size"
                  onChange={(e) => setTableSize(e.target.value)}
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Zoom Level"
                secondary={`${Math.round(scale * 100)}%`}
              />
            </ListItem>
            <ListItem sx={{ pt: 0 }}>
              <Slider
                value={scale}
                min={0.5}
                max={2}
                step={0.1}
                onChange={(e, value) => setScale(value)}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                  { value: 1.5, label: '150%' },
                  { value: 2, label: '200%' },
                ]}
              />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>
    </FloorPlanContainer>
  );
};

export default TableFloorPlan;
