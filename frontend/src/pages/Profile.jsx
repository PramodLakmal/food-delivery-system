import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize form with user data when available
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || '',
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsSubmitting(true);
    
    try {
      // Transform the data to match the backend expectation
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        }
      };
      
      const response = await authService.updateProfile(profileData);
      if (response.data) {
        updateUser(response.data);
      }
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
      setIsEditing(false);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await authService.updatePassword(passwordData);
      setMessage({ 
        type: 'success', 
        text: 'Password updated successfully!' 
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Failed to update password. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Styles
  const container = {
    padding: '1rem',
  };

  const contentContainer = {
    width: '100%',
  };

  const card = {
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  };

  const tabNav = {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
  };

  const tab = {
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const activeTabStyle = {
    ...tab,
    borderBottom: '2px solid #4f46e5',
    color: '#4f46e5',
  };

  const inactiveTabStyle = {
    ...tab,
    color: '#6b7280',
  };

  const cardContent = {
    padding: '1.5rem',
  };

  const formStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
  };

  const formGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '1rem',
  };

  const formGridDesktop = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  };

  const buttonRow = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem',
  };

  const buttonPrimary = {
    padding: '0.5rem 1rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
  };

  const buttonSecondary = {
    padding: '0.5rem 1rem',
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
  };

  const alertBox = {
    padding: '0.75rem',
    borderRadius: '0.375rem',
    marginBottom: '1.5rem',
  };

  const successAlert = {
    ...alertBox,
    backgroundColor: '#ecfdf5',
    color: '#065f46',
  };

  const errorAlert = {
    ...alertBox,
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
  };

  const sectionTitle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem',
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
          <div style={tabNav}>
            <div 
              style={activeTab === 'profile' ? activeTabStyle : inactiveTabStyle}
              onClick={() => setActiveTab('profile')}
            >
              Profile Information
            </div>
            <div 
              style={activeTab === 'password' ? activeTabStyle : inactiveTabStyle}
              onClick={() => setActiveTab('password')}
            >
              Change Password
            </div>
          </div>

          <div style={cardContent}>
            {message.text && (
              <div style={message.type === 'success' ? successAlert : errorAlert}>
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <>
                <h2 style={sectionTitle}>Your Profile Information</h2>
                <form onSubmit={handleProfileSubmit} style={formStyle}>
                  <div style={window.innerWidth > 768 ? formGridDesktop : formGrid}>
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="input"
                        value={formData.name}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="input"
                        value={formData.email}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="input"
                        value={formData.phone}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>

                  <h3 style={{ ...sectionTitle, marginTop: '1rem', fontSize: '1rem' }}>Address Information</h3>
                  
                  <div style={window.innerWidth > 768 ? formGridDesktop : formGrid}>
                    <div className="form-group">
                      <label htmlFor="street" className="form-label">Street Address</label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        className="input"
                        value={formData.street}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="city" className="form-label">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="input"
                        value={formData.city}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="state" className="form-label">State/Province</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="input"
                        value={formData.state}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="postalCode" className="form-label">Postal/ZIP Code</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        className="input"
                        value={formData.postalCode}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="country" className="form-label">Country</label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        className="input"
                        value={formData.country}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>

                  <div style={buttonRow}>
                    {isEditing ? (
                      <>
                        <button 
                          type="button" 
                          onClick={() => setIsEditing(false)}
                          style={buttonSecondary}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          style={buttonPrimary}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(true)}
                        style={buttonPrimary}
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}

            {activeTab === 'password' && (
              <>
                <h2 style={sectionTitle}>Change Your Password</h2>
                <form onSubmit={handlePasswordSubmit} style={formStyle}>
                  <div className="form-group">
                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      className="input"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      className="input"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className="input"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div style={buttonRow}>
                    <button 
                      type="submit" 
                      style={buttonPrimary}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 

 