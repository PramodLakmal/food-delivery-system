import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminUserView = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }

    // Get userId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
      setError('User ID is missing');
      setIsLoading(false);
      return;
    }

    // Fetch user details
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/users/${userId}`);
        if (response.data && response.data.success) {
          setUserData(response.data.data);
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

  const handleGoBack = () => {
    window.location.href = '/admin/users';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    logout();
  };

  const handleEditUser = () => {
    if (userData && userData._id) {
      window.location.href = `/admin/users/edit?id=${userData._id}`;
    }
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

  const userInfoField = {
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
  };

  const fieldLabel = {
    fontWeight: '500',
    marginBottom: '0.25rem',
    fontSize: '0.875rem',
    color: '#4b5563',
  };

  const fieldValue = {
    fontWeight: '400',
    color: '#111827',
  };

  const roleBadge = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    backgroundColor: userData?.role === 'admin' ? '#dcfce7' : 
                  userData?.role === 'restaurant-admin' ? '#dbeafe' : 
                  userData?.role === 'delivery-person' ? '#fef3c7' : '#e0e7ff',
    color: userData?.role === 'admin' ? '#166534' : 
         userData?.role === 'restaurant-admin' ? '#1e40af' : 
         userData?.role === 'delivery-person' ? '#92400e' : '#4338ca',
  };

  const actionButtons = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
    gap: '0.75rem',
  };

  const editButton = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#4f46e5',
    color: 'white',
  };

  return (
    <div style={container}>

      <div style={contentContainer}>
        <button style={backButton} onClick={handleGoBack}>
          &larr; Back to User Management
        </button>

        <div style={card}>
          <h2 style={heading}>
            <span style={adminBadge}>ADMIN</span>
            User Details
          </h2>

          {error && <div style={errorMessage}>{error}</div>}

          {userData ? (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flexBasis: '100%' }}>
                  <div style={{ ...userInfoField, backgroundColor: '#f3f4f7', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                      {userData.name}
                    </h3>
                    <div>
                      <span style={roleBadge}>{userData.role}</span>
                    </div>
                  </div>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Email</div>
                    <div style={fieldValue}>{userData.email}</div>
                  </div>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Phone</div>
                    <div style={fieldValue}>{userData.phone}</div>
                  </div>
                </div>

                <div style={{ width: '100%' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1rem', marginBottom: '0.75rem' }}>
                    Address Information
                  </h3>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Street</div>
                    <div style={fieldValue}>{userData.address?.street || 'Not provided'}</div>
                  </div>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>City</div>
                    <div style={fieldValue}>{userData.address?.city || 'Not provided'}</div>
                  </div>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>State</div>
                    <div style={fieldValue}>{userData.address?.state || 'Not provided'}</div>
                  </div>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Postal Code</div>
                    <div style={fieldValue}>{userData.address?.postalCode || 'Not provided'}</div>
                  </div>
                </div>

                <div style={{ flexBasis: '100%' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Country</div>
                    <div style={fieldValue}>{userData.address?.country || 'Not provided'}</div>
                  </div>
                </div>

                <div style={{ width: '100%' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1rem', marginBottom: '0.75rem' }}>
                    Account Information
                  </h3>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Account Created</div>
                    <div style={fieldValue}>
                      {userData.createdAt ? new Date(userData.createdAt).toLocaleString() : 'Not available'}
                    </div>
                  </div>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Last Updated</div>
                    <div style={fieldValue}>
                      {userData.updatedAt ? new Date(userData.updatedAt).toLocaleString() : 'Not available'}
                    </div>
                  </div>
                </div>

                <div style={{ flexBasis: 'calc(50% - 0.5rem)', minWidth: '250px' }}>
                  <div style={userInfoField}>
                    <div style={fieldLabel}>Status</div>
                    <div style={fieldValue}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        backgroundColor: userData.isActive ? '#dcfce7' : '#fee2e2',
                        color: userData.isActive ? '#166534' : '#b91c1c',
                      }}>
                        {userData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={actionButtons}>
                <button style={editButton} onClick={handleEditUser}>
                  Edit User
                </button>
              </div>
            </div>
          ) : (
            <p>No user data found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserView; 

 
 