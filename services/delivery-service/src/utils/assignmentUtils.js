const DeliveryPerson = require('../models/DeliveryPerson');

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {Object} coords1 - First set of coordinates {lat, lng}
 * @param {Object} coords2 - Second set of coordinates {lat, lng}
 * @returns {Number} Distance in kilometers
 */
const calculateDistance = (coords1, coords2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param {Number} value - Value in degrees
 * @returns {Number} Value in radians
 */
const toRad = (value) => {
  return value * Math.PI / 180;
};

/**
 * Assign a delivery person to a delivery based on proximity and availability
 * @param {String} deliveryId - The ID of the delivery to assign
 * @param {Object} pickupCoords - The pickup coordinates {lat, lng}
 * @param {Number} maxDistanceKm - Maximum distance to consider for assignment (default: 10km)
 * @returns {Object} Result of the assignment process {success, deliveryPersonId, message}
 */
const assignDeliveryPerson = async (deliveryId, pickupCoords, maxDistanceKm = 10) => {
  try {
    console.log('Assignment request with coordinates:', JSON.stringify(pickupCoords));
    
    // Validate pickup coordinates
    if (!pickupCoords || (!pickupCoords.lat && !pickupCoords.lng)) {
      console.log('No valid coordinates provided for delivery assignment');
      return {
        success: false,
        message: 'No valid coordinates provided for delivery assignment'
      };
    }
    
    // Ensure coordinates are proper numbers
    const validatedCoords = {
      lat: Number(pickupCoords.lat),
      lng: Number(pickupCoords.lng)
    };
    
    // Check if coordinates are valid numbers
    if (isNaN(validatedCoords.lat) || isNaN(validatedCoords.lng)) {
      console.log('Invalid coordinates for delivery assignment:', validatedCoords);
      return {
        success: false,
        message: 'Invalid coordinates for delivery assignment'
      };
    }
    
    console.log('Using validated coordinates for assignment:', validatedCoords);
    
    // Find available delivery persons
    const availableDeliveryPersons = await DeliveryPerson.findAvailable(maxDistanceKm, validatedCoords);
    
    if (!availableDeliveryPersons || availableDeliveryPersons.length === 0) {
      return {
        success: false,
        message: 'No available delivery persons found in the area'
      };
    }
    
    // Select the best delivery person based on proximity and rating
    // For a simple version, we'll just take the first one in the list (which is sorted by activeDeliveries and rating)
    const selectedDeliveryPerson = availableDeliveryPersons[0];
    
    // Update the delivery person's active deliveries
    await selectedDeliveryPerson.incrementActiveDeliveries();
    
    return {
      success: true,
      deliveryPersonId: selectedDeliveryPerson.userId,
      message: 'Delivery person assigned successfully'
    };
  } catch (error) {
    console.error(`Error assigning delivery person: ${error.message}`);
    return {
      success: false,
      message: `Assignment failed: ${error.message}`
    };
  }
};

module.exports = {
  calculateDistance,
  assignDeliveryPerson
}; 