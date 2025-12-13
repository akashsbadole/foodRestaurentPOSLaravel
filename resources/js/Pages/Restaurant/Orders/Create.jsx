import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Divider,
  Tabs,
  Tab,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  RestaurantMenu as MenuIcon,
  TableRestaurant as TableIcon,
  Person as CustomerIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const OrdersCreate = ({ currentStore, tables, customers }) => {
  const theme = useTheme();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState('dine_in');

  const { data, setData, post, processing, errors, reset } = useForm({
    table_id: '',
    order_type: 'dine_in',
    customer_count: 1,
    waiter_id: '',
    contact_id: '',
    priority: 'normal',
    special_instructions: '',
    estimated_time: '',
    items: []
  });

  useEffect(() => {
    // Load products for search
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    // This would typically be an API call to get products
    // For now, we'll use a mock array
    const mockProducts = [
      { id: 1, name: 'Burger', price: 12.99, cost: 5.50, category: 'Main Course' },
      { id: 2, name: 'Pizza', price: 15.99, cost: 7.00, category: 'Main Course' },
      { id: 3, name: 'Salad', price: 8.99, cost: 3.50, category: 'Appetizer' },
      { id: 4, name: 'Soup', price: 6.99, cost: 2.50, category: 'Appetizer' },
      { id: 5, name: 'Pasta', price: 13.99, cost: 6.00, category: 'Main Course' },
      { id: 6, name: 'Soda', price: 2.99, cost: 0.50, category: 'Beverage' },
      { id: 7, name: 'Coffee', price: 3.99, cost: 0.75, category: 'Beverage' },
      { id: 8, name: 'Dessert', price: 5.99, cost: 2.00, category: 'Dessert' }
    ];
    setAvailableProducts(mockProducts);
  };

  const handleProductSearch = () => {
    if (productSearchTerm.trim()) {
      // This would typically be an API call to search products
      const filtered = availableProducts.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
      setAvailableProducts(filtered);
      setProductDialogOpen(true);
    }
  };

  const handleAddProduct = (product) => {
    const newItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      unit_cost: product.cost,
      discount: 0,
      special_instructions: '',
      modifiers: []
    };
    
    setSelectedProducts([...selectedProducts, newItem]);
    setData('items', [...selectedProducts, newItem]);
    setProductDialogOpen(false);
    setProductSearchTerm('');
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updatedProducts);
    setData('items', updatedProducts);
  };

  const handleUpdateProductQuantity = (index, quantity) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = parseFloat(quantity) || 1;
    setSelectedProducts(updatedProducts);
    setData('items', updatedProducts);
  };

  const handleUpdateProductPrice = (index, price) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].unit_price = parseFloat(price) || 0;
    setSelectedProducts(updatedProducts);
    setData('items', updatedProducts);
  };

  const handleCustomerSearch = () => {
    if (customerSearchTerm.trim()) {
      // This would typically be an API call to search customers
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phone.includes(customerSearchTerm)
      );
      setAvailableCustomers(filtered);
      setCustomerDialogOpen(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setData('contact_id', customer.id);
    setCustomerDialogOpen(false);
    setCustomerSearchTerm('');
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const calculateTax = () => {
    // Assuming 10% tax rate
    return calculateSubtotal() * 0.1;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      Swal.fire({
        title: "No Items!",
        text: "Please add at least one item to the order.",
        icon: "warning",
      });
      return;
    }

    post('/restaurant/orders', {
      onSuccess: () => {
        Swal.fire({
          title: "Success!",
          text: "Order created successfully.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        reset();
        setSelectedProducts([]);
      },
      onError: (errors) => {
        const errorMessage = errors.message || "Failed to create order.";
        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
        });
      },
    });
  };

  const handleCancel = () => {
    router.get('/restaurant/orders');
  };

  return (
    <AuthenticatedLayout>
      <Head title="Create Restaurant Order" />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create Restaurant Order
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add a new restaurant order with items and customer details
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Order Details */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Order Details
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Order Type</InputLabel>
                      <Select
                        value={data.order_type}
                        label="Order Type"
                        onChange={(e) => {
                          setData('order_type', e.target.value);
                          setOrderType(e.target.value);
                        }}
                      >
                        <MenuItem value="dine_in">Dine In</MenuItem>
                        <MenuItem value="takeaway">Takeaway</MenuItem>
                        <MenuItem value="delivery">Delivery</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={data.priority}
                        label="Priority"
                        onChange={(e) => setData('priority', e.target.value)}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {orderType === 'dine_in' && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Table</InputLabel>
                        <Select
                          value={data.table_id}
                          label="Table"
                          onChange={(e) => setData('table_id', e.target.value)}
                        >
                          {tables && tables.map((table) => (
                            <MenuItem key={table.id} value={table.id}>
                              {table.name || `Table ${table.table_number}`} (Capacity: {table.capacity})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Customer Count"
                      type="number"
                      value={data.customer_count}
                      onChange={(e) => setData('customer_count', e.target.value)}
                      inputProps={{ min: 1, max: 50 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Estimated Time (minutes)"
                      type="number"
                      value={data.estimated_time}
                      onChange={(e) => setData('estimated_time', e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Special Instructions"
                      multiline
                      rows={3}
                      value={data.special_instructions}
                      onChange={(e) => setData('special_instructions', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Order Items */}
              <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="medium">
                    Order Items
                  </Typography>
                  <Box display="flex" gap={2}>
                    <TextField
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleProductSearch}
                    >
                      Search
                    </Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {selectedProducts.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedProducts.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body1" fontWeight="medium">
                                {item.product_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateProductQuantity(index, e.target.value)}
                                inputProps={{ min: 0.01, step: 0.01 }}
                                size="small"
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => handleUpdateProductPrice(index, e.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                                size="small"
                                sx={{ width: 100 }}
                                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" fontWeight="medium">
                                ${(item.quantity * item.unit_price).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                color="error"
                                onClick={() => handleRemoveProduct(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.secondary">
                      No items added to the order. Search and add products above.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Customer & Summary */}
            <Grid item xs={12} md={4}>
              {/* Customer Selection */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Customer Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box mb={2}>
                  <TextField
                    fullWidth
                    placeholder="Search customers..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    onClick={handleCustomerSearch}
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    Search Customer
                  </Button>
                </Box>

                {selectedCustomer && (
                  <Box mt={2} p={2} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedCustomer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCustomer.phone}
                    </Typography>
                    {selectedCustomer.email && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedCustomer.email}
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>

              {/* Order Summary */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Order Summary
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">${calculateSubtotal().toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Tax (10%):</Typography>
                    <Typography variant="body2">${calculateTax().toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      ${calculateTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

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
                    disabled={processing || selectedProducts.length === 0}
                    fullWidth
                  >
                    Create Order
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>

        {/* Product Search Dialog */}
        <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Select Product</DialogTitle>
          <DialogContent>
            <List>
              {availableProducts.map((product) => (
                <ListItem key={product.id}>
                  <ListItemButton onClick={() => handleAddProduct(product)}>
                    <ListItemText
                      primary={product.name}
                      secondary={`${product.category} - $${product.price}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Customer Search Dialog */}
        <Dialog open={customerDialogOpen} onClose={() => setCustomerDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Select Customer</DialogTitle>
          <DialogContent>
            <List>
              {customers && customers.map((customer) => (
                <ListItem key={customer.id}>
                  <ListItemButton onClick={() => handleSelectCustomer(customer)}>
                    <ListItemText
                      primary={customer.name}
                      secondary={customer.phone}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AuthenticatedLayout>
  );
};

export default OrdersCreate;