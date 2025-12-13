import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  useTheme,
  alpha,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  TableRestaurant as TableIcon,
  MeetingRoom as SectionIcon,
  People as CapacityIcon,
  Square as SquareIcon,
  Circle as CircleIcon,
  Rectangle as RectangleIcon,
  Straighten as WidthIcon,
  Height as HeightIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const TablesCreate = ({ currentStore, sections }) => {
  const theme = useTheme();
  const [selectedShape, setSelectedShape] = useState('square');

  const { data, setData, post, processing, errors, reset } = useForm({
    table_number: '',
    name: '',
    capacity: 4,
    section_id: '',
    shape: 'square',
    position_x: 0,
    position_y: 0,
    width: 100,
    height: 100,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!data.table_number.trim()) {
      Swal.fire({
        title: "Missing Table Number!",
        text: "Please enter a table number.",
        icon: "warning",
      });
      return;
    }

    if (data.capacity < 1 || data.capacity > 50) {
      Swal.fire({
        title: "Invalid Capacity!",
        text: "Capacity must be between 1 and 50.",
        icon: "warning",
      });
      return;
    }

    post('/restaurant/tables', data, {
      onSuccess: () => {
        Swal.fire({
          title: "Success!",
          text: "Table created successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        reset();
        setSelectedShape('square');
      },
      onError: (errors) => {
        const errorMessage = errors.message || "Failed to create table.";
        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
        });
      },
    });
  };

  const handleCancel = () => {
    router.get('/restaurant/tables');
  };

  const handleShapeChange = (shape) => {
    setSelectedShape(shape);
    setData('shape', shape);
    
    // Set default dimensions based on shape
    if (shape === 'round') {
      setData('width', 100);
      setData('height', 100);
    } else if (shape === 'rectangle') {
      setData('width', 120);
      setData('height', 80);
    } else {
      setData('width', 100);
      setData('height', 100);
    }
  };

  const ShapeIcon = ({ shape, size = 24 }) => {
    switch (shape) {
      case 'round':
        return <CircleIcon sx={{ fontSize: size }} />;
      case 'rectangle':
        return <RectangleIcon sx={{ fontSize: size }} />;
      default:
        return <SquareIcon sx={{ fontSize: size }} />;
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Create Restaurant Table" />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create Restaurant Table
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add a new table to your restaurant floor plan
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Table Details */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Table Details
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Table Number"
                      value={data.table_number}
                      onChange={(e) => setData('table_number', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TableIcon />
                          </InputAdornment>
                        ),
                      }}
                      error={!!errors.table_number}
                      helperText={errors.table_number}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Table Name (Optional)"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      placeholder="e.g., Window Table, Corner Booth"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Capacity"
                      type="number"
                      value={data.capacity}
                      onChange={(e) => setData('capacity', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1, max: 50 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CapacityIcon />
                          </InputAdornment>
                        ),
                      }}
                      error={!!errors.capacity}
                      helperText={errors.capacity}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Section (Optional)</InputLabel>
                      <Select
                        value={data.section_id}
                        label="Section"
                        onChange={(e) => setData('section_id', e.target.value)}
                      >
                        <MenuItem value="">No Section</MenuItem>
                        {sections && sections.map((section) => (
                          <MenuItem key={section.id} value={section.id}>
                            {section.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes (Optional)"
                      multiline
                      rows={3}
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Any special notes about this table"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Visual Settings */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Visual Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Table Shape
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: selectedShape === 'square' ? `2px solid ${theme.palette.primary.main}` : '1px solid #ddd',
                            bgcolor: selectedShape === 'square' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            textAlign: 'center',
                            p: 2
                          }}
                          onClick={() => handleShapeChange('square')}
                        >
                          <SquareIcon sx={{ fontSize: 32, mb: 1 }} />
                          <Typography variant="body2">Square</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: selectedShape === 'round' ? `2px solid ${theme.palette.primary.main}` : '1px solid #ddd',
                            bgcolor: selectedShape === 'round' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            textAlign: 'center',
                            p: 2
                          }}
                          onClick={() => handleShapeChange('round')}
                        >
                          <CircleIcon sx={{ fontSize: 32, mb: 1 }} />
                          <Typography variant="body2">Round</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: selectedShape === 'rectangle' ? `2px solid ${theme.palette.primary.main}` : '1px solid #ddd',
                            bgcolor: selectedShape === 'rectangle' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            textAlign: 'center',
                            p: 2
                          }}
                          onClick={() => handleShapeChange('rectangle')}
                        >
                          <RectangleIcon sx={{ fontSize: 32, mb: 1 }} />
                          <Typography variant="body2">Rectangle</Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Dimensions (for floor plan)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Width"
                          type="number"
                          value={data.width}
                          onChange={(e) => setData('width', parseInt(e.target.value) || 100)}
                          inputProps={{ min: 50, max: 300 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <WidthIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Height"
                          type="number"
                          value={data.height}
                          onChange={(e) => setData('height', parseInt(e.target.value) || 100)}
                          inputProps={{ min: 50, max: 300 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <HeightIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Position will be set when you place the table on the floor plan.
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Actions */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Actions
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={processing}
                    fullWidth
                  >
                    Create Table
                  </Button>
                </Box>
              </Paper>

              {/* Preview */}
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Preview
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 200,
                    bgcolor: alpha(theme.palette.grey[500], 0.1),
                    borderRadius: 1,
                    border: `1px dashed ${theme.palette.grey[400]}`
                  }}
                >
                  <Box
                    sx={{
                      width: Math.min(data.width, 150),
                      height: Math.min(data.height, 150),
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: selectedShape === 'round' ? '50%' : '8px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <ShapeIcon shape={selectedShape} size={32} />
                    <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>
                      {data.table_number || 'Table #'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {data.capacity} seats
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>
      </Box>
    </AuthenticatedLayout>
  );
};

export default TablesCreate;