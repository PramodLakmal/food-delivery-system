import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import PlaceholderImage from '../components/PlaceholderImage';
import LocationPicker from '../components/LocationPicker';
import StripeCheckout from '../components/StripeCheckout';

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart: cartData, loading: cartLoading, fetchCart, clearCart } = useCart();
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    coordinates: { lat: null, lng: null }
  });
  const [useMapLocation, setUseMapLocation] = useState(false);
  const [mapLocation, setMapLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart review, 2: Delivery details, 3: Confirmation, 4: Payment
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'cash'
  const [orderData, setOrderData] = useState(null); // Store order data for card payments

  // Fetch cart data
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        setIsLoading(true);
        
        if (cartData && !cartLoading) {
          setCart(cartData);
        } else {
          const response = await api.get('/cart');
          if (response.data && response.data.success) {
            setCart(response.data.data);
          } else {
            setError('Failed to fetch cart');
          }
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to fetch cart. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartData();
  }, [cartData, cartLoading]);

  // Pre-fill user's details if available
  useEffect(() => {
    if (user) {
      setContactPhone(user.phone || '');
      if (user.address) {
        setDeliveryAddress({
          street: user.address.street || '',
          city: user.address.city || '',
          state: user.address.state || '',
          zipCode: user.address.zipCode || '',
          coordinates: user.address.coordinates || { lat: null, lng: null }
        });
        
        if (user.address.street) {
          const fullAddress = `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}`;
          setMapLocation(fullAddress);
        }
      }
    }
  }, [user]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      setIsLoading(true);
      const response = await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });
      
      if (response.data && response.data.success) {
        setCart(response.data.data);
      } else {
        setError('Failed to update item quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setIsLoading(true);
      const response = await api.delete(`/cart/items/${itemId}`);
      
      if (response.data && response.data.success) {
        setCart(response.data.data);
      } else {
        setError('Failed to remove item from cart');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        setIsLoading(true);
        const response = await api.delete('/cart');
        
        if (response.data && response.data.success) {
          setCart(response.data.data);
        } else {
          setError('Failed to clear cart');
        }
      } catch (err) {
        console.error('Error clearing cart:', err);
        setError('Failed to clear cart. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoToRestaurant = () => {
    if (cart && cart.items.length > 0) {
      const restaurantId = cart.items[0].restaurantId;
      navigate(`/restaurants/${restaurantId}`);
    }
  };

  const handleContinueShopping = () => {
    navigate('/customer/home');
  };

  const handleProceedToDelivery = () => {
    if (!cart || cart.items.length === 0) {
      setError('Your cart is empty. Add items before proceeding.');
      return;
    }
    setCheckoutStep(2);
  };

  const handleBackToCart = () => {
    setCheckoutStep(1);
  };

  const handleProceedToConfirmation = () => {
    // Basic validation
    if (useMapLocation) {
      if (!mapLocation || !deliveryAddress.coordinates.lat || !deliveryAddress.coordinates.lng || !contactPhone) {
        setOrderError('Please select a location and provide a contact phone number');
        return;
      }
    } else {
      if (!deliveryAddress.street || !deliveryAddress.city || 
          !deliveryAddress.state || !deliveryAddress.zipCode || !contactPhone) {
        setOrderError('Please fill in all required delivery details');
        return;
      }
    }
    
    setOrderError(null);
    setCheckoutStep(3);
  };

  const handleBackToDelivery = () => {
    setCheckoutStep(2);
  };

  const handlePlaceOrder = async () => {
    try {
      setIsPlacingOrder(true);
      setOrderError(null);

      let orderData;
      
      if (useMapLocation) {
        orderData = {
          deliveryAddress: {
            fullAddress: mapLocation,
            coordinates: deliveryAddress.coordinates,
            // Also include parsed components if available
            street: deliveryAddress.street || '',
            city: deliveryAddress.city || '',
            state: deliveryAddress.state || '',
            zipCode: deliveryAddress.zipCode || ''
          },
          deliveryInstructions,
          contactPhone,
          paymentMethod,
          skipCartClear: paymentMethod === 'card' // Only skip cart clear for card payments
        };
      } else {
        orderData = {
          deliveryAddress,
          deliveryInstructions,
          contactPhone,
          paymentMethod,
          skipCartClear: paymentMethod === 'card' // Only skip cart clear for card payments
        };
      }

      const response = await api.post('/orders', orderData);
      
      if (response.data && response.data.success) {
        if (paymentMethod === 'card') {
          // For card payments, store the order info for payment processing
          if (response.data.data.requiresPayment) {
            // Store the cart and order data for creating the order after payment
            setOrderData({
              cart: response.data.data.cart,
              deliveryAddress: orderData.deliveryAddress,
              deliveryInstructions: orderData.deliveryInstructions,
              contactPhone: orderData.contactPhone
            });
            setOrderTotal(response.data.data.cart.total);
            // Move to payment step
            setCheckoutStep(4);
          } else {
            // If there was an error or unexpected response
            setOrderError('Error processing order for payment');
          }
        } else {
          // For cash payments, we already have the order created
          setOrderId(response.data.data._id);
          setOrderSuccess(true);
        }
      } else {
        setOrderError('Failed to place order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setOrderError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleViewOrders = () => {
    navigate('/customer/orders');
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    
    try {
      // Create the order now that payment is successful
      if (orderData) {
        const createOrderResponse = await api.post('/orders/complete-payment', {
          deliveryAddress: orderData.deliveryAddress,
          deliveryInstructions: orderData.deliveryInstructions || '',
          contactPhone: orderData.contactPhone,
          paymentId: paymentIntent.id,
          cartItems: orderData.cart.items,
          restaurantId: orderData.cart.restaurantId,
          restaurantName: orderData.cart.restaurantName,
          total: orderData.cart.total
        });
        
        if (createOrderResponse.data && createOrderResponse.data.success) {
          setOrderId(createOrderResponse.data.data._id);
          setOrderSuccess(true);
          
          // Clear the cart using CartContext's clearCart method
          await clearCart();
          // Refresh the cart in CartContext
          fetchCart();
        } else {
          setOrderError('Error creating order after payment');
        }
      } else {
        setOrderError('Missing order data for payment completion');
      }
    } catch (error) {
      console.error('Error creating order after payment:', error);
      setOrderError('Error creating order after payment. Your payment was successful but there was an issue recording your order.');
    }
  };

  const handlePaymentError = (errorMessage) => {
    console.error('Payment error:', errorMessage);
    setOrderError(`Payment failed: ${errorMessage}`);
  };

  const handleBackToConfirmation = () => {
    setCheckoutStep(3);
  };

  // Handle location selection from map
  const handleLocationChange = (address) => {
    setMapLocation(address);
    
    // Try to parse address components
    const parts = address.split(',');
    if (parts.length >= 3) {
      const streetParts = parts.slice(0, parts.length - 2);
      const street = streetParts.join(',').trim();
      const city = parts[parts.length - 2].trim();
      const stateZipParts = parts[parts.length - 1].trim().split(' ');
      const state = stateZipParts[0].trim();
      const zipCode = stateZipParts.length > 1 ? stateZipParts[stateZipParts.length - 1].trim() : '';
      
      setDeliveryAddress({
        ...deliveryAddress,
        street,
        city,
        state,
        zipCode
      });
    }
  };

  const handleCoordinatesChange = (coords) => {
    setDeliveryAddress({
      ...deliveryAddress,
      coordinates: coords
    });
  };

  const toggleAddressMethod = () => {
    setUseMapLocation(!useMapLocation);
  };

  const calculateTotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;
    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = 2.99;
    const tax = 1.50; // This could be calculated based on subtotal
    return (subtotal + deliveryFee + tax).toFixed(2);
  };

  // Styles
  const container = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem 1rem',
  };

  const contentContainer = {
    maxWidth: '1000px',
    margin: '0 auto',
  };

  const pageTitle = {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '2rem',
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  };

  const cardHeader = {
    backgroundColor: '#f9fafb',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const cardHeaderTitle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
  };

  const cardBody = {
    padding: '1.5rem',
  };

  const formRow = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1rem',
  };

  const formColumn = {
    flex: '1',
    minWidth: '200px',
  };

  const formGroup = {
    marginBottom: '1.5rem',
  };

  const formLabel = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  };

  const formInput = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    color: '#1f2937',
  };

  const formTextarea = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    color: '#1f2937',
    minHeight: '100px',
    resize: 'vertical',
  };

  const buttonGroup = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
  };

  const primaryButton = {
    padding: '0.75rem 1rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontWeight: '500',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
  };

  const secondaryButton = {
    padding: '0.75rem 1rem',
    backgroundColor: 'white',
    color: '#4b5563',
    fontWeight: '500',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
  };

  const cartTable = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeader = {
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#4b5563',
    borderBottom: '1px solid #e5e7eb',
  };

  const tableCell = {
    padding: '1rem 0.5rem',
    fontSize: '0.875rem',
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'middle',
  };

  const imageContainer = {
    width: '60px',
    height: '60px',
    overflow: 'hidden',
    borderRadius: '0.375rem',
  };

  const itemImage = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const quantityControl = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const quantityButton = {
    width: '24px',
    height: '24px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    color: '#4b5563',
    cursor: 'pointer',
    padding: '0',
  };

  const quantityInput = {
    width: '40px',
    height: '24px',
    textAlign: 'center',
    border: '1px solid #d1d5db',
    margin: '0 0.25rem',
    padding: '0',
    fontSize: '0.875rem',
  };

  const emptyCart = {
    textAlign: 'center',
    padding: '3rem 0',
  };

  const emptyCartMessage = {
    fontSize: '1.25rem',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '1.5rem',
  };

  const actionButton = {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    marginLeft: '0.5rem',
  };

  const errorAlert = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1.5rem',
  };

  const successAlert = {
    backgroundColor: '#d1fae5',
    color: '#047857',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const loadingState = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  };

  const mapContainer = {
    height: '300px',
    marginBottom: '1.5rem',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  };

  const toggleButton = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '1rem',
    border: '1px solid #e5e7eb',
  };

  // Render cart review step
  const renderCartReview = () => {
    if (!cart || cart.items.length === 0) {
      return (
        <div style={card}>
          <div style={cardBody}>
            <div style={emptyCart}>
              <p style={emptyCartMessage}>Your cart is empty</p>
              <button style={primaryButton} onClick={handleContinueShopping}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div style={card}>
          <div style={cardHeader}>
            <h2 style={cardHeaderTitle}>Your Items</h2>
          </div>
          <div style={cardBody}>
            <table style={cartTable}>
              <thead>
                <tr>
                  <th style={{ ...tableHeader, width: '15%' }}>Image</th>
                  <th style={{ ...tableHeader, width: '30%' }}>Item</th>
                  <th style={{ ...tableHeader, width: '15%' }}>Price</th>
                  <th style={{ ...tableHeader, width: '20%' }}>Quantity</th>
                  <th style={{ ...tableHeader, width: '15%' }}>Subtotal</th>
                  <th style={{ ...tableHeader, width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item._id}>
                    <td style={tableCell}>
                      <div style={imageContainer}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={itemImage} />
                        ) : (
                          <PlaceholderImage type="menu" width="100%" height="100%" />
                        )}
                      </div>
                    </td>
                    <td style={tableCell}>
                      <div style={{ fontWeight: '500' }}>{item.name}</div>
                      {item.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Note: {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={tableCell}>${item.price.toFixed(2)}</td>
                    <td style={tableCell}>
                      <div style={quantityControl}>
                        <button 
                          style={quantityButton}
                          onClick={() => item.quantity > 1 && handleUpdateQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input 
                          type="text" 
                          style={quantityInput} 
                          value={item.quantity} 
                          readOnly 
                        />
                        <button 
                          style={quantityButton}
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ ...tableCell, fontWeight: '600' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td style={tableCell}>
                      <button 
                        style={actionButton}
                        onClick={() => handleRemoveItem(item._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 2 }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button style={secondaryButton} onClick={handleContinueShopping}>
                Continue Shopping
              </button>
              <button style={secondaryButton} onClick={handleGoToRestaurant}>
                Go to Restaurant
              </button>
              <button style={primaryButton} onClick={handleClearCart}>
                Clear Cart
              </button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={formGroup}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Order Summary</h3>
              
              <div style={formRow}>
                <div style={formColumn}>
                  <label style={formLabel}>Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</label>
                </div>
                <div style={formColumn}>
                  <label style={formLabel}>${cart.total.toFixed(2)}</label>
                </div>
              </div>
              
              <div style={formRow}>
                <div style={formColumn}>
                  <label style={formLabel}>Delivery Fee</label>
                </div>
                <div style={formColumn}>
                  <label style={formLabel}>$3.99</label>
                </div>
              </div>
              
              <div style={formRow}>
                <div style={formColumn}>
                  <label style={formLabel}>Total</label>
                </div>
                <div style={formColumn}>
                  <label style={formLabel}>${(cart.total + 3.99).toFixed(2)}</label>
                </div>
              </div>
              
              <button 
                style={{ ...primaryButton, width: '100%', padding: '0.75rem', marginTop: '1rem' }}
                onClick={handleProceedToDelivery}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Render delivery details step
  const renderDeliveryDetails = () => {
    return (
      <div style={card}>
        <div style={cardHeader}>
          <h2 style={cardHeaderTitle}>Delivery Details</h2>
        </div>
        <div style={cardBody}>
          {orderError && (
            <div style={errorAlert}>
              <p>{orderError}</p>
            </div>
          )}
          
          <button 
            style={toggleButton} 
            onClick={toggleAddressMethod}
          >
            <i className={`fas fa-${useMapLocation ? 'edit' : 'map-marker-alt'} mr-2`}></i>
            {useMapLocation ? 'Enter Address Manually' : 'Select Location on Map'}
          </button>
          
          {useMapLocation ? (
            <>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                You can search for an address, click on the map, or drag the marker to set your delivery location.
              </p>
              
              <div style={mapContainer}>
                <LocationPicker 
                  initialLocation={mapLocation}
                  onLocationChange={handleLocationChange}
                  onCoordinatesChange={handleCoordinatesChange}
                  placeholder="Search for your delivery address"
                />
              </div>
              
              <div style={formGroup}>
                <label style={formLabel}>Selected Address</label>
                <p style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  color: '#4b5563',
                  fontSize: '0.875rem'
                }}>
                  {mapLocation || 'No address selected yet. Please search or click on the map.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={formRow}>
                <div style={formColumn}>
                  <div style={formGroup}>
                    <label style={formLabel} htmlFor="street">Street Address *</label>
                    <input
                      type="text"
                      id="street"
                      style={formInput}
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div style={formRow}>
                <div style={formColumn}>
                  <div style={formGroup}>
                    <label style={formLabel} htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      style={formInput}
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={formColumn}>
                  <div style={formGroup}>
                    <label style={formLabel} htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      style={formInput}
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={formColumn}>
                  <div style={formGroup}>
                    <label style={formLabel} htmlFor="zipCode">Zip Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      style={formInput}
                      value={deliveryAddress.zipCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div style={formGroup}>
            <label style={formLabel} htmlFor="phone">Contact Phone *</label>
            <input
              type="tel"
              id="phone"
              style={formInput}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
          </div>
          
          <div style={formGroup}>
            <label style={formLabel} htmlFor="instructions">Delivery Instructions</label>
            <textarea
              id="instructions"
              style={formTextarea}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="E.g., Apartment number, gate code, parking details, etc."
            ></textarea>
          </div>
          
          <div style={buttonGroup}>
            <button style={secondaryButton} onClick={handleBackToCart}>
              Back to Cart
            </button>
            <button style={primaryButton} onClick={handleProceedToConfirmation}>
              Review Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render order confirmation step
  const renderOrderConfirmation = () => {
    if (orderSuccess) {
      return (
        <div style={card}>
          <div style={cardHeader}>
            <h2 style={cardHeaderTitle}>Order Placed Successfully!</h2>
          </div>
          <div style={cardBody}>
            <div style={successAlert}>
              <p>Your order has been placed successfully. You can track your order in the "My Orders" section.</p>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button style={{ ...primaryButton, padding: '0.75rem 1.5rem' }} onClick={handleViewOrders}>
                View My Orders
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Function to render a small map preview
    const renderMapPreview = () => {
      if (!deliveryAddress.coordinates.lat || !deliveryAddress.coordinates.lng) {
        return null;
      }

      // Safe way to get API key - matching the method used in LocationPicker
      const getGoogleMapsApiKey = () => {
        const envKey = typeof import.meta !== 'undefined' ? 
          import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || 
          import.meta.env?.REACT_APP_GOOGLE_MAPS_API_KEY : undefined;
        
        const windowKey = typeof window !== 'undefined' ? 
          window.GOOGLE_MAPS_API_KEY : undefined;
        
        return envKey || windowKey || '';
      };
      
      const apiKey = getGoogleMapsApiKey();
      const { lat, lng } = deliveryAddress.coordinates;
      
      return (
        <div style={{ 
          marginTop: '0.5rem', 
          height: '150px', 
          width: '100%', 
          borderRadius: '0.375rem', 
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`}
          ></iframe>
        </div>
      );
    };

    return (
      <>
        <div style={card}>
          <div style={cardHeader}>
            <h2 style={cardHeaderTitle}>Order Confirmation</h2>
          </div>
          <div style={cardBody}>
            {orderError && (
              <div style={errorAlert}>
                <p>{orderError}</p>
              </div>
            )}
            
            <div style={formGroup}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Delivery Address</h3>
              {useMapLocation ? (
                <>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                    {mapLocation}
                  </p>
                  {renderMapPreview()}
                </>
              ) : (
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
                </p>
              )}
            </div>
            
            <div style={formGroup}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Contact Phone</h3>
              <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{contactPhone}</p>
            </div>
            
            {deliveryInstructions && (
              <div style={formGroup}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Delivery Instructions</h3>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{deliveryInstructions}</p>
              </div>
            )}
            
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Order Items</h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableHeader, width: '60%', textAlign: 'left' }}>Item</th>
                    <th style={{ ...tableHeader, width: '20%', textAlign: 'center' }}>Quantity</th>
                    <th style={{ ...tableHeader, width: '20%', textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item._id}>
                      <td style={{ ...tableCell, textAlign: 'left' }}>
                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                        {item.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Note: {item.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ ...tableCell, textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ ...tableCell, textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#4b5563' }}>Subtotal</span>
                <span style={{ fontWeight: '500' }}>${cart.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#4b5563' }}>Delivery Fee</span>
                <span style={{ fontWeight: '500' }}>$2.99</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#4b5563' }}>Tax</span>
                <span style={{ fontWeight: '500' }}>$1.50</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '1.125rem', marginTop: '1rem' }}>
                <span>Total</span>
                <span>${(cart.items.reduce((total, item) => total + (item.price * item.quantity), 0) + 2.99 + 1.50).toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Payment Method</h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div 
                  style={{ 
                    padding: '1rem', 
                    border: `1px solid ${paymentMethod === 'card' ? '#4f46e5' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    backgroundColor: paymentMethod === 'card' ? '#eff6ff' : 'white',
                    flex: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div style={{ 
                    width: '1.5rem', 
                    height: '1.5rem', 
                    borderRadius: '50%', 
                    border: `2px solid ${paymentMethod === 'card' ? '#4f46e5' : '#d1d5db'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {paymentMethod === 'card' && (
                      <div style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        borderRadius: '50%',
                        backgroundColor: '#4f46e5'
                      }}></div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>Card Payment</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pay securely with credit or debit card</div>
                  </div>
                </div>
                
                <div 
                  style={{ 
                    padding: '1rem', 
                    border: `1px solid ${paymentMethod === 'cash' ? '#4f46e5' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    backgroundColor: paymentMethod === 'cash' ? '#eff6ff' : 'white',
                    flex: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div style={{ 
                    width: '1.5rem', 
                    height: '1.5rem', 
                    borderRadius: '50%', 
                    border: `2px solid ${paymentMethod === 'cash' ? '#4f46e5' : '#d1d5db'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {paymentMethod === 'cash' && (
                      <div style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        borderRadius: '50%',
                        backgroundColor: '#4f46e5'
                      }}></div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>Cash on Delivery</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pay with cash when your order arrives</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={buttonGroup}>
              <button style={secondaryButton} onClick={handleBackToDelivery}>
                Back to Delivery Details
              </button>
              <button 
                style={{ ...primaryButton, opacity: isPlacingOrder ? '0.7' : '1' }} 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? 'Placing Order...' : paymentMethod === 'card' ? 'Proceed to Payment' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Render payment step
  const renderPayment = () => {
    if (orderSuccess) {
      return (
        <div style={card}>
          <div style={cardHeader}>
            <h2 style={cardHeaderTitle}>Order Placed Successfully!</h2>
          </div>
          <div style={cardBody}>
            <div style={successAlert}>
              <p>Your order has been placed and payment processed successfully. You can track your order in the "My Orders" section.</p>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button style={{ ...primaryButton, padding: '0.75rem 1.5rem' }} onClick={handleViewOrders}>
                View My Orders
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={card}>
        <div style={cardHeader}>
          <h2 style={cardHeaderTitle}>Payment</h2>
        </div>
        <div style={cardBody}>
          {orderError && (
            <div style={errorAlert}>
              <p>{orderError}</p>
            </div>
          )}
          
          <div style={formGroup}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Order Total</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
              ${orderTotal}
            </p>
          </div>
          
          <div style={formGroup}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Payment Method</h3>
            <StripeCheckout 
              amount={parseFloat(orderTotal)} 
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              buttonText="Pay and Complete Order"
            />
          </div>
          
          <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Your card will be charged ${orderTotal} upon completion of this order.
            </p>
            <button 
              style={secondaryButton} 
              onClick={handleBackToConfirmation}
            >
              Back to Order Review
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !cart) {
    return (
      <div style={container}>
        <div style={contentContainer}>
          <h1 style={pageTitle}>Shopping Cart</h1>
          <div style={loadingState}>
            <div style={{ 
              height: '3rem', 
              width: '3rem', 
              borderRadius: '50%',
              borderTop: '3px solid #4f46e5',
              borderRight: '3px solid transparent',
              animation: 'spin 1s linear infinite',
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={contentContainer}>
        <h1 style={pageTitle}>
          {checkoutStep === 1 ? 'Shopping Cart' : 
           checkoutStep === 2 ? 'Delivery Details' : 
           checkoutStep === 3 ? 'Order Confirmation' : 
           'Payment'}
        </h1>
        
        {error && (
          <div style={errorAlert}>
            <p>{error}</p>
          </div>
        )}
        
        {checkoutStep === 1 && renderCartReview()}
        {checkoutStep === 2 && renderDeliveryDetails()}
        {checkoutStep === 3 && renderOrderConfirmation()}
        {checkoutStep === 4 && renderPayment()}
      </div>
    </div>
  );
};

export default CartPage; 