import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ImageUpload from '../../components/ImageUpload';

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

const RestaurantAdminMenuItemCreate = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Starter',
    description: '',
    availability: true
  });
  const [imageUrl, setImageUrl] = useState('');

  // Get effective user ID - from user object or token as fallback
  const getEffectiveUserId = () => {
    if (user && user.id && user.id !== 'undefined') {
      return user.id;
    }
    
    // Fallback to token-extracted ID
    const tokenId = getUserIdFromToken();
    console.log('Using token-extracted ID as fallback:', tokenId);
    return tokenId;
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      setError('Name and price are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const dataToSubmit = {
        ...formData,
        price: parseFloat(formData.price),
        imageUrl: imageUrl
      };
      
      const response = await api.post(`/menu/${restaurantId}`, dataToSubmit);
      
      if (response.data && response.data.success) {
        navigate(`/restaurant-admin/restaurants/${restaurantId}`);
      } else {
        setError('Failed to create menu item');
      }
    } catch (err) {
      console.error('Error creating menu item:', err);
      setError(err.response?.data?.error || 'Failed to create menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/restaurant-admin/restaurants/${restaurantId}`);
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

  const select = {
    ...input,
  };

  const textarea = {
    ...input,
    minHeight: '5rem',
    resize: 'vertical',
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
          <span style={restaurantAdminBadge}>MENU ITEM</span>
          Add New Menu Item
        </h2>

        {error && (
          <div style={errorContainer}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={formGroup}>
            <label style={label} htmlFor="name">Item Name</label>
            <input
              style={input}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter menu item name"
              required
            />
          </div>

          <div style={formGroup}>
            <label style={label} htmlFor="price">Price ($)</label>
            <input
              style={input}
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div style={formGroup}>
            <label style={label} htmlFor="category">Category</label>
            <select
              style={select}
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="Starter">Starter</option>
              <option value="Main">Main</option>
              <option value="Dessert">Dessert</option>
              <option value="Drink">Drink</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={formGroup}>
            <label style={label} htmlFor="description">Description</label>
            <textarea
              style={textarea}
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter item description (optional)"
            />
          </div>

          {/* Image Upload Component */}
          <ImageUpload 
            imageUrl={imageUrl} 
            setImageUrl={setImageUrl} 
            placeholderText="Upload menu item image (optional)" 
          />
          <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '-0.5rem', marginBottom: '1rem'}}>
            Note: Images must be less than 5MB in size for optimal performance.
          </div>

          <div style={formGroup}>
            <label style={checkboxLabel}>
              <input
                style={checkbox}
                type="checkbox"
                name="availability"
                checked={formData.availability}
                onChange={handleChange}
              />
              Item is available for order
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
              {isLoading ? 'Creating...' : 'Add Menu Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantAdminMenuItemCreate; 