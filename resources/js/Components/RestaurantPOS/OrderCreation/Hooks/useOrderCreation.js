import { useState, useEffect, useCallback } from 'react';

const useOrderCreation = (initialData = {}) => {
  // Order state
  const [orderState, setOrderState] = useState({
    selectedTable: null,
    orderType: 'dine_in',
    items: [],
    customer: null,
    specialInstructions: '',
    estimatedTime: null,
    priority: 'normal',
    customerCount: 1,
    waiterId: '',
    contactId: '',
    ...initialData
  });

  // UI state
  const [uiState, setUiState] = useState({
    activeSection: 'table', // 'table', 'menu', 'cart'
    selectedCategory: null,
    searchTerm: '',
    modifiersOpen: false,
    checkoutOpen: false,
    selectedProduct: null,
    editingItem: null
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    tables: false,
    products: false,
    submitting: false
  });

  // Error states
  const [errors, setErrors] = useState({});

  // Table actions
  const selectTable = useCallback((table) => {
    setOrderState(prev => ({ ...prev, selectedTable: table }));
    setUiState(prev => ({ ...prev, activeSection: 'menu' }));
    setErrors(prev => ({ ...prev, table_id: '' }));
  }, []);

  // Product actions
  const addProduct = useCallback((product, modifiers = [], specialInstructions = '') => {
    const newItem = {
      id: Date.now() + Math.random(), // Temporary ID
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      unit_cost: product.cost || 0,
      discount: 0,
      special_instructions: specialInstructions,
      modifiers: modifiers,
      product: product // Store full product for reference
    };
    
    setOrderState(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setErrors(prev => ({ ...prev, items: '' }));
  }, []);

  const updateItem = useCallback((itemId, updates) => {
    setOrderState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  }, []);

  const removeItem = useCallback((itemId) => {
    setOrderState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  }, []);

  const clearCart = useCallback(() => {
    setOrderState(prev => ({ ...prev, items: [] }));
  }, []);

  // UI actions
  const setActiveSection = useCallback((section) => {
    setUiState(prev => ({ ...prev, activeSection: section }));
  }, []);

  const setSelectedCategory = useCallback((category) => {
    setUiState(prev => ({ ...prev, selectedCategory: category }));
  }, []);

  const setSearchTerm = useCallback((term) => {
    setUiState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const openModifiersDialog = useCallback((product) => {
    setUiState(prev => ({ 
      ...prev, 
      modifiersOpen: true, 
      selectedProduct: product 
    }));
  }, []);

  const closeModifiersDialog = useCallback(() => {
    setUiState(prev => ({ 
      ...prev, 
      modifiersOpen: false, 
      selectedProduct: null 
    }));
  }, []);

  const openCheckoutDialog = useCallback(() => {
    setUiState(prev => ({ ...prev, checkoutOpen: true }));
  }, []);

  const closeCheckoutDialog = useCallback(() => {
    setUiState(prev => ({ ...prev, checkoutOpen: false }));
  }, []);

  const setEditingItem = useCallback((item) => {
    setUiState(prev => ({ ...prev, editingItem: item }));
  }, []);

  const clearEditingItem = useCallback(() => {
    setUiState(prev => ({ ...prev, editingItem: null }));
  }, []);

  // Order data actions
  const updateOrderData = useCallback((updates) => {
    setOrderState(prev => ({ ...prev, ...updates }));
  }, []);

  // Loading state actions
  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // Error handling
  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Calculations
  const calculateSubtotal = useCallback(() => {
    return orderState.items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const modifiersTotal = item.modifiers?.reduce((modTotal, modifier) => {
        return modTotal + (modifier.price * modifier.quantity * item.quantity);
      }, 0) || 0;
      return total + itemTotal + modifiersTotal;
    }, 0);
  }, [orderState.items]);

  const calculateTax = useCallback(() => {
    return calculateSubtotal() * 0.1; // 10% tax
  }, [calculateSubtotal]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + calculateTax();
  }, [calculateSubtotal, calculateTax]);

  // Validation
  const validateOrder = useCallback(() => {
    const newErrors = {};
    
    if (!orderState.selectedTable && orderState.orderType === 'dine_in') {
      newErrors.table_id = 'Please select a table';
    }
    
    if (orderState.items.length === 0) {
      newErrors.items = 'Please add at least one item to the order';
    }
    
    if (orderState.customerCount < 1) {
      newErrors.customer_count = 'Customer count must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [orderState]);

  // Reset order
  const resetOrder = useCallback(() => {
    setOrderState({
      selectedTable: null,
      orderType: 'dine_in',
      items: [],
      customer: null,
      specialInstructions: '',
      estimatedTime: null,
      priority: 'normal',
      customerCount: 1,
      waiterId: '',
      contactId: ''
    });
    setUiState({
      activeSection: 'table',
      selectedCategory: null,
      searchTerm: '',
      modifiersOpen: false,
      checkoutOpen: false,
      selectedProduct: null,
      editingItem: null
    });
    setErrors({});
  }, []);

  // Prepare data for submission
  const prepareSubmissionData = useCallback(() => {
    return {
      table_id: orderState.selectedTable?.id || '',
      order_type: orderState.orderType,
      customer_count: orderState.customerCount,
      waiter_id: orderState.waiterId,
      contact_id: orderState.contactId,
      priority: orderState.priority,
      special_instructions: orderState.specialInstructions,
      estimated_time: orderState.estimatedTime,
      items: orderState.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        discount: item.discount,
        special_instructions: item.special_instructions,
        modifiers: item.modifiers || []
      }))
    };
  }, [orderState]);

  return {
    // State
    state: { ...orderState, ...uiState },
    loadingStates,
    errors,
    
    // Order actions
    selectTable,
    addProduct,
    updateItem,
    removeItem,
    clearCart,
    updateOrderData,
    resetOrder,
    
    // UI actions
    setActiveSection,
    setSelectedCategory,
    setSearchTerm,
    openModifiersDialog,
    closeModifiersDialog,
    openCheckoutDialog,
    closeCheckoutDialog,
    setEditingItem,
    clearEditingItem,
    
    // Loading actions
    setLoading,
    
    // Error actions
    setFieldError,
    clearErrors,
    clearFieldError,
    
    // Calculations
    calculateSubtotal,
    calculateTax,
    calculateTotal,
    
    // Validation
    validateOrder,
    
    // Data preparation
    prepareSubmissionData
  };
};

export default useOrderCreation;