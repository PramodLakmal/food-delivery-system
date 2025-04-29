import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import LocationPicker from '../../components/LocationPicker';

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

const RestaurantAdminCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    cuisine: '',
    isOpen: true
  });
  const [imageUrl, setImageUrl] = useState('');
  const [coordinates, setCoordinates] = useState(null);

  // Get effective user ID (from auth context or token as fallback)
  const getEffectiveUserId = () => {
    if (user && user.id && user.id !== 'undefined') {
      return user.id;
    }
    
    const tokenId = getUserIdFromToken();
    console.log('Using JWT token ID as fallback:', tokenId);
    return tokenId;
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleLocationChange = (location) => {
    setFormData({
      ...formData,
      location
    });
  };

  const handleCoordinatesChange = (coords) => {
    setCoordinates(coords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get effective user ID
    const effectiveUserId = getEffectiveUserId();
    
    // Log the user data to help debug ID issues
    console.log('Submitting with user:', {
      contextId: user?.id,
      effectiveId: effectiveUserId,
      idType: typeof effectiveUserId,
      role: user?.role
    });
    
    // Check if we have a valid user ID
    if (!effectiveUserId) {
      setError('Authentication issue. Please log out and log in again.');
      return;
    }
    
    // Validate required fields
    if (!formData.name || !formData.location || !formData.cuisine) {
      setError('Name, location, and cuisine are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await api.post('/restaurants', {
        ...formData,
        imageUrl: imageUrl, // Include the image URL in the request
        coordinates: coordinates // Include coordinates if available
      });
      
      if (response.data && response.data.success) {
        console.log('Created restaurant:', response.data.data);
        navigate('/restaurant-admin/dashboard');
      } else {
        setError('Failed to create restaurant');
      }
    } catch (err) {
      console.error('Error creating restaurant:', err);
      setError(err.response?.data?.error || 'Failed to create restaurant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/restaurant-admin/dashboard');
  };

  // Styles
  const container = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '2rem 0',
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    maxWidth: '32rem',
    margin: '0 auto',
    padding: '1.5rem',
  };

  const header = {
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

  const formGroup = {
    marginBottom: '1rem',
  };

  const label = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: '0.5rem',
  };

  const input = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    color: '#1f2937',
  };

  const checkboxLabel = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#4b5563',
    cursor: 'pointer',
  };

  const checkbox = {
    marginRight: '0.5rem',
  };

  const buttonContainer = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
    gap: '0.75rem',
  };

  const button = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  };

  const primaryButton = {
    ...button,
    backgroundColor: '#4f46e5',
    color: 'white',
  };

  const secondaryButton = {
    ...button,
    backgroundColor: '#9ca3af',
    color: 'white',
  };

  const errorContainer = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={header}>
          <span style={restaurantAdminBadge}>RESTAURANT</span>
          Create New Restaurant
        </h2>

        {error && (
          <div style={errorContainer}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={formGroup}>
            <label style={label} htmlFor="name">Restaurant Name</label>
            <input
              style={input}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div style={formGroup}>
            <label style={label} htmlFor="location">Location*</label>
            <input
              style={input}
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter restaurant location"
              required
            />
          </div>

          <div style={formGroup}>
            <label style={{...label, marginBottom: '10px'}}>Select on Map</label>
            <LocationPicker 
              initialLocation={formData.location}
              onLocationChange={handleLocationChange}
              onCoordinatesChange={handleCoordinatesChange}
              placeholder="Search for location"
            />
            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem'}}>
              Note: You can manually type an address or use the map to select a location.
            </div>
          </div>

          <div style={formGroup}>
            <label style={label} htmlFor="cuisine">Cuisine Type</label>
            <input
              style={input}
              type="text"
              id="cuisine"
              name="cuisine"
              value={formData.cuisine}
              onChange={handleChange}
              placeholder="Enter cuisine type (e.g. Italian, Chinese)"
              required
            />
          </div>

          {/* Image Upload Component */}
          <ImageUpload 
            imageUrl={imageUrl} 
            setImageUrl={setImageUrl} 
            placeholderText="Upload restaurant image (optional)" 
          />
          <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '-0.5rem', marginBottom: '1rem'}}>
            Note: Images must be less than 5MB in size for optimal performance.
          </div>

          <div style={formGroup}>
            <label style={checkboxLabel}>
              <input
                style={checkbox}
                type="checkbox"
                name="isOpen"
                checked={formData.isOpen}
                onChange={handleChange}
              />
              Restaurant is open and ready to accept orders
            </label>
          </div>

          <div style={buttonContainer}>
            <button
              type="button"
              style={secondaryButton}
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={primaryButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantAdminCreate; 

 
 