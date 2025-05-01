import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    // Don't attempt to fetch cart if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get('/cart');
      if (response.data && response.data.success) {
        setCart(response.data.data || { items: [] });
        setCartItemCount((response.data.data?.items || []).length);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      // Set empty cart on error to prevent further errors
      setCart({ items: [] });
      setCartItemCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch on component mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Reset cart when logged out
      setCart({ items: [] });
      setCartItemCount(0);
    }
  }, [fetchCart, isAuthenticated]);

  // Add item to cart
  const addToCart = async (item) => {
    if (!isAuthenticated) {
      return { success: false, error: 'authentication_required', message: 'Please login to add items to cart' };
    }
    
    try {
      const response = await api.post('/cart/items', item);
      if (response.data && response.data.success) {
        await fetchCart(); // Refresh cart data
        return { success: true };
      }
      return { success: false, error: 'Failed to add item to cart' };
    } catch (err) {
      console.error('Error adding item to cart:', err);
      
      // Check if this is a different restaurant error
      if (err.response?.data?.error?.includes('different restaurant')) {
        return { 
          success: false, 
          error: 'different_restaurant',
          message: 'Your cart contains items from another restaurant',
          currentRestaurantId: err.response.data.currentRestaurantId
        };
      }
      
      return { 
        success: false, 
        error: 'general_error',
        message: err.response?.data?.error || 'Failed to add item to cart' 
      };
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (!isAuthenticated) return false;
    
    try {
      const response = await api.put(`/cart/items/${itemId}`, { quantity });
      if (response.data && response.data.success) {
        await fetchCart(); // Refresh cart data
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating cart item:', err);
      return false;
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    if (!isAuthenticated) return false;
    
    try {
      const response = await api.delete(`/cart/items/${itemId}`);
      if (response.data && response.data.success) {
        await fetchCart(); // Refresh cart data
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing cart item:', err);
      return false;
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated) return false;
    
    try {
      const response = await api.delete('/cart');
      if (response.data && response.data.success) {
        await fetchCart(); // Refresh cart data
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error clearing cart:', err);
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItemCount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider; 