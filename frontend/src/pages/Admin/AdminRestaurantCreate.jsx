import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import LocationPicker from '../../components/LocationPicker';

const AdminRestaurantCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 6.9271, lng: 79.8612 }); // Default to Colombo
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    cuisine: '',
    rating: 0
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
    
    if (!formData.name || !formData.location || !formData.cuisine) {
      setError('Name, location, and cuisine are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Include imageUrl and coordinates in the data sent to the server
      const restaurantData = {
        ...formData,
        imageUrl,
        coordinates
      };
      
      const response = await api.post('/restaurants', restaurantData);
      
      if (response.data && response.data.success) {
        // Navigate back to restaurant list on success
        navigate('/admin/restaurants');
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

  const handleGoBack = () => {
    navigate('/admin/restaurants');
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

  const formGroup = {
    marginBottom: '1.5rem',
  };

  const label = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  };

  const input = {
    width: '100%',
    padding: '0.625rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
  };

  const submitButton = {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  };

  const cancelButton = {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginLeft: '0.75rem',
  };

  const disabledButton = {
    ...submitButton,
    backgroundColor: '#a5b4fc',
    cursor: 'not-allowed',
  };

  const buttonContainer = {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: '1.5rem',
  };

  return (
    <div style={container}>

      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Restaurants
        </button>

        <div style={card}>
          <h2 style={heading}>
            <span style={adminBadge}>ADMIN</span>
            Create New Restaurant
          </h2>

          {error && <div style={errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={formGroup}>
              <label style={label} htmlFor="name">Restaurant Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={input}
                required
              />
            </div>

            <div style={formGroup}>
              <label style={label} htmlFor="location">Location*</label>
              <LocationPicker
                initialLocation={formData.location}
                onLocationChange={handleLocationChange}
                onCoordinatesChange={handleCoordinatesChange}
                placeholder="Enter restaurant location"
              />
            </div>

            <div style={formGroup}>
              <label style={label} htmlFor="cuisine">Cuisine Type*</label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                style={input}
                required
              />
            </div>

            <div style={formGroup}>
              <label style={label} htmlFor="rating">Initial Rating (0-5)</label>
              <input
                type="number"
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                style={input}
                min="0"
                max="5"
                step="0.1"
              />
            </div>

            <div style={formGroup}>
              <ImageUpload
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                placeholderText="Upload restaurant image (optional)"
              />
              <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '-0.5rem', marginBottom: '1rem'}}>
                Note: Images must be less than 100KB in size due to server limitations.
              </div>
            </div>

            <div style={buttonContainer}>
              <button 
                type="submit" 
                style={isLoading ? disabledButton : submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Restaurant'}
              </button>
              <button 
                type="button" 
                onClick={handleGoBack}
                style={cancelButton}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantCreate; 

 
 