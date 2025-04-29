import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminRestaurantStats = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }

    // Fetch restaurant stats
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/restaurants/stats');
        if (response.data && response.data.success) {
          setStats(response.data.data);
        } else {
          setError('Failed to fetch restaurant statistics');
        }
      } catch (err) {
        console.error('Error fetching restaurant stats:', err);
        setError('Failed to fetch restaurant statistics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const handleGoBack = () => {
    window.location.href = '/admin/restaurants';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    logout();
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

  const statsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    marginTop: '1.5rem',
  };

  const statCard = {
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
  };

  const statValue = {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
  };

  const statLabel = {
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  return (
    <div style={container}>

      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Restaurant Management
        </button>

        <div style={card}>
          <h2 style={heading}>
            <span style={adminBadge}>ADMIN</span>
            Restaurant System Statistics
          </h2>

          {error && <div style={errorMessage}>{error}</div>}

          {stats ? (
            <div>
              <div style={statsGrid}>
                <div style={{
                  ...statCard,
                  backgroundColor: '#e0e7ff',
                }}>
                  <div style={{
                    ...statValue,
                    color: '#4338ca',
                  }}>
                    {stats.totalRestaurants}
                  </div>
                  <div style={statLabel}>Total Restaurants</div>
                </div>
                
                <div style={{
                  ...statCard,
                  backgroundColor: '#dbeafe',
                }}>
                  <div style={{
                    ...statValue,
                    color: '#1e40af',
                  }}>
                    {stats.totalMenuItems}
                  </div>
                  <div style={statLabel}>Total Menu Items</div>
                </div>
                
                <div style={{
                  ...statCard,
                  backgroundColor: '#dcfce7',
                }}>
                  <div style={{
                    ...statValue,
                    color: '#047857',
                  }}>
                    ${parseFloat(stats.averageMenuPrice).toFixed(2)}
                  </div>
                  <div style={statLabel}>Average Menu Item Price</div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>System Information</h3>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                  These statistics provide an overview of the restaurant service in the food delivery system.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p>No statistics available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantStats; 

 
 