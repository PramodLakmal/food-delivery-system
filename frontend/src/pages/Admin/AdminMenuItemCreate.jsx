import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ImageUpload from '../../components/ImageUpload';

const AdminMenuItemCreate = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Other',
    description: '',
    availability: true
  });

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
      setError(null);
      
      const menuItemData = {
        ...formData,
        price: parseFloat(formData.price),
        imageUrl
      };
      
      const response = await api.post(`/menu/${restaurantId}`, menuItemData);
      
      if (response.data && response.data.success) {
        // Navigate back to restaurant view
        navigate(`/admin/restaurants/${restaurantId}`);
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

  const handleGoBack = () => {
    navigate(`/admin/restaurants/${restaurantId}`);
  };

  // Styles
  const container = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    maxWidth: '600px',
    margin: '20px auto',
  };

  const header = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1f2937',
  };

  const formGroup = {
    marginBottom: '16px',
  };

  const label = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'medium',
    color: '#4b5563',
  };

  const input = {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '16px',
  };

  const select = {
    ...input,
  };

  const checkbox = {
    marginRight: '8px',
  };

  const button = {
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'medium',
    marginRight: '12px',
  };

  const cancelButton = {
    ...button,
    backgroundColor: '#6b7280',
  };

  const buttonContainer = {
    marginTop: '24px',
    display: 'flex',
  };

  const errorText = {
    color: '#ef4444',
    marginTop: '8px',
  };

  return (
    <div style={container}>
      <div style={card}>
        <h1 style={header}>Add New Menu Item</h1>
        
        {error && <div style={errorText}>{error}</div>}
        
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
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div style={formGroup}>
            <label style={label} htmlFor="price">Price</label>
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
              style={{ ...input, minHeight: '100px' }}
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter item description"
            />
          </div>
          
          <div style={formGroup}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                style={checkbox}
                type="checkbox"
                name="availability"
                checked={formData.availability}
                onChange={handleChange}
              />
              Available for ordering
            </label>
          </div>
          
          <div style={formGroup}>
            <ImageUpload
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              placeholderText="Upload menu item image (optional)"
            />
            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '-0.5rem', marginBottom: '1rem'}}>
              Note: Images must be less than 100KB in size due to server limitations.
            </div>
          </div>
          
          <div style={buttonContainer}>
            <button
              type="submit"
              style={button}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Add Menu Item'}
            </button>
            <button
              type="button"
              style={cancelButton}
              onClick={handleGoBack}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMenuItemCreate; 

 
 
 