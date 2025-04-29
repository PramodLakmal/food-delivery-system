const asyncHandler = require('express-async-handler');
const axios = require('axios');
const DeliveryPerson = require('../models/DeliveryPerson');
const Delivery = require('../models/Delivery');

// @desc    Register a delivery person
// @route   POST /api/assignments/register
// @access  Private (registered user with delivery-person role)
const registerDeliveryPerson = asyncHandler(async (req, res) => {
  const { 
    vehicleType, 
    vehicleNumber, 
    licenseNumber 
  } = req.body;

  // Check if already registered
  const existingDeliveryPerson = await DeliveryPerson.findOne({ userId: req.user.id });
  if (existingDeliveryPerson) {
    res.status(400);
    throw new Error('Delivery person profile already exists');
  }

  // Create the delivery person profile
  const deliveryPerson = await DeliveryPerson.create({
    userId: req.user.id,
    name: req.user.name,
    vehicleType,
    vehicleNumber,
    licenseNumber,
    isAvailable: false // Initially not available
  });

  res.status(201).json({
    success: true,
    data: deliveryPerson
  });
});

// @desc    Get delivery person profile
// @route   GET /api/assignments/profile
// @access  Private (Delivery Person)
const getDeliveryPersonProfile = asyncHandler(async (req, res) => {
  const deliveryPerson = await DeliveryPerson.findOne({ userId: req.user.id });

  if (!deliveryPerson) {
    res.status(404);
    throw new Error('Delivery person profile not found');
  }

  res.status(200).json({
    success: true,
    data: deliveryPerson
  });
});

// @desc    Update delivery person availability
// @route   PUT /api/assignments/availability
// @access  Private (Delivery Person)
const updateAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  
  if (isAvailable === undefined) {
    res.status(400);
    throw new Error('isAvailable field is required');
  }

  const deliveryPerson = await DeliveryPerson.findOne({ userId: req.user.id });

  if (!deliveryPerson) {
    res.status(404);
    throw new Error('Delivery person profile not found');
  }

  // Update availability
  const updatedDeliveryPerson = await deliveryPerson.updateAvailability(isAvailable);

  res.status(200).json({
    success: true,
    data: updatedDeliveryPerson
  });
});

// @desc    Update delivery person location
// @route   PUT /api/assignments/location
// @access  Private (Delivery Person)
const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  
  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const deliveryPerson = await DeliveryPerson.findOne({ userId: req.user.id });

  if (!deliveryPerson) {
    res.status(404);
    throw new Error('Delivery person profile not found');
  }

  // Update location
  const updatedDeliveryPerson = await deliveryPerson.updateLocation(lat, lng);

  // Update location for all active deliveries
  try {
    const activeDeliveries = await Delivery.find({
      deliveryPersonId: req.user.id,
      status: { $in: ['assigned', 'picked_up', 'on_the_way', 'arrived'] }
    });

    for (const delivery of activeDeliveries) {
      await delivery.updateLocation(lat, lng);
    }
  } catch (error) {
    console.error(`Failed to update active deliveries locations: ${error.message}`);
  }

  res.status(200).json({
    success: true,
    data: updatedDeliveryPerson
  });
});

// @desc    Get delivery person statistics
// @route   GET /api/assignments/stats
// @access  Private (Delivery Person)
const getDeliveryPersonStats = asyncHandler(async (req, res) => {
  const deliveryPerson = await DeliveryPerson.findOne({ userId: req.user.id });

  if (!deliveryPerson) {
    res.status(404);
    throw new Error('Delivery person profile not found');
  }

  // The issue is likely with the ID format in the database vs JWT token
  console.log('User requesting stats:', req.user);
  
  // Create query that checks for either user.id or user._id
  const deliveryPersonId = req.user.id || req.user._id;
  console.log('Looking for deliveries with deliveryPersonId:', deliveryPersonId);

  // Get count of active deliveries
  const activeCount = await Delivery.countDocuments({
    $or: [
      { deliveryPersonId: deliveryPersonId },
      { deliveryPersonId: String(deliveryPersonId) } // Try string conversion in case of ObjectId vs String mismatch
    ],
    status: { $in: ['assigned', 'picked_up', 'on_the_way', 'arrived'] }
  });

  console.log(`Found ${activeCount} active deliveries for user ${deliveryPersonId}`);

  // Get count of completed deliveries today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completedToday = await Delivery.countDocuments({
    $or: [
      { deliveryPersonId: deliveryPersonId },
      { deliveryPersonId: String(deliveryPersonId) }
    ],
    status: 'delivered',
    actualDeliveryTime: { $gte: today }
  });

  // Calculate total earnings (would normally be from a transactions service)
  // For this simple version, we'll assume $5 base + $1 per km
  const deliveries = await Delivery.find({
    $or: [
      { deliveryPersonId: deliveryPersonId },
      { deliveryPersonId: String(deliveryPersonId) }
    ],
    status: 'delivered'
  });
  
  const basePayment = 5; // $5 base payment
  const ratePerKm = 1; // $1 per km
  
  const totalEarnings = deliveries.reduce((total, delivery) => {
    return total + basePayment + (delivery.distance * ratePerKm);
  }, 0);

  res.status(200).json({
    success: true,
    data: {
      activeDeliveries: activeCount,
      completedToday,
      totalEarnings,
      rating: deliveryPerson.rating,
      totalRatings: deliveryPerson.totalRatings,
      totalDeliveries: deliveryPerson.totalDeliveries,
      isAvailable: deliveryPerson.isAvailable
    }
  });
});

// @desc    Get all available delivery people (for admin)
// @route   GET /api/assignments/available
// @access  Private (Admin)
const getAvailableDeliveryPeople = asyncHandler(async (req, res) => {
  const { lat, lng, distance = 10 } = req.query;
  
  let deliveryPeople;
  
  if (lat && lng) {
    // If coordinates are provided, find delivery persons within the given radius
    const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    deliveryPeople = await DeliveryPerson.findAvailable(parseFloat(distance), coords);
  } else {
    // Otherwise, find all available delivery persons
    deliveryPeople = await DeliveryPerson.find({
      isAvailable: true
    }).sort({ activeDeliveries: 1, rating: -1 });
    
    // Filter out delivery people who have reached their maximum active deliveries
    deliveryPeople = deliveryPeople.filter(person => 
      person.activeDeliveries < (person.maxActiveDeliveries || 3) // Default to 3 if maxActiveDeliveries is not set
    );
  }

  res.status(200).json({
    success: true,
    count: deliveryPeople.length,
    data: deliveryPeople
  });
});

// @desc    Manually assign a delivery to a delivery person (for admin)
// @route   POST /api/assignments/assign
// @access  Private (Admin)
const assignDelivery = asyncHandler(async (req, res) => {
  const { deliveryId, deliveryPersonId } = req.body;
  
  console.log(`Received assignment request: deliveryId=${deliveryId}, deliveryPersonId=${deliveryPersonId}`);
  
  // Validate inputs
  if (!deliveryId || !deliveryPersonId) {
    res.status(400);
    throw new Error('Delivery ID and delivery person ID are required');
  }

  // Find the delivery
  console.log(`Looking for delivery with ID: ${deliveryId}`);
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    console.log(`No delivery found with ID: ${deliveryId}`);
    res.status(404);
    throw new Error('Delivery not found');
  }
  console.log(`Found delivery: ${JSON.stringify(delivery)}`);

  // Check if delivery can be assigned or reassigned
  const validNewAssignmentStatuses = ['pending', 'ready_for_pickup'];
  
  // Updated logic to properly check if this is a new assignment or a reassignment
  const samePersonReassignment = delivery.status === 'assigned' && 
    (delivery.deliveryPersonId === deliveryPersonId || delivery.deliveryPersonId === String(deliveryPersonId));
  
  const differentPersonReassignment = delivery.status === 'assigned' && 
    delivery.deliveryPersonId !== deliveryPersonId && 
    delivery.deliveryPersonId !== String(deliveryPersonId);
  
  // Allow assignment if: 
  // 1. Status is valid for new assignment
  // 2. It's a reassignment to a different person
  // 3. If already assigned to same person, treat as an update
  if (!validNewAssignmentStatuses.includes(delivery.status) && !differentPersonReassignment && !samePersonReassignment) {
    res.status(400);
    throw new Error(`Cannot assign delivery with status: ${delivery.status}. Status must be one of: ${validNewAssignmentStatuses.join(', ')} or be a reassignment`);
  }
  
  // Skip further processing if already assigned to this person
  if (samePersonReassignment) {
    console.log(`Delivery ${deliveryId} is already assigned to delivery person ${deliveryPersonId}`);
    return res.status(200).json({
      success: true,
      data: delivery,
      message: 'Delivery is already assigned to this delivery person'
    });
  }

  // Find the delivery person
  let deliveryPerson;
  
  // First try to find by _id (delivery service's internal ID)
  deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
  
  // If not found, try to find by userId (from auth service)
  if (!deliveryPerson) {
    deliveryPerson = await DeliveryPerson.findOne({ userId: deliveryPersonId });
  }
  
  if (!deliveryPerson) {
    res.status(404);
    throw new Error('Delivery person not found');
  }

  // Check if delivery person is available
  if (!deliveryPerson.isAvailable) {
    res.status(400);
    throw new Error('Delivery person is not available');
  }

  // Check if delivery person has reached their limit
  if (deliveryPerson.activeDeliveries >= deliveryPerson.maxActiveDeliveries) {
    res.status(400);
    throw new Error('Delivery person has reached maximum active deliveries');
  }

  // If this is a reassignment, decrement the previous delivery person's active deliveries count
  if (differentPersonReassignment && delivery.deliveryPersonId) {
    try {
      console.log(`Reassigning delivery from ${delivery.deliveryPersonId} to ${deliveryPersonId}`);
      const previousDeliveryPerson = await DeliveryPerson.findOne({ userId: delivery.deliveryPersonId });
      if (previousDeliveryPerson) {
        console.log(`Found previous delivery person: ${previousDeliveryPerson._id}. Decrementing active deliveries.`);
        await previousDeliveryPerson.decrementActiveDeliveries();
      } else {
        console.log(`Could not find previous delivery person with ID: ${delivery.deliveryPersonId}`);
      }
    } catch (error) {
      console.error(`Error updating previous delivery person's count: ${error.message}`);
      // Continue with the reassignment even if we couldn't update the previous delivery person
    }
  }

  // Update the delivery with the userId rather than the MongoDB _id
  // This is the key fix - always use userId for consistent identification
  console.log(`Assigning delivery ${deliveryId} to delivery person userId: ${deliveryPerson.userId}`);
  delivery.deliveryPersonId = deliveryPerson.userId;
  delivery.status = 'assigned';
  delivery.assignedAt = Date.now();
  await delivery.save();

  // Update the delivery person's active deliveries count
  await deliveryPerson.incrementActiveDeliveries();

  res.status(200).json({
    success: true,
    data: delivery
  });
});

module.exports = {
  registerDeliveryPerson,
  getDeliveryPersonProfile,
  updateAvailability,
  updateLocation,
  getDeliveryPersonStats,
  getAvailableDeliveryPeople,
  assignDelivery
};