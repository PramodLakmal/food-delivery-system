const mongoose = require('mongoose');

// Define a consistent GeoPoint schema for coordinates
const GeoPointSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  }
}, { _id: false });

const DeliverySchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  deliveryPersonId: {
    type: String,
    required: false // Initially null until assigned
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled'],
    default: 'pending'
  },
  pickupLocation: {
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    postalCode: String,
    coordinates: GeoPointSchema
  },
  deliveryLocation: {
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    postalCode: String,
    coordinates: GeoPointSchema
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  assignedAt: Date,
  pickedUpAt: Date,
  distance: {
    type: Number, // In kilometers
    default: 0
  },
  notes: String,
  restaurantId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes to improve performance
DeliverySchema.index({ deliveryPersonId: 1, status: 1 });
DeliverySchema.index({ restaurantId: 1 });
DeliverySchema.index({ customerId: 1 });
DeliverySchema.index({ orderId: 1 }, { unique: true });
// Add geospatial index for location-based queries
DeliverySchema.index({ 'pickupLocation.coordinates': '2d' });
DeliverySchema.index({ 'deliveryLocation.coordinates': '2d' });
DeliverySchema.index({ 'currentLocation': '2d' });

// Helper function to ensure consistent coordinate format
function normalizeCoordinates(location) {
  if (!location) return location;

  console.log('Normalizing coordinates for location:', JSON.stringify(location));
  
  // Handle case where coordinates are direct properties on the location
  if (location.lat !== undefined && location.lng !== undefined) {
    if (!location.coordinates) {
      location.coordinates = {
        lat: Number(location.lat),
        lng: Number(location.lng)
      };
    }
    // Clean up the direct properties to avoid duplication
    delete location.lat;
    delete location.lng;
  }
  
  // Handle case where coordinates use latitude/longitude naming
  if (location.latitude !== undefined && location.longitude !== undefined) {
    if (!location.coordinates) {
      location.coordinates = {
        lat: Number(location.latitude),
        lng: Number(location.longitude)
      };
    }
    // Clean up the direct properties to avoid duplication
    delete location.latitude;
    delete location.longitude;
  }
  
  // Ensure coordinates are objects with lat/lng properties
  if (location.coordinates) {
    // Handle GeoJSON format [longitude, latitude]
    if (Array.isArray(location.coordinates)) {
      const [lng, lat] = location.coordinates;
      location.coordinates = {
        lat: Number(lat),
        lng: Number(lng)
      };
    } 
    // Handle case where coordinates have latitude/longitude naming
    else if (location.coordinates.latitude !== undefined && location.coordinates.longitude !== undefined) {
      location.coordinates = {
        lat: Number(location.coordinates.latitude),
        lng: Number(location.coordinates.longitude)
      };
    }
    // Ensure lat/lng are numbers
    else if (location.coordinates.lat !== undefined && location.coordinates.lng !== undefined) {
      location.coordinates.lat = Number(location.coordinates.lat);
      location.coordinates.lng = Number(location.coordinates.lng);
    }
    
    // Validate coordinates - check for zero coordinates
    if (location.coordinates.lat === 0 && location.coordinates.lng === 0) {
      console.warn('WARNING: Both latitude and longitude are zero. This is likely an error in coordinate extraction.');
    }
  }
  
  return location;
}

// Middleware to ensure coordinates are properly formatted before saving
DeliverySchema.pre('save', function(next) {
  console.log('Pre-save middleware running for delivery with order ID:', this.orderId);
  
  // Normalize pickup location coordinates
  if (this.pickupLocation) {
    console.log('Original pickup location:', JSON.stringify(this.pickupLocation));
    this.pickupLocation = normalizeCoordinates(this.pickupLocation);
    console.log('Normalized pickup location:', JSON.stringify(this.pickupLocation));
  }
  
  // Normalize delivery location coordinates
  if (this.deliveryLocation) {
    console.log('Original delivery location:', JSON.stringify(this.deliveryLocation));
    this.deliveryLocation = normalizeCoordinates(this.deliveryLocation);
    console.log('Normalized delivery location:', JSON.stringify(this.deliveryLocation));
  }
  
  // Update distance between pickup and delivery locations if both have valid coordinates
  const hasValidPickupCoords = this.pickupLocation?.coordinates && 
    (this.pickupLocation.coordinates.lat !== 0 || this.pickupLocation.coordinates.lng !== 0);
  
  const hasValidDeliveryCoords = this.deliveryLocation?.coordinates && 
    (this.deliveryLocation.coordinates.lat !== 0 || this.deliveryLocation.coordinates.lng !== 0);
  
  if (hasValidPickupCoords && hasValidDeliveryCoords) {
    console.log('Calculating distance with valid coordinates');
    this.calculateDistance();
  } else {
    console.warn('Cannot calculate distance: Invalid or missing coordinates');
  }
  
  next();
});

// Method to update delivery status
DeliverySchema.methods.updateStatus = async function(newStatus) {
  const allowedStatusUpdates = {
    'pending': ['assigned', 'cancelled'],
    'assigned': ['picked_up', 'cancelled'],
    'picked_up': ['on_the_way', 'cancelled'],
    'on_the_way': ['arrived', 'cancelled'],
    'arrived': ['delivered', 'cancelled']
  };

  if (allowedStatusUpdates[this.status] && allowedStatusUpdates[this.status].includes(newStatus)) {
    this.status = newStatus;
    
    // Record timestamp based on status
    if (newStatus === 'assigned') {
      this.assignedAt = Date.now();
    } else if (newStatus === 'picked_up') {
      this.pickedUpAt = Date.now();
    } else if (newStatus === 'delivered') {
      this.actualDeliveryTime = Date.now();
    }
    
    // Update the updatedAt timestamp
    this.updatedAt = Date.now();
    
    return await this.save();
  } else {
    throw new Error(`Cannot update status from ${this.status} to ${newStatus}`);
  }
};

// Method to update current location
DeliverySchema.methods.updateLocation = async function(lat, lng) {
  this.currentLocation = {
    lat: Number(lat),
    lng: Number(lng),
    updatedAt: Date.now()
  };
  this.updatedAt = Date.now();
  return await this.save();
};

// Helper method to calculate distance between two sets of coordinates
DeliverySchema.methods.calculateDistance = function() {
  if (!this.pickupLocation?.coordinates || !this.deliveryLocation?.coordinates) {
    return null;
  }
  
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(this.deliveryLocation.coordinates.lat - this.pickupLocation.coordinates.lat);
  const dLng = deg2rad(this.deliveryLocation.coordinates.lng - this.pickupLocation.coordinates.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(this.pickupLocation.coordinates.lat)) * Math.cos(deg2rad(this.deliveryLocation.coordinates.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2); 
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  this.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
  return this.distance;
};

// Helper function for distance calculation
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

const Delivery = mongoose.model('Delivery', DeliverySchema);

module.exports = Delivery; 