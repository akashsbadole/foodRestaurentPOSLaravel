import React from 'react';
import { useMediaQuery } from '@mui/material';
import DesktopLayout from './DesktopLayout';
import TabletLayout from './TabletLayout';
import MobileLayout from './MobileLayout';

const OrderCreationLayout = ({
  // Data
  tables = [],
  sections = [],
  products = [],
  categories = [],
  order = {},
  
  // Table selection props
  selectedTable = null,
  onTableSelect,
  onTableDetails,
  tablesLoading = false,
  tablesError = null,
  
  // Product selection props
  selectedCategory = null,
  onProductSelect,
  onProductDetails,
  productsLoading = false,
  productsError = null,
  
  // Cart props
  onItemUpdate,
  onItemRemove,
  onClearCart,
  onCheckout,
  onAddItem,
  cartLoading = false,
  cartError = null,
  
  // UI state
  searchTerm = '',
  onSearchChange,
  activeSection = 'table',
  onSectionChange,
  onBack
}) => {
  // Determine which layout to use based on screen size
  const isDesktop = useMediaQuery('(min-width: 1200px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1199px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Common props for all layouts
  const commonProps = {
    // Data
    tables,
    sections,
    products,
    categories,
    order,
    
    // Table selection props
    selectedTable,
    onTableSelect,
    onTableDetails,
    tablesLoading,
    tablesError,
    
    // Product selection props
    selectedCategory,
    onProductSelect,
    onProductDetails,
    productsLoading,
    productsError,
    
    // Cart props
    onItemUpdate,
    onItemRemove,
    onClearCart,
    onCheckout,
    onAddItem,
    cartLoading,
    cartError,
    
    // UI state
    searchTerm,
    onSearchChange,
    activeSection,
    onSectionChange,
    onBack
  };

  // Render appropriate layout based on screen size
  if (isDesktop) {
    return <DesktopLayout {...commonProps} />;
  }
  
  if (isTablet) {
    return <TabletLayout {...commonProps} />;
  }
  
  if (isMobile) {
    return <MobileLayout {...commonProps} />;
  }
  
  // Fallback to desktop layout if media queries fail
  return <DesktopLayout {...commonProps} />;
};

export default OrderCreationLayout;