import axios from 'axios';

// Create an axios instance for the API gateway
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add a request interceptor to include auth token in all requests
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add a response interceptor to handle expired tokens
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Don't redirect to login if the error is from a login attempt
      // or if we're already on the login page
      const isLoginAttempt = error.config.url.includes('/login');
      
      if (error.response && error.response.status === 401 && !isLoginAttempt) {
        // Token expired or invalid, clear storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// API instance pointing to the gateway for all services
const api = createApiInstance(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Ensure user object has consistent ID format
const normalizeUser = (user) => {
  if (!user) return user;
  
  // Create a new object to avoid mutations
  const normalizedUser = { ...user };
  
  // Ensure ID field is consistent - prefer _id (MongoDB format)
  if (normalizedUser._id && !normalizedUser.id) {
    normalizedUser.id = normalizedUser._id;
  }
  
  return normalizedUser;
};

// Simplified API object - all requests go through the gateway
const apiService = {
  async get(url, config) {
    return api.get(url, config);
  },
  
  async post(url, data, config) {
    return api.post(url, data, config);
  },
  
  async put(url, data, config) {
    return api.put(url, data, config);
  },
  
  async delete(url, config) {
    return api.delete(url, config);
  },
  
  async patch(url, data, config) {
    return api.patch(url, data, config);
  },
  
  // Delivery assignment methods
  async getAvailableDeliveryPersonnel() {
    try {
      const response = await api.get('/assignments/available');
      console.error('Response from available delivery personnel:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      throw error.response?.data || { error: 'Failed to fetch available delivery personnel' };
    }
  },
  
  async assignDeliveryPerson(deliveryId, deliveryPersonId) {
    try {
      const response = await api.post('/assignments/assign', {
        deliveryId,
        deliveryPersonId
      });
      
      return response.data;
    } catch (error) {
      console.error('API Error - Assign Delivery Person:', error);
      if (error.response) {
        const errorObj = new Error(error.response.data?.message || 'Failed to assign delivery person');
        errorObj.status = error.response.status;
        errorObj.error = error.response.data?.error;
        throw errorObj;
      }
      throw error;
    }
  },
  
  // Helper to get delivery by order ID
  async getDeliveryByOrderId(orderId) {
    try {
      const response = await api.get(`/deliveries/order/${orderId}`);
      console.log('Delivery for order response:', response);
      return response.data;
    } catch (error) {
      console.error('Error getting delivery for order:', error);
      throw error.response?.data || { error: 'Failed to get delivery for order' };
    }
  },
  
  // Create a new delivery record
  async createDelivery(deliveryData) {
    try {
      const response = await api.post('/deliveries', deliveryData);
      console.log('Create delivery response:', response);
      return response.data;
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw error.response?.data || { error: 'Failed to create delivery' };
    }
  },

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      console.log('Get order response:', response);
      return response.data;
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error.response?.data || { error: 'Failed to get order details' };
    }
  },

  // Get restaurant by ID
  async getRestaurantById(restaurantId) {
    try {
      const response = await api.get(`/restaurants/${restaurantId}`);
      console.log('Get restaurant response:', response);
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant details:', error);
      throw error.response?.data || { error: 'Failed to get restaurant details' };
    }
  },

  // Get customer by ID
  async getCustomerById(customerId) {
    try {
      const response = await api.get(`/users/${customerId}`);
      console.log('Get customer response:', response);
      return response.data;
    } catch (error) {
      console.error('Error getting customer details:', error);
      throw error.response?.data || { error: 'Failed to get customer details' };
    }
  },

  // Create and assign delivery person in one call
  async createAndAssignDelivery(orderId, restaurantId, deliveryPersonId) {
    try {
      console.log(`Creating and assigning delivery for order ${orderId} to delivery person ${deliveryPersonId}`);
      
      // Step 1: Try to find existing delivery for this order
      let deliveryId;
      try {
        const deliveryResponse = await api.get(`/deliveries/order/${orderId}`);
        if (deliveryResponse.data && deliveryResponse.data.success && deliveryResponse.data.data) {
          deliveryId = deliveryResponse.data.data._id;
          console.log(`Found existing delivery: ${deliveryId}`);
        }
      } catch (err) {
        console.log('No existing delivery found, will create a new one');
      }
      
      // Step 2: If no delivery exists, create one
      if (!deliveryId) {
        try {
          const createResponse = await api.post('/deliveries', {
            orderId,
            restaurantId
          });
          
          if (createResponse.data && createResponse.data.success && createResponse.data.data) {
            deliveryId = createResponse.data.data._id;
            console.log(`Created new delivery: ${deliveryId}`);
          } else {
            throw new Error('Failed to create delivery record');
          }
        } catch (createError) {
          console.error('Failed to create delivery:', createError);
          throw createError.response?.data || { error: 'Failed to create delivery record' };
        }
      }
      
      // Step 3: Assign delivery person
      if (!deliveryId) {
        throw new Error('No delivery ID available for assignment');
      }
      
      try {
        // Get delivery person details to confirm we have the correct ID format
        // This helps ensure we pass the userId rather than the MongoDB _id
        const deliveryPersonResponse = await api.get(`/assignments/available`);
        const availableDeliveryPersonnel = deliveryPersonResponse.data?.data || [];
        
        // Find the selected delivery person in available personnel
        const selectedPerson = availableDeliveryPersonnel.find(dp => 
          dp._id === deliveryPersonId || dp.userId === deliveryPersonId
        );
        
        // Use userId if available, otherwise fall back to the provided ID
        const assignmentId = selectedPerson ? selectedPerson.userId : deliveryPersonId;
        console.log(`Using delivery person ID for assignment: ${assignmentId}`);
        
        const assignResponse = await api.post('/assignments/assign', {
          deliveryId,
          deliveryPersonId: assignmentId
        });
        
        console.log('Assignment response:', assignResponse.data);
        
        // Check if there's a special message in the response
        const responseMessage = assignResponse.data.message || '';
        
        // If already assigned to the same person, we don't need to update the order status
        if (responseMessage.includes('already assigned')) {
          console.log('Delivery is already assigned to this person, skipping order status update');
          return assignResponse.data;
        }
        
        // Step 4: Update the order status to assigned or out_for_delivery if not already assigned
        try {
          console.log(`Updating order ${orderId} status to 'out_for_delivery'`);
          const orderUpdateResponse = await api.patch(`/orders/${orderId}/status`, {
            status: 'out_for_delivery'
          });
          console.log('Order status update response:', orderUpdateResponse.data);
        } catch (orderUpdateError) {
          console.error('Failed to update order status:', orderUpdateError);
          // Don't throw here, we want to continue even if order status update fails
        }
        
        return assignResponse.data;
      } catch (assignError) {
        console.error('Failed to assign delivery person:', assignError);
        throw assignError.response?.data || { error: 'Failed to assign delivery person' };
      }
    } catch (error) {
      console.error('Create and assign delivery error:', error);
      if (error.response) {
        const errorObj = new Error(error.response.data?.message || 'Failed to process delivery assignment');
        errorObj.status = error.response.status;
        errorObj.error = error.response.data?.error;
        throw errorObj;
      }
      throw error;
    }
  },

  // Delivery person API methods
  async getActiveDeliveries() {
    try {
      const response = await api.get('/deliveries/active');
      console.log('Active deliveries response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching active deliveries:', error);
      throw error.response?.data || { error: 'Failed to fetch active deliveries' };
    }
  },

  // Get delivery by ID
  async getDeliveryById(deliveryId) {
    try {
      const response = await api.get(`/deliveries/${deliveryId}`);
      console.log('Get delivery response:', response);
      return response.data;
    } catch (error) {
      console.error('Error getting delivery details:', error);
      throw error.response?.data || { error: 'Failed to get delivery details' };
    }
  },

  async updateDeliveryStatus(deliveryId, status) {
    try {
      const response = await api.put(`/deliveries/${deliveryId}/status`, { status });
      console.log('Update delivery status response:', response);
      return response.data;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error.response?.data || { error: 'Failed to update delivery status' };
    }
  },

  async getDeliveryPersonStats() {
    try {
      const response = await api.get('/assignments/stats');
      console.log('Delivery person stats response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery person stats:', error);
      throw error.response?.data || { error: 'Failed to fetch delivery person stats' };
    }
  }
};

// Authentication services
export const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Normalize and store user data
        const normalizedUser = normalizeUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        response.data.user = normalizedUser;
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Login an existing user
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // After successful login, fetch complete user profile
        const userResponse = await api.get('/users/me');
        if (userResponse.data && userResponse.data.success && userResponse.data.data) {
          // Normalize and store complete user data
          const normalizedUser = normalizeUser(userResponse.data.data);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          response.data.user = normalizedUser;
        } else {
          // If profile fetch fails, normalize and store basic user data
          const normalizedUser = normalizeUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          response.data.user = normalizedUser;
        }
      }
      return response.data;
    } catch (error) {
      console.error('Login error in authService:', error);
      // Don't navigate to login here - just throw the error for the component to handle
      if (error.response) {
        throw { 
          response: error.response,
          message: error.response.data?.message || error.response.data?.error || 'Invalid credentials'
        };
      } else {
        throw { message: 'Network error. Please try again.' };
      }
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data && response.data.success) {
        // Normalize user data in the response
        response.data.data = normalizeUser(response.data.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch user data' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/update-details', profileData);
      if (response.data && response.data.success && response.data.data) {
        // Normalize and store updated user data
        const normalizedUser = normalizeUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        response.data.data = normalizedUser;
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },

  // Update user password
  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update password' };
    }
  }
};

export default apiService; 
 
 