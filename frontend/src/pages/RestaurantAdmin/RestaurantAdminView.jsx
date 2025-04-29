import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PlaceholderImage from '../../components/PlaceholderImage';
import MenuItemCard from '../../components/MenuItemCard';
import LocationDisplay from '../../components/LocationDisplay';

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

const RestaurantAdminView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({});

  // Get effective user ID - from user object or token as fallback
  const getEffectiveUserId = () => {
    if (user && user.id && user.id !== 'undefined') {
      return user.id;
    }
    
    // Fallback to token-extracted ID
    const tokenId = getUserIdFromToken();
    console.log('Using token-extracted ID as fallback:', tokenId);
    return tokenId;
  };

  useEffect(() => {
    // Check if user is restaurant-admin, if not redirect to dashboard
    if (user && user.role !== 'restaurant-admin') {
      navigate('/dashboard');
      return;
    }

    const fetchRestaurantData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch restaurant details
        const restaurantResponse = await api.get(`/restaurants/${id}`);
        console.log('Restaurant API Response:', restaurantResponse.data);
        
        if (restaurantResponse.data && restaurantResponse.data.success) {
          // Verify this restaurant belongs to the current user
          const restaurant = restaurantResponse.data.data;
          
          // Get the effective user ID (using token as fallback if needed)
          const effectiveUserId = getEffectiveUserId();
          
          // Debug the restaurant data we received
          console.log('Restaurant details:', {
            id: restaurant._id,
            name: restaurant.name,
            ownerId: restaurant.ownerId
          });
          
          console.log('User details:', {
            id: user?.id,
            effectiveId: effectiveUserId,
            role: user?.role
          });
          
          // Check if user is restaurant-admin and if they own this restaurant
          if (user && user.role === 'restaurant-admin') {
            // Skip permission check for admins
            if (user.role === 'admin') {
              console.log('User is admin, skipping ownership check');
            } 
            // If restaurant has no ownerId or it's null/undefined
            else if (!restaurant.ownerId) {
              console.log('Restaurant has no ownerId:', restaurant);
              setError('Restaurant ownership information is missing');
              setIsLoading(false);
              return;
            } 
            // If user has no ID at all (even after fallback)
            else if (!effectiveUserId) {
              console.error('Cannot verify restaurant ownership - user ID is completely missing');
              setError('User authentication information is incomplete. Please log out and log in again.');
              setIsLoading(false);
              return;
            }
            // Normal case - check if current user is the owner
            else {
              const ownerIdStr = String(restaurant.ownerId);
              const userIdStr = String(effectiveUserId);
              
              console.log('Comparing IDs for permission:', {
                ownerIdStr, 
                userIdStr, 
                match: ownerIdStr === userIdStr
              });
              
              if (ownerIdStr !== userIdStr) {
                console.log('Permission denied - user is not the owner');
                setError('You do not have permission to view this restaurant');
                setIsLoading(false);
                return;
              }
            }
          }
          
          setRestaurant(restaurant);
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
            setFilteredMenuItems(items);
          } else {
            console.error('Failed to fetch menu items');
          }
        } catch (menuErr) {
          console.error('Error fetching menu items:', menuErr);
          // Don't set the error state, just continue if menu items can't be fetched
        }
      } catch (err) {
        console.error('Error fetching restaurant data:', err);
        setError('Restaurant not found or you don\'t have permission to view it.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id, user, navigate]);

  // Filter menu items when category changes
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredMenuItems(menuItems);
    } else {
      setFilteredMenuItems(menuItems.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, menuItems]);

  // Get unique categories from menu items
  const getCategories = () => {
    const categories = new Set(menuItems.map(item => item.category || 'Other'));
    return ['All', ...Array.from(categories)];
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleGoBack = () => {
    navigate('/restaurant-admin/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditRestaurant = () => {
    navigate(`/restaurant-admin/restaurants/${id}/edit`);
  };

  const handleAddMenuItem = () => {
    navigate(`/restaurant-admin/restaurants/${id}/menu/create`);
  };

  const handleViewOrders = () => {
    navigate(`/restaurant-admin/restaurants/${id}/orders`);
  };

  const handleEditMenuItem = (menuItemId) => {
    console.log('Editing menu item, ID:', menuItemId);
    console.log('Restaurant ID:', id);
    
    // Validate that we have a proper ID before navigating
    if (!menuItemId) {
      console.error('Missing menu item ID, cannot navigate to edit');
      return;
    }
    
    const menuItem = menuItems.find(item => item._id === menuItemId);
    console.log('Full menu item object:', menuItem);
    
    if (!menuItem) {
      console.error('Could not find menu item with ID:', menuItemId);
      return;
    }
    
    // Use string interpolation to ensure values are properly converted to strings
    const editUrl = `/restaurant-admin/restaurants/${id}/menu/${menuItemId}/edit`;
    console.log('Navigating to:', editUrl);
    
    navigate(editUrl);
  };

  const handleToggleAvailability = async () => {
    try {
      const response = await api.patch(`/restaurants/${id}/availability`, {
        isOpen: !restaurant.isOpen
      });
      
      if (response.data && response.data.success) {
        setRestaurant({
          ...restaurant,
          isOpen: !restaurant.isOpen
        });
      } else {
        setError('Failed to update restaurant availability');
      }
    } catch (err) {
      console.error('Error updating restaurant availability:', err);
      setError(err.response?.data?.error || 'Failed to update restaurant availability. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
      }}>
        <div style={{ 
          height: '2.5rem', 
          width: '2.5rem', 
          animation: 'spin 1s linear infinite',
          borderRadius: '9999px',
          borderWidth: '4px',
          borderColor: '#6366f1',
          borderTopColor: 'transparent'
        }}></div>
      </div>
    );
  }

  // Styles
  const container = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  };

  const nav = {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  };

  const navContainer = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem',
  };

  const navFlex = {
    display: 'flex',
    height: '4rem',
    justifyContent: 'space-between',
  };

  const navBrand = {
    display: 'flex',
    alignItems: 'center',
  };

  const brandText = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#4338ca',
  };

  const navActions = {
    display: 'flex',
    alignItems: 'center',
  };

  const userGreeting = {
    marginRight: '1rem',
    fontSize: '0.875rem',
    color: '#374151',
  };

  const contentContainer = {
    maxWidth: '60rem',
    margin: '2rem auto',
    padding: '0 1rem',
  };

  const card = {
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  };

  const heading = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
  };

  const restaurantAdminBadge = {
    backgroundColor: '#4f46e5', 
    color: 'white',
    borderRadius: '9999px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    marginRight: '0.5rem',
  };

  const backButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
    marginBottom: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
  };

  const errorMessage = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const detailsContainer = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  };

  const detailItem = {
    marginBottom: '0.75rem',
  };

  const detailLabel = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  };

  const detailValue = {
    fontSize: '1rem',
    color: '#1f2937',
  };

  const badge = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
  };

  const editButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginRight: '0.5rem',
  };

  const toggleButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    backgroundColor: restaurant?.isOpen ? '#fee2e2' : '#d1fae5',
    color: restaurant?.isOpen ? '#b91c1c' : '#047857',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  };

  const menuHeading = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem',
  };

  const menuGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  };

  const menuItem = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  };

  const menuItemImageContainer = {
    height: '140px',
    overflow: 'hidden',
    borderRadius: '0.25rem',
    marginBottom: '0.75rem',
  };

  const menuItemImage = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const menuItemContent = {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
  };

  const menuItemName = {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '0.5rem',
  };

  const menuItemDetail = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  };

  const menuItemPrice = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#047857',
    marginTop: '0.5rem',
  };

  const addButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
  };

  const menuItemButton = {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontWeight: '500',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    marginTop: '0.5rem',
  };

  const filterContainer = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    marginTop: '1rem'
  };

  const filterLabel = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginRight: '0.5rem',
  };

  const filterSelect = {
    padding: '0.375rem 0.75rem',
    borderRadius: '0.25rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    color: '#1f2937',
    cursor: 'pointer',
  };

  const restaurantImageContainer = {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    borderRadius: '0.375rem',
    marginBottom: '1.5rem',
    position: 'relative',
  };

  const restaurantImage = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const restaurantHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  };

  const restaurantName = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
  };

  const cuisineDetail = {
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  const actionButtons = {
    display: 'flex',
    alignItems: 'center',
  };

  const availabilityButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  };

  const imageContainer = {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    borderRadius: '0.375rem',
    marginBottom: '1.5rem',
    position: 'relative',
  };

  const placeholderContainer = {
    width: '100%',
    height: '200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const statusBadge = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontWeight: '500',
    fontSize: '0.875rem',
  };

  return (
    <div style={container}>
      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Dashboard
        </button>

        {error && <div style={errorMessage}>{error}</div>}
        
        {/* Debug information - visible only in development */}
        {process.env.NODE_ENV === 'development' && Object.keys(debug).length > 0 && (
          <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.75rem' }}>
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}

        {!isLoading && restaurant ? (
          <>
            {/* Restaurant Details Card */}
            <div style={card}>
              <div style={restaurantHeader}>
                <div>
                  <h2 style={restaurantName}>{restaurant.name}</h2>
                  <p style={cuisineDetail}>{restaurant.cuisine}</p>
                </div>
                <div style={actionButtons}>
                  <button 
                    style={editButton}
                    onClick={handleEditRestaurant}
                  >
                    Edit
                  </button>
                  <button 
                    style={{
                      ...availabilityButton, 
                      backgroundColor: restaurant.isOpen ? '#ef4444' : '#10b981'
                    }}
                    onClick={handleToggleAvailability}
                  >
                    {restaurant.isOpen ? 'Mark as Closed' : 'Mark as Open'}
                  </button>
                  <button 
                    style={{
                      ...availabilityButton, 
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      marginLeft: '0.5rem'
                    }}
                    onClick={handleViewOrders}
                  >
                    Orders
                  </button>
                </div>
              </div>

              {/* Restaurant Image */}
              <div style={imageContainer}>
                {restaurant.imageUrl ? (
                  <img 
                    src={restaurant.imageUrl} 
                    alt={restaurant.name} 
                    style={restaurantImage} 
                  />
                ) : (
                  <div style={placeholderContainer}>
                    <PlaceholderImage name={restaurant.name} size={150} />
                  </div>
                )}
                <div style={{
                  ...statusBadge,
                  backgroundColor: restaurant.isOpen ? '#dcfce7' : '#fee2e2',
                  color: restaurant.isOpen ? '#047857' : '#b91c1c',
                }}>
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </div>
              </div>

              <div style={detailsContainer}>
                <div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Name</div>
                    <div style={detailValue}>{restaurant.name}</div>
                  </div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Location</div>
                    <div style={detailValue}>{restaurant.location}</div>
                  </div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Cuisine</div>
                    <div style={detailValue}>{restaurant.cuisine}</div>
                  </div>
                </div>
                <div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Rating</div>
                    <div style={detailValue}>{restaurant.rating || '0'} ⭐</div>
                  </div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Status</div>
                    <div>
                      {restaurant.isOpen ? (
                        <span style={{
                          ...badge,
                          backgroundColor: '#dcfce7',
                          color: '#047857',
                        }}>
                          Open
                        </span>
                      ) : (
                        <span style={{
                          ...badge,
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                        }}>
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Map */}
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Restaurant Location
                </h3>
                <LocationDisplay 
                  location={restaurant.location} 
                  coordinates={restaurant.coordinates} 
                  height="250px"
                />
              </div>
            </div>

            {/* Menu Items Card */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={menuHeading}>Menu Items</h3>
                <button style={addButton} onClick={handleAddMenuItem}>Add Menu Item</button>
              </div>
              
              {menuItems.length > 0 ? (
                <>
                  <div style={filterContainer}>
                    <span style={filterLabel}>Filter by Category:</span>
                    <select 
                      style={filterSelect}
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                    >
                      {getCategories().map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={menuGrid}>
                    {filteredMenuItems.map((item) => (
                      <MenuItemCard 
                        key={item._id}
                        menuItem={item}
                        onEdit={() => handleEditMenuItem(item._id)}
                        onToggleAvailability={(id, newStatus) => {
                          // Handle toggling menu item availability
                          console.log(`Toggle menu item ${id} availability to ${newStatus}`);
                          // Implement this functionality if needed in the future
                        }}
                      />
                    ))}
                  </div>
                  {filteredMenuItems.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280' }}>
                      No items found in the selected category
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p>No menu items available for this restaurant.</p>
                  <button style={{...addButton, marginTop: '1rem'}} onClick={handleAddMenuItem}>
                    Add First Menu Item
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={card}>
            <p>Restaurant not found or you don't have permission to view it.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantAdminView; 
