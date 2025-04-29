import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PlaceholderImage from '../../components/PlaceholderImage';

// Helper function to extract user ID from JWT token as a fallback
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // JWT tokens are in format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload
    const payload = JSON.parse(atob(parts[1]));
    return payload && payload.id ? payload.id : null;
  } catch (e) {
    console.error('Error extracting ID from token:', e);
    return null;
  }
};

const RestaurantAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get effective user ID (from auth context or token as fallback)
  const getEffectiveUserId = () => {
    if (user && user.id && user.id !== 'undefined') {
      return user.id;
    }
    
    const tokenId = getUserIdFromToken();
    console.log('Using JWT token ID as fallback:', tokenId);
    return tokenId;
  };

  useEffect(() => {
    // Check if user is restaurant-admin, if not redirect to dashboard
    if (user && user.role !== 'restaurant-admin') {
      navigate('/dashboard');
      return;
    }

    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        
        // Log current auth state for debugging
        const effectiveUserId = getEffectiveUserId();
        console.log('Current user:', {
          ...user,
          effectiveId: effectiveUserId
        });
        
        // Log the user ID type
        console.log('User ID info:', {
          contextId: user?.id,
          contextIdType: typeof user?.id,
          effectiveId: effectiveUserId,
          effectiveIdType: typeof effectiveUserId
        });
        
        // If we have no user ID at all
        if (!effectiveUserId) {
          console.error('No valid user ID available');
          setError('Authentication issue. Please log out and log in again.');
          setIsLoading(false);
          return;
        }
        
        const response = await api.get('/restaurants/my-restaurants');
        
        console.log('My restaurants response:', response.data);
        
        if (response.data && response.data.success) {
          setRestaurants(response.data.data);
        } else {
          setError('Failed to fetch restaurants. Please try again.');
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError(err?.response?.data?.error || 'Failed to fetch restaurants. Please try again.');
        setIsLoading(false);
      }
    };

    if (user && user.role === 'restaurant-admin') {
      fetchRestaurants();
    }
  }, [user, navigate]);

  const handleCreateRestaurant = () => {
    navigate('/restaurant-admin/restaurants/create');
  };

  const handleViewRestaurant = (restaurantId) => {
    navigate(`/restaurant-admin/restaurants/${restaurantId}`);
  };

  const handleEditRestaurant = (restaurantId) => {
    navigate(`/restaurant-admin/restaurants/${restaurantId}/edit`);
  };

  const handleManageMenu = (restaurantId) => {
    navigate(`/restaurant-admin/restaurants/${restaurantId}/menu`);
  };

  const handleViewOrders = (restaurantId) => {
    navigate(`/restaurant-admin/restaurants/${restaurantId}/orders`);
  };

  const handleToggleAvailability = async (restaurantId, currentStatus) => {
    try {
      const response = await api.patch(`/restaurants/${restaurantId}/availability`, {
        isOpen: !currentStatus
      });
      
      if (response.data && response.data.success) {
        // Update the restaurants state to reflect the change
        setRestaurants(restaurants.map(restaurant => 
          restaurant._id === restaurantId 
            ? { ...restaurant, isOpen: !currentStatus } 
            : restaurant
        ));
      } else {
        setError('Failed to update restaurant availability');
      }
    } catch (err) {
      console.error('Error updating restaurant availability:', err);
      setError(err.response?.data?.error || 'Failed to update restaurant availability. Please try again.');
    }
  };

  // Updated styles for content
  const container = {
    padding: '1rem',
  };

  const contentContainer = {
    width: '100%',
  };

  const headingContainer = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const heading = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
  };

  const button = {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const restaurantGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  };

  const restaurantCard = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const imageContainer = {
    height: '160px',
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
    top: '0.5rem',
    right: '0.5rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: isOpen ? '#10b981' : '#ef4444',
  });

  const restaurantContent = {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  };

  const restaurantName = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
  };

  const restaurantDetail = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  };

  const ratingContainer = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#f59e0b',
    fontWeight: '500',
    marginTop: '0.5rem',
  };

  const starIcon = {
    marginRight: '0.25rem',
  };

  const actionButtons = {
    padding: '0.75rem 1rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  };

  const actionButton = {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.75rem',
  };

  const viewButton = {
    ...actionButton,
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  };

  const editButton = {
    ...actionButton,
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
  };

  const menuButton = {
    ...actionButton,
    backgroundColor: '#dcfce7',
    color: '#15803d',
  };

  const toggleButton = (isOpen) => ({
    ...actionButton,
    backgroundColor: isOpen ? '#fee2e2' : '#dcfce7',
    color: isOpen ? '#b91c1c' : '#15803d',
  });

  return (
    <div style={container}>
      <div style={contentContainer}>
        <div style={headingContainer}>
          <h2 style={heading}>My Restaurants</h2>
          <button 
            style={button}
            onClick={handleCreateRestaurant}
          >
            Create New Restaurant
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              display: 'inline-block',
              width: '2rem', 
              height: '2rem', 
              border: '4px solid rgba(0, 0, 0, 0.1)', 
              borderLeftColor: '#4f46e5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
          </div>
        ) : error ? (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '1rem', 
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        ) : (
          <div style={card}>
            <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>RESTAURANT LIST</h3>
            
            {restaurants.length === 0 ? (
              <p style={{ color: '#6b7280', padding: '1rem 0' }}>
                You don't have any restaurants yet. Create your first restaurant to get started.
              </p>
            ) : (
              <div style={restaurantGrid}>
                {restaurants.map((restaurant) => (
                  <div key={restaurant._id} style={restaurantCard}>
                    <div style={imageContainer}>
                      {restaurant.imageUrl ? (
                        <img src={restaurant.imageUrl} alt={restaurant.name} style={image} />
                      ) : (
                        <PlaceholderImage type="restaurant" width="100%" height="160px" />
                      )}
                      <div style={statusBadge(restaurant.isOpen)}>
                        {restaurant.isOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>
                    
                    <div style={restaurantContent}>
                      <h3 style={restaurantName}>{restaurant.name}</h3>
                      <p style={restaurantDetail}><strong>Location:</strong> {restaurant.location}</p>
                      <p style={restaurantDetail}><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                      
                      <div style={ratingContainer}>
                        <span style={starIcon}>★</span> {restaurant.rating || '0.0'}
                      </div>
                    </div>
                    
                    <div style={actionButtons}>
                      <button 
                        style={viewButton}
                        onClick={() => handleViewRestaurant(restaurant._id)}
                      >
                        View
                      </button>
                      <button 
                        style={editButton}
                        onClick={() => handleEditRestaurant(restaurant._id)}
                      >
                        Edit
                      </button>
                      <button 
                        style={menuButton}
                        onClick={() => handleManageMenu(restaurant._id)}
                      >
                        Menu
                      </button>
                      <button 
                        style={{
                          ...actionButton,
                          backgroundColor: '#bae6fd',
                          color: '#0284c7',
                        }}
                        onClick={() => handleViewOrders(restaurant._id)}
                      >
                        Orders
                      </button>
                      <button 
                        style={toggleButton(restaurant.isOpen)}
                        onClick={() => handleToggleAvailability(restaurant._id, restaurant.isOpen)}
                      >
                        {restaurant.isOpen ? 'Close' : 'Open'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantAdminDashboard; 

 