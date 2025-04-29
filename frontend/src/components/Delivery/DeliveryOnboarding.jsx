import React, { useState } from 'react';
import { FaCar, FaIdCard } from 'react-icons/fa';
import api from '../../services/api';

const DeliveryOnboarding = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    vehicleType: 'car',
    vehicleNumber: '',
    licenseNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!formData.vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle number is required';
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      setLoading(true);
      setServerError('');
      
      try {
        const response = await api.post('/assignments/register', formData);
        console.log('Delivery registration successful:', response.data);
        
        if (onComplete && typeof onComplete === 'function') {
          onComplete(response.data.data);
        }
      } catch (error) {
        console.error('Delivery registration error:', error);
        setServerError(
          error.response?.data?.message || 
          error.response?.data?.error ||
          'Registration failed. Please try again.'
        );
        
        // If there are field-specific errors, set them in the errors state
        if (error.response?.data?.errors) {
          const fieldErrors = {};
          Object.entries(error.response.data.errors).forEach(([field, message]) => {
            fieldErrors[field] = message;
          });
          setErrors(prev => ({...prev, ...fieldErrors}));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Complete Your Delivery Profile</h2>
        <p className="text-gray-600 mt-2">
          Before you can start accepting deliveries, we need some additional information about your vehicle.
        </p>
      </div>
      
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {serverError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Vehicle Type
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaCar className="text-gray-400" />
            </div>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className={`w-full py-2 px-10 border ${errors.vehicleType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
            >
              <option value="car">Car</option>
              <option value="motorbike">Motorbike</option>
              <option value="bicycle">Bicycle</option>
              <option value="van">Van</option>
            </select>
          </div>
          {errors.vehicleType && <p className="text-red-500 text-xs mt-1">{errors.vehicleType}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Vehicle Number / Plate
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaCar className="text-gray-400" />
            </div>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              className={`w-full py-2 px-10 border ${errors.vehicleNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="ABC-123"
            />
          </div>
          {errors.vehicleNumber && <p className="text-red-500 text-xs mt-1">{errors.vehicleNumber}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            License Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaIdCard className="text-gray-400" />
            </div>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className={`w-full py-2 px-10 border ${errors.licenseNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="DL12345678"
            />
          </div>
          {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex justify-center items-center"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Complete Registration'
          )}
        </button>
      </form>
    </div>
  );
};

export default DeliveryOnboarding; 