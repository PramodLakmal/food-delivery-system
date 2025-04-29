import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PlaceholderImage from '../components/PlaceholderImage';

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [isOpenOnly, setIsOpenOnly] = useState(false);
  const [cuisines, setCuisines] = useState(['All']);

  useEffect(() => {
    // Fetch all restaurants
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/restaurants');
        if (response.data && response.data.success) {
          const restaurantData = response.data.data;
          setRestaurants(restaurantData);
          
          // Extract unique cuisines for filter
          const uniqueCuisines = new Set(restaurantData.map(r => r.cuisine));
          setCuisines(['All', ...Array.from(uniqueCuisines)]);
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
  }, []);

  // Filter restaurants when search, cuisine filter or open-only filter changes
  useEffect(() => {
    let results = [...restaurants];
    
    // Filter by search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      results = results.filter(restaurant => 
        restaurant.name.toLowerCase().includes(lowercasedSearch) ||
        restaurant.cuisine.toLowerCase().includes(lowercasedSearch) ||
        restaurant.location.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Filter by cuisine
    if (cuisineFilter !== 'All') {
      results = results.filter(restaurant => restaurant.cuisine === cuisineFilter);
    }
    
    // Filter by open status
    if (isOpenOnly) {
      results = results.filter(restaurant => restaurant.isOpen);
    }
    
    setFilteredRestaurants(results);
  }, [searchTerm, cuisineFilter, isOpenOnly, restaurants]);

  const handleRestaurantClick = (id) => {
    navigate(`/restaurants/${id}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCuisineChange = (e) => {
    setCuisineFilter(e.target.value);
  };

  const handleToggleOpenOnly = () => {
    setIsOpenOnly(!isOpenOnly);
  };

  // Styles
  const container = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  };

  const contentContainer = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  };

  const hero = {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '3rem 1rem',
    textAlign: 'center',
    borderRadius: '0.5rem',
    marginBottom: '2rem',
  };

  const heroTitle = {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '1rem',
  };

  const heroSubtitle = {
    fontSize: '1.125rem',
    maxWidth: '800px',
    margin: '0 auto',
  };

  const searchContainer = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    margin: '0 auto 2rem',
    maxWidth: '900px',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  };

  const searchInputContainer = {
    display: 'flex',
    width: '100%',
    position: 'relative',
  };

  const searchInput = {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
  };

  const searchIcon = {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    fontSize: '1.25rem',
  };

  const filterContainer = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
  };

  const selectContainer = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const selectLabel = {
    fontSize: '0.875rem',
    color: '#374151',
  };

  const select = {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
  };

  const checkbox = {
    marginRight: '0.5rem',
  };

  const restaurantGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  };

  const restaurantCard = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const cardHover = {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };

  const imageContainer = {
    height: '180px',
    position: 'relative',
  };

  const image = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const statusBadge = (isOpen) => ({
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontWeight: '500',
    fontSize: '0.75rem',
    backgroundColor: isOpen ? '#10b981' : '#ef4444',
    color: 'white',
  });

  const restaurantContent = {
    padding: '1rem',
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
    marginTop: '0.5rem',
    color: '#f59e0b',
    fontWeight: '500',
  };

  const starIcon = {
    marginRight: '0.25rem',
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

  const noResults = {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    marginTop: '1rem',
  };

  if (isLoading) {
    return (
      <div style={container}>
        <div style={contentContainer}>
          <div style={hero}>
            <h1 style={heroTitle}>Welcome to Food Delivery!</h1>
            <p style={heroSubtitle}>Order from the best restaurants in your area, with fast delivery right to your door.</p>
          </div>
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

  return (
    <div style={container}>
      <div style={contentContainer}>
        <div style={hero}>
          <h1 style={heroTitle}>Welcome to Food Delivery!</h1>
          <p style={heroSubtitle}>
            {user ? `Hello, ${user.name}! ` : ''}
            Order from the best restaurants in your area, with fast delivery right to your door.
          </p>
        </div>

        <div style={searchContainer}>
          <div style={searchInputContainer}>
            <span style={searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search for restaurants, cuisines, or locations..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={searchInput}
            />
          </div>

          <div style={filterContainer}>
            <div style={selectContainer}>
              <label style={selectLabel}>Cuisine:</label>
              <select 
                value={cuisineFilter} 
                onChange={handleCuisineChange}
                style={select}
              >
                {cuisines.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                id="openOnly" 
                checked={isOpenOnly}
                onChange={handleToggleOpenOnly}
                style={checkbox}
              />
              <label htmlFor="openOnly" style={selectLabel}>Show only open restaurants</label>
            </div>
          </div>
        </div>

        {error && (
          <div style={errorContainer}>
            <p>{error}</p>
          </div>
        )}

        {filteredRestaurants.length === 0 ? (
          <div style={noResults}>
            <p>No restaurants found matching your criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={restaurantGrid}>
            {filteredRestaurants.map(restaurant => (
              <div 
                key={restaurant._id} 
                style={restaurantCard}
                onClick={() => handleRestaurantClick(restaurant._id)}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHover)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={imageContainer}>
                  {restaurant.imageUrl ? (
                    <img src={restaurant.imageUrl} alt={restaurant.name} style={image} />
                  ) : (
                    <PlaceholderImage type="restaurant" width="100%" height="180px" />
                  )}
                  <div style={statusBadge(restaurant.isOpen)}>
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </div>
                </div>
                
                <div style={restaurantContent}>
                  <h3 style={restaurantName}>{restaurant.name}</h3>
                  <p style={restaurantDetail}><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                  <p style={restaurantDetail}><strong>Location:</strong> {restaurant.location}</p>
                  
                  <div style={ratingContainer}>
                    <span style={starIcon}>★</span> {restaurant.rating?.toFixed(1) || 'No ratings yet'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHome; 