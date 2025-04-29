import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PlaceholderImage from '../../components/PlaceholderImage';

const AdminRestaurants = () => {
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }

    // Fetch all restaurants
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/restaurants');
        if (response.data && response.data.success) {
          setRestaurants(response.data.data);
        } else {
          setError('Failed to fetch restaurants');
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to fetch restaurants. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [user]);

  const handleGoBack = () => {
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    logout();
  };

  const handleViewRestaurant = (restaurantId) => {
    window.location.href = `/admin/restaurants/view?id=${restaurantId}`;
  };

  const handleEditRestaurant = (restaurantId) => {
    window.location.href = `/admin/restaurants/edit?id=${restaurantId}`;
  };

  const handleViewMenu = (restaurantId) => {
    window.location.href = `/admin/restaurants/${restaurantId}/menu`;
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
      setError('Failed to update restaurant availability. Please try again.');
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (window.confirm('Are you sure you want to delete this restaurant? This will also delete all associated menu items.')) {
      try {
        await api.delete(`/restaurants/${restaurantId}`);
        // Remove restaurant from state
        setRestaurants(restaurants.filter(restaurant => restaurant._id !== restaurantId));
      } catch (err) {
        console.error('Error deleting restaurant:', err);
        setError('Failed to delete restaurant. Please try again.');
      }
    }
  };

  const handleAddRestaurant = () => {
    window.location.href = '/admin/restaurants/add';
  };

  const handleViewStats = () => {
    window.location.href = '/admin/restaurants/stats';
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
    maxWidth: '80rem',
    margin: '2rem auto',
    padding: '0 1rem',
  };

  const card = {
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    overflow: 'hidden',
  };

  const heading = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  const table = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const th = {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '500',
    color: '#4b5563',
  };

  const td = {
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#1f2937',
  };

  const button = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    marginRight: '0.5rem',
  };

  const viewButton = {
    ...button,
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  };

  const editButton = {
    ...button,
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
  };

  const deleteButton = {
    ...button,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  };

  const menuButton = {
    ...button,
    backgroundColor: '#fef3c7',
    color: '#92400e',
  };

  const actionButton = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.875rem',
  };

  const statusBadge = (isOpen) => ({
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    backgroundColor: isOpen ? '#dcfce7' : '#fee2e2',
    color: isOpen ? '#166534' : '#b91c1c',
  });

  const actionButtons = {
    display: 'flex',
    gap: '0.5rem',
  };

  const tableImageCell = {
    ...td,
    width: '60px',
    padding: '0.5rem',
  };

  const tableImage = {
    width: '50px',
    height: '50px',
    borderRadius: '4px',
    objectFit: 'cover',
  };

  return (
    <div style={container}>

      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Dashboard
        </button>

        <div style={card}>
          <div style={heading}>
            <div>
              <span style={adminBadge}>ADMIN</span>
              Restaurant Management
            </div>
            <div style={actionButtons}>
              <button style={actionButton} onClick={handleViewStats}>
                View Statistics
              </button>
              <button style={actionButton} onClick={handleAddRestaurant}>
                Add Restaurant
              </button>
            </div>
          </div>

          {error && <div style={errorMessage}>{error}</div>}

          {restaurants.length === 0 ? (
            <p>No restaurants found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Image</th>
                    <th style={th}>Name</th>
                    <th style={th}>Location</th>
                    <th style={th}>Cuisine</th>
                    <th style={th}>Rating</th>
                    <th style={th}>Status</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((restaurant) => (
                    <tr key={restaurant._id}>
                      <td style={tableImageCell}>
                        {restaurant.imageUrl ? (
                          <img 
                            src={restaurant.imageUrl} 
                            alt={restaurant.name} 
                            style={tableImage} 
                          />
                        ) : (
                          <div style={{width: '50px', height: '50px'}}>
                            <PlaceholderImage type="restaurant" width="50px" height="50px" />
                          </div>
                        )}
                      </td>
                      <td style={td}>{restaurant.name}</td>
                      <td style={td}>{restaurant.location}</td>
                      <td style={td}>{restaurant.cuisine}</td>
                      <td style={td}>{restaurant.rating ? restaurant.rating.toFixed(1) : 'N/A'}</td>
                      <td style={td}>
                        <span style={statusBadge(restaurant.isOpen)}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td style={td}>
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
                          onClick={() => handleViewMenu(restaurant._id)}
                        >
                          Menu
                        </button>
                        <button 
                          style={{
                            ...button,
                            backgroundColor: restaurant.isOpen ? '#f3f4f6' : '#d1fae5',
                            color: restaurant.isOpen ? '#6b7280' : '#047857',
                          }} 
                          onClick={() => handleToggleAvailability(restaurant._id, restaurant.isOpen)}
                        >
                          {restaurant.isOpen ? 'Close' : 'Open'}
                        </button>
                        <button 
                          style={deleteButton} 
                          onClick={() => handleDeleteRestaurant(restaurant._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurants; 

 
 