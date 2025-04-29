import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import PlaceholderImage from '../../components/PlaceholderImage';
import LocationPicker from '../../components/LocationPicker';

const AdminRestaurantEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 6.9271, lng: 79.8612 }); // Default to Colombo
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    cuisine: '',
    rating: 0,
    isOpen: false
  });

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchRestaurant = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/restaurants/${id}`);
        
        if (response.data && response.data.success) {
          const restaurant = response.data.data;
          setFormData({
            name: restaurant.name || '',
            location: restaurant.location || '',
            cuisine: restaurant.cuisine || '',
            rating: restaurant.rating || 0,
            isOpen: restaurant.isOpen || false
          });
          
          // Set image URL if available
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
      
      // Include imageUrl and coordinates in the data sent to the server
      const restaurantData = {
        ...formData,
        imageUrl,
        coordinates
      };
      
      const response = await api.put(`/restaurants/${id}`, restaurantData);
      
      if (response.data && response.data.success) {
        navigate(`/admin/restaurants/${id}`);
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
    navigate(`/admin/restaurants/${id}`);
  };

  const handleToggleAvailability = async () => {
    try {
      const response = await api.patch(`/restaurants/${id}/availability`, {
        isOpen: !formData.isOpen
      });
      
      if (response.data && response.data.success) {
        setFormData({
          ...formData,
          isOpen: !formData.isOpen
        });
      } else {
        setError('Failed to update restaurant availability');
      }
    } catch (err) {
      console.error('Error updating restaurant availability:', err);
      setError('Failed to update restaurant availability');
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

  const checkbox = {
    marginRight: '0.5rem',
  };

  const checkboxLabel = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#374151',
    cursor: 'pointer',
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

  const toggleButton = {
    backgroundColor: formData.isOpen ? '#dcfce7' : '#fee2e2',
    color: formData.isOpen ? '#047857' : '#b91c1c',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'inline-flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
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
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to Restaurant
        </button>

        <div style={card}>
          <h2 style={heading}>
            <span style={adminBadge}>ADMIN</span>
            Edit Restaurant
          </h2>

          {error && <div style={errorMessage}>{error}</div>}

          <button 
            style={toggleButton}
            onClick={handleToggleAvailability}
          >
            {formData.isOpen ? '✓ Restaurant is Open' : '✕ Restaurant is Closed'}
          </button>

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
              <label style={label} htmlFor="rating">Rating (0-5)</label>
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
                style={isSaving ? disabledButton : submitButton}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={handleGoBack}
                style={cancelButton}
                disabled={isSaving}
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

export default AdminRestaurantEdit; 

 
 