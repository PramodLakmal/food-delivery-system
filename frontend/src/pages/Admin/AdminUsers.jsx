import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminUsers = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }

    // Fetch all users
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/users');
        setUsers(response.data.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const handleGoBack = () => {
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    logout();
  };

  const handleViewUser = (userId) => {
    window.location.href = `/admin/users/view?id=${userId}`;
  };

  const handleEditUser = (userId) => {
    window.location.href = `/admin/users/edit?id=${userId}`;
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        // Remove user from state
        setUsers(users.filter(user => user._id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user. Please try again.');
      }
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
    maxWidth: '80rem',
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

  const table = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const th = {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '500',
    color: '#4b5563',
  };

  const td = {
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#1f2937',
  };

  const button = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    marginRight: '0.5rem',
  };

  const viewButton = {
    ...button,
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  };

  const editButton = {
    ...button,
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
  };

  const deleteButton = {
    ...button,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
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

  return (
    <div style={container}>

      <div style={contentContainer}>

        <div style={card}>
          <h2 style={heading}>
            <span style={adminBadge}>ADMIN</span>
            User Management
          </h2>

          {error && <div style={errorMessage}>{error}</div>}

          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Role</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td style={td}>{user.name}</td>
                      <td style={td}>{user.email}</td>
                      <td style={td}>{user.phone}</td>
                      <td style={td}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          backgroundColor: user.role === 'admin' ? '#dcfce7' : 
                                          user.role === 'restaurant-admin' ? '#dbeafe' : 
                                          user.role === 'delivery-person' ? '#fef3c7' : '#e0e7ff',
                          color: user.role === 'admin' ? '#166534' : 
                                user.role === 'restaurant-admin' ? '#1e40af' : 
                                user.role === 'delivery-person' ? '#92400e' : '#4338ca',
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={td}>
                        <button 
                          style={viewButton} 
                          onClick={() => handleViewUser(user._id)}
                        >
                          View
                        </button>
                        <button 
                          style={editButton} 
                          onClick={() => handleEditUser(user._id)}
                        >
                          Edit
                        </button>
                        <button 
                          style={deleteButton} 
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers; 

 
 