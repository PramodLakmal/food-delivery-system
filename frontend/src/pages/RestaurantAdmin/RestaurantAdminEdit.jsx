import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import PlaceholderImage from '../../components/PlaceholderImage';
import LocationPicker from '../../components/LocationPicker';

const RestaurantAdminEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    cuisine: '',
    isOpen: false
  });
  const [imageUrl, setImageUrl] = useState('');
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    // Check if user is restaurant-admin, if not redirect to dashboard
    if (user && user.role !== 'restaurant-admin') {
      navigate('/dashboard');
      return;
    }

    const fetchRestaurant = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/restaurants/${id}`);
        
        if (response.data && response.data.success) {
          const restaurant = response.data.data;
          
          // Verify this restaurant belongs to the current user
          if (restaurant.ownerId !== user.id && user.role !== 'admin') {
            setError('You do not have permission to edit this restaurant');
            setIsLoading(false);
            return;
          }
          
          setFormData({
            name: restaurant.name || '',
            location: restaurant.location || '',
            cuisine: restaurant.cuisine || '',
            isOpen: restaurant.isOpen || false
          });
          
          // Set the image URL if available
          if (restaurant.imageUrl) {
            setImageUrl(restaurant.imageUrl);
          }

          // Set coordinates if available
          if (restaurant.coordinates) {
            setCoordinates(restaurant.coordinates);
          }
        } else {
          setError('Failed to fetch restaurant details');
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError(err.response?.data?.error || 'Failed to fetch restaurant details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [id, navigate, user]);

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
    
    if (!formData.name || !formData.location || !formData.cuisine) {
      setError('Name, location, and cuisine are required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // Include the image URL and coordinates in the data sent to the server
      const restaurantData = {
        ...formData,
        imageUrl: imageUrl,
        coordinates: coordinates
      };
      
      const response = await api.put(`/restaurants/${id}`, restaurantData);
      
      if (response.data && response.data.success) {
        navigate(`/restaurant-admin/restaurants/${id}`);
      } else {
        setError('Failed to update restaurant');
      }
    } catch (err) {
      console.error('Error updating restaurant:', err);
      setError(err.response?.data?.error || 'Failed to update restaurant. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate(`/restaurant-admin/restaurants/${id}`);
  };

  const handleCancel = () => {
    navigate(`/restaurant-admin/restaurants/${id}`);
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

  const disabledButton = {
    ...primaryButton,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const errorContainer = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  };

  const loadingContainer = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  };

  const imagePreviewContainer = {
    marginBottom: '1.5rem',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    height: '200px',
    position: 'relative',
  };

  if (isLoading) {
    return (
      <div style={container}>
        <div style={card}>
          <div style={loadingContainer}>
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
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={header}>
          <span style={restaurantAdminBadge}>RESTAURANT ADMIN</span>
          Edit Restaurant
        </h2>

        {error && (
          <div style={errorContainer}>
            <p>{error}</p>
          </div>
        )}

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
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={input}
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
              Note: You can manually type an address above or use the map to select a location.
            </div>
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
          
          {/* Image Upload Component */}
          <div style={formGroup}>
            <ImageUpload 
              imageUrl={imageUrl} 
              setImageUrl={setImageUrl} 
              placeholderText="Upload restaurant image (optional)" 
            />
            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '-0.5rem', marginBottom: '1rem'}}>
              Note: Images must be less than 5MB in size for optimal performance.
            </div>
          </div>

          <div style={formGroup}>
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="isOpen"
                checked={formData.isOpen}
                onChange={handleChange}
                style={checkbox}
              />
              Restaurant is open and ready to accept orders
            </label>
          </div>

          <div style={buttonContainer}>
            <button
              type="button"
              style={secondaryButton}
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={isSaving ? disabledButton : primaryButton}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantAdminEdit; 

 
 