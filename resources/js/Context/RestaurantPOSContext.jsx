import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

const RestaurantPOSContext = createContext();

// Initial state for restaurant POS
const initialState = {
  // Table management
  tables: [],
  selectedTable: null,
  tableSections: [],
  
  // Order management
  orders: [],
  currentOrder: null,
  orderType: 'dine-in', // 'dine-in', 'takeaway', 'delivery'
  
  // Kitchen display
  kitchenOrders: [],
  kitchenStations: [],
  
  // Checkout
  checkoutData: {
    splitBill: false,
    splitItems: [],
    tips: 0,
    paymentMethod: 'cash'
  },
  
  // Reservations
  reservations: [],
  selectedReservation: null,
  
  // UI state
  loading: false,
  error: null,
  activeView: 'tables' // 'tables', 'orders', 'kitchen', 'checkout', 'reservations'
};

// Action types
const ACTIONS = {
  // Table management
  SET_TABLES: 'SET_TABLES',
  SELECT_TABLE: 'SELECT_TABLE',
  UPDATE_TABLE_STATUS: 'UPDATE_TABLE_STATUS',
  SET_TABLE_SECTIONS: 'SET_TABLE_SECTIONS',
  
  // Order management
  SET_ORDERS: 'SET_ORDERS',
  SET_CURRENT_ORDER: 'SET_CURRENT_ORDER',
  ADD_ORDER_ITEM: 'ADD_ORDER_ITEM',
  UPDATE_ORDER_ITEM: 'UPDATE_ORDER_ITEM',
  REMOVE_ORDER_ITEM: 'REMOVE_ORDER_ITEM',
  SET_ORDER_TYPE: 'SET_ORDER_TYPE',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  
  // Kitchen display
  SET_KITCHEN_ORDERS: 'SET_KITCHEN_ORDERS',
  SET_KITCHEN_STATIONS: 'SET_KITCHEN_STATIONS',
  UPDATE_KITCHEN_ORDER_STATUS: 'UPDATE_KITCHEN_ORDER_STATUS',
  
  // Checkout
  SET_SPLIT_BILL: 'SET_SPLIT_BILL',
  ADD_SPLIT_ITEM: 'ADD_SPLIT_ITEM',
  REMOVE_SPLIT_ITEM: 'REMOVE_SPLIT_ITEM',
  SET_TIPS: 'SET_TIPS',
  SET_PAYMENT_METHOD: 'SET_PAYMENT_METHOD',
  
  // Reservations
  SET_RESERVATIONS: 'SET_RESERVATIONS',
  SELECT_RESERVATION: 'SELECT_RESERVATION',
  ADD_RESERVATION: 'ADD_RESERVATION',
  UPDATE_RESERVATION: 'UPDATE_RESERVATION',
  DELETE_RESERVATION: 'DELETE_RESERVATION',
  
  // UI state
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const restaurantPOSReducer = (state, action) => {
  switch (action.type) {
    // Table management
    case ACTIONS.SET_TABLES:
      return { ...state, tables: action.payload };
    
    case ACTIONS.SELECT_TABLE:
      return { ...state, selectedTable: action.payload };
    
    case ACTIONS.UPDATE_TABLE_STATUS:
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === action.payload.tableId
            ? { ...table, status: action.payload.status }
            : table
        )
      };
    
    case ACTIONS.SET_TABLE_SECTIONS:
      return { ...state, tableSections: action.payload };
    
    // Order management
    case ACTIONS.SET_ORDERS:
      return { ...state, orders: action.payload };
    
    case ACTIONS.SET_CURRENT_ORDER:
      return { ...state, currentOrder: action.payload };
    
    case ACTIONS.ADD_ORDER_ITEM:
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: [...(state.currentOrder?.items || []), action.payload]
        }
      };
    
    case ACTIONS.UPDATE_ORDER_ITEM:
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: state.currentOrder?.items?.map(item =>
            item.id === action.payload.itemId
              ? { ...item, ...action.payload.updates }
              : item
          ) || []
        }
      };
    
    case ACTIONS.REMOVE_ORDER_ITEM:
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: state.currentOrder?.items?.filter(item => item.id !== action.payload.itemId) || []
        }
      };
    
    case ACTIONS.SET_ORDER_TYPE:
      return { ...state, orderType: action.payload };
    
    case ACTIONS.UPDATE_ORDER_STATUS:
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        )
      };
    
    // Kitchen display
    case ACTIONS.SET_KITCHEN_ORDERS:
      return { ...state, kitchenOrders: action.payload };
    
    case ACTIONS.SET_KITCHEN_STATIONS:
      return { ...state, kitchenStations: action.payload };
    
    case ACTIONS.UPDATE_KITCHEN_ORDER_STATUS:
      return {
        ...state,
        kitchenOrders: state.kitchenOrders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        )
      };
    
    // Checkout
    case ACTIONS.SET_SPLIT_BILL:
      return {
        ...state,
        checkoutData: { ...state.checkoutData, splitBill: action.payload }
      };
    
    case ACTIONS.ADD_SPLIT_ITEM:
      return {
        ...state,
        checkoutData: {
          ...state.checkoutData,
          splitItems: [...state.checkoutData.splitItems, action.payload]
        }
      };
    
    case ACTIONS.REMOVE_SPLIT_ITEM:
      return {
        ...state,
        checkoutData: {
          ...state.checkoutData,
          splitItems: state.checkoutData.splitItems.filter(item => item.id !== action.payload.itemId)
        }
      };
    
    case ACTIONS.SET_TIPS:
      return {
        ...state,
        checkoutData: { ...state.checkoutData, tips: action.payload }
      };
    
    case ACTIONS.SET_PAYMENT_METHOD:
      return {
        ...state,
        checkoutData: { ...state.checkoutData, paymentMethod: action.payload }
      };
    
    // Reservations
    case ACTIONS.SET_RESERVATIONS:
      return { ...state, reservations: action.payload };
    
    case ACTIONS.SELECT_RESERVATION:
      return { ...state, selectedReservation: action.payload };
    
    case ACTIONS.ADD_RESERVATION:
      return { ...state, reservations: [...state.reservations, action.payload] };
    
    case ACTIONS.UPDATE_RESERVATION:
      return {
        ...state,
        reservations: state.reservations.map(reservation =>
          reservation.id === action.payload.id
            ? { ...reservation, ...action.payload.updates }
            : reservation
        )
      };
    
    case ACTIONS.DELETE_RESERVATION:
      return {
        ...state,
        reservations: state.reservations.filter(reservation => reservation.id !== action.payload.reservationId)
      };
    
    // UI state
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ACTIONS.SET_ACTIVE_VIEW:
      return { ...state, activeView: action.payload };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Provider component
const RestaurantPOSProvider = ({ children }) => {
  const [state, dispatch] = useReducer(restaurantPOSReducer, initialState);

  // Actions
  const actions = useMemo(() => ({
    // Table management
    setTables: (tables) => dispatch({ type: ACTIONS.SET_TABLES, payload: tables }),
    selectTable: (table) => dispatch({ type: ACTIONS.SELECT_TABLE, payload: table }),
    updateTableStatus: (tableId, status) => dispatch({ type: ACTIONS.UPDATE_TABLE_STATUS, payload: { tableId, status } }),
    setTableSections: (sections) => dispatch({ type: ACTIONS.SET_TABLE_SECTIONS, payload: sections }),
    
    // Order management
    setOrders: (orders) => dispatch({ type: ACTIONS.SET_ORDERS, payload: orders }),
    setCurrentOrder: (order) => dispatch({ type: ACTIONS.SET_CURRENT_ORDER, payload: order }),
    addOrderItem: (item) => dispatch({ type: ACTIONS.ADD_ORDER_ITEM, payload: item }),
    updateOrderItem: (itemId, updates) => dispatch({ type: ACTIONS.UPDATE_ORDER_ITEM, payload: { itemId, updates } }),
    removeOrderItem: (itemId) => dispatch({ type: ACTIONS.REMOVE_ORDER_ITEM, payload: { itemId } }),
    setOrderType: (type) => dispatch({ type: ACTIONS.SET_ORDER_TYPE, payload: type }),
    updateOrderStatus: (orderId, status) => dispatch({ type: ACTIONS.UPDATE_ORDER_STATUS, payload: { orderId, status } }),
    
    // Kitchen display
    setKitchenOrders: (orders) => dispatch({ type: ACTIONS.SET_KITCHEN_ORDERS, payload: orders }),
    setKitchenStations: (stations) => dispatch({ type: ACTIONS.SET_KITCHEN_STATIONS, payload: stations }),
    updateKitchenOrderStatus: (orderId, status) => dispatch({ type: ACTIONS.UPDATE_KITCHEN_ORDER_STATUS, payload: { orderId, status } }),
    
    // Checkout
    setSplitBill: (splitBill) => dispatch({ type: ACTIONS.SET_SPLIT_BILL, payload: splitBill }),
    addSplitItem: (item) => dispatch({ type: ACTIONS.ADD_SPLIT_ITEM, payload: item }),
    removeSplitItem: (itemId) => dispatch({ type: ACTIONS.REMOVE_SPLIT_ITEM, payload: { itemId } }),
    setTips: (tips) => dispatch({ type: ACTIONS.SET_TIPS, payload: tips }),
    setPaymentMethod: (method) => dispatch({ type: ACTIONS.SET_PAYMENT_METHOD, payload: method }),
    
    // Reservations
    setReservations: (reservations) => dispatch({ type: ACTIONS.SET_RESERVATIONS, payload: reservations }),
    selectReservation: (reservation) => dispatch({ type: ACTIONS.SELECT_RESERVATION, payload: reservation }),
    addReservation: (reservation) => dispatch({ type: ACTIONS.ADD_RESERVATION, payload: reservation }),
    updateReservation: (id, updates) => dispatch({ type: ACTIONS.UPDATE_RESERVATION, payload: { id, updates } }),
    deleteReservation: (reservationId) => dispatch({ type: ACTIONS.DELETE_RESERVATION, payload: { reservationId } }),
    
    // UI state
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    setActiveView: (view) => dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: view }),
    clearError: () => dispatch({ type: ACTIONS.CLEAR_ERROR })
  }), []);

  // Computed values
  const computedValues = useMemo(() => ({
    // Get available tables (not occupied)
    getAvailableTables: () => state.tables.filter(table => table.status === 'available'),
    
    // Get occupied tables
    getOccupiedTables: () => state.tables.filter(table => table.status === 'occupied'),
    
    // Get tables by section
    getTablesBySection: (sectionId) => state.tables.filter(table => table.section_id === sectionId),
    
    // Calculate order total
    calculateOrderTotal: (order) => {
      if (!order || !order.items) return 0;
      return order.items.reduce((total, item) => {
        const itemTotal = item.price * item.quantity;
        const modifiersTotal = item.modifiers?.reduce((modTotal, modifier) => modTotal + modifier.price, 0) || 0;
        return total + itemTotal + (modifiersTotal * item.quantity);
      }, 0);
    },
    
    // Get pending kitchen orders
    getPendingKitchenOrders: () => state.kitchenOrders.filter(order => order.status === 'pending'),
    
    // Get today's reservations
    getTodayReservations: () => {
      const today = new Date().toISOString().split('T')[0];
      return state.reservations.filter(reservation => reservation.date === today);
    }
  }), [state]);

  const value = {
    ...state,
    ...actions,
    ...computedValues
  };

  return (
    <RestaurantPOSContext.Provider value={value}>
      {children}
    </RestaurantPOSContext.Provider>
  );
};

// Hook to use the context
const useRestaurantPOS = () => {
  const context = useContext(RestaurantPOSContext);
  if (!context) {
    throw new Error('useRestaurantPOS must be used within a RestaurantPOSProvider');
  }
  return context;
};

export { RestaurantPOSProvider, useRestaurantPOS, ACTIONS };