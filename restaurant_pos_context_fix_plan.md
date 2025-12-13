# Restaurant POS Context Fix Plan

## Problem Analysis
The error `useRestaurantPOS must be used within a RestaurantPOSProvider` occurs because:
1. The `useRestaurantPOS()` hook is called in the `RestaurantPOS` component at line 165
2. The `RestaurantPOSProvider` is only rendered in the return statement at line 438
3. This creates a situation where the hook tries to access the context before the provider is available

## Solution
Move the `RestaurantPOSProvider` to a higher level in the component tree (Index.jsx) to ensure the context is available before any child components try to use it.

## Required Changes

### 1. Update resources/js/Pages/RestaurantPOS/Index.jsx
- Import `RestaurantPOSProvider` from `@/Context/RestaurantPOSContext`
- Wrap the `RestaurantPOS` component with `RestaurantPOSProvider`

```jsx
import React from 'react';
import { usePage } from '@inertiajs/react';
import RestaurantPOS from './RestaurantPOS';
import { RestaurantPOSProvider } from '@/Context/RestaurantPOSContext';

const Index = () => {
  const { props } = usePage();
  // ... existing code ...

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
```

### 2. Update resources/js/Pages/RestaurantPOS/RestaurantPOS.jsx
- Remove the import of `RestaurantPOSProvider` (keep `useRestaurantPOS`)
- Remove the `RestaurantPOSProvider` wrapper from the return statement

Remove line 49:
```jsx
import { RestaurantPOSProvider, useRestaurantPOS } from '@/Context/RestaurantPOSContext';
```
Replace with:
```jsx
import { useRestaurantPOS } from '@/Context/RestaurantPOSContext';
```

Remove lines 438 and 903:
```jsx
return (
  <RestaurantPOSProvider>
    // ... existing content ...
  </RestaurantPOSProvider>
);
```
Replace with:
```jsx
return (
  // ... existing content without RestaurantPOSProvider wrapper ...
);
```

## Benefits of This Approach
1. Follows React best practices by providing context at the highest necessary level
2. Maintains single responsibility principle
3. Makes context available to all child components if needed in the future
4. Avoids unnecessary component splitting complexity
5. Fixes the immediate error while improving the overall architecture

## Testing
After implementing these changes:
1. The context error should be resolved
2. The Restaurant POS page should load without errors
3. All functionality that depends on the context should work properly