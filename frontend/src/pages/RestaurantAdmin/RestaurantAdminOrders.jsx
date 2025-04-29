import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const RestaurantAdminOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [availableDeliveryPersonnel, setAvailableDeliveryPersonnel] = useState([]);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState('');
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  useEffect(() => {
    // Check if user is restaurant-admin, if not redirect to dashboard
    if (user && user.role !== 'restaurant-admin') {
      navigate('/dashboard');
      return;
    }

    fetchRestaurantAndOrders();
  }, [id, user, navigate]);

  const fetchRestaurantAndOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch restaurant details
      const restaurantResponse = await api.get(`/restaurants/${id}`);
      
      if (!restaurantResponse.data || !restaurantResponse.data.success) {
        setError('Failed to fetch restaurant details');
        setIsLoading(false);
        return;
      }
      
      setRestaurant(restaurantResponse.data.data);
      
      // Simplified API call now that the backend authorization is fixed
      const ordersResponse = await api.get(`/orders/restaurant/${id}`);
      
      if (ordersResponse.data && ordersResponse.data.success) {
        setOrders(ordersResponse.data.data);
        setFilteredOrders(ordersResponse.data.data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err?.response?.data?.error || 'Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data 
  const refreshOrders = () => {
    fetchRestaurantAndOrders();
    toast.success('Orders refreshed');
  };

  const fetchAvailableDeliveryPersonnel = async () => {
    try {
      setIsAssigningDelivery(true);
      setAssignmentError(null);
      
      const response = await api.getAvailableDeliveryPersonnel();
      
      if (response && response.success) {
        console.log("Available delivery personnel:", response.data);
        setAvailableDeliveryPersonnel(response.data);
      } else {
        console.error("Failed to get delivery personnel:", response);
        setAssignmentError('Failed to fetch available delivery personnel');
      }
    } catch (err) {
      console.error('Error fetching delivery personnel:', err);
      setAssignmentError(err?.error || 'Failed to fetch delivery personnel. Please try again.');
    } finally {
      setIsAssigningDelivery(false);
    }
  };

  const handleAssignDelivery = async (orderId, deliveryPersonId) => {
    if (!deliveryPersonId) {
      setAssignmentError('Please select a delivery person');
      return;
    }
    
    setAssignmentLoading(true);
    setAssignmentError('');
    
    try {
      // Find the selected delivery person in our available list to get their userId
      const selectedPerson = availableDeliveryPersonnel.find(dp => dp._id === deliveryPersonId);
      
      // Prefer userId over _id for consistent identification
      const assignmentId = selectedPerson?.userId || deliveryPersonId;
      console.log(`Assigning delivery using ID: ${assignmentId} (original selection: ${deliveryPersonId})`);
      
      // Use the new combined function to create and assign in one go
      const response = await api.createAndAssignDelivery(orderId, restaurant._id, assignmentId);
      
      // Check if the response contains a message about already being assigned
      if (response.message && response.message.includes('already assigned')) {
        toast.info('This delivery is already assigned to the selected delivery person');
      } else {
        toast.success('Delivery person assigned successfully');
      }
      
      // Update the order in the local state - now with 'out_for_delivery' status
      const updatedOrders = orders.map(order => {
        if (order._id === orderId) {
          return {
            ...order,
            status: 'out_for_delivery', // Update status to match what we set in the backend
            deliveryPerson: availableDeliveryPersonnel.find(dp => dp._id === deliveryPersonId || dp.userId === deliveryPersonId)
          };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      
      // Also update the selected order if it's currently being viewed
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'out_for_delivery',
          deliveryPerson: availableDeliveryPersonnel.find(dp => dp._id === deliveryPersonId || dp.userId === deliveryPersonId)
        });
      }
      
      // Close the modal after successful assignment
      setTimeout(() => {
        setShowOrderDetails(false);
      }, 1500);
    } catch (error) {
      console.error('Assignment error:', error);
      
      // Handle specific error messages from the backend
      let errorMessage = 'Failed to assign delivery person';
      
      if (error.status === 400 && error.error === 'ALREADY_ASSIGNED') {
        errorMessage = 'This delivery is already assigned to a delivery person';
        
        // Try to update the UI with current assignment info
        try {
          const orderResponse = await api.getOrderById(orderId);
          if (orderResponse && orderResponse.deliveryPerson) {
            // Update the order in local state with current assignment info
            const updatedOrders = orders.map(order => {
              if (order._id === orderId) {
                return {
                  ...order,
                  deliveryPerson: orderResponse.deliveryPerson
                };
              }
              return order;
            });
            setOrders(updatedOrders);
            toast.info('Showing current delivery assignment');
          }
        } catch (refreshError) {
          console.error('Error refreshing order data:', refreshError);
        }
      } else if (error.status === 400 && error.error === 'INVALID_STATUS') {
        errorMessage = 'Cannot assign delivery person at current order status';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAssignmentError(errorMessage);
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStatus === 'All') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === selectedStatus));
    }
  }, [selectedStatus, orders]);

  useEffect(() => {
    if (showOrderDetails && selectedOrder) {
      const eligibleStatuses = ['ready_for_pickup'];
      if (eligibleStatuses.includes(selectedOrder.status)) {
        fetchAvailableDeliveryPersonnel();
      }
    }
  }, [showOrderDetails, selectedOrder]);

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      
      if (response.data && response.data.success) {
        console.log("Status updated successfully:", response.data);
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );

        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
          
          if (newStatus === 'ready_for_pickup') {
            console.log("Order is ready for pickup, fetching delivery information");
            try {
              // Check if delivery has been created
              const deliveryResponse = await api.getDeliveryByOrderId(orderId);
              console.log("Delivery found for order:", deliveryResponse);
            } catch (deliveryError) {
              console.error("Could not find delivery for order:", deliveryError);
            }
            fetchAvailableDeliveryPersonnel();
          }
        }
        
        setError(null);
      } else {
        setError('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setError('You do not have permission to update this order. Please contact an administrator.');
        } else if (err.response.status === 404) {
          setError('Order not found. It may have been deleted or moved.');
        } else {
          setError(err.response.data?.error || 'Failed to update order status. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    }
  };

  const handleBack = () => {
    navigate(`/restaurant-admin/restaurants/${id}`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' }; // Amber
      case 'confirmed':
        return { backgroundColor: '#e0f2fe', color: '#0369a1' }; // Blue
      case 'preparing':
        return { backgroundColor: '#e0e7ff', color: '#4338ca' }; // Indigo
      case 'ready_for_pickup':
        return { backgroundColor: '#d8b4fe', color: '#6d28d9' }; // Purple
      case 'out_for_delivery':
        return { backgroundColor: '#bae6fd', color: '#0284c7' }; // Light Blue
      case 'delivered':
        return { backgroundColor: '#d1fae5', color: '#047857' }; // Green
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#b91c1c' }; // Red
      default:
        return { backgroundColor: '#f3f4f6', color: '#4b5563' }; // Gray
    }
  };

  const formatStatus = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    
    setSelectedDeliveryPersonId('');
    setAssignmentError(null);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleDeliveryPersonChange = (e) => {
    setSelectedDeliveryPersonId(e.target.value);
    setAssignmentError(null);
  };

  const container = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem 1rem',
  };

  const contentContainer = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const pageTitle = {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1rem',
  };

  const pageSubtitle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: '2rem',
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  };

  const cardHeader = {
    backgroundColor: '#f9fafb',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const cardHeaderTitle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
  };

  const cardBody = {
    padding: '1.5rem',
  };

  const filterContainer = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const select = {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    fontSize: '0.875rem',
    color: '#4b5563',
  };

  const button = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const primaryButton = {
    ...button,
    backgroundColor: '#4f46e5',
    color: 'white',
  };

  const backButton = {
    ...button,
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    marginRight: '0.5rem',
  };

  const viewButton = {
    ...button,
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    marginRight: '0.5rem',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
  };

  const table = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeader = {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#4b5563',
    borderBottom: '1px solid #e5e7eb',
  };

  const tableCell = {
    padding: '1rem',
    fontSize: '0.875rem',
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'middle',
  };

  const badge = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'capitalize',
  };

  const actionButton = {
    ...button,
    padding: '0.25rem 0.5rem',
    marginRight: '0.25rem',
    fontSize: '0.75rem',
  };

  const loadingState = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  };

  const errorAlert = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const emptyState = {
    textAlign: 'center',
    padding: '3rem 0',
    color: '#6b7280',
  };

  const modalOverlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modal = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };

  const modalHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const modalTitle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
  };

  const closeButton = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    color: '#9ca3af',
  };

  const sectionTitle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: '0.75rem',
    marginTop: '1.5rem',
  };

  const deliverySection = {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '0.375rem',
    border: '1px solid #bae6fd',
  };

  const deliveryTitle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: '0.75rem',
  };

  const deliverySelect = {
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
  };

  const assignButton = {
    ...button,
    backgroundColor: '#0369a1',
    color: 'white',
    width: '100%',
  };

  const assignButtonLoading = {
    ...assignButton,
    opacity: '0.7',
    cursor: 'not-allowed',
  };

  const assignmentErrorStyle = {
    color: '#b91c1c',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
  };

  const renderStatusActions = (order) => {
    const actions = [];
    
    switch(order.status) {
      case 'pending':
        actions.push(
          <button 
            key="confirm"
            style={{ ...actionButton, backgroundColor: '#e0f2fe', color: '#0369a1' }}
            onClick={() => handleUpdateStatus(order._id, 'confirmed')}
          >
            Confirm
          </button>
        );
        actions.push(
          <button 
            key="cancel"
            style={{ ...actionButton, backgroundColor: '#fee2e2', color: '#b91c1c' }}
            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
          >
            Cancel
          </button>
        );
        break;
      case 'confirmed':
        actions.push(
          <button 
            key="prepare"
            style={{ ...actionButton, backgroundColor: '#e0e7ff', color: '#4338ca' }}
            onClick={() => handleUpdateStatus(order._id, 'preparing')}
          >
            Preparing
          </button>
        );
        break;
      case 'preparing':
        actions.push(
          <button 
            key="ready"
            style={{ ...actionButton, backgroundColor: '#d8b4fe', color: '#6d28d9' }}
            onClick={() => handleUpdateStatus(order._id, 'ready_for_pickup')}
          >
            Ready
          </button>
        );
        break;
      case 'ready_for_pickup':
        actions.push(
          <button 
            key="deliver"
            style={{ ...actionButton, backgroundColor: '#bae6fd', color: '#0284c7' }}
            onClick={() => handleUpdateStatus(order._id, 'out_for_delivery')}
          >
            Out for Delivery
          </button>
        );
        break;
      case 'out_for_delivery':
        actions.push(
          <button 
            key="delivered"
            style={{ ...actionButton, backgroundColor: '#d1fae5', color: '#047857' }}
            onClick={() => handleUpdateStatus(order._id, 'delivered')}
          >
            Delivered
          </button>
        );
        break;
      default:
        // No actions for delivered or cancelled orders
        break;
    }
    
    return actions;
  };

  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <div style={modalOverlay} onClick={handleCloseOrderDetails}>
        <div style={modal} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeader}>
            <h3 style={modalTitle}>Order #{selectedOrder._id.substring(0, 8)}</h3>
            <button style={closeButton} onClick={handleCloseOrderDetails}>×</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
              <p>
                <strong>Status:</strong> 
                <span style={{ 
                  ...badge, 
                  ...getStatusBadgeStyle(selectedOrder.status),
                  marginLeft: '0.5rem'
                }}>
                  {formatStatus(selectedOrder.status)}
                </span>
              </p>
              <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}</p>
              <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
            </div>
            <div>
              <div style={{ marginBottom: '1rem' }}>
                {renderStatusActions(selectedOrder)}
              </div>
            </div>
          </div>

          <h4 style={sectionTitle}>Customer Information</h4>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            <p><strong>Contact Phone:</strong> {selectedOrder.contactPhone}</p>
            <p><strong>Delivery Address:</strong> {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}</p>
            {selectedOrder.deliveryInstructions && (
              <p><strong>Delivery Instructions:</strong> {selectedOrder.deliveryInstructions}</p>
            )}
          </div>

          {selectedOrder.status === 'ready_for_pickup' && (
            <div style={deliverySection}>
              <h4 style={deliveryTitle}>Assign Delivery Person</h4>
              <select 
                style={deliverySelect}
                value={selectedDeliveryPersonId}
                onChange={handleDeliveryPersonChange}
                disabled={isAssigningDelivery}
              >
                <option value="">Select a delivery person</option>
                {availableDeliveryPersonnel.map(person => (
                  <option key={person._id} value={person._id}>
                    {person.name} - ({person.vehicleType}) - {person.activeDeliveries}/{person.maxActiveDeliveries} deliveries
                    {" "}- ID: {person.userId ? person.userId.substring(0, 6) : 'N/A'} / _id: {person._id.substring(0, 6)}
                  </option>
                ))}
              </select>
              <button 
                style={isAssigningDelivery ? assignButtonLoading : assignButton}
                onClick={() => handleAssignDelivery(selectedOrder._id, selectedDeliveryPersonId)}
                disabled={isAssigningDelivery || !selectedDeliveryPersonId}
              >
                {isAssigningDelivery ? 'Assigning...' : 'Assign Delivery Person'}
              </button>
              {assignmentError && (
                <p style={assignmentErrorStyle}>{assignmentError}</p>
              )}
              {availableDeliveryPersonnel.length === 0 && !isAssigningDelivery && !assignmentError && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No delivery personnel are currently available</p>
              )}
            </div>
          )}

          {/* Display assigned delivery person details for out_for_delivery or assigned orders */}
          {(selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'assigned') && selectedOrder.deliveryPersonId && (
            <div style={{
              ...deliverySection,
              backgroundColor: '#f0fff4',
              borderColor: '#c6f6d5'
            }}>
              <h4 style={{
                ...deliveryTitle,
                color: '#047857'
              }}>Assigned Delivery Person</h4>
              
              {/* Display assigned delivery person info */}
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Delivery Person ID:</strong> {selectedOrder.deliveryPersonId ? selectedOrder.deliveryPersonId.substring(0, 10) + '...' : 'Not assigned'}
              </p>
              
              {/* If deliveryPerson object is available with more details */}
              {selectedOrder.deliveryPerson && (
                <>
                  <p style={{ margin: '0.5rem 0' }}><strong>Name:</strong> {selectedOrder.deliveryPerson.name || 'Unnamed'}</p>
                  <p style={{ margin: '0.5rem 0' }}><strong>Vehicle:</strong> {selectedOrder.deliveryPerson.vehicleType || 'Unknown'}</p>
                  <p style={{ margin: '0.5rem 0' }}><strong>Phone:</strong> {selectedOrder.deliveryPerson.phone || 'N/A'}</p>
                  <div style={{ 
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(209, 250, 229, 0.4)',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    <p style={{ margin: '0.25rem 0' }}><strong>Debug Info:</strong></p>
                    <p style={{ margin: '0.25rem 0' }}><strong>userId:</strong> {selectedOrder.deliveryPerson.userId || 'N/A'}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>_id:</strong> {selectedOrder.deliveryPerson._id || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <h4 style={sectionTitle}>Order Items</h4>
          <table style={{ width: '100%', marginBottom: '1.5rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Quantity</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    {item.notes && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Note: {item.notes}</div>}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>${item.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600' }}>Total:</td>
                <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600' }}>${selectedOrder.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={container}>
        <div style={contentContainer}>
          <h1 style={pageTitle}>Restaurant Orders</h1>
          <div style={loadingState}>
            <div style={{ 
              height: '3rem', 
              width: '3rem', 
              borderRadius: '50%',
              borderTop: '3px solid #4f46e5',
              borderRight: '3px solid transparent',
              animation: 'spin 1s linear infinite',
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={contentContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={pageTitle}>Restaurant Orders</h1>
            {restaurant && <p style={pageSubtitle}>{restaurant.name}</p>}
          </div>
          <div>
            <button 
              style={{
                ...button,
                backgroundColor: '#f0f9ff',
                color: '#0369a1',
                marginRight: '0.5rem',
                display: 'flex',
                alignItems: 'center'
              }} 
              onClick={refreshOrders}
            >
              <i className="fas fa-sync-alt" style={{ marginRight: '0.25rem' }}></i> Refresh
            </button>
            <button style={backButton} onClick={handleBack}>
              Back to Restaurant
            </button>
          </div>
        </div>
        
        {error && (
          <div style={errorAlert}>
            <p>{error}</p>
          </div>
        )}
        
        <div style={card}>
          <div style={cardHeader}>
            <h2 style={cardHeaderTitle}>Orders</h2>
            <div style={filterContainer}>
              <select
                style={select}
                value={selectedStatus}
                onChange={handleStatusChange}
              >
                <option value="All">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div style={cardBody}>
            {filteredOrders.length === 0 ? (
              <div style={emptyState}>
                <p>No orders found with the selected status.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={tableHeader}>Order ID</th>
                      <th style={tableHeader}>Contact Phone</th>
                      <th style={tableHeader}>Items</th>
                      <th style={tableHeader}>Total</th>
                      <th style={tableHeader}>Date</th>
                      <th style={tableHeader}>Payment</th>
                      <th style={tableHeader}>Status</th>
                      <th style={tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td style={tableCell}>{order._id.substring(0, 8)}...</td>
                        <td style={tableCell}>{order.contactPhone}</td>
                        <td style={tableCell}>{order.items.length} items</td>
                        <td style={tableCell}>${order.total.toFixed(2)}</td>
                        <td style={tableCell}>{formatDate(order.createdAt)}</td>
                        <td style={tableCell}>
                          {order.paymentMethod === 'card' ? 'Card' : 'Cash'} - {order.paymentStatus}
                        </td>
                        <td style={tableCell}>
                          <span style={{
                            ...badge,
                            ...getStatusBadgeStyle(order.status)
                          }}>
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        <td style={tableCell}>
                          <button 
                            style={viewButton}
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            View Details
                          </button>
                          {renderStatusActions(order)}
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
      
      {showOrderDetails && renderOrderDetailsModal()}
    </div>
  );
};

export default RestaurantAdminOrders; 