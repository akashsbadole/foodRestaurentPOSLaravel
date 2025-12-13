import React from 'react';
import { usePage } from '@inertiajs/react';
import RestaurantPOS from './RestaurantPOS';
import { RestaurantPOSProvider } from '@/Context/RestaurantPOSContext';

const Index = () => {
  const { props } = usePage();
  const {
    tables,
    reservations,
    activeOrders,
    products,
    customers,
    currentStore,
    categories,
    all_collections,
    cart_first_focus,
    misc_settings,
    default_charges,
    auth
  } = props;

  const handleRefresh = () => {
    // Refresh data from server
    window.location.reload();
  };

  const handleTableSelect = (table) => {
    // Handle table selection
    console.log('Table selected:', table);
  };

  const handleOrderCreate = (order) => {
    // Handle order creation
    console.log('Order created:', order);
  };

  const handleOrderUpdate = (orderId, updates) => {
    // Handle order updates
    console.log('Order updated:', orderId, updates);
  };

  const handleReservationCreate = (reservation) => {
    // Handle reservation creation
    console.log('Reservation created:', reservation);
  };

  const handleCheckout = (orderId, paymentData) => {
    // Handle checkout process
    console.log('Checkout:', orderId, paymentData);
  };

  return (
    <RestaurantPOSProvider>
      <RestaurantPOS
        tables={tables || []}
        sections={[]} // Will be populated when table sections are implemented
        orders={activeOrders || []}
        kitchenStations={[]} // Will be populated when kitchen stations are implemented
        reservations={reservations || []}
        products={products || []}
        customers={customers || []}
        user={auth?.user}
        onRefresh={handleRefresh}
        onTableSelect={handleTableSelect}
        onOrderCreate={handleOrderCreate}
        onOrderUpdate={handleOrderUpdate}
        onReservationCreate={handleReservationCreate}
        onCheckout={handleCheckout}
      />
    </RestaurantPOSProvider>
  );
};

export default Index;