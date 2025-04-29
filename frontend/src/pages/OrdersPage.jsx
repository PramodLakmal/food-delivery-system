import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/orders');
        if (response.data && response.data.success) {
          setOrders(response.data.data);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.patch(`/orders/${orderId}/cancel`);
      
      if (response.data && response.data.success) {
        // Update the order in the list
        const updatedOrders = orders.map(order => 
          order._id === orderId ? response.data.data : order
        );
        setOrders(updatedOrders);
        
        // If we're viewing this order's details, update it
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(response.data.data);
        }
      } else {
        setError('Failed to cancel order');
      }
    } catch (err) {
      console.error('Error canceling order:', err);
      setError(err.response?.data?.error || 'Failed to cancel order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Filter orders based on status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  // Helper function to get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#f3f4f6', text: '#374151' };
      case 'confirmed':
        return { bg: '#e0f2fe', text: '#0369a1' };
      case 'preparing':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'ready_for_pickup':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'out_for_delivery':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'delivered':
        return { bg: '#d1fae5', text: '#047857' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  // Helper function to format status text
  const formatStatus = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Styles
  const container = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem 1rem',
  };

  const contentContainer = {
    maxWidth: '1000px',
    margin: '0 auto',
  };

  const pageTitle = {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1.5rem',
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
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const filterLabel = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#4b5563',
    marginRight: '0.5rem',
  };

  const selectFilter = {
    padding: '0.5rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    color: '#1f2937',
  };

  const ordersList = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const orderCard = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
  };

  const orderCardHover = {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };

  const orderHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  };

  const orderNumber = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#4b5563',
  };

  const orderDate = {
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  const statusBadge = (status) => {
    const colors = getStatusColor(status);
    return {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      backgroundColor: colors.bg,
      color: colors.text,
      display: 'inline-block',
    };
  };

  const restaurantName = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
  };

  const orderInfo = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  };

  const orderTotal = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
  };

  const orderItems = {
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  const actionButton = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  };

  const viewButton = {
    ...actionButton,
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    marginRight: '0.5rem',
  };

  const cancelButton = {
    ...actionButton,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  };

  const emptyState = {
    textAlign: 'center',
    padding: '3rem 0',
  };

  const emptyStateText = {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  };

  const primaryButton = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const errorAlert = {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const loadingState = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
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
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  };

  const modalHeader = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const modalTitle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
  };

  const closeButton = {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    color: '#6b7280',
    cursor: 'pointer',
  };

  const modalBody = {
    padding: '1.5rem',
  };

  const sectionTitle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.75rem',
  };

  const detailRow = {
    display: 'flex',
    marginBottom: '0.5rem',
  };

  const detailLabel = {
    width: '40%',
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  const detailValue = {
    width: '60%',
    fontSize: '0.875rem',
    color: '#1f2937',
  };

  const divider = {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '1.5rem 0',
  };

  const itemsTable = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeader = {
    textAlign: 'left',
    padding: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#4b5563',
    borderBottom: '1px solid #e5e7eb',
  };

  const tableCell = {
    padding: '0.75rem 0.5rem',
    fontSize: '0.875rem',
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb',
  };

  const itemName = {
    fontWeight: '500',
  };

  const modalFooter = {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
  };

  const noOrders = {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#6b7280',
  };

  if (isLoading && orders.length === 0) {
    return (
      <div style={container}>
        <div style={contentContainer}>
          <h1 style={pageTitle}>My Orders</h1>
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

  // Render order details modal
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    const statusColor = getStatusColor(selectedOrder.status);
    const canCancel = ['pending', 'confirmed'].includes(selectedOrder.status);

    return (
      <div style={modalOverlay}>
        <div style={modal}>
          <div style={modalHeader}>
            <h2 style={modalTitle}>Order Details</h2>
            <button style={closeButton} onClick={handleCloseOrderDetails}>×</button>
          </div>
          <div style={modalBody}>
            <div style={detailRow}>
              <span style={detailLabel}>Order ID:</span>
              <span style={detailValue}>{selectedOrder._id}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Date:</span>
              <span style={detailValue}>{formatDate(selectedOrder.createdAt)}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Status:</span>
              <span style={detailValue}>
                <span style={{
                  ...statusBadge(selectedOrder.status),
                  marginLeft: 0
                }}>
                  {formatStatus(selectedOrder.status)}
                </span>
              </span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Restaurant:</span>
              <span style={detailValue}>{selectedOrder.restaurantName}</span>
            </div>
            
            <div style={divider}></div>
            
            <h3 style={sectionTitle}>Delivery Information</h3>
            <div style={detailRow}>
              <span style={detailLabel}>Address:</span>
              <span style={detailValue}>
                {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}
              </span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Contact Phone:</span>
              <span style={detailValue}>{selectedOrder.contactPhone}</span>
            </div>
            {selectedOrder.deliveryInstructions && (
              <div style={detailRow}>
                <span style={detailLabel}>Instructions:</span>
                <span style={detailValue}>{selectedOrder.deliveryInstructions}</span>
              </div>
            )}
            {selectedOrder.estimatedDeliveryTime && (
              <div style={detailRow}>
                <span style={detailLabel}>Estimated Delivery:</span>
                <span style={detailValue}>{formatDate(selectedOrder.estimatedDeliveryTime)}</span>
              </div>
            )}
            
            <div style={divider}></div>
            
            <h3 style={sectionTitle}>Order Items</h3>
            <table style={itemsTable}>
              <thead>
                <tr>
                  <th style={{...tableHeader, width: '50%'}}>Item</th>
                  <th style={{...tableHeader, width: '15%'}}>Price</th>
                  <th style={{...tableHeader, width: '15%'}}>Qty</th>
                  <th style={{...tableHeader, width: '20%', textAlign: 'right'}}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item, index) => (
                  <tr key={index}>
                    <td style={tableCell}>
                      <div style={itemName}>{item.name}</div>
                      {item.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Note: {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={tableCell}>${item.price.toFixed(2)}</td>
                    <td style={tableCell}>{item.quantity}</td>
                    <td style={{...tableCell, textAlign: 'right'}}>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              padding: '1rem',
              marginTop: '1rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Subtotal</span>
                <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Delivery Fee</span>
                <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>$3.99</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                marginTop: '0.5rem',
                borderTop: '1px solid #e5e7eb',
                fontWeight: '600',
              }}>
                <span>Total</span>
                <span>${(selectedOrder.total + 3.99).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div style={modalFooter}>
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
            }} onClick={handleCloseOrderDetails}>
              Close
            </button>
            {canCancel && (
              <button 
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                }}
                onClick={() => {
                  handleCancelOrder(selectedOrder._id);
                  handleCloseOrderDetails();
                }}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={container}>
      <div style={contentContainer}>
        <h1 style={pageTitle}>My Orders</h1>
        
        {error && (
          <div style={errorAlert}>
            <p>{error}</p>
          </div>
        )}
        
        {orders.length > 0 ? (
          <>
            <div style={filterContainer}>
              <label style={filterLabel} htmlFor="statusFilter">Filter by Status:</label>
              <select
                id="statusFilter"
                style={selectFilter}
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {filteredOrders.length > 0 ? (
              <div style={ordersList}>
                {filteredOrders.map(order => (
                  <div 
                    key={order._id} 
                    style={orderCard}
                    onClick={() => handleViewOrderDetails(order)}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, orderCardHover)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <div style={orderHeader}>
                      <span style={orderNumber}>Order #{order._id.slice(-6)}</span>
                      <span style={orderDate}>{formatDate(order.createdAt)}</span>
                    </div>
                    
                    <div style={restaurantName}>{order.restaurantName}</div>
                    
                    <div style={orderInfo}>
                      <span style={statusBadge(order.status)}>
                        {formatStatus(order.status)}
                      </span>
                      <span style={orderTotal}>${(order.total + 3.99).toFixed(2)}</span>
                    </div>
                    
                    <div style={orderItems}>
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </div>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        style={viewButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrderDetails(order);
                        }}
                      >
                        View Details
                      </button>
                      
                      {['pending', 'confirmed'].includes(order.status) && (
                        <button 
                          style={cancelButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order._id);
                          }}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={noOrders}>
                <p>No orders found with the selected status filter.</p>
              </div>
            )}
          </>
        ) : (
          <div style={emptyState}>
            <p style={emptyStateText}>You haven't placed any orders yet.</p>
            <button style={primaryButton} onClick={() => navigate('/customer/home')}>
              Browse Restaurants
            </button>
          </div>
        )}
        
        {showOrderDetails && renderOrderDetailsModal()}
      </div>
    </div>
  );
};

export default OrdersPage; 