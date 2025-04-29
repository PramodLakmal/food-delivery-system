import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminUserEdit = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isActive: true
  });
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }

    // Get userId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
      setError('User ID is missing');
      setIsLoading(false);
      return;
    }

    setUserId(id);

    // Fetch user details
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/users/${id}`);
        if (response.data && response.data.success) {
          const user = response.data.data;
          setUserData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'customer',
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            postalCode: user.address?.postalCode || '',
            country: user.address?.country || '',
            isActive: user.isActive !== undefined ? user.isActive : true
          });
        } else {
          setError('Failed to fetch user details');
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to fetch user details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');
    setIsSaving(true);

    try {
      // Format the data for API
      const formattedData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        address: {
          street: userData.street,
          city: userData.city,
          state: userData.state,
          postalCode: userData.postalCode,
          country: userData.country
        },
        isActive: userData.isActive
      };

      const response = await api.put(`/users/${userId}`, formattedData);
      
      if (response.data && response.data.success) {
        setSuccessMessage('User updated successfully!');
        // Scroll to top to show the success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError('Failed to update user. Please try again.');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.error || 'Failed to update user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    window.location.href = `/admin/users/view?id=${userId}`;
  };

  const handleGoToUserList = () => {
    window.location.href = '/admin/users';
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
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    marginRight: '0.5rem',
  };

  const userListButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    marginRight: '0.5rem',
  };

  const dashboardButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    marginRight: '0.5rem',
  };

  const logoutButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  };

  const form = {
    marginTop: '1.5rem',
  };

  const formGroup = {
    marginBottom: '1rem',
  };

  const label = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  };

  const input = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    backgroundColor: 'white',
  };

  const select = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    backgroundColor: 'white',
  };

  const checkbox = {
    marginRight: '0.5rem',
    width: '1rem',
    height: '1rem',
  };

  const checkboxLabel = {
    fontSize: '0.875rem',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  };

  const buttonGroup = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
  };

  const saveButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '0.5rem',
  };

  const cancelButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
  };

  const alert = {
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const errorAlert = {
    ...alert,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
  };

  const successAlert = {
    ...alert,
    backgroundColor: '#dcfce7',
    color: '#15803d',
    border: '1px solid #bbf7d0',
  };

  const addressSection = {
    marginTop: '1.5rem',
    padding: '1rem',
    borderRadius: '0.375rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
  };

  const addressHeading = {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '1rem',
  };

  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '1rem',
  };

  return (
    <div style={container}>

      <div style={contentContainer}>
        {error && (
          <div style={errorAlert}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={successAlert}>
            {successMessage}
          </div>
        )}

        <div style={card}>
          <div style={heading}>
            {user && user.role === 'admin' && (
              <span style={adminBadge}>Admin</span>
            )}
            Edit User
          </div>

          <form style={form} onSubmit={handleSubmit}>
            <div style={formGroup}>
              <label style={label} htmlFor="name">Name</label>
              <input 
                style={input}
                type="text"
                id="name"
                name="name"
                value={userData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div style={formGroup}>
              <label style={label} htmlFor="email">Email</label>
              <input 
                style={input}
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div style={formGroup}>
              <label style={label} htmlFor="phone">Phone</label>
              <input 
                style={input}
                type="tel"
                id="phone"
                name="phone"
                value={userData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div style={formGroup}>
              <label style={label} htmlFor="role">Role</label>
              <select 
                style={select}
                id="role"
                name="role"
                value={userData.role}
                onChange={handleInputChange}
                required
              >
                <option value="customer">Customer</option>
                <option value="restaurant-admin">Restaurant Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={addressSection}>
              <h3 style={addressHeading}>Address</h3>
              
              <div style={grid}>
                <div style={formGroup}>
                  <label style={label} htmlFor="street">Street</label>
                  <input 
                    style={input}
                    type="text"
                    id="street"
                    name="street"
                    value={userData.street}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={formGroup}>
                  <label style={label} htmlFor="city">City</label>
                  <input 
                    style={input}
                    type="text"
                    id="city"
                    name="city"
                    value={userData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={formGroup}>
                  <label style={label} htmlFor="state">State/Province</label>
                  <input 
                    style={input}
                    type="text"
                    id="state"
                    name="state"
                    value={userData.state}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={formGroup}>
                  <label style={label} htmlFor="postalCode">Postal Code</label>
                  <input 
                    style={input}
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={userData.postalCode}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={formGroup}>
                  <label style={label} htmlFor="country">Country</label>
                  <input 
                    style={input}
                    type="text"
                    id="country"
                    name="country"
                    value={userData.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div style={formGroup}>
              <label style={checkboxLabel}>
                <input 
                  style={checkbox}
                  type="checkbox"
                  name="isActive"
                  checked={userData.isActive}
                  onChange={handleCheckboxChange}
                />
                Active User
              </label>
            </div>

            <div style={buttonGroup}>
              <button 
                type="button" 
                style={cancelButton} 
                onClick={handleGoBack}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={saveButton}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUserEdit; 

 
 