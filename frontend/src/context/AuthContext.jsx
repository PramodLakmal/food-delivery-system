import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

// Create context
const AuthContext = createContext();

// Helper function for logging only in development
const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Helper function for logging errors
const debugError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

// Helper function to ensure user object has a valid ID
const ensureUserId = (user) => {
  if (!user) return null;
  
  // Create a copy to avoid mutations
  const normalizedUser = { ...user };
  
  // If id is undefined or null, but _id exists, use _id
  if ((!normalizedUser.id || normalizedUser.id === 'undefined') && normalizedUser._id) {
    debugLog('Setting missing user ID from _id:', normalizedUser._id);
    normalizedUser.id = normalizedUser._id;
  }
  
  // If stored with string 'undefined', fix it
  if (normalizedUser.id === 'undefined') {
    debugError('User ID is string "undefined", checking for alternatives');
    
    // Try to extract ID from token or find another way to get the ID
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // JWT tokens are usually in format: header.payload.signature
        const payload = token.split('.')[1];
        if (payload) {
          const decodedData = JSON.parse(atob(payload));
          if (decodedData && decodedData.id) {
            debugLog('Recovered user ID from JWT token:', decodedData.id);
            normalizedUser.id = decodedData.id;
          }
        }
      } catch (e) {
        debugError('Failed to extract ID from token:', e);
      }
    }
  }
  
  return normalizedUser;
};

// Context provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (token && storedUser) {
          let parsedUser = JSON.parse(storedUser);
          
          // Ensure user has a valid ID
          parsedUser = ensureUserId(parsedUser);
          
          debugLog('Auth initialized with stored user:', {
            id: parsedUser.id,
            role: parsedUser.role,
            idType: typeof parsedUser.id
          });
          
          // If ID is still missing, try to refresh user data from API
          if (!parsedUser.id || parsedUser.id === 'undefined') {
            try {
              debugLog('Attempting to refresh user data from API...');
              const userData = await authService.getCurrentUser();
              if (userData && userData.success && userData.data) {
                parsedUser = ensureUserId(userData.data);
                localStorage.setItem('user', JSON.stringify(parsedUser));
                debugLog('User data refreshed from API:', parsedUser);
              }
            } catch (refreshErr) {
              debugError('Failed to refresh user data:', refreshErr);
            }
          }
          
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        debugError('Auth initialization error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login({ email, password });
      
      // Ensure user has a valid ID
      const normalizedUser = ensureUserId(data.user);
      debugLog('Login successful, user data:', {
        id: normalizedUser.id,
        role: normalizedUser.role,
        idType: typeof normalizedUser.id
      });
      
      setUser(normalizedUser);
      setIsAuthenticated(true);
      
      // Update localStorage with normalized user
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      return { ...data, user: normalizedUser };
    } catch (err) {
      debugError('Login error in AuthContext:', err);
      const errorMessage = err.message || err.error || 'Login failed';
      setError(errorMessage);
      throw err; // Re-throw to allow component to handle it
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      
      // Ensure user has a valid ID
      const normalizedUser = ensureUserId(data.user);
      debugLog('Registration successful, user data:', {
        id: normalizedUser.id,
        role: normalizedUser.role,
        idType: typeof normalizedUser.id
      });
      
      setUser(normalizedUser);
      setIsAuthenticated(true);
      
      // Update localStorage with normalized user
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      return { ...data, user: normalizedUser };
    } catch (err) {
      setError(err.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user function
  const updateUser = (userData) => {
    // Ensure user has a valid ID
    const normalizedUser = ensureUserId(userData);
    debugLog('Updating user data:', {
      id: normalizedUser.id,
      role: normalizedUser.role,
      idType: typeof normalizedUser.id
    });
    
    setUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 
 
 