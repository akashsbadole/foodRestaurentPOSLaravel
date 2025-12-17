import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import POSOrderCreation from '@/Components/RestaurantPOS/OrderCreation/POSOrderCreation';
import axios from 'axios';

const OrdersCreate = ({ currentStore }) => {
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({
    tables: false,
    products: false,
    categories: false,
    submitting: false
  });

  // Load initial data
  useEffect(() => {
    // Load tables
    setLoading(prev => ({ ...prev, tables: true }));
    axios.get('/api/v1/restaurant/tables')
      .then(response => {
        setTables(response.data || []);
        setLoading(prev => ({ ...prev, tables: false }));
      })
      .catch(error => {
        console.error('Failed to load tables:', error);
        setLoading(prev => ({ ...prev, tables: false }));
      });
  
    // Load products
    setLoading(prev => ({ ...prev, products: true }));
    axios.get('/products')
      .then(response => {
        setProducts(response.data || []);
        setLoading(prev => ({ ...prev, products: false }));
      })
      .catch(error => {
        console.error('Failed to load products:', error);
        setLoading(prev => ({ ...prev, products: false }));
      });
  
    // Load categories - using collections as categories for now
    setLoading(prev => ({ ...prev, categories: true }));
    axios.get('/collections')
      .then(response => {
        setCategories(response.data || []);
        setLoading(prev => ({ ...prev, categories: false }));
      })
      .catch(error => {
        console.error('Failed to load categories:', error);
        setLoading(prev => ({ ...prev, categories: false }));
      });
  }, []);

  // Handle order submission
  const handleOrderSubmit = (orderData) => {
    return new Promise((resolve, reject) => {
      setLoading(prev => ({ ...prev, submitting: true }));
      
      axios.post('/restaurant/orders', orderData)
        .then(response => {
          setLoading(prev => ({ ...prev, submitting: false }));
          router.visit('/restaurant/orders');
          resolve(response);
        })
        .catch(error => {
          setLoading(prev => ({ ...prev, submitting: false }));
          console.error('Failed to create order:', error);
          reject(error);
        });
    });
  };

  // Handle navigation
  const handleCancel = () => {
    router.visit('/restaurant/orders');
  };

  const handleSuccess = (response) => {
    console.log('Order created successfully:', response);
  };

  return (
    <AuthenticatedLayout>
      <Head title="Create Restaurant Order" />
      
      <POSOrderCreation
        // Initial data
        initialTables={tables}
        initialProducts={products}
        initialCategories={categories}
        
        // API callbacks
        onOrderSubmit={handleOrderSubmit}
        onTableFetch={() => axios.get('/api/v1/restaurant/tables')}
        onProductFetch={() => axios.get('/products')}
        onCategoryFetch={() => axios.get('/collections')}
        
        // Navigation
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        
        // Loading states
        tablesLoading={loading.tables}
        productsLoading={loading.products}
        categoriesLoading={loading.categories}
      />
    </AuthenticatedLayout>
  );
};

export default OrdersCreate;