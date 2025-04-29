import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import PlaceholderImage from '../components/PlaceholderImage';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [notification, setNotification] = useState({ visible: false, message: '', item: null });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch restaurant details
        const restaurantResponse = await api.get(`/restaurants/${id}`);
        if (restaurantResponse.data && restaurantResponse.data.success) {
          setRestaurant(restaurantResponse.data.data);
        } else {
          setError('Failed to fetch restaurant details');
          return;
        }
        
        // Fetch menu items for the restaurant
        try {
          const menuResponse = await api.get(`/menu/${id}`);
          if (menuResponse.data && menuResponse.data.success) {
            const items = menuResponse.data.data || [];
            setMenuItems(items);
            
            // Extract unique categories
            const uniqueCategories = new Set(items.map(item => item.category || 'Other'));
            setCategories(['All', ...Array.from(uniqueCategories)]);
          } else {
            console.error('Failed to fetch menu items');
          }
        } catch (menuErr) {
          console.error('Error fetching menu items:', menuErr);
          // Don't set the error state, just continue if menu items can't be fetched
        }
      } catch (err) {
        console.error('Error fetching restaurant data:', err);
        setError('Failed to fetch restaurant data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id]);

  // Filter menu items when category changes
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredMenuItems(menuItems);
    } else {
      setFilteredMenuItems(menuItems.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, menuItems]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddToCart = async (menuItem) => {
    try {
      // Process the image URL before sending to server
      let processedImageUrl = '';
      if (menuItem.imageUrl) {
        // If it's a long data URL, we'll just send a reference to avoid payload issues
        if (menuItem.imageUrl.startsWith('data:image') && menuItem.imageUrl.length > 1000) {
          // Send the ID as a reference, which the backend can use to fetch the image later if needed
          processedImageUrl = `/api/menu/images/${menuItem._id}`;
          console.log('Large image URL detected, using reference instead');
        } else {
          processedImageUrl = menuItem.imageUrl;
        }
      }

      // Create the cart item data
      const cartItemData = {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        imageUrl: processedImageUrl,
        notes: ''
      };
      
      // Use the cart context to add the item
      const result = await addToCart(cartItemData);
      
      if (result.success) {
        // Show custom notification
        setNotification({
          visible: true,
          message: `Added ${menuItem.name} to your cart!`,
          item: menuItem
        });
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification({ visible: false, message: '', item: null });
        }, 3000);
      } else if (result.error === 'different_restaurant') {
        // Show custom confirmation modal instead of window.confirm
        setConfirmModal({
          visible: true,
          title: 'Different Restaurant',
          message: `Your cart already has items from another restaurant. Would you like to clear your current cart and add this item instead?`,
          onConfirm: async () => {
            try {
              console.log('User confirmed clearing cart');
              // Clear the cart using the cart context and then try adding again
              const cleared = await clearCart();
              if (cleared) {
                console.log('Cart cleared successfully, attempting to add item again');
                // Hide the modal
                setConfirmModal(prev => ({ ...prev, visible: false }));
                // Try again with the same item
                handleAddToCart(menuItem);
              } else {
                console.error('Failed to clear cart');
                setConfirmModal(prev => ({ ...prev, visible: false }));
                setNotification({
                  visible: true,
                  message: 'Failed to clear cart. Please try again.',
                  isError: true
                });
                
                setTimeout(() => {
                  setNotification({ visible: false, message: '', isError: false });
                }, 3000);
              }
            } catch (clearErr) {
              console.error('Error clearing cart:', clearErr);
              setConfirmModal(prev => ({ ...prev, visible: false }));
              setNotification({
                visible: true,
                message: 'Failed to clear cart. Please try again.',
                isError: true
              });
              
              setTimeout(() => {
                setNotification({ visible: false, message: '', isError: false });
              }, 3000);
            }
          },
          onCancel: () => {
            console.log('User chose not to clear cart');
            setConfirmModal(prev => ({ ...prev, visible: false }));
            setNotification({
              visible: true,
              message: 'Item not added. Your cart contains items from another restaurant.',
              isError: true
            });
            
            setTimeout(() => {
              setNotification({ visible: false, message: '', isError: false });
            }, 3000);
          }
        });
      } else {
        // Show general error notification
        setNotification({
          visible: true,
          message: result.message || 'Failed to add item to cart.',
          isError: true
        });
        
        setTimeout(() => {
          setNotification({ visible: false, message: '', isError: false });
        }, 3000);
      }
    } catch (err) {
      console.error('Unexpected error adding item to cart:', err);
      
      setNotification({
        visible: true,
        message: 'An unexpected error occurred. Please try again.',
        isError: true
      });
      
      setTimeout(() => {
        setNotification({ visible: false, message: '', isError: false });
      }, 3000);
    }
  };

  // Function to render the location map
  const renderLocationMap = () => {
    if (!restaurant?.coordinates) {
      return (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          No location coordinates available
        </div>
      );
    }
    
    // Get Google Maps API key - matching the method used in LocationPicker
    const getGoogleMapsApiKey = () => {
      const envKey = typeof import.meta !== 'undefined' ? 
        import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || 
        import.meta.env?.REACT_APP_GOOGLE_MAPS_API_KEY : undefined;
      
      const windowKey = typeof window !== 'undefined' ? 
        window.GOOGLE_MAPS_API_KEY : undefined;
      
      return envKey || windowKey || '';
    };
    
    const apiKey = getGoogleMapsApiKey();
    const { lat, lng } = restaurant.coordinates;
    
    return (
      <div style={{ height: '250px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
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

  // Styles
  const container = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem 1rem',
  };

  const contentContainer = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const backButton = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '1.5rem',
  };

  const restaurantCard = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: '2rem',
  };

  const imageContainer = {
    width: '100%',
    height: '300px',
    overflow: 'hidden',
    position: 'relative',
  };

  const image = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const statusBadge = (isOpen) => ({
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontWeight: '600',
    fontSize: '0.875rem',
    backgroundColor: isOpen ? '#10b981' : '#ef4444',
    color: 'white',
  });

  const restaurantContent = {
    padding: '1.5rem',
  };

  const restaurantNameContainer = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  };

  const restaurantName = {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
  };

  const ratingBadge = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#fef3c7',
    borderRadius: '0.375rem',
    color: '#d97706',
    fontWeight: '600',
  };

  const starIcon = {
    marginRight: '0.375rem',
  };

  const restaurantDetail = {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1rem',
  };

  const detailItem = {
    display: 'flex',
    alignItems: 'center',
  };

  const detailIcon = {
    marginRight: '0.5rem',
    color: '#6b7280',
  };

  const detailText = {
    fontSize: '1rem',
    color: '#374151',
  };

  const divider = {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '1.5rem 0',
  };

  const sectionTitle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem',
  };

  const twoColumn = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
  };

  const menuSection = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  };

  const mapSection = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  };

  const categoryFilter = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const filterLabel = {
    fontSize: '0.875rem',
    color: '#4b5563',
    marginRight: '0.5rem',
  };

  const select = {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
  };

  const menuGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  };

  const menuItem = {
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  };

  const menuItemContent = {
    padding: '1rem',
  };

  const menuItemImage = {
    height: '160px',
    overflow: 'hidden',
  };

  const menuItemName = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
  };

  const menuItemDescription = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  };

  const menuItemPrice = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#059669',
    marginBottom: '1rem',
  };

  const addToCartButton = {
    display: 'block',
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    textAlign: 'center',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const noMenuItems = {
    textAlign: 'center',
    padding: '2rem 0',
    color: '#6b7280',
  };

  const loadingContainer = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  };

  const errorContainer = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  };

  // For smaller screens, adjust the grid
  const responsiveGrid = {
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  };

  // Add notification styles
  const notificationStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: notification.isError ? '#fee2e2' : '#ecfdf5',
    color: notification.isError ? '#b91c1c' : '#065f46',
    padding: '1rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '350px',
    zIndex: 50,
    display: notification.visible ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    animation: notification.visible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
    border: notification.isError ? '1px solid #fca5a5' : '1px solid #a7f3d0',
  };

  const notificationContent = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const notificationIcon = {
    fontSize: '1.5rem',
    color: notification.isError ? '#b91c1c' : '#059669',
  };

  if (isLoading) {
    return (
      <div style={container}>
        <div style={contentContainer}>
          <div style={loadingContainer}>
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

  if (error) {
    return (
      <div style={container}>
        <div style={contentContainer}>
          <button style={backButton} onClick={handleGoBack}>
            &larr; Back
          </button>
          <div style={errorContainer}>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={container}>
        <div style={contentContainer}>
          <button style={backButton} onClick={handleGoBack}>
            &larr; Back
          </button>
          <div style={errorContainer}>
            <p>Restaurant not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Restaurants
        </button>

        {/* Confirmation Modal */}
        {confirmModal.visible && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.75rem',
              }}>{confirmModal.title}</h3>
              <p style={{
                fontSize: '1rem',
                color: '#4b5563',
                marginBottom: '1.5rem',
              }}>{confirmModal.message}</p>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}>
                <button 
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={confirmModal.onCancel}
                >
                  Cancel
                </button>
                <button 
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={confirmModal.onConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        <div style={notificationStyle}>
          <div style={notificationContent}>
            <div style={notificationIcon}>
              {notification.isError ? (
                <i className="fas fa-exclamation-circle"></i>
              ) : (
                <i className="fas fa-shopping-cart"></i>
              )}
            </div>
            <div>
              <p style={{ fontWeight: 'bold' }}>{notification.message}</p>
              {notification.item && !notification.isError && (
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  ${notification.item.price.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => setNotification({ visible: false, message: '', item: null })}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: notification.isError ? '#b91c1c' : '#065f46',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={restaurantCard}>
          <div style={imageContainer}>
            {restaurant.imageUrl ? (
              <img src={restaurant.imageUrl} alt={restaurant.name} style={image} />
            ) : (
              <PlaceholderImage type="restaurant" width="100%" height="300px" />
            )}
            <div style={statusBadge(restaurant.isOpen)}>
              {restaurant.isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>

          <div style={restaurantContent}>
            <div style={restaurantNameContainer}>
              <h1 style={restaurantName}>{restaurant.name}</h1>
              {restaurant.rating > 0 && (
                <div style={ratingBadge}>
                  <span style={starIcon}>★</span> {restaurant.rating?.toFixed(1)}
                </div>
              )}
            </div>

            <div style={restaurantDetail}>
              <div style={detailItem}>
                <span style={detailIcon}>🍽️</span>
                <span style={detailText}>{restaurant.cuisine}</span>
              </div>
              <div style={detailItem}>
                <span style={detailIcon}>📍</span>
                <span style={detailText}>{restaurant.location}</span>
              </div>
            </div>

            {!restaurant.isOpen && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '0.375rem',
                marginTop: '1rem',
              }}>
                <p>This restaurant is currently closed and not accepting orders.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{...twoColumn, ...responsiveGrid}}>
          <div style={menuSection}>
            <h2 style={sectionTitle}>Menu</h2>
            
            {menuItems.length > 0 ? (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={categoryFilter}>
                    <span style={filterLabel}>Filter by:</span>
                    <select 
                      value={selectedCategory} 
                      onChange={handleCategoryChange}
                      style={select}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      setConfirmModal({
                        visible: true,
                        title: 'Clear Cart',
                        message: 'Are you sure you want to clear all items from your cart?',
                        onConfirm: async () => {
                          try {
                            const cleared = await clearCart();
                            setConfirmModal(prev => ({ ...prev, visible: false }));
                            if (cleared) {
                              setNotification({
                                visible: true,
                                message: 'Cart cleared successfully',
                                isError: false
                              });
                            } else {
                              setNotification({
                                visible: true,
                                message: 'Failed to clear cart',
                                isError: true
                              });
                            }
                            setTimeout(() => {
                              setNotification({ visible: false, message: '', isError: false });
                            }, 3000);
                          } catch (err) {
                            console.error('Error clearing cart:', err);
                            setConfirmModal(prev => ({ ...prev, visible: false }));
                          }
                        },
                        onCancel: () => {
                          setConfirmModal(prev => ({ ...prev, visible: false }));
                        }
                      });
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Reset Cart
                  </button>
                </div>

                <div style={menuGrid}>
                  {filteredMenuItems.map(item => (
                    <div key={item._id} style={menuItem}>
                      <div style={menuItemImage}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={image} />
                        ) : (
                          <PlaceholderImage type="menu" width="100%" height="160px" />
                        )}
                      </div>
                      <div style={menuItemContent}>
                        <h3 style={menuItemName}>{item.name}</h3>
                        {item.description && (
                          <p style={menuItemDescription}>{item.description}</p>
                        )}
                        <p style={menuItemPrice}>${item.price.toFixed(2)}</p>
                        <button 
                          style={{
                            ...addToCartButton,
                            backgroundColor: restaurant.isOpen ? '#4f46e5' : '#9ca3af',
                            cursor: restaurant.isOpen ? 'pointer' : 'not-allowed',
                          }}
                          onClick={() => restaurant.isOpen && handleAddToCart(item)}
                          disabled={!restaurant.isOpen}
                        >
                          {restaurant.isOpen ? 'Add to Cart' : 'Restaurant Closed'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredMenuItems.length === 0 && (
                  <div style={noMenuItems}>
                    <p>No menu items found in this category.</p>
                  </div>
                )}
              </>
            ) : (
              <div style={noMenuItems}>
                <p>No menu items available for this restaurant.</p>
              </div>
            )}
          </div>

          <div style={mapSection}>
            <h2 style={sectionTitle}>Location</h2>
            {renderLocationMap()}
            
            <div style={{marginTop: '1rem'}}>
              <h3 style={{...sectionTitle, fontSize: '1rem'}}>Address</h3>
              <p style={{color: '#4b5563'}}>{restaurant.location}</p>
            </div>
            
            <div style={divider}></div>
            
            <div>
              <h3 style={{...sectionTitle, fontSize: '1rem'}}>Hours</h3>
              <p style={{color: '#4b5563'}}>
                {restaurant.isOpen 
                  ? 'Currently open for orders' 
                  : 'Currently closed'}
              </p>
              <p style={{color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem'}}>
                Hours information coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RestaurantDetails; 