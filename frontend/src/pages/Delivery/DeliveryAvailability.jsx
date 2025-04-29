import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DeliveryAvailability = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  useEffect(() => {
    // Redirect if not a delivery person
    if (user && user.role !== 'delivery-person') {
      navigate('/dashboard');
      return;
    }

    // Fetch current availability status
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const response = await api.get('/assignments/profile');
        setIsAvailable(response.data.data.isAvailable);
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 404) {
          // Profile not found, show message about registering first
          setError('Please register your vehicle details before setting availability');
        } else {
          setError('Failed to load availability status. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [user, navigate]);

  const toggleAvailability = async () => {
    try {
      setLoading(true);
      const newStatus = !isAvailable;
      
      await api.put('/assignments/availability', { isAvailable: newStatus });
      
      setIsAvailable(newStatus);
      setSuccess(`You are now ${newStatus ? 'available' : 'unavailable'} for deliveries`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Availability Settings</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
          {success}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center space-y-6">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors ${isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
            <i className={`fas ${isAvailable ? 'fa-motorcycle text-green-500' : 'fa-pause text-red-500'} text-5xl`}></i>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">Current Status</h2>
            <p className={`text-lg font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {isAvailable ? 'You are available for deliveries' : 'You are unavailable for deliveries'}
            </p>
          </div>
          
          <button
            onClick={toggleAvailability}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              isAvailable 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isAvailable ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Important Information</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>When you're online, you'll receive delivery requests based on your location.</li>
            <li>You can view active deliveries in the "Active Deliveries" section.</li>
            <li>Keep the app open when you're online to receive notifications.</li>
            <li>Make sure to update your location regularly for accurate delivery assignments.</li>
            <li>Your performance metrics (delivery time, ratings) affect how often you receive orders.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAvailability; 