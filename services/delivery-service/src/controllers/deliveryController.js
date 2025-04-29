const asyncHandler = require('express-async-handler');
const Delivery = require('../models/Delivery');
const DeliveryPerson = require('../models/DeliveryPerson');
const { assignDeliveryPerson } = require('../utils/assignmentUtils');

/**
 * Helper function to validate and normalize coordinates
 * @param {Object} location - Location object with potential coordinates
 * @returns {Object} - Location object with normalized coordinates
 */
const validateAndNormalizeCoordinates = (location) => {
  if (!location) {
    console.log('Location is null or undefined');
    return location;
  }
  
  console.log('Original location object:', JSON.stringify(location));
  
  const result = { ...location };
  
  // Ensure we have a coordinates object
  if (!result.coordinates) {
    console.log('No coordinates found in location object, checking for flat coordinates');
    result.coordinates = {};
    
    // Check for flat lat/lng properties
    if (location.lat !== undefined && location.lng !== undefined) {
      console.log(`Found flat lat/lng: lat=${location.lat}, lng=${location.lng}`);
      result.coordinates.lat = Number(location.lat);
      result.coordinates.lng = Number(location.lng);
    } 
    // Check for latitude/longitude naming
    else if (location.latitude !== undefined && location.longitude !== undefined) {
      console.log(`Found latitude/longitude: latitude=${location.latitude}, longitude=${location.longitude}`);
      result.coordinates.lat = Number(location.latitude);
      result.coordinates.lng = Number(location.longitude);
    }
  } 
  // Normalize existing coordinates
  else if (typeof result.coordinates === 'object') {
    console.log('Coordinates object found:', JSON.stringify(result.coordinates));
    
    // Handle array format [lng, lat]
    if (Array.isArray(result.coordinates) && result.coordinates.length >= 2) {
      console.log(`Coordinates in array format: [${result.coordinates[0]}, ${result.coordinates[1]}]`);
      result.coordinates = {
        lat: Number(result.coordinates[1]),
        lng: Number(result.coordinates[0])
      };
    }
    // Handle nested latitude/longitude
    else if (result.coordinates.latitude !== undefined && result.coordinates.longitude !== undefined) {
      console.log(`Nested latitude/longitude: latitude=${result.coordinates.latitude}, longitude=${result.coordinates.longitude}`);
      result.coordinates = {
        lat: Number(result.coordinates.latitude),
        lng: Number(result.coordinates.longitude)
      };
    }
    // Ensure lat/lng are numbers
    else if (result.coordinates.lat !== undefined && result.coordinates.lng !== undefined) {
      console.log(`Found lat/lng in coordinates: lat=${result.coordinates.lat}, lng=${result.coordinates.lng}`);
      result.coordinates.lat = Number(result.coordinates.lat);
      result.coordinates.lng = Number(result.coordinates.lng);
    }
  }
  
  // Special case: nested coordinates might be a string or have unexpected format
  if (result.coordinates && 
      (typeof result.coordinates.lat === 'string' || typeof result.coordinates.lng === 'string')) {
    console.log('Converting string coordinates to numbers');
    result.coordinates.lat = Number(result.coordinates.lat);
    result.coordinates.lng = Number(result.coordinates.lng);
  }
  
  // Validate that we have proper coordinates
  if (!result.coordinates.lat && result.coordinates.lat !== 0 || 
      !result.coordinates.lng && result.coordinates.lng !== 0 ||
      isNaN(result.coordinates.lat) || 
      isNaN(result.coordinates.lng)) {
    console.log('Invalid coordinates detected:', JSON.stringify(result.coordinates));
  } else {
    console.log('Normalized coordinates:', JSON.stringify(result.coordinates));
  }
  
  return result;
};

// @desc    Create a new delivery request
// @route   POST /api/deliveries
// @access  Private
const createDelivery = asyncHandler(async (req, res) => {
  // Log full raw request body for debugging coordinate transfer
  console.log('Raw request body received:', JSON.stringify(req.body));
  
  const {
    orderId,
    pickupLocation: rawPickupLocation,
    deliveryLocation: rawDeliveryLocation,
    restaurantId,
    customerId,
    distance,
    notes
  } = req.body;
  
  console.log('Raw delivery location before normalization:', JSON.stringify(rawDeliveryLocation));
  
  // Normalize coordinates
  const pickupLocation = validateAndNormalizeCoordinates(rawPickupLocation);
  const deliveryLocation = validateAndNormalizeCoordinates(rawDeliveryLocation);

  console.log('Creating delivery with normalized coordinates:');
  console.log('Pickup location after normalization:', JSON.stringify(pickupLocation));
  console.log('Delivery location after normalization:', JSON.stringify(deliveryLocation));

  // Check if delivery for this order already exists
  const existingDelivery = await Delivery.findOne({ orderId });
  if (existingDelivery) {
    console.log(`Delivery for order ${orderId} already exists. Updating instead.`);
    
    // Update existing delivery with new information if provided
    if (pickupLocation) {
      console.log('Updating pickup location with coordinates:', 
                  pickupLocation.coordinates ? JSON.stringify(pickupLocation.coordinates) : 'No coordinates');
      existingDelivery.pickupLocation = pickupLocation;
    }
    
    if (deliveryLocation) {
      console.log('Updating delivery location with coordinates:', 
                  deliveryLocation.coordinates ? JSON.stringify(deliveryLocation.coordinates) : 'No coordinates');
      existingDelivery.deliveryLocation = deliveryLocation;
    }
    
    if (distance) existingDelivery.distance = distance;
    if (notes) existingDelivery.notes = notes;
    
    // Only update status if it's 'pending' to avoid overriding assigned deliveries
    if (existingDelivery.status === 'pending') {
      // Try to assign a delivery person automatically
      try {
        const coords = existingDelivery.pickupLocation?.coordinates;
        console.log('Using coordinates for assignment:', coords ? JSON.stringify(coords) : 'No coordinates');
        const maxDistanceKm = 10;
        
        const assignmentResult = await assignDeliveryPerson(existingDelivery._id, coords, maxDistanceKm);
        
        if (assignmentResult.success) {
          existingDelivery.deliveryPersonId = assignmentResult.deliveryPersonId;
          existingDelivery.status = 'assigned';
          existingDelivery.assignedAt = Date.now();
        }
      } catch (error) {
        console.error(`Auto-assignment failed: ${error.message}`);
      }
    }
    
    existingDelivery.updatedAt = Date.now();
    await existingDelivery.save();
    
    console.log('Updated delivery saved with coordinates:', 
                existingDelivery.pickupLocation?.coordinates ? JSON.stringify(existingDelivery.pickupLocation.coordinates) : 'No pickup coordinates',
                existingDelivery.deliveryLocation?.coordinates ? JSON.stringify(existingDelivery.deliveryLocation.coordinates) : 'No delivery coordinates');
    
    return res.status(200).json({
      success: true,
      data: existingDelivery,
      message: 'Delivery record updated'
    });
  }

  // Calculate estimated delivery time (simple calculation - 5 min base + 2 min per km)
  const baseTime = 5; // minutes
  const timePerKm = 2; // minutes
  const estimatedTime = baseTime + (distance * timePerKm);
  const estimatedDeliveryTime = new Date(Date.now() + estimatedTime * 60 * 1000);

  console.log('Creating new delivery with normalized locations:');
  console.log('Pickup:', JSON.stringify(pickupLocation));
  console.log('Delivery:', JSON.stringify(deliveryLocation));
  
  // Create the delivery with properly formatted locations
  const delivery = await Delivery.create({
    orderId,
    pickupLocation,
    deliveryLocation,
    restaurantId,
    customerId,
    status: 'pending',
    distance: distance || 0,
    notes,
    estimatedDeliveryTime
  });

  console.log('Created delivery with coordinates:', 
              delivery.pickupLocation?.coordinates ? JSON.stringify(delivery.pickupLocation.coordinates) : 'No pickup coordinates',
              delivery.deliveryLocation?.coordinates ? JSON.stringify(delivery.deliveryLocation.coordinates) : 'No delivery coordinates');

  // Try to assign a delivery person automatically
  try {
    const coords = delivery.pickupLocation?.coordinates;
    console.log('Using coordinates for assignment:', coords ? JSON.stringify(coords) : 'No coordinates');
    const maxDistanceKm = 10; // Maximum distance to consider for delivery assignment
    
    const assignmentResult = await assignDeliveryPerson(delivery._id, coords, maxDistanceKm);
    
    if (assignmentResult.success) {
      delivery.deliveryPersonId = assignmentResult.deliveryPersonId;
      delivery.status = 'assigned';
      delivery.assignedAt = Date.now();
      await delivery.save();
    }
  } catch (error) {
    console.error(`Auto-assignment failed: ${error.message}`);
    // Continue without auto-assignment. The delivery will remain in 'pending' status.
  }

  res.status(201).json({
    success: true,
    data: delivery
  });
});

// @desc    Get all deliveries with optional filtering
// @route   GET /api/deliveries
// @access  Private (Admin)
const getDeliveries = asyncHandler(async (req, res) => {
  // Extract query parameters
  const { status, deliveryPersonId, restaurantId, customerId, orderId } = req.query;
  
  // Build query object
  let query = {};
  
  if (status) query.status = status;
  if (deliveryPersonId) query.deliveryPersonId = deliveryPersonId;
  if (restaurantId) query.restaurantId = restaurantId;
  if (customerId) query.customerId = customerId;
  if (orderId) query.orderId = orderId;
  
  // Execute query
  const deliveries = await Delivery.find(query).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: deliveries.length,
    data: deliveries
  });
});

// @desc    Get a single delivery by ID
// @route   GET /api/deliveries/:id
// @access  Private
const getDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    res.status(404);
    throw new Error('Delivery not found');
  }

  res.status(200).json({
    success: true,
    data: delivery
  });
});

// @desc    Get a delivery by order ID
// @route   GET /api/deliveries/order/:orderId
// @access  Private
const getDeliveryByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  console.log(`Looking for delivery with orderId: ${orderId}`);
  
  const delivery = await Delivery.findOne({ orderId });

  if (!delivery) {
    console.log(`No delivery found for orderId: ${orderId}`);
    res.status(404);
    throw new Error('Delivery not found');
  }

  console.log(`Found delivery for orderId ${orderId}: ${delivery._id}`);
  res.status(200).json({
    success: true,
    data: delivery
  });
});

// @desc    Update delivery status
// @route   PUT /api/deliveries/:id/status
// @access  Private (Delivery Person)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    res.status(404);
    throw new Error('Delivery not found');
  }

  // Get user ID in the format stored in the system
  const deliveryPersonId = req.user.id || req.user._id;

  // Check if the logged-in delivery person is assigned to this delivery
  if (req.user.role === 'delivery-person' && 
      delivery.deliveryPersonId !== deliveryPersonId && 
      delivery.deliveryPersonId !== String(deliveryPersonId)) {
    console.log(`Unauthorized: User ${deliveryPersonId} tried to update delivery ${delivery._id} assigned to ${delivery.deliveryPersonId}`);
    res.status(403);
    throw new Error('Not authorized to update this delivery');
  }

  try {
    const updatedDelivery = await delivery.updateStatus(status);
    
    // If delivery is now complete, decrement active deliveries for the delivery person
    if (status === 'delivered' && delivery.deliveryPersonId) {
      try {
        // Try to find delivery person by either ID format
        let deliveryPerson = await DeliveryPerson.findOne({ userId: delivery.deliveryPersonId });
        
        // If not found, try with string conversion
        if (!deliveryPerson) {
          deliveryPerson = await DeliveryPerson.findOne({ userId: String(delivery.deliveryPersonId) });
        }
        
        if (deliveryPerson) {
          await deliveryPerson.decrementActiveDeliveries();
        }
      } catch (error) {
        console.error(`Failed to update delivery person's active deliveries: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: updatedDelivery
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Update delivery location (for real-time tracking)
// @route   PUT /api/deliveries/:id/location
// @access  Private (Delivery Person)
const updateDeliveryLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    res.status(404);
    throw new Error('Delivery not found');
  }

  // Get user ID in the format stored in the system
  const deliveryPersonId = req.user.id || req.user._id;

  // Only the assigned delivery person can update the location
  if (delivery.deliveryPersonId !== deliveryPersonId && 
      delivery.deliveryPersonId !== String(deliveryPersonId)) {
    console.log(`Unauthorized: User ${deliveryPersonId} tried to update location for delivery ${delivery._id} assigned to ${delivery.deliveryPersonId}`);
    res.status(403);
    throw new Error('Not authorized to update this delivery location');
  }

  // Update the current location
  const updatedDelivery = await delivery.updateLocation(lat, lng);

  // Also update the delivery person's location
  try {
    const deliveryPerson = await DeliveryPerson.findOne({ userId: req.user.id });
    if (deliveryPerson) {
      await deliveryPerson.updateLocation(lat, lng);
    }
  } catch (error) {
    console.error(`Failed to update delivery person's location: ${error.message}`);
  }

  res.status(200).json({
    success: true,
    data: updatedDelivery
  });
});

// @desc    Get active deliveries for a delivery person
// @route   GET /api/deliveries/active
// @access  Private (Delivery Person)
const getActiveDeliveries = asyncHandler(async (req, res) => {
  const activeStatuses = ['assigned', 'picked_up', 'on_the_way', 'arrived'];
  
  // The issue is likely with the ID format in the database vs JWT token
  // Add logging to debug
  console.log('User requesting active deliveries:', req.user);
  
  // Create query that checks for either user.id or user._id
  const deliveryPersonId = req.user.id || req.user._id;
  console.log('Looking for deliveries with deliveryPersonId:', deliveryPersonId);
  
  // Find deliveries where deliveryPersonId matches either the user's id or MongoDB _id
  const deliveries = await Delivery.find({
    $or: [
      { deliveryPersonId: deliveryPersonId },
      { deliveryPersonId: String(deliveryPersonId) } // Try string conversion in case of ObjectId vs String mismatch
    ],
    status: { $in: activeStatuses }
  }).sort({ assignedAt: 1 });

  console.log(`Found ${deliveries.length} active deliveries for user ${deliveryPersonId}`);
  
  // Enhance delivery data with more details
  const enhancedDeliveries = await Promise.all(deliveries.map(async (delivery) => {
    // Convert to plain object so we can add additional fields
    const enhancedDelivery = delivery.toObject();
    
    try {
      // Fetch order details if not already present
      if (delivery.orderId && (!enhancedDelivery.restaurantName || !enhancedDelivery.customerName)) {
        console.log(`Fetching additional details for order ${delivery.orderId}`);
        
        // Attempt to fetch order details through API Gateway
        const apiGatewayURL = process.env.API_GATEWAY_URL || 'http://localhost:5000';
        const orderResponse = await fetch(`${apiGatewayURL}/api/orders/${delivery.orderId}`, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          
          if (orderData.success && orderData.data) {
            const order = orderData.data;
            
            // Add order details to delivery
            enhancedDelivery.restaurantName = order.restaurantName || enhancedDelivery.restaurantName;
            enhancedDelivery.customerName = order.customerName || 'Customer';
            enhancedDelivery.contactPhone = order.contactPhone;
            
            // Add additional addresses if not already present
            if (order.deliveryAddress && !enhancedDelivery.deliveryAddress) {
              enhancedDelivery.deliveryAddress = order.deliveryAddress;
            }
            
            // Add special instructions
            if (order.deliveryInstructions) {
              enhancedDelivery.deliveryInstructions = order.deliveryInstructions;
            }
            
            console.log(`Enhanced delivery ${delivery._id} with order details`);
          }
        } else {
          console.error(`Failed to fetch order details for ${delivery.orderId}: Status ${orderResponse.status}`);
        }
      }
    } catch (error) {
      console.error(`Error enhancing delivery data for ${delivery._id}:`, error);
      // Continue with basic delivery data if enhancement fails
    }
    
    return enhancedDelivery;
  }));
  
  res.status(200).json({
    success: true,
    count: enhancedDeliveries.length,
    data: enhancedDeliveries
  });
});

// @desc    Get delivery history for a delivery person
// @route   GET /api/deliveries/history
// @access  Private (Delivery Person)
const getDeliveryHistory = asyncHandler(async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  
  // The issue is likely with the ID format in the database vs JWT token
  console.log('User requesting delivery history:', req.user);
  
  // Create query that checks for either user.id or user._id
  const deliveryPersonId = req.user.id || req.user._id;
  console.log('Looking for delivery history with deliveryPersonId:', deliveryPersonId);
  
  const deliveries = await Delivery.find({
    $or: [
      { deliveryPersonId: deliveryPersonId },
      { deliveryPersonId: String(deliveryPersonId) } // Try string conversion in case of ObjectId vs String mismatch
    ],
    status: 'delivered'
  })
  .sort({ actualDeliveryTime: -1 })
  .skip(parseInt(offset))
  .limit(parseInt(limit));

  const total = await Delivery.countDocuments({
    $or: [
      { deliveryPersonId: deliveryPersonId },
      { deliveryPersonId: String(deliveryPersonId) }
    ],
    status: 'delivered'
  });

  console.log(`Found ${deliveries.length} delivery history items for user ${deliveryPersonId} (total: ${total})`);

  res.status(200).json({
    success: true,
    count: deliveries.length,
    total,
    data: deliveries
  });
});

// @desc    Rate a delivery (by customer)
// @route   POST /api/deliveries/:id/rate
// @access  Private (Customer)
const rateDelivery = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  
  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    res.status(404);
    throw new Error('Delivery not found');
  }

  // Check if the current user is the customer for this delivery
  if (delivery.customerId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to rate this delivery');
  }

  // Check if the delivery is completed
  if (delivery.status !== 'delivered') {
    res.status(400);
    throw new Error('Cannot rate a delivery that is not completed');
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Update the delivery person's rating
  try {
    const deliveryPerson = await DeliveryPerson.findOne({ userId: delivery.deliveryPersonId });
    if (deliveryPerson) {
      await deliveryPerson.addRating(rating);
    }
  } catch (error) {
    console.error(`Failed to update delivery person's rating: ${error.message}`);
  }

  res.status(200).json({
    success: true,
    message: 'Delivery rated successfully'
  });
});

module.exports = {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  updateDeliveryLocation,
  getActiveDeliveries,
  getDeliveryHistory,
  rateDelivery
}; 