import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate('/profile');
  };

  // Admin routes navigation
  const navigateToUsers = () => {
    navigate('/admin/users');
  };

  const navigateToRestaurants = () => {
    navigate('/admin/restaurants');
  };

  const navigateToRestaurantAdminDashboard = () => {
    navigate('/restaurant-admin/dashboard');
  };

  const navigateToStatistics = () => {
    // Placeholder for future implementation
    alert('System Statistics feature will be implemented soon.');
  };

  const navigateToOrderAnalytics = () => {
    // Placeholder for future implementation
    alert('Order Analytics feature will be implemented soon.');
  };

  // Styles
  const container = {
    padding: '1rem',
  };

  const contentContainer = {
    width: '100%',
  };

  const heading = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem',
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  };

  const cardHeader = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const cardHeaderText = {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: '#1f2937',
  };

  const cardBody = {
    padding: '1.5rem',
  };

  const cardsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
    gap: '1.5rem',
  };

  const roleCard = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const roleIcon = {
    width: '3rem',
    height: '3rem',
    borderRadius: '9999px',
    backgroundColor: '#e0e7ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    color: '#4338ca',
    fontSize: '1.5rem',
  };

  const roleTitle = {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '0.5rem',
  };

  const roleDescription = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  };

  const button = {
    padding: '0.5rem 1rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
  };

  return (
    <div style={container}>
      <div style={contentContainer}>
        <h2 style={heading}>Dashboard</h2>

        <div style={card}>
          <div style={cardHeader}>
            <h3 style={cardHeaderText}>Welcome to Food Delivery System</h3>
          </div>
          <div style={cardBody}>
            <p style={{ marginBottom: '1rem' }}>
              {user?.role === 'admin' ? (
                "You're logged in as an administrator. You have access to all system features."
              ) : user?.role === 'restaurant-admin' ? (
                "You're logged in as a restaurant owner. You can manage your restaurants and menu items."
              ) : (
                "You're logged in as a customer. You can browse restaurants and place orders."
              )}
            </p>

            {user?.role === 'admin' && (
              <div style={cardsGrid}>
                <div style={roleCard}>
                  <div style={roleIcon}>👥</div>
                  <h4 style={roleTitle}>User Management</h4>
                  <p style={roleDescription}>
                    View and manage all users in the system
                  </p>
                  <button style={button} onClick={navigateToUsers}>
                    Manage Users
                  </button>
                </div>

                <div style={roleCard}>
                  <div style={roleIcon}>🍽️</div>
                  <h4 style={roleTitle}>Restaurant Management</h4>
                  <p style={roleDescription}>
                    View and manage all restaurants in the system
                  </p>
                  <button style={button} onClick={navigateToRestaurants}>
                    Manage Restaurants
                  </button>
                </div>

                <div style={roleCard}>
                  <div style={roleIcon}>📊</div>
                  <h4 style={roleTitle}>System Statistics</h4>
                  <p style={roleDescription}>
                    View overall system statistics and insights
                  </p>
                  <button style={button} onClick={navigateToStatistics}>
                    View Statistics
                  </button>
                </div>
              </div>
            )}

            {user?.role === 'restaurant-admin' && (
              <div style={cardsGrid}>
                <div style={roleCard}>
                  <div style={roleIcon}>🏪</div>
                  <h4 style={roleTitle}>My Restaurants</h4>
                  <p style={roleDescription}>
                    Manage your restaurants and menu items
                  </p>
                  <button style={button} onClick={navigateToRestaurantAdminDashboard}>
                    Manage Restaurants
                  </button>
                </div>

                <div style={roleCard}>
                  <div style={roleIcon}>📈</div>
                  <h4 style={roleTitle}>Order Analytics</h4>
                  <p style={roleDescription}>
                    View analytics for your restaurant orders
                  </p>
                  <button style={button} onClick={navigateToOrderAnalytics}>
                    View Analytics
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 

 