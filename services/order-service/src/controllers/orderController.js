const Order = require('../models/Order');
const Cart = require('../models/Cart');
const fetch = require('node-fetch');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      deliveryAddress,
      deliveryInstructions,
      contactPhone,
      notes,
      skipCartClear,
      paymentMethod // 'cash' or 'card'
    } = req.body;

    // Validate required fields
    if (!deliveryAddress || !contactPhone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide delivery address and contact phone'
      });
    }

    // Validate address fields
    if (!deliveryAddress.street || !deliveryAddress.city || 
        !deliveryAddress.state || !deliveryAddress.zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Delivery address must include street, city, state, and zipCode'
      });
    }

    // Validate payment method
    if (!paymentMethod || !['cash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid payment method (cash or card)'
      });
    }

    // Get the user's cart
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Your cart is empty. Please add items before placing an order.'
      });
    }

    // Check if cart has items from multiple restaurants
    if (cart.hasMultipleRestaurants) {
      return res.status(400).json({
        success: false,
        error: 'Cannot place order with items from multiple restaurants'
      });
    }

    // Calculate estimated delivery time (30 minutes from now)
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 30);

    // For card payments with preAuthOrder flag, just return cart info without creating an order
    if (paymentMethod === 'card') {
      // Calculate the total amount for payment processing
      const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      const deliveryFee = 2.99;
      const tax = 1.50;
      const totalAmount = (subtotal + deliveryFee + tax).toFixed(2);

      // Return the prepared order data without creating the order
      return res.status(200).json({
        success: true,
        message: 'Payment required to complete order',
        data: {
          cart: {
            items: cart.items.map(item => ({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              notes: item.notes,
              imageUrl: item.imageUrl
            })),
            total: parseFloat(totalAmount),
            restaurantId: cart.items[0].restaurantId,
            restaurantName: cart.items[0].restaurantName
          },
          deliveryAddress,
          deliveryInstructions: deliveryInstructions || '',
          contactPhone,
          requiresPayment: true
        }
      });
    }

    // For cash payments, create the order immediately
    const order = await Order.create({
      userId: req.user.id,
      restaurantId: cart.items[0].restaurantId,
      restaurantName: cart.items[0].restaurantName,
      items: cart.items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        imageUrl: item.imageUrl
      })),
      total: cart.total,
      deliveryAddress,
      deliveryInstructions: deliveryInstructions || '',
      contactPhone,
      estimatedDeliveryTime,
      notes: notes || '',
      paymentMethod: 'cash',
      paymentStatus: 'pending' // Cash payments are initially pending until delivery
    });

    // Clear the cart for cash payments or if skipCartClear is false
    if (paymentMethod === 'cash' || !skipCartClear) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    }

    // Create delivery record right after order is created
    try {
      // Create a delivery record through the API Gateway
      const apiGatewayURL = process.env.API_GATEWAY_URL || 'http://localhost:5000';
      
      // Prepare delivery data with properly formatted location data
      const deliveryData = {
        orderId: order._id.toString(),
        pickupLocation: {
          coordinates: [0, 0], // Default coordinates if not available
          address: `${order.restaurantName} Restaurant`
        },
        deliveryLocation: {
          coordinates: [0, 0], // Default coordinates if not available
          address: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}`
        },
        restaurantId: order.restaurantId,
        customerId: order.userId,
        distance: 5, // Default distance in km
        notes: deliveryInstructions || ''
      };
      
      console.log('Creating delivery record for new order:', JSON.stringify(deliveryData));
      
      // Make the API call through the API Gateway
      const deliveryResponse = await fetch(`${apiGatewayURL}/api/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        },
        body: JSON.stringify(deliveryData)
      });
      
      if (deliveryResponse.ok) {
        const deliveryResult = await deliveryResponse.json();
        console.log('Successfully created delivery record for new order:', deliveryResult.data._id);
      } else {
        console.error(`Failed to create delivery record for new order: Status ${deliveryResponse.status}`);
      }
    } catch (deliveryError) {
      console.error('Error creating delivery record for new order:', deliveryError);
      // Continue even if delivery creation fails
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create order after successful payment
// @route   POST /api/orders/complete-payment
// @access  Private
exports.createOrderAfterPayment = async (req, res) => {
  try {
    const {
      deliveryAddress,
      deliveryInstructions,
      contactPhone,
      notes,
      paymentId,
      cartItems,
      restaurantId,
      restaurantName,
      total
    } = req.body;

    // Validate required fields
    if (!deliveryAddress || !contactPhone || !cartItems || !restaurantId || !total || !paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order information'
      });
    }

    // Calculate estimated delivery time (30 minutes from now)
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 30);

    // Create order with payment confirmed
    const order = await Order.create({
      userId: req.user.id,
      restaurantId,
      restaurantName,
      items: cartItems,
      total,
      deliveryAddress,
      deliveryInstructions: deliveryInstructions || '',
      contactPhone,
      estimatedDeliveryTime,
      notes: notes || '',
      paymentMethod: 'card',
      paymentStatus: 'completed',
      paymentId
    });

    // Clear the cart after successful payment
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart && cart.items.length > 0) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    }

    // Create delivery record right after order is created
    try {
      // Create a delivery record through the API Gateway
      const apiGatewayURL = process.env.API_GATEWAY_URL || 'http://localhost:5000';
      
      // Prepare delivery data with properly formatted location data
      const deliveryData = {
        orderId: order._id.toString(),
        pickupLocation: {
          coordinates: [0, 0], // Default coordinates if not available
          address: `${restaurantName} Restaurant`
        },
        deliveryLocation: {
          coordinates: [0, 0], // Default coordinates if not available
          address: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}`
        },
        restaurantId: restaurantId,
        customerId: req.user.id,
        distance: 5, // Default distance in km
        notes: deliveryInstructions || ''
      };
      
      console.log('Creating delivery record for new order after payment:', JSON.stringify(deliveryData));
      
      // Make the API call through the API Gateway
      const deliveryResponse = await fetch(`${apiGatewayURL}/api/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        },
        body: JSON.stringify(deliveryData)
      });
      
      if (deliveryResponse.ok) {
        const deliveryResult = await deliveryResponse.json();
        console.log('Successfully created delivery record for new order after payment:', deliveryResult.data._id);
      } else {
        console.error(`Failed to create delivery record for new order after payment: Status ${deliveryResponse.status}`);
      }
    } catch (deliveryError) {
      console.error('Error creating delivery record for new order after payment:', deliveryError);
      // Continue even if delivery creation fails
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in createOrderAfterPayment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get all orders for current user
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get a single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order belongs to current user or user is admin/restaurant-admin
    if (
      order.userId.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      (req.user.role !== 'restaurant-admin' || order.restaurantId.toString() !== req.user.restaurantId)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in getOrder:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin or Restaurant Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a status'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Authorization check - only admin and restaurant-admin can update order status
    // We'll simplify the check for now by only checking the role
    if (req.user.role !== 'admin' && req.user.role !== 'restaurant-admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order'
      });
    }

    // Update status
    order.status = status;
    order.updatedAt = Date.now();
    
    // If the order is delivered and it's a cash payment, update the payment status to completed
    if (status === 'delivered' && order.paymentMethod === 'cash') {
      order.paymentStatus = 'completed';
    }
    
    // If status is changing to ready_for_pickup, create a delivery record
    if (status === 'ready_for_pickup') {
      try {
        // Create a delivery record through the API Gateway
        const apiGatewayURL = process.env.API_GATEWAY_URL || 'http://localhost:5000';
        
        // Prepare delivery data with properly formatted location data
        const deliveryData = {
          orderId: order._id.toString(),
          pickupLocation: {
            coordinates: [0, 0], // Default coordinates if not available
            address: `${order.restaurantName} Restaurant`
          },
          deliveryLocation: {
            coordinates: [0, 0], // Default coordinates if not available
            address: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`
          },
          restaurantId: order.restaurantId,
          customerId: order.userId,
          distance: 5, // Default distance in km
          notes: order.deliveryInstructions || ''
        };
        
        console.log('Creating delivery record with data:', JSON.stringify(deliveryData));
        
        // Make the API call through the API Gateway
        const deliveryResponse = await fetch(`${apiGatewayURL}/api/deliveries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          body: JSON.stringify(deliveryData)
        });
        
        if (!deliveryResponse.ok) {
          const errorText = await deliveryResponse.text();
          console.error(`Failed to create delivery record: Status ${deliveryResponse.status}, Response: ${errorText}`);
          throw new Error(`Delivery service returned status ${deliveryResponse.status}`);
        }
        
        const deliveryResult = await deliveryResponse.json();
        
        if (!deliveryResult.success) {
          console.error('Failed to create delivery record:', deliveryResult.error);
          // We don't fail the order status update if delivery creation fails
          // But we log it for monitoring
        } else {
          console.log('Successfully created delivery record:', deliveryResult.data._id);
        }
      } catch (deliveryError) {
        console.error('Error creating delivery record:', deliveryError);
        // Continue with order status update even if delivery creation fails
      }
    }
    
    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a payment status'
      });
    }

    // Validate paymentStatus
    const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only allow the user who placed the order or an admin to update the payment status
    if (
      order.userId.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order'
      });
    }

    // Update payment status
    order.paymentStatus = paymentStatus;
    if (paymentId) {
      order.paymentId = paymentId;
    }

    order.updatedAt = Date.now();
    await order.save();

    // If payment is completed, clear the cart if it wasn't already cleared
    if (paymentStatus === 'completed') {
      const cart = await Cart.findOne({ userId: req.user.id });
      if (cart && cart.items.length > 0) {
        cart.items = [];
        cart.updatedAt = Date.now();
        await cart.save();
      }
    }

    // If payment failed and the order is new, cancel the order
    if (paymentStatus === 'failed' && order.status === 'pending') {
      order.status = 'cancelled';
      await order.save();
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Cancel an order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order belongs to current user
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order'
      });
    }

    // Check if order is already delivered or cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel an order that is already ${order.status}`
      });
    }

    // Check if order is already in preparation
    if (['preparing', 'ready_for_pickup', 'out_for_delivery'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel an order that is already in preparation or delivery'
      });
    }

    // Update status to cancelled
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get orders for a restaurant
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private (Admin or Restaurant Admin)
exports.getRestaurantOrders = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const { status } = req.query;

    // Authorization check - only admin and restaurant-admin can access restaurant orders
    if (req.user.role !== 'admin' && req.user.role !== 'restaurant-admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access restaurant orders'
      });
    }

    // Build query
    const query = { restaurantId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error in getRestaurantOrders:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get order statistics for a user
// @route   GET /api/orders/stats
// @access  Private
exports.getOrderStats = async (req, res) => {
  try {
    // Get count of orders by status
    const statusCounts = await Order.getCountsByStatus(req.user.id);
    
    // Get recent orders
    const recentOrders = await Order.getRecentOrders(req.user.id, 5);

    // Format status counts for easier frontend consumption
    const formattedStatusCounts = {};
    statusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        statusCounts: formattedStatusCounts,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error in getOrderStats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 