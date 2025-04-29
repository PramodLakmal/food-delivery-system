import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const ActiveDeliveries = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    // Redirect if not a delivery person
    if (user && user.role !== 'delivery-person') {
      navigate('/dashboard');
      return;
    }

    fetchActiveDeliveries();

    // Poll for new deliveries every 30 seconds
    const intervalId = setInterval(fetchActiveDeliveries, 30000);

    return () => clearInterval(intervalId);
  }, [user, navigate]);

  const fetchActiveDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getActiveDeliveries();
      
      if (response && response.success) {
        // Format and normalize deliveries data
        const formattedDeliveries = response.data.map(delivery => ({
          ...delivery,
          // Convert snake_case status to kebab-case for UI consistency
          status: delivery.status === 'out_for_delivery' ? 'on-the-way' : 
                 delivery.status.replace(/_/g, '-')
        }));
        
        console.log('Formatted active deliveries:', formattedDeliveries);
        setActiveDeliveries(formattedDeliveries);
        
        // Update selected delivery if it exists in the new data
        if (selectedDelivery) {
          const updatedDelivery = formattedDeliveries.find(d => d._id === selectedDelivery._id);
          if (updatedDelivery) {
            setSelectedDelivery(updatedDelivery);
          }
        }
      } else {
        console.error('Failed to fetch active deliveries:', response);
        setError('Failed to load active deliveries. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching active deliveries:', err);
      setError('Failed to load active deliveries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch additional delivery details when a delivery is selected
  const fetchDeliveryDetails = async (delivery) => {
    if (!delivery) return;
    
    setDetailsLoading(true);
    const enhancedDelivery = { ...delivery };
    
    try {
      // Instead of fetching order details directly, get enhanced delivery info 
      // from the delivery service which already has permission
      if (delivery._id) {
        const deliveryResponse = await api.getDeliveryById(delivery._id);
        
        if (deliveryResponse.success && deliveryResponse.data) {
          // API is returning data in a different structure than expected
          // Extract data from the response and map to the expected structure
          const responseData = deliveryResponse.data;
          
          // Add basic data
          if (responseData.pickupLocation) {
            enhancedDelivery.pickupAddress = responseData.pickupLocation.address;
          }
          
          if (responseData.deliveryLocation) {
            enhancedDelivery.deliveryAddress = responseData.deliveryLocation.address;
          }
          
          // Add other available fields
          enhancedDelivery.distance = responseData.distance || enhancedDelivery.distance;
          enhancedDelivery.notes = responseData.notes || enhancedDelivery.notes;
          enhancedDelivery.deliveryInstructions = responseData.notes || enhancedDelivery.deliveryInstructions;
          enhancedDelivery.estimatedDeliveryTime = responseData.estimatedDeliveryTime || enhancedDelivery.estimatedDeliveryTime;
          
          // Extract restaurant and customer IDs for display
          enhancedDelivery.restaurantId = responseData.restaurantId || enhancedDelivery.restaurantId;
          enhancedDelivery.customerId = responseData.customerId || enhancedDelivery.customerId;
          
          // If restaurantName is not available, use ID temporarily
          if (!enhancedDelivery.restaurantName && responseData.restaurantId) {
            enhancedDelivery.restaurantName = `Restaurant ${responseData.restaurantId.substring(0, 8)}`;
          }
          
          // If customerName is not available, use ID temporarily
          if (!enhancedDelivery.customerName && responseData.customerId) {
            enhancedDelivery.customerName = `Customer ${responseData.customerId.substring(0, 8)}`;
          }
          
          console.log('Enhanced delivery with details:', enhancedDelivery);
        }
      }
      
      // If we still don't have some data, try to get it from active deliveries endpoint
      if (!enhancedDelivery.restaurantName || !enhancedDelivery.customerName) {
        try {
          const activeResponse = await api.getActiveDeliveries();
          if (activeResponse.success) {
            const fullDelivery = activeResponse.data.find(d => d._id === delivery._id);
            if (fullDelivery) {
              // Fill in missing pieces
              if (!enhancedDelivery.restaurantName) enhancedDelivery.restaurantName = fullDelivery.restaurantName;
              if (!enhancedDelivery.customerName) enhancedDelivery.customerName = fullDelivery.customerName;
              if (!enhancedDelivery.contactPhone) enhancedDelivery.contactPhone = fullDelivery.contactPhone;
              if (!enhancedDelivery.deliveryAddress) enhancedDelivery.deliveryAddress = fullDelivery.deliveryAddress;
              if (!enhancedDelivery.pickupAddress) enhancedDelivery.pickupAddress = fullDelivery.pickupAddress;
              if (!enhancedDelivery.deliveryInstructions) enhancedDelivery.deliveryInstructions = fullDelivery.deliveryInstructions;
            }
          }
        } catch (err) {
          console.error('Error fetching from active deliveries:', err);
        }
      }
      
      // Update selected delivery with enhanced data
      setSelectedDelivery(enhancedDelivery);
    } catch (err) {
      console.error('Error fetching delivery details:', err);
      toast.error('Could not load all delivery details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectDelivery = (delivery) => {
    // First set the basic delivery object to prevent UI delay
    setSelectedDelivery(delivery);
    // Then fetch enhanced details
    fetchDeliveryDetails(delivery);
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      setStatusUpdateLoading(true);

      // Convert kebab-case status to snake_case for API consistency
      const apiStatus = newStatus.replace(/-/g, '_');

      const response = await api.updateDeliveryStatus(deliveryId, apiStatus);

      if (response && response.success) {
      // Update the delivery in the list
      setActiveDeliveries(prevDeliveries => 
        prevDeliveries.map(delivery => 
          delivery._id === deliveryId 
            ? { ...delivery, status: newStatus } 
            : delivery
        )
      );

      // Update selected delivery if it's the one that was updated
      if (selectedDelivery && selectedDelivery._id === deliveryId) {
        setSelectedDelivery({ ...selectedDelivery, status: newStatus });
      }

        // Show success message
      setStatusMessage({
        type: 'success',
          message: `Delivery status updated to ${formatStatus(newStatus)}`
      });

      // If delivery is completed, remove it from active list after a delay
      if (newStatus === 'delivered') {
        setTimeout(() => {
          setActiveDeliveries(prevDeliveries => 
            prevDeliveries.filter(delivery => delivery._id !== deliveryId)
          );
          setSelectedDelivery(null);
        }, 3000);
        }
      } else {
        setStatusMessage({
          type: 'error',
          message: 'Failed to update delivery status'
        });
      }
    } catch (err) {
      console.error('Error updating delivery status:', err);
      setStatusMessage({
        type: 'error',
        message: 'Failed to update delivery status. Please try again.'
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'assigned': 'picked-up',
      'picked-up': 'on-the-way',
      'on-the-way': 'arrived',
      'arrived': 'delivered'
    };
    return statusFlow[currentStatus] || null;
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    // Handle case where address is already a formatted string
    if (typeof address === 'string') return address;
    
    // Handle different address formats
    if (address.fullAddress) return address.fullAddress;
    
    // Handle address object with coordinates
    if (address.coordinates && !address.street) {
      return `Location: (${address.coordinates.lat}, ${address.coordinates.lng})`;
    }
    
    // Handle standard address object
    const street = address.street || '';
    const city = address.city || '';
    const state = address.state || '';
    const zip = address.zipCode || address.zip || '';
    
    return `${street}, ${city}, ${state} ${zip}`.replace(/,\s+,/g, ',').trim();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle different timestamp formats
      let date;
      if (typeof timestamp === 'string') {
        // ISO string or other string format
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else if (typeof timestamp === 'number') {
        // Unix timestamp in milliseconds
        date = new Date(timestamp);
      } else {
        return 'Invalid date format';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Date error';
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'assigned': 'bg-yellow-100 text-yellow-800',
      'picked-up': 'bg-blue-100 text-blue-800',
      'on-the-way': 'bg-purple-100 text-purple-800',
      'arrived': 'bg-pink-100 text-pink-800',
      'delivered': 'bg-green-100 text-green-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper method to extract order number from various data formats
  const getOrderNumber = (delivery) => {
    if (delivery.orderNumber) return delivery.orderNumber;
    if (delivery.orderId) {
      // If it's a full MongoDB ID, just show the first 8 chars
      return delivery.orderId.substring(0, 8);
    }
    return 'Unknown';
  };

  // Update the delivery card to include more customer and restaurant details
  const DeliveryCard = ({ delivery, onClick, isSelected }) => {
    return (
      <div
        className={`p-4 mb-4 border rounded-lg shadow-sm ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        } cursor-pointer transition-all hover:shadow-md`}
        onClick={() => onClick(delivery)}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold text-lg">Order #</span>{" "}
            <span className="text-gray-700">{delivery.orderId}</span>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
              delivery.status
            )}`}
          >
            {formatStatus(delivery.status)}
          </span>
        </div>
        
        {/* Restaurant Information */}
        <div className="mt-3">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="font-medium">Restaurant</p>
              <p className="text-gray-700">{delivery.restaurantName || 'Restaurant information loading...'}</p>
            </div>
          </div>
        </div>
        
        {/* Customer Information */}
        <div className="mt-3">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <p className="font-medium">Customer</p>
              <p className="text-gray-700">{delivery.customerName || 'Customer information loading...'}</p>
              {delivery.contactPhone && (
                <p className="text-sm text-gray-600">{delivery.contactPhone}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Delivery Address */}
        <div className="mt-3">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="font-medium">Delivery Address</p>
              <p className="text-gray-700">{formatAddress(delivery.deliveryAddress) || 'Loading address...'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the DeliveryDetail component to better display the enhanced information
  const DeliveryDetail = ({ delivery, onUpdateStatus, isUpdating }) => {
    if (!delivery) return null;

    // Get next status based on current status
    const nextStatus = getNextStatus(delivery.status);

    return (
      <div className="bg-white p-6 rounded-lg shadow-md relative">
        <h3 className="text-xl font-bold mb-4">Delivery Details</h3>
        
        <div className="grid gap-4 mb-6">
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold mb-2">Order Information</h4>
            <p>
              <span className="font-medium">Order ID:</span> {delivery.orderId}
            </p>
            <p>
              <span className="font-medium">Current Status:</span>{" "}
              <span className={`${getStatusBadgeClass(delivery.status)} py-1 px-2 rounded`}>
                {formatStatus(delivery.status)}
              </span>
            </p>
            <p>
              <span className="font-medium">Assigned At:</span>{" "}
              {formatDateTime(delivery.assignedAt)}
            </p>
          </div>
          
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold mb-2">Restaurant Information</h4>
            <p>
              <span className="font-medium">Name:</span> {delivery.restaurantName || 'Not available'}
            </p>
            {delivery.restaurantId && !delivery.restaurantName && (
              <p>
                <span className="font-medium">ID:</span> {delivery.restaurantId}
              </p>
            )}
            {delivery.restaurantPhone && (
              <p>
                <span className="font-medium">Contact:</span> {delivery.restaurantPhone}
              </p>
            )}
            <p>
              <span className="font-medium">Pickup Address:</span>{" "}
              {formatAddress(delivery.pickupAddress || delivery.pickupLocation) || 'Address not available'}
            </p>
          </div>
          
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold mb-2">Customer Information</h4>
            <p>
              <span className="font-medium">Name:</span> {delivery.customerName || 'Not available'}
            </p>
            {delivery.customerId && !delivery.customerName && (
              <p>
                <span className="font-medium">ID:</span> {delivery.customerId}
              </p>
            )}
            {delivery.contactPhone && (
              <p>
                <span className="font-medium">Contact:</span> {delivery.contactPhone}
              </p>
            )}
            <p>
              <span className="font-medium">Delivery Address:</span>{" "}
              {formatAddress(delivery.deliveryAddress || delivery.deliveryLocation) || 'Address not available'}
            </p>
          </div>

          {delivery.distance && (
            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold mb-2">Distance Information</h4>
              <p>
                <span className="font-medium">Estimated Distance:</span>{" "}
                {delivery.distance} km
              </p>
              <p>
                <span className="font-medium">Estimated Delivery Time:</span>{" "}
                {formatDateTime(delivery.estimatedDeliveryTime)}
              </p>
            </div>
          )}
          
          {(delivery.deliveryInstructions || delivery.notes) && (
            <div className="border-b pb-4">
              <h4 className="text-lg font-semibold mb-2">Special Instructions</h4>
              <p className="p-3 bg-yellow-50 border border-yellow-100 rounded text-gray-700">
                {delivery.deliveryInstructions || delivery.notes}
              </p>
            </div>
          )}

          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold mb-2">Status Timeline</h4>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <div className={`${delivery.status === 'assigned' || delivery.status === 'picked-up' || delivery.status === 'on-the-way' || delivery.status === 'arrived' || delivery.status === 'delivered' ? 'text-green-600 font-semibold' : ''}`}>
                Assigned
              </div>
              <div className={`${delivery.status === 'picked-up' || delivery.status === 'on-the-way' || delivery.status === 'arrived' || delivery.status === 'delivered' ? 'text-green-600 font-semibold' : ''}`}>
                Picked Up
              </div>
              <div className={`${delivery.status === 'on-the-way' || delivery.status === 'arrived' || delivery.status === 'delivered' ? 'text-green-600 font-semibold' : ''}`}>
                On the Way
              </div>
              <div className={`${delivery.status === 'arrived' || delivery.status === 'delivered' ? 'text-green-600 font-semibold' : ''}`}>
                Arrived
              </div>
              <div className={`${delivery.status === 'delivered' ? 'text-green-600 font-semibold' : ''}`}>
                Delivered
              </div>
            </div>
            <div className="relative h-2 bg-gray-200 rounded">
              <div 
                className="absolute top-0 left-0 h-full bg-green-500 rounded"
                style={{ 
                  width: 
                    delivery.status === 'assigned' ? '20%' :
                    delivery.status === 'picked-up' ? '40%' :
                    delivery.status === 'on-the-way' ? '60%' :
                    delivery.status === 'arrived' ? '80%' :
                    delivery.status === 'delivered' ? '100%' : '0%'
                }}
              ></div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Update Status</h4>
            <div className="flex flex-col space-y-4">
              {nextStatus && (
                <button
                  onClick={() => onUpdateStatus(delivery._id, nextStatus)}
                  disabled={isUpdating}
                  className={`
                    flex items-center justify-center w-full py-3 rounded-md font-medium
                    ${isUpdating ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                  `}
                >
                  {isUpdating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>Mark as {formatStatus(nextStatus)}</>
                  )}
                </button>
              )}
              {!nextStatus && delivery.status === 'delivered' && (
                <div className="bg-green-100 text-green-800 p-3 rounded-md text-center">
                  Delivery completed successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && activeDeliveries.length === 0) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Active Deliveries</h1>
        <button 
          onClick={fetchActiveDeliveries}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Refreshing...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt mr-2"></i> Refresh
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {activeDeliveries.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <i className="fas fa-motorcycle text-5xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Active Deliveries</h2>
          <p className="text-gray-500">
            You don't have any active deliveries right now. New assignments will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Delivery Queue ({activeDeliveries.length})</h2>
              
              <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                {activeDeliveries.map(delivery => (
                  <DeliveryCard
                    key={delivery._id}
                    delivery={delivery}
                    onClick={handleSelectDelivery}
                    isSelected={selectedDelivery && selectedDelivery._id === delivery._id}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {selectedDelivery ? (
              <>
                {detailsLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                <DeliveryDetail
                  delivery={selectedDelivery}
                  onUpdateStatus={handleStatusUpdate}
                  isUpdating={statusUpdateLoading}
                />
              </>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-md text-center h-full flex flex-col justify-center items-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <i className="fas fa-clipboard-list text-5xl"></i>
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Delivery Selected</h2>
                <p className="text-gray-500">
                  Select a delivery from the list to view details and update its status.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveDeliveries; 