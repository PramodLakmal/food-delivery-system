const mongoose = require('mongoose');

const DeliveryPersonSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  activeDeliveries: {
    type: Number,
    default: 0
  },
  maxActiveDeliveries: {
    type: Number,
    default: 1 // Most delivery people will handle one delivery at a time
  },
  vehicleType: {
    type: String,
    enum: ['bicycle', 'motorbike', 'car', 'van'],
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  lastLocationUpdateTime: {
    type: Date,
    default: Date.now
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
DeliveryPersonSchema.index({ isAvailable: 1 });
DeliveryPersonSchema.index({ userId: 1 }, { unique: true });
DeliveryPersonSchema.index({ currentLocation: '2dsphere' });

// Update the availability status
DeliveryPersonSchema.methods.updateAvailability = async function(isAvailable) {
  this.isAvailable = isAvailable;
  this.updatedAt = Date.now();
  return await this.save();
};

// Update the current location
DeliveryPersonSchema.methods.updateLocation = async function(lat, lng) {
  this.currentLocation = {
    lat,
    lng,
    updatedAt: Date.now()
  };
  this.lastLocationUpdateTime = Date.now();
  this.updatedAt = Date.now();
  return await this.save();
};

// Update the rating
DeliveryPersonSchema.methods.addRating = async function(rating) {
  const newTotalRatings = this.totalRatings + 1;
  const newRating = ((this.rating * this.totalRatings) + rating) / newTotalRatings;
  
  this.totalRatings = newTotalRatings;
  this.rating = Number(newRating.toFixed(1));
  this.updatedAt = Date.now();
  
  return await this.save();
};

// Increment the active deliveries count
DeliveryPersonSchema.methods.incrementActiveDeliveries = async function() {
  this.activeDeliveries += 1;
  this.totalDeliveries += 1;
  
  // Check if at maximum capacity and update availability
  if (this.activeDeliveries >= this.maxActiveDeliveries) {
    this.isAvailable = false;
  }
  
  this.updatedAt = Date.now();
  return await this.save();
};

// Decrement the active deliveries count
DeliveryPersonSchema.methods.decrementActiveDeliveries = async function() {
  if (this.activeDeliveries > 0) {
    this.activeDeliveries -= 1;
    
    // Automatically set to available if below max capacity and user has set themselves as available
    if (this.activeDeliveries < this.maxActiveDeliveries && this.isAvailable) {
      this.isAvailable = true;
    }
    
    this.updatedAt = Date.now();
    return await this.save();
  }
  
  throw new Error('Active deliveries count cannot be negative');
};

// Static method to find available delivery persons
DeliveryPersonSchema.statics.findAvailable = async function(maxDistanceKm = 10, coords = null) {
  let query = {
    isAvailable: true
  };
  
  // If coordinates are provided, find delivery persons within the given radius
  if (coords && coords.lat && coords.lng) {
    // Convert kilometers to radians (Earth's radius is approximately 6371 km)
    const maxDistanceRadians = maxDistanceKm / 6371;
    
    query.currentLocation = {
      $geoWithin: {
        $centerSphere: [[coords.lng, coords.lat], maxDistanceRadians]
      }
    };
  }
  
  const deliveryPersons = await this.find(query).sort({ activeDeliveries: 1, rating: -1 });
  
  // Filter out delivery people who have reached their maximum active deliveries
  return deliveryPersons.filter(person => 
    person.activeDeliveries < person.maxActiveDeliveries
  );
};

const DeliveryPerson = mongoose.model('DeliveryPerson', DeliveryPersonSchema);

module.exports = DeliveryPerson; 