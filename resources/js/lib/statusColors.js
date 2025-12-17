// Restaurant Status Color Mapping Utility
// This file provides consistent color mapping for all restaurant-related statuses

// Navy Blue Theme Color Palette
export const statusColors = {
  // Table Status Colors - WCAG AA Compliant
  tableStatus: {
    available: {
      color: '#059669',      // Darker green for better contrast
      lightColor: '#22c55e',  // Better contrast green (for dark mode)
      label: 'Available',
      muiVariant: 'tableAvailable',
      tailwindClass: 'bg-green-600',
      tailwindDarkClass: 'bg-green-500',
    },
    occupied: {
      color: '#dc2626',      // Darker red for better contrast
      lightColor: '#ef4444',  // Better contrast red (for dark mode)
      label: 'Occupied',
      muiVariant: 'tableOccupied',
      tailwindClass: 'bg-red-600',
      tailwindDarkClass: 'bg-red-500',
    },
    reserved: {
      color: '#d97706',      // Darker amber for better contrast
      lightColor: '#f59e0b',  // Better contrast amber (for dark mode)
      label: 'Reserved',
      muiVariant: 'tableReserved',
      tailwindClass: 'bg-amber-600',
      tailwindDarkClass: 'bg-amber-500',
    },
    cleaning: {
      color: '#4b5563',      // Darker gray for better contrast
      lightColor: '#6b7280',  // Better contrast gray (for dark mode)
      label: 'Cleaning',
      muiVariant: 'tableCleaning',
      tailwindClass: 'bg-gray-600',
      tailwindDarkClass: 'bg-gray-500',
    },
  },

  // Order Status Colors - WCAG AA Compliant
  orderStatus: {
    pending: {
      color: '#d97706',      // Darker amber for better contrast
      lightColor: '#f59e0b',  // Better contrast amber (for dark mode)
      label: 'Pending',
      muiVariant: 'orderPending',
      tailwindClass: 'bg-amber-600',
      tailwindDarkClass: 'bg-amber-500',
    },
    preparing: {
      color: '#2563eb',      // Darker blue for better contrast
      lightColor: '#3b82f6',  // Better contrast blue (for dark mode)
      label: 'Preparing',
      muiVariant: 'orderPreparing',
      tailwindClass: 'bg-blue-600',
      tailwindDarkClass: 'bg-blue-500',
    },
    ready: {
      color: '#059669',      // Darker green for better contrast
      lightColor: '#22c55e',  // Better contrast green (for dark mode)
      label: 'Ready',
      muiVariant: 'orderReady',
      tailwindClass: 'bg-green-600',
      tailwindDarkClass: 'bg-green-500',
    },
    served: {
      color: '#4b5563',      // Darker gray for better contrast
      lightColor: '#6b7280',  // Better contrast gray (for dark mode)
      label: 'Served',
      muiVariant: 'orderServed',
      tailwindClass: 'bg-gray-600',
      tailwindDarkClass: 'bg-gray-500',
    },
  },

  // Kitchen Queue Status Colors - WCAG AA Compliant
  kitchenStatus: {
    new: {
      color: '#d97706',      // Darker amber for better contrast
      lightColor: '#f59e0b',  // Better contrast amber (for dark mode)
      label: 'New',
      muiVariant: 'kitchenNew',
      tailwindClass: 'bg-amber-600',
      tailwindDarkClass: 'bg-amber-500',
    },
    in_progress: {
      color: '#2563eb',      // Darker blue for better contrast
      lightColor: '#3b82f6',  // Better contrast blue (for dark mode)
      label: 'In Progress',
      muiVariant: 'kitchenInProgress',
      tailwindClass: 'bg-blue-600',
      tailwindDarkClass: 'bg-blue-500',
    },
    completed: {
      color: '#059669',      // Darker green for better contrast
      lightColor: '#22c55e',  // Better contrast green (for dark mode)
      label: 'Completed',
      muiVariant: 'kitchenCompleted',
      tailwindClass: 'bg-green-600',
      tailwindDarkClass: 'bg-green-500',
    },
    cancelled: {
      color: '#dc2626',      // Darker red for better contrast
      lightColor: '#ef4444',  // Better contrast red (for dark mode)
      label: 'Cancelled',
      muiVariant: 'kitchenCancelled',
      tailwindClass: 'bg-red-600',
      tailwindDarkClass: 'bg-red-500',
    },
  },

  // General Status Colors
  generalStatus: {
    active: {
      color: '#10b981',      // Green
      lightColor: '#34d399',  // Lighter green (for dark mode)
      label: 'Active',
      tailwindClass: 'bg-green-500',
      tailwindDarkClass: 'bg-green-400',
    },
    inactive: {
      color: '#6b7280',      // Gray
      lightColor: '#94a3b8',  // Lighter gray (for dark mode)
      label: 'Inactive',
      tailwindClass: 'bg-gray-500',
      tailwindDarkClass: 'bg-gray-400',
    },
    draft: {
      color: '#6b7280',      // Gray
      lightColor: '#94a3b8',  // Lighter gray (for dark mode)
      label: 'Draft',
      tailwindClass: 'bg-gray-500',
      tailwindDarkClass: 'bg-gray-400',
    },
    published: {
      color: '#10b981',      // Green
      lightColor: '#34d399',  // Lighter green (for dark mode)
      label: 'Published',
      tailwindClass: 'bg-green-500',
      tailwindDarkClass: 'bg-green-400',
    },
  },
};

// Helper functions to get status colors
export const getTableStatusColor = (status, isDarkMode = false) => {
  const statusConfig = statusColors.tableStatus[status];
  if (!statusConfig) return null;
  
  return isDarkMode ? statusConfig.lightColor : statusConfig.color;
};

export const getOrderStatusColor = (status, isDarkMode = false) => {
  const statusConfig = statusColors.orderStatus[status];
  if (!statusConfig) return null;
  
  return isDarkMode ? statusConfig.lightColor : statusConfig.color;
};

export const getKitchenStatusColor = (status, isDarkMode = false) => {
  const statusConfig = statusColors.kitchenStatus[status];
  if (!statusConfig) return null;
  
  return isDarkMode ? statusConfig.lightColor : statusConfig.color;
};

export const getGeneralStatusColor = (status, isDarkMode = false) => {
  const statusConfig = statusColors.generalStatus[status];
  if (!statusConfig) return null;
  
  return isDarkMode ? statusConfig.lightColor : statusConfig.color;
};

// Get Material-UI variant for chip components
export const getTableStatusMuiVariant = (status) => {
  const statusConfig = statusColors.tableStatus[status];
  return statusConfig ? statusConfig.muiVariant : 'default';
};

export const getOrderStatusMuiVariant = (status) => {
  const statusConfig = statusColors.orderStatus[status];
  return statusConfig ? statusConfig.muiVariant : 'default';
};

// Get Tailwind CSS classes
export const getTableStatusTailwindClass = (status, isDarkMode = false) => {
  const statusConfig = statusColors.tableStatus[status];
  if (!statusConfig) return '';
  
  return isDarkMode ? statusConfig.tailwindDarkClass : statusConfig.tailwindClass;
};

export const getOrderStatusTailwindClass = (status, isDarkMode = false) => {
  const statusConfig = statusColors.orderStatus[status];
  if (!statusConfig) return '';
  
  return isDarkMode ? statusConfig.tailwindDarkClass : statusConfig.tailwindClass;
};

// Get status label
export const getTableStatusLabel = (status) => {
  const statusConfig = statusColors.tableStatus[status];
  return statusConfig ? statusConfig.label : status;
};

export const getOrderStatusLabel = (status) => {
  const statusConfig = statusColors.orderStatus[status];
  return statusConfig ? statusConfig.label : status;
};

export const getKitchenStatusLabel = (status) => {
  const statusConfig = statusColors.kitchenStatus[status];
  return statusConfig ? statusConfig.label : status;
};

// Get all available options for dropdowns/selects
export const getTableStatusOptions = () => {
  return Object.entries(statusColors.tableStatus).map(([key, config]) => ({
    value: key,
    label: config.label,
    color: config.color,
  }));
};

export const getOrderStatusOptions = () => {
  return Object.entries(statusColors.orderStatus).map(([key, config]) => ({
    value: key,
    label: config.label,
    color: config.color,
  }));
};

export const getKitchenStatusOptions = () => {
  return Object.entries(statusColors.kitchenStatus).map(([key, config]) => ({
    value: key,
    label: config.label,
    color: config.color,
  }));
};

// Reservation Status Colors - WCAG AA Compliant
export const reservationStatus = {
  confirmed: {
    color: '#059669',      // Darker green for better contrast
    lightColor: '#22c55e',  // Better contrast green (for dark mode)
    label: 'Confirmed',
    muiVariant: 'reservationConfirmed',
    tailwindClass: 'bg-green-600',
    tailwindDarkClass: 'bg-green-500',
  },
  pending: {
    color: '#d97706',      // Darker amber for better contrast
    lightColor: '#f59e0b',  // Better contrast amber (for dark mode)
    label: 'Pending',
    muiVariant: 'reservationPending',
    tailwindClass: 'bg-amber-600',
    tailwindDarkClass: 'bg-amber-500',
  },
  cancelled: {
    color: '#dc2626',      // Darker red for better contrast
    lightColor: '#ef4444',  // Better contrast red (for dark mode)
    label: 'Cancelled',
    muiVariant: 'reservationCancelled',
    tailwindClass: 'bg-red-600',
    tailwindDarkClass: 'bg-red-500',
  },
  completed: {
    color: '#4b5563',      // Darker gray for better contrast
    lightColor: '#6b7280',  // Better contrast gray (for dark mode)
    label: 'Completed',
    muiVariant: 'reservationCompleted',
    tailwindClass: 'bg-gray-600',
    tailwindDarkClass: 'bg-gray-500',
  },
  'no-show': {
    color: '#991b1b',      // Even darker red for better contrast
    lightColor: '#dc2626',  // Better contrast red (for dark mode)
    label: 'No Show',
    muiVariant: 'reservationNoShow',
    tailwindClass: 'bg-red-700',
    tailwindDarkClass: 'bg-red-600',
  },
};

// Helper function to get reservation status colors
export const getReservationStatusColor = (status, isDarkMode = false) => {
  const statusConfig = reservationStatus[status];
  if (!statusConfig) return null;
  
  return isDarkMode ? statusConfig.lightColor : statusConfig.color;
};

// Get Material-UI variant for reservation chip components
export const getReservationStatusMuiVariant = (status) => {
  const statusConfig = reservationStatus[status];
  return statusConfig ? statusConfig.muiVariant : 'default';
};

// Get Tailwind CSS classes for reservation status
export const getReservationStatusTailwindClass = (status, isDarkMode = false) => {
  const statusConfig = reservationStatus[status];
  if (!statusConfig) return '';
  
  return isDarkMode ? statusConfig.tailwindDarkClass : statusConfig.tailwindClass;
};

// Get reservation status label
export const getReservationStatusLabel = (status) => {
  const statusConfig = reservationStatus[status];
  return statusConfig ? statusConfig.label : status;
};

// Get all available reservation status options
export const getReservationStatusOptions = () => {
  return Object.entries(reservationStatus).map(([key, config]) => ({
    value: key,
    label: config.label,
    color: config.color,
  }));
};

export default statusColors;
