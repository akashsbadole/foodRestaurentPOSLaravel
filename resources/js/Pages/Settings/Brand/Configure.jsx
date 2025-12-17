import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Container,
    Grid,
    TextField,
    Button,
    Typography,
    Avatar,
    Stack,
    Divider,
    Alert,
    Snackbar,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const Configure = () => {
    const { brandSettings, flash } = usePage().props;
    const [previewLogo, setPreviewLogo] = useState(brandSettings?.logo_url || null);
    const [uploading, setUploading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        app_name: brandSettings?.app_name || 'DineFlow',
        logo_url: brandSettings?.logo_url || '',
        primary_color: brandSettings?.primary_color || '#3B82F6',
        secondary_color: brandSettings?.secondary_color || '#64748B',
        accent_color: brandSettings?.accent_color || '#EF4444',
        industry_type: brandSettings?.industry_type || 'restaurant',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('brand.settings.update'), {
            onSuccess: () => {
                setSnackbar({
                    open: true,
                    message: 'Brand settings updated successfully!',
                    severity: 'success',
                });
            },
            onError: () => {
                setSnackbar({
                    open: true,
                    message: 'Error updating brand settings.',
                    severity: 'error',
                });
            },
        });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('logo', file);
            
            setUploading(true);
            
            router.post(route('brand.settings.upload-logo'), formData, {
                onSuccess: (page) => {
                    setPreviewLogo(page.props.logo_url);
                    setData('logo_url', page.props.logo_url);
                    setSnackbar({
                        open: true,
                        message: 'Logo uploaded successfully!',
                        severity: 'success',
                    });
                    setUploading(false);
                },
                onError: () => {
                    setSnackbar({
                        open: true,
                        message: 'Error uploading logo.',
                        severity: 'error',
                    });
                    setUploading(false);
                },
                forceFormData: true,
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <AuthenticatedLayout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Brand Configuration
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Customize your application's appearance and branding settings.
                </Typography>

                {flash?.success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {flash.success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Basic Settings */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader title="Basic Settings" />
                                <Divider />
                                <CardContent>
                                    <Stack spacing={3}>
                                        <TextField
                                            fullWidth
                                            label="Application Name"
                                            value={data.app_name}
                                            onChange={(e) => setData('app_name', e.target.value)}
                                            error={!!errors.app_name}
                                            helperText={errors.app_name}
                                            required
                                        />
                                        
                                        <FormControl fullWidth>
                                            <InputLabel id="industry-type-label">Industry Type</InputLabel>
                                            <Select
                                                labelId="industry-type-label"
                                                value={data.industry_type}
                                                label="Industry Type"
                                                onChange={(e) => setData('industry_type', e.target.value)}
                                                error={!!errors.industry_type}
                                            >
                                                <MenuItem value="restaurant">Restaurant</MenuItem>
                                                <MenuItem value="cafe">Cafe</MenuItem>
                                                <MenuItem value="bar">Bar</MenuItem>
                                                <MenuItem value="bakery">Bakery</MenuItem>
                                            </Select>
                                            {errors.industry_type && (
                                                <Typography variant="caption" color="error">
                                                    {errors.industry_type}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Logo Settings */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader title="Logo" />
                                <Divider />
                                <CardContent>
                                    <Stack spacing={3} alignItems="center">
                                        <Avatar
                                            src={previewLogo}
                                            alt="Logo Preview"
                                            variant="rounded"
                                            sx={{ width: 120, height: 120, border: '2px dashed #ccc' }}
                                        />
                                        
                                        <Button
                                            component="label"
                                            variant="outlined"
                                            startIcon={<CloudUploadIcon />}
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload Logo'}
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                            />
                                        </Button>
                                        
                                        <Typography variant="caption" color="text.secondary">
                                            Recommended: Square image, at least 200x200px
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Color Settings */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader title="Color Scheme" />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <Stack spacing={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Primary Color"
                                                    type="color"
                                                    value={data.primary_color}
                                                    onChange={(e) => setData('primary_color', e.target.value)}
                                                    error={!!errors.primary_color}
                                                    helperText={errors.primary_color}
                                                />
                                                <Box
                                                    sx={{
                                                        height: 50,
                                                        backgroundColor: data.primary_color,
                                                        border: '1px solid #ccc',
                                                        borderRadius: 1,
                                                    }}
                                                />
                                            </Stack>
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={6} md={4}>
                                            <Stack spacing={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Secondary Color"
                                                    type="color"
                                                    value={data.secondary_color}
                                                    onChange={(e) => setData('secondary_color', e.target.value)}
                                                    error={!!errors.secondary_color}
                                                    helperText={errors.secondary_color}
                                                />
                                                <Box
                                                    sx={{
                                                        height: 50,
                                                        backgroundColor: data.secondary_color,
                                                        border: '1px solid #ccc',
                                                        borderRadius: 1,
                                                    }}
                                                />
                                            </Stack>
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={6} md={4}>
                                            <Stack spacing={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Accent Color"
                                                    type="color"
                                                    value={data.accent_color}
                                                    onChange={(e) => setData('accent_color', e.target.value)}
                                                    error={!!errors.accent_color}
                                                    helperText={errors.accent_color}
                                                />
                                                <Box
                                                    sx={{
                                                        height: 50,
                                                        backgroundColor: data.accent_color,
                                                        border: '1px solid #ccc',
                                                        borderRadius: 1,
                                                    }}
                                                />
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Preview */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader title="Preview" />
                                <Divider />
                                <CardContent>
                                    <Box
                                        sx={{
                                            p: 3,
                                            border: '1px solid #ccc',
                                            borderRadius: 2,
                                            backgroundColor: '#f5f5f5',
                                        }}
                                    >
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                color: data.primary_color,
                                                mb: 2,
                                            }}
                                        >
                                            {data.app_name}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: data.secondary_color,
                                                mb: 2,
                                            }}
                                        >
                                            This is how your branding will appear in the application.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                backgroundColor: data.primary_color,
                                                '&:hover': {
                                                    backgroundColor: data.accent_color,
                                                },
                                            }}
                                        >
                                            Sample Button
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Actions */}
                        <Grid item xs={12}>
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    onClick={() => reset()}
                                    disabled={processing}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={processing}
                                    sx={{
                                        backgroundColor: data.primary_color,
                                        '&:hover': {
                                            backgroundColor: data.accent_color,
                                        },
                                    }}
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </AuthenticatedLayout>
    );
};

export default Configure;