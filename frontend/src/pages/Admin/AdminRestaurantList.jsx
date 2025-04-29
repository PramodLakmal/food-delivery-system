import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PlaceholderImage from '../../components/PlaceholderImage';

const AdminRestaurantList = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/restaurants`, {
          params: {
            page: currentPage,
            limit: PAGE_SIZE,
            search: searchTerm
          }
        });

        if (response.data && response.data.success) {
          setRestaurants(response.data.data);
          setTotalPages(Math.ceil(response.data.total / PAGE_SIZE) || 1);
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
  }, [user, navigate, currentPage, searchTerm]);

  const handleViewRestaurant = (id) => {
    navigate(`/admin/restaurants/${id}`);
  };

  const handleCreateRestaurant = () => {
    navigate('/admin/restaurants/create');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleStatsView = () => {
    navigate('/admin/restaurants/stats');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // Search is handled by the useEffect dependency
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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

  const card = {
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  };

  const heading = {
    fontSize: '1.5rem',
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

  const headerActions = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const buttonPrimary = {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  };

  const buttonSecondary = {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginLeft: '0.5rem',
  };

  const errorMessage = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const searchForm = {
    display: 'flex',
    marginBottom: '1.5rem',
  };

  const searchInput = {
    flex: '1',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem 0 0 0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
  };

  const searchButton = {
    padding: '0.5rem 1rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    borderRadius: '0 0.375rem 0.375rem 0',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  };

  const table = {
    minWidth: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeader = {
    backgroundColor: '#f9fafb',
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
  };

  const tableCell = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    color: '#1f2937',
  };

  const badge = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
  };

  const viewButton = {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  };

  const paginationContainer = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
  };

  const paginationInfo = {
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  const paginationButtons = {
    display: 'flex',
    gap: '0.5rem',
  };

  const paginationButton = {
    padding: '0.375rem 0.75rem',
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    fontSize: '0.875rem',
  };

  const disabledButton = {
    ...paginationButton,
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
  };

  const noDataMessage = {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  };

  const tableImageCell = {
    ...tableCell,
    width: '60px',
    padding: '0.5rem',
  };

  const tableImage = {
    width: '50px',
    height: '50px',
    borderRadius: '4px',
    objectFit: 'cover',
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

  return (
    <div style={container}>

      <div style={contentContainer}>
        <div style={card}>
          <div style={headerActions}>
            <h2 style={heading}>
              <span style={adminBadge}>ADMIN</span>
              Restaurant Management
            </h2>
            <div>
              <button style={buttonPrimary} onClick={handleCreateRestaurant}>
                Add New Restaurant
              </button>
              <button style={buttonSecondary} onClick={handleStatsView}>
                View Statistics
              </button>
            </div>
          </div>

          {error && <div style={errorMessage}>{error}</div>}

          <form style={searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search restaurants by name, location, or cuisine..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={searchInput}
            />
            <button type="submit" style={searchButton}>
              Search
            </button>
          </form>

          {restaurants.length > 0 ? (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={tableHeader}>Image</th>
                      <th style={tableHeader}>Restaurant Name</th>
                      <th style={tableHeader}>Location</th>
                      <th style={tableHeader}>Cuisine</th>
                      <th style={tableHeader}>Rating</th>
                      <th style={tableHeader}>Status</th>
                      <th style={tableHeader}>Actions</th>
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
                        <td style={tableCell}>{restaurant.name}</td>
                        <td style={tableCell}>{restaurant.location}</td>
                        <td style={tableCell}>{restaurant.cuisine}</td>
                        <td style={tableCell}>{restaurant.rating} ⭐</td>
                        <td style={tableCell}>
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
                        </td>
                        <td style={tableCell}>
                          <button
                            style={viewButton}
                            onClick={() => handleViewRestaurant(restaurant._id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={paginationContainer}>
                <div style={paginationInfo}>
                  Showing page {currentPage} of {totalPages}
                </div>
                <div style={paginationButtons}>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    style={currentPage === 1 ? disabledButton : paginationButton}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    style={currentPage === totalPages ? disabledButton : paginationButton}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={noDataMessage}>
              No restaurants found. {searchTerm && 'Try a different search term.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantList; 

 
 