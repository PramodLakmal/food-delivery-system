import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const RestaurantAdminMenu = () => {
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
        if (restaurantResponse.data && restaurantResponse.data.success) {
          // Verify this restaurant belongs to the current user
          const restaurant = restaurantResponse.data.data;
          
          if (restaurant.ownerId !== user.id && user.role !== 'admin') {
            setError('You do not have permission to view this restaurant');
            setIsLoading(false);
            return;
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
    navigate('/restaurant-admin/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddMenuItem = () => {
    navigate(`/restaurant-admin/restaurants/${id}/menu/create`);
  };

  const handleEditMenuItem = (menuItemId) => {
    navigate(`/restaurant-admin/restaurants/${id}/menu/${menuItemId}/edit`);
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/menu/${menuItemId}`);
      
      if (response.data && response.data.success) {
        setMenuItems(menuItems.filter(item => item._id !== menuItemId));
        // Update filtered items
        if (selectedCategory === 'All') {
          setFilteredMenuItems(menuItems.filter(item => item._id !== menuItemId));
        } else {
          setFilteredMenuItems(filteredMenuItems.filter(item => item._id !== menuItemId));
        }
      } else {
        setError('Failed to delete menu item');
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError(err.response?.data?.error || 'Failed to delete menu item. Please try again.');
    }
  };

  const handleToggleItemAvailability = async (menuItemId, currentAvailability) => {
    try {
      const response = await api.patch(`/menu/${menuItemId}/availability`, {
        availability: !currentAvailability
      });
      
      if (response.data && response.data.success) {
        // Update the menuItems state to reflect the change
        const updatedItems = menuItems.map(item => 
          item._id === menuItemId 
            ? { ...item, availability: !currentAvailability } 
            : item
        );
        setMenuItems(updatedItems);
        
        // Update filtered items
        if (selectedCategory === 'All') {
          setFilteredMenuItems(updatedItems);
        } else {
          setFilteredMenuItems(updatedItems.filter(item => item.category === selectedCategory));
        }
      } else {
        setError('Failed to update menu item availability');
      }
    } catch (err) {
      console.error('Error updating menu item availability:', err);
      setError(err.response?.data?.error || 'Failed to update menu item availability. Please try again.');
    }
  };

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
    maxWidth: '80rem',
    margin: '2rem auto',
    padding: '0 1rem',
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

  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
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

  const errorMessage = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const loadingContainer = {
    display: 'flex', 
    minHeight: '300px', 
    alignItems: 'center', 
    justifyContent: 'center',
  };

  const menuHeading = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem',
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
    position: 'relative',
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

  const badge = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginLeft: '0.5rem',
  };

  const availableBadge = {
    ...badge,
    backgroundColor: '#dcfce7',
    color: '#047857',
  };

  const unavailableBadge = {
    ...badge,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  };

  const actionsContainer = {
    display: 'flex',
    marginTop: '1rem',
    gap: '0.5rem',
  };

  const actionButton = {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  };

  const editButton = {
    ...actionButton,
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  };

  const deleteButton = {
    ...actionButton,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  };

  const toggleButton = (isAvailable) => ({
    ...actionButton,
    backgroundColor: isAvailable ? '#fee2e2' : '#dcfce7',
    color: isAvailable ? '#b91c1c' : '#047857',
  });

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

  return (
    <div style={container}>

      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Dashboard
        </button>

        {error && <div style={errorMessage}>{error}</div>}

        {restaurant && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 style={heading}>
                <span style={restaurantAdminBadge}>MENU</span>
                {restaurant.name}
              </h2>
            </div>

            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1rem' 
              }}>
                <h3 style={menuHeading}>Menu Items</h3>
                <button style={addButton} onClick={handleAddMenuItem}>
                  Add Menu Item
                </button>
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
                        <div style={menuItemName}>
                          {item.name}
                          {item.availability ? (
                            <span style={availableBadge}>Available</span>
                          ) : (
                            <span style={unavailableBadge}>Unavailable</span>
                          )}
                        </div>
                        <div style={menuItemDetail}>Category: {item.category || 'Not specified'}</div>
                        {item.description && (
                          <div style={menuItemDetail}>Description: {item.description}</div>
                        )}
                        <div style={menuItemPrice}>${item.price.toFixed(2)}</div>
                        <div style={actionsContainer}>
                          <button 
                            style={editButton} 
                            onClick={() => handleEditMenuItem(item._id)}
                          >
                            Edit
                          </button>
                          <button 
                            style={deleteButton} 
                            onClick={() => handleDeleteMenuItem(item._id)}
                          >
                            Delete
                          </button>
                          <button 
                            style={toggleButton(item.availability)} 
                            onClick={() => handleToggleItemAvailability(item._id, item.availability)}
                          >
                            {item.availability ? 'Mark Unavailable' : 'Mark Available'}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantAdminMenu; 

 
 