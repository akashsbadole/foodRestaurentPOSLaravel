# Restaurant POS User Interface Design

## Overview
This document outlines the user interface components and design patterns for the restaurant POS system, building upon the existing InfoShop POS foundation while adding restaurant-specific functionality.

## 1. Restaurant POS Layout Structure

### 1.1 Main Restaurant POS Interface
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Restaurant POS Header                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ Table Management Area                    │          Order Management Area               │
│ ┌─────────────────────────┐             │  ┌─────────────────────────────────────┐ │
│ │   Floor Plan View      │             │  │     Active Orders List              │ │
│ │  ┌───┐ ┌───┐ ┌───┐   │             │  │  ┌─────────────────────────────┐   │ │
│ │  │ T1│ │ T2│ │ T3│   │             │  │  │ Table 5 - Order #1234     │   │ │
│ │  └───┘ └───┘ └───┘   │             │  │  │ Items: 3 | Time: 15m     │   │ │
│ │  ┌───┐ ┌───┐ ┌───┐   │             │  │  │ Status: Preparing          │   │ │
│ │  │ T4│ │ T5│ │ T6│   │             │  │  └─────────────────────────────┘   │ │
│ │  └───┘ └───┘ └───┘   │             │  │  ┌─────────────────────────────┐   │ │
│ │  ┌───┐ ┌───┐ ┌───┐   │             │  │  │ Table 8 - Order #1235     │   │ │
│ │  │ T7│ │ T8│ │ T9│   │             │  │  │ Items: 5 | Time: 25m     │   │ │
│ │  └───┘ └───┘ └───┘   │             │  │  │ Status: Ready              │   │ │
│ └─────────────────────────┘             │  │  └─────────────────────────────┘   │ │
│                                        │  └─────────────────────────────────────┘ │
├─────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Menu & Ordering Area                    │          Cart & Checkout Area            │
│ ┌─────────────────────────────────────┐   │  ┌─────────────────────────────────────┐ │
│ │         Categories                 │   │  │        Current Order               │ │
│ │ [Food] [Beverages] [Desserts]   │   │  │  ┌─────────────────────────────┐   │ │
│ └─────────────────────────────────────┘   │  │  │ Table: T5                   │   │ │
│ ┌─────────────────────────────────────┐   │  │  │ Items: 3                    │   │ │
│ │         Menu Items                │   │  │  │ Total: $45.50               │   │ │
│ │ ┌─────────┐ ┌─────────┐         │   │  │  └─────────────────────────────┘   │ │
│ │ │ Burger  │ │ Pizza   │         │   │  │  ┌─────────────────────────────┐   │ │
│ │ │ $12.99  │ │ $15.99  │         │   │  │  │ Order Items                 │   │ │
│ │ └─────────┘ └─────────┘         │   │  │  │ • Burger x1 ........ $12.99 │ │ │
│ │ ┌─────────┐ ┌─────────┐         │   │  │  │ • Fries x1 ........ $4.99  │ │ │
│ │ │ Fries   │ │ Salad   │         │   │  │  │ • Coke x1 ........ $2.99  │ │ │
│ │ │ $4.99   │ │ $8.99   │         │   │  │  └─────────────────────────────┘   │ │
│ │ └─────────┘ └─────────┘         │   │  │                                     │ │
│ └─────────────────────────────────────┘   │  │  [Add Item] [Modify] [Checkout]     │ │
│                                        │  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────┴─────────────────────────────────────────┘
```

### 1.2 Responsive Layout Adaptation
- **Desktop**: Full three-column layout (Tables, Menu, Cart)
- **Tablet**: Two-column layout with collapsible sections
- **Mobile**: Single-column layout with tab navigation

## 2. Table Management Interface

### 2.1 Floor Plan View Component
```jsx
// FloorPlanView.jsx
const FloorPlanView = () => {
  return (
    <Box className="floor-plan-container">
      <Box className="floor-plan-header">
        <Typography variant="h6">Restaurant Floor Plan</Typography>
        <ButtonGroup size="small">
          <Button onClick={() => setViewMode('tables')}>Tables</Button>
          <Button onClick={() => setViewMode('sections')}>Sections</Button>
          <Button onClick={() => setViewMode('status')}>Status</Button>
        </ButtonGroup>
      </Box>
      
      <Box className="floor-plan-grid">
        {sections.map(section => (
          <Box key={section.id} className="section">
            <Typography variant="subtitle2">{section.name}</Typography>
            {tables.filter(t => t.section_id === section.id).map(table => (
              <TableComponent 
                key={table.id} 
                table={table}
                onClick={() => handleTableClick(table)}
                onLongPress={() => handleTableLongPress(table)}
              />
            ))}
          </Box>
        ))}
      </Box>
      
      <Box className="floor-plan-legend">
        <Chip label="Available" color="success" size="small" />
        <Chip label="Occupied" color="warning" size="small" />
        <Chip label="Reserved" color="info" size="small" />
        <Chip label="Cleaning" color="default" size="small" />
      </Box>
    </Box>
  );
};

// Table Component
const TableComponent = ({ table, onClick, onLongPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4caf50';
      case 'occupied': return '#ff9800';
      case 'reserved': return '#2196f3';
      case 'cleaning': return '#9e9e9e';
      default: return '#f44336';
    }
  };

  return (
    <Box
      className={`table-shape table-${table.shape}`}
      style={{
        backgroundColor: getStatusColor(table.status),
        left: `${table.position_x}px`,
        top: `${table.position_y}px`,
        width: `${table.width}px`,
        height: `${table.height}px`,
      }}
      onClick={() => onClick(table)}
      onTouchStart={() => onLongPress(table)}
    >
      <Typography variant="caption" className="table-number">
        {table.table_number}
      </Typography>
      {table.current_order && (
        <Typography variant="caption" className="order-time">
          {table.current_order.order_time}
        </Typography>
      )}
    </Box>
  );
};
```

### 2.2 Table Details Modal
```jsx
// TableDetailsModal.jsx
const TableDetailsModal = ({ table, open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Table {table.table_number} - {table.name}
        <Chip 
          label={table.status} 
          color={getStatusColor(table.status)}
          size="small"
          sx={{ ml: 2 }}
        />
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Capacity</Typography>
            <Typography>{table.capacity} guests</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Section</Typography>
            <Typography>{table.section?.name}</Typography>
          </Grid>
          
          {table.current_order && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6">Current Order</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Order Number</Typography>
                <Typography>{table.current_order.order_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Customer Count</Typography>
                <Typography>{table.current_order.customer_count}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Items</Typography>
                <List dense>
                  {table.current_order.items.map(item => (
                    <ListItem key={item.id}>
                      <ListItemText 
                        primary={`${item.quantity}x ${item.product.name}`}
                        secondary={`$${item.unit_price}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </>
          )}
          
          {table.reservations?.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6">Reservations</Typography>
              <List dense>
                {table.reservations.map(reservation => (
                  <ListItem key={reservation.id}>
                    <ListItemText 
                      primary={`${reservation.customer_name} - ${reservation.party_size} guests`}
                      secondary={`${reservation.reservation_time} - ${reservation.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        {table.status === 'available' && (
          <>
            <Button onClick={() => handleSeatGuests(table)}>Seat Guests</Button>
            <Button onClick={() => handleReserveTable(table)}>Reserve Table</Button>
          </>
        )}
        {table.status === 'occupied' && (
          <>
            <Button onClick={() => handleViewOrder(table.current_order)}>View Order</Button>
            <Button onClick={() => handleAddToOrder(table.current_order)}>Add Items</Button>
            <Button onClick={() => handleCheckout(table.current_order)}>Checkout</Button>
          </>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
```

## 3. Order Management Interface

### 3.1 Order Taking Component
```jsx
// OrderTakingComponent.jsx
const OrderTakingComponent = ({ table, order, onOrderUpdate }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(1);

  return (
    <Box className="order-taking-container">
      <Box className="order-header">
        <Typography variant="h6">
          Table {table.table_number} - Order {order?.order_number}
        </Typography>
        <Chip label={`Course ${currentCourse}`} color="primary" />
      </Box>

      <Box className="order-items">
        <Typography variant="subtitle2">Order Items</Typography>
        <List>
          {order?.items?.map(item => (
            <OrderItemComponent 
              key={item.id} 
              item={item}
              onModify={() => handleModifyItem(item)}
              onVoid={() => handleVoidItem(item)}
            />
          ))}
        </List>
        
        <Button 
          variant="outlined" 
          onClick={() => setCurrentCourse(currentCourse + 1)}
          startIcon={<AddIcon />}
        >
          Add Next Course
        </Button>
      </Box>

      <Box className="order-actions">
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => handleSendToKitchen(order)}
          disabled={!order?.items?.length}
        >
          Send to Kitchen
        </Button>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => handleCheckout(order)}
        >
          Checkout
        </Button>
      </Box>
    </Box>
  );
};

// Order Item Component
const OrderItemComponent = ({ item, onModify, onVoid }) => {
  return (
    <Card className="order-item-card">
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Typography variant="body1">
              {item.quantity}x {item.product.name}
            </Typography>
            {item.modifiers?.length > 0 && (
              <Typography variant="caption" color="textSecondary">
                {item.modifiers.map(m => m.name).join(', ')}
              </Typography>
            )}
            {item.special_instructions && (
              <Typography variant="caption" color="primary">
                Note: {item.special_instructions}
              </Typography>
            )}
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body1">
              ${item.calculateSubtotal()}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <IconButton size="small" onClick={onModify}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={onVoid}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
```

### 3.2 Menu with Modifiers Component
```jsx
// MenuWithModifiers.jsx
const MenuWithModifiers = ({ onAddToOrder }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modifiersOpen, setModifiersOpen] = useState(false);

  return (
    <Box className="menu-container">
      <Box className="menu-categories">
        <Typography variant="h6">Categories</Typography>
        <ButtonGroup variant="contained" orientation="vertical">
          {categories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory?.id === category.id ? 'contained' : 'outlined'}
            >
              {category.name}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Box className="menu-items">
        <Typography variant="h6">{selectedCategory?.name || 'Select Category'}</Typography>
        <Grid container spacing={2}>
          {selectedCategory?.products?.map(product => (
            <Grid item xs={6} sm={4} md={3} key={product.id}>
              <ProductCard 
                product={product}
                onClick={() => handleProductClick(product)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <ModifierSelectionModal
        open={modifiersOpen}
        product={selectedProduct}
        onClose={() => setModifiersOpen(false)}
        onConfirm={handleAddWithModifiers}
      />
    </Box>
  );
};

// Product Card Component
const ProductCard = ({ product, onClick }) => {
  return (
    <Card 
      className="product-card"
      onClick={() => onClick(product)}
      sx={{ cursor: 'pointer' }}
    >
      {product.image_url && (
        <CardMedia
          component="img"
          height="120"
          image={product.image_url}
          alt={product.name}
        />
      )}
      <CardContent>
        <Typography variant="h6" noWrap>{product.name}</Typography>
        <Typography variant="body2" color="textSecondary" noWrap>
          {product.description}
        </Typography>
        <Typography variant="h6" color="primary">
          ${product.price}
        </Typography>
        {!product.is_available && (
          <Chip label="Unavailable" color="error" size="small" />
        )}
      </CardContent>
    </Card>
  );
};
```

### 3.3 Modifier Selection Modal
```jsx
// ModifierSelectionModal.jsx
const ModifierSelectionModal = ({ open, product, onClose, onConfirm }) => {
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Customize: {product.name}
        <Typography variant="subtitle2" color="textSecondary">
          ${product.price}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box className="modifier-sections">
          {product.modifier_groups?.map(group => (
            <Box key={group.id} className="modifier-group">
              <Typography variant="subtitle1">
                {group.name}
                {group.is_required && <span style={{ color: 'red' }}> *</span>}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {group.selection_type === 'single' ? 'Choose one' : 
                 group.selection_type === 'multiple' ? 'Choose multiple' : 'Optional'}
              </Typography>

              <FormGroup>
                {group.modifiers?.map(modifier => (
                  <FormControlLabel
                    key={modifier.id}
                    control={
                      group.selection_type === 'single' ? (
                        <Radio
                          checked={selectedModifiers.some(m => 
                            m.group_id === group.id && m.modifier_id === modifier.id
                          )}
                          onChange={() => handleModifierSelect(group, modifier)}
                        />
                      ) : (
                        <Checkbox
                          checked={selectedModifiers.some(m => 
                            m.group_id === group.id && m.modifier_id === modifier.id
                          )}
                          onChange={() => handleModifierToggle(group, modifier)}
                        />
                      )
                    }
                    label={
                      <Box>
                        <Typography variant="body1">{modifier.name}</Typography>
                        {modifier.price_adjustment > 0 && (
                          <Typography variant="caption" color="primary">
                            +${modifier.price_adjustment}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          ))}
        </Box>

        <Box className="quantity-section">
          <Typography variant="subtitle1">Quantity</Typography>
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={99}
          />
        </Box>

        <Box className="special-instructions-section">
          <Typography variant="subtitle1">Special Instructions</Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special requests..."
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Box className="price-summary">
          <Typography variant="h6">
            Total: ${calculateTotal()}
          </Typography>
        </Box>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => onConfirm({
            product,
            quantity,
            modifiers: selectedModifiers,
            specialInstructions
          })}
          variant="contained"
          color="primary"
        >
          Add to Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

## 4. Kitchen Display Interface

### 4.1 Kitchen Display System
```jsx
// KitchenDisplaySystem.jsx
const KitchenDisplaySystem = ({ station }) => {
  const [queueItems, setQueueItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <Box className="kitchen-display">
      <Box className="kitchen-header">
        <Typography variant="h4">{station.name}</Typography>
        <Typography variant="subtitle1">
          Queue: {queueItems.filter(i => i.status === 'queued').length} items
        </Typography>
      </Box>

      <Box className="kitchen-queue">
        {queueItems.map(item => (
          <KitchenOrderItem
            key={item.id}
            item={item}
            onSelect={setSelectedItem}
            onUpdate={handleItemUpdate}
          />
        ))}
      </Box>

      <KitchenItemDetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleItemUpdate}
      />
    </Box>
  );
};

// Kitchen Order Item Component
const KitchenOrderItem = ({ item, onSelect, onUpdate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'queued': return 'default';
      case 'in_progress': return 'warning';
      case 'ready': return 'success';
      case 'completed': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Card 
      className={`kitchen-item kitchen-item-${item.status}`}
      onClick={() => onSelect(item)}
      sx={{ mb: 2 }}
    >
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Typography variant="h6">
              Order #{item.order_item.order.order_number}
            </Typography>
            <Typography variant="body1">
              Table {item.order_item.order.table.table_number}
            </Typography>
            <Typography variant="body2">
              {item.order_item.quantity}x {item.order_item.product.name}
            </Typography>
            {item.order_item.modifiers?.length > 0 && (
              <Typography variant="caption" color="textSecondary">
                {item.order_item.modifiers.map(m => m.name).join(', ')}
              </Typography>
            )}
            {item.order_item.special_instructions && (
              <Typography variant="caption" color="primary">
                Note: {item.order_item.special_instructions}
              </Typography>
            )}
          </Grid>
          <Grid item xs={4}>
            <Box className="kitchen-item-controls">
              <Chip 
                label={item.status} 
                color={getStatusColor(item.status)}
                size="small"
              />
              <Chip 
                label={item.priority} 
                color={getPriorityColor(item.priority)}
                size="small"
              />
              <Typography variant="caption">
                {item.estimated_time} min
              </Typography>
              
              <ButtonGroup size="small" orientation="vertical">
                {item.status === 'queued' && (
                  <Button onClick={() => onUpdate(item.id, 'in_progress')}>
                    Start
                  </Button>
                )}
                {item.status === 'in_progress' && (
                  <Button onClick={() => onUpdate(item.id, 'ready')}>
                    Ready
                  </Button>
                )}
                {item.status === 'ready' && (
                  <Button onClick={() => onUpdate(item.id, 'completed')}>
                    Complete
                  </Button>
                )}
              </ButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
```

## 5. Checkout and Payment Interface

### 5.1 Checkout Component
```jsx
// CheckoutComponent.jsx
const CheckoutComponent = ({ order, onComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitType, setSplitType] = useState('single');
  const [splits, setSplits] = useState([]);
  const [tipAmount, setTipAmount] = useState(0);

  return (
    <Dialog open={true} maxWidth="lg" fullWidth>
      <DialogTitle>Checkout - Order #{order.order_number}</DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box className="order-summary">
              <Typography variant="h6">Order Summary</Typography>
              <List>
                {order.items.map(item => (
                  <ListItem key={item.id}>
                    <ListItemText 
                      primary={`${item.quantity}x ${item.product.name}`}
                      secondary={`$${item.calculateSubtotal()}`}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Divider />
              
              <Box className="order-totals">
                <Typography>Subtotal: ${order.subtotal}</Typography>
                <Typography>Tax: ${order.tax_amount}</Typography>
                <Typography>Service Charge: ${order.service_charge}</Typography>
                <Typography variant="h6">Total: ${order.total_amount}</Typography>
              </Box>
            </Box>

            {splitType !== 'single' && (
              <Box className="split-billing">
                <Typography variant="h6">Split Billing</Typography>
                <SplitBillingComponent
                  type={splitType}
                  order={order}
                  splits={splits}
                  onChange={setSplits}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Box className="payment-section">
              <Typography variant="h6">Payment</Typography>
              
              <FormControl component="fieldset">
                <FormLabel component="legend">Split Type</FormLabel>
                <RadioGroup
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value)}
                >
                  <FormControlLabel value="single" control={<Radio />} label="Single Payment" />
                  <FormControlLabel value="equal" control={<Radio />} label="Split Equally" />
                  <FormControlLabel value="item" control={<Radio />} label="Split by Items" />
                </RadioGroup>
              </FormControl>

              <FormControl component="fieldset">
                <FormLabel component="legend">Payment Method</FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel value="cash" control={<Radio />} label="Cash" />
                  <FormControlLabel value="card" control={<Radio />} label="Card" />
                  <FormControlLabel value="mixed" control={<Radio />} label="Mixed" />
                </RadioGroup>
              </FormControl>

              <Box className="tip-section">
                <Typography variant="subtitle1">Tip</Typography>
                <TipCalculator
                  total={order.total_amount}
                  onTipChange={setTipAmount}
                />
              </Box>

              {paymentMethod === 'cash' && (
                <CashPaymentComponent
                  total={order.total_amount + tipAmount}
                  onPayment={handleCashPayment}
                />
              )}

              {paymentMethod === 'card' && (
                <CardPaymentComponent
                  total={order.total_amount + tipAmount}
                  onPayment={handleCardPayment}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onComplete(order)}>Complete Order</Button>
      </DialogActions>
    </Dialog>
  );
};
```

### 5.2 Split Billing Component
```jsx
// SplitBillingComponent.jsx
const SplitBillingComponent = ({ type, order, splits, onChange }) => {
  if (type === 'equal') {
    return <EqualSplit order={order} onChange={onChange} />;
  }
  
  if (type === 'item') {
    return <ItemSplit order={order} onChange={onChange} />;
  }
  
  return null;
};

// Equal Split Component
const EqualSplit = ({ order, onChange }) => {
  const [splitCount, setSplitCount] = useState(2);
  
  const amountPerPerson = (order.total_amount / splitCount).toFixed(2);
  
  return (
    <Box>
      <Typography variant="subtitle2">Number of Splits</Typography>
      <QuantityInput
        value={splitCount}
        onChange={setSplitCount}
        min={2}
        max={20}
      />
      
      <Typography variant="h6">
        ${amountPerPerson} per person
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={() => onChange(
          Array.from({ length: splitCount }, (_, i) => ({
            split_number: i + 1,
            amount: parseFloat(amountPerPerson)
          }))
        )}
      >
        Create Splits
      </Button>
    </Box>
  );
};

// Item Split Component
const ItemSplit = ({ order, onChange }) => {
  const [itemAssignments, setItemAssignments] = useState({});
  
  return (
    <Box>
      <Typography variant="subtitle2">Assign Items to People</Typography>
      {order.items.map(item => (
        <Box key={item.id} className="item-assignment">
          <Typography variant="body1">
            {item.quantity}x {item.product.name}
          </Typography>
          <Select
            value={itemAssignments[item.id] || 1}
            onChange={(e) => setItemAssignments({
              ...itemAssignments,
              [item.id]: e.target.value
            })}
          >
            <MenuItem value={1}>Person 1</MenuItem>
            <MenuItem value={2}>Person 2</MenuItem>
            <MenuItem value={3}>Person 3</MenuItem>
            <MenuItem value={4}>Person 4</MenuItem>
          </Select>
        </Box>
      ))}
    </Box>
  );
};
```

## 6. Reservation Management Interface

### 6.1 Reservation Management Component
```jsx
// ReservationManagement.jsx
const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <Box className="reservation-management">
      <Box className="reservation-header">
        <Typography variant="h4">Reservations</Typography>
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          label="Reservation Date"
        />
        <Button 
          variant="contained"
          onClick={() => setCreateDialogOpen(true)}
          startIcon={<AddIcon />}
        >
          New Reservation
        </Button>
      </Box>

      <Box className="reservation-calendar">
        <ReservationCalendar
          reservations={reservations}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </Box>

      <Box className="reservation-list">
        <Typography variant="h6">
          Reservations for {selectedDate.toLocaleDateString()}
        </Typography>
        <List>
          {reservations
            .filter(r => isSameDay(r.reservation_date, selectedDate))
            .map(reservation => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onEdit={handleEditReservation}
                onCancel={handleCancelReservation}
              />
            ))}
        </List>
      </Box>

      <CreateReservationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateReservation}
      />
    </Box>
  );
};
```

## 7. Responsive Design Considerations

### 7.1 Mobile Adaptations
- **Table View**: Scrollable list instead of floor plan
- **Menu**: Grid layout with larger touch targets
- **Order Entry**: Full-screen modal for item selection
- **Kitchen Display**: Simplified card-based layout

### 7.2 Tablet Optimizations
- **Split Screen**: Table management on left, order entry on right
- **Touch-Friendly**: Larger buttons and gestures
- **Rotation Support**: Landscape for detailed work, portrait for quick tasks

### 7.3 Desktop Enhancements
- **Multi-Monitor**: Kitchen display on separate screen
- **Keyboard Shortcuts**: Quick access to common functions
- **Drag & Drop**: Item reordering and table assignment

## 8. Accessibility Features

### 8.1 Visual Accessibility
- High contrast modes
- Scalable text sizes
- Color-blind friendly palettes
- Clear visual hierarchy

### 8.2 Motor Accessibility
- Large touch targets
- Keyboard navigation support
- Voice control compatibility
- Reduced motion options

### 8.3 Cognitive Accessibility
- Clear error messages
- Consistent terminology
- Progress indicators
- Undo/redo functionality

## 9. Performance Optimizations

### 9.1 Loading Strategies
- Progressive loading for large menus
- Lazy loading for order history
- Optimized image delivery
- Cached component states

### 9.2 Real-time Updates
- WebSocket connections for live updates
- Optimized re-rendering
- Efficient state management
- Minimal API calls

This UI design provides a comprehensive restaurant POS interface that builds upon the existing InfoShop POS foundation while adding specialized restaurant functionality.