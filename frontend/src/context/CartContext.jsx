import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      if (response.data && response.data.success) {
        setCart(response.data.data);
        setCartItemCount(response.data.data.items.length);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = async (item) => {
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

export default CartContext; 