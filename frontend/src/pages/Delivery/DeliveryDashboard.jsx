import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DeliveryOnboarding from '../../components/Delivery/DeliveryOnboarding';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0,
    rating: 0
  });
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [deliveryProfile, setDeliveryProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    // Redirect if not a delivery person
    if (user && user.role !== 'delivery-person') {
      navigate('/dashboard');
      return;
    }

    // Check if delivery profile exists
    const fetchDeliveryProfile = async () => {
      try {
        setIsProfileLoading(true);
        const response = await api.get('/assignments/profile');
        setDeliveryProfile(response.data.data);
        // Set initial availability state from profile
        setIsAvailable(response.data.data.isAvailable);
        // Load stats once profile is loaded
        loadDeliveryStats();
        // Load recent deliveries
        fetchRecentDeliveries();
      } catch (err) {
        console.error('Error fetching delivery profile:', err);
        // 404 means profile doesn't exist yet, which is expected for new delivery people
        if (err.response?.status !== 404) {
          setError('Failed to check delivery profile. Please try again.');
        }
        setDeliveryProfile(null);
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchDeliveryProfile();
    
    // Only dependency on user and navigate, not deliveryProfile
  }, [user, navigate]);

  const loadDeliveryStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real stats from API
      const response = await api.get('/assignments/stats');
      
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching delivery stats:', err);
      setError('Failed to load delivery statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentDeliveries = async () => {
    try {
      // Fetch the 5 most recent completed deliveries
      const response = await api.get('/deliveries/history?limit=5');
      
      if (response.data && response.data.success) {
        setRecentDeliveries(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching recent deliveries:', err);
      // Don't show error for this, just leave empty table
    }
  };

  const handleProfileComplete = (profileData) => {
    setDeliveryProfile(profileData);
    // After profile is complete, load delivery stats
    loadDeliveryStats();
    fetchRecentDeliveries();
  };

  const toggleAvailability = async () => {
    if (toggleLoading) return;
    
    try {
      setToggleLoading(true);
      const newStatus = !isAvailable;
      
      // Update availability via API
      const response = await api.put('/assignments/availability', { 
        isAvailable: newStatus 
      });
      
      if (response.data && response.data.success) {
        setIsAvailable(newStatus);
        
        // Also update the delivery profile
        setDeliveryProfile(prevProfile => ({
          ...prevProfile,
          isAvailable: newStatus
        }));
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability status. Please try again.');
      // Don't update the UI state if the API call fails
    } finally {
      setToggleLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    
    const { street, city, state, zip } = address;
    return `${street || ''}, ${city || ''}, ${state || ''} ${zip || ''}`.trim();
  };

  const formatOrderId = (orderId) => {
    if (!orderId) return 'N/A';
    // Show only the first 6 characters of the order ID
    return orderId.substring(0, 6) + '...';
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no delivery profile exists, show onboarding
  if (!deliveryProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome to the Delivery Dashboard</h1>
        
        <div className="mb-8">
          <p className="text-gray-600">
            Before you can start accepting deliveries, we need some additional information about your vehicle.
          </p>
        </div>
        
        <DeliveryOnboarding onComplete={handleProfileComplete} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Delivery Dashboard</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {/* Availability Toggle */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Your Status</h2>
            <p className="text-gray-600">
              You are currently <span className={isAvailable ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </span> for deliveries
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={toggleLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              toggleLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
              isAvailable 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {toggleLoading ? 'Updating...' : 
              isAvailable ? 'Go Offline' : 'Go Online'
            }
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Active Deliveries */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-500">
              <i className="fas fa-motorcycle text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Active Deliveries</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.activeDeliveries}</p>
            </div>
          </div>
        </div>
        
        {/* Completed Today */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 text-green-500">
              <i className="fas fa-check-circle text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.completedToday}</p>
            </div>
          </div>
        </div>
        
        {/* Earnings */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50 text-yellow-500">
              <i className="fas fa-dollar-sign text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-800">{formatCurrency(stats.totalEarnings)}</p>
            </div>
          </div>
        </div>
        
        {/* Rating */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 text-purple-500">
              <i className="fas fa-star text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Rating</p>
              <p className="text-2xl font-semibold text-gray-800">
                {stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
                <span className="text-sm text-gray-500 ml-1">/ 5.0</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Deliveries */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Deliveries</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent deliveries found
                  </td>
                </tr>
              ) : (
                recentDeliveries.map((delivery) => (
                  <tr key={delivery._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatOrderId(delivery.orderId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {delivery.restaurantName || 'Restaurant'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {delivery.customerName || 'Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAddress(delivery.deliveryLocation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(delivery.actualDeliveryTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(5 + (delivery.distance * 1))} {/* Base $5 + $1 per km */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {recentDeliveries.length > 0 && (
          <div className="px-4 py-3 border-t">
            <button
              onClick={() => navigate('/delivery/history')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Deliveries
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard; 