import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PlaceholderImage from '../../components/PlaceholderImage';

const AdminRestaurantView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

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
        setError('Failed to fetch restaurant data. Please try again.');
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
    navigate('/admin/restaurants');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditRestaurant = () => {
    navigate(`/admin/restaurants/edit/${id}`);
  };

  const handleAddMenuItem = () => {
    navigate(`/admin/restaurants/${id}/menu/create`);
  };

  const handleEditMenuItem = (menuItemId) => {
    navigate(`/admin/restaurants/${id}/menu/${menuItemId}/edit`);
  };

  // Add a new function to render the location map
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
      <div style={{ height: '200px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
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

  const adminBadge = {
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
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    padding: '1rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  };

  const menuItemImageContainer = {
    width: '100%',
    height: '140px',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    marginBottom: '0.75rem',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const menuItemImage = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
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

  // Add styles for restaurant image container
  const imageContainer = {
    width: '100%',
    height: '200px',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    marginBottom: '1.5rem',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const restaurantImage = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  return (
    <div style={container}>

      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Restaurants
        </button>

        {error && <div style={errorMessage}>{error}</div>}

        {restaurant ? (
          <>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h2 style={heading}>
                  <span style={adminBadge}>ADMIN</span>
                  Restaurant Details
                </h2>
                <button style={editButton} onClick={handleEditRestaurant}>
                  Edit Restaurant
                </button>
              </div>

              {/* Add restaurant image section */}
              <div style={imageContainer}>
                {restaurant.imageUrl ? (
                  <img 
                    src={restaurant.imageUrl} 
                    alt={restaurant.name} 
                    style={restaurantImage} 
                  />
                ) : (
                  <PlaceholderImage type="restaurant" />
                )}
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
                    <div style={detailLabel}>Owner ID</div>
                    <div style={detailValue}>{restaurant.ownerId}</div>
                  </div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Rating</div>
                    <div style={detailValue}>{restaurant.rating} ⭐</div>
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
              
              {/* Add location map display */}
              <div style={{ marginTop: '1rem' }}>
                <div style={detailLabel}>Restaurant Location Map</div>
                {renderLocationMap()}
              </div>
            </div>

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
                      <div key={item._id} style={menuItem}>
                        <div style={menuItemImageContainer}>
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              style={menuItemImage} 
                            />
                          ) : (
                            <PlaceholderImage type="menu" />
                          )}
                        </div>
                        <div style={menuItemName}>{item.name}</div>
                        <div style={menuItemDetail}>Category: {item.category || 'Not specified'}</div>
                        {item.description && (
                          <div style={menuItemDetail}>Description: {item.description}</div>
                        )}
                        <div style={menuItemPrice}>${item.price.toFixed(2)}</div>
                        <div>
                          <button 
                            style={menuItemButton} 
                            onClick={() => handleEditMenuItem(item._id)}
                          >
                            Edit Item
                          </button>
                        </div>
                      </div>
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
            <p>Restaurant not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRestaurantView; 