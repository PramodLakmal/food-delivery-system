const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  notes: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  }
});

// Calculate item subtotal
OrderItemSchema.virtual('subtotal').get(function() {
  return this.price * this.quantity;
});

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Restaurant'
  },
  restaurantName: {
    type: String,
    required: true
  },
  items: [OrderItemSchema],
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card'],
    default: 'card'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    default: null
  },
  total: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  deliveryInstructions: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    required: true
  },
  estimatedDeliveryTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

// Define a pre-save middleware to set the total
OrderSchema.pre('save', function(next) {
  if (this.isModified('items') || !this.total) {
    this.total = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  this.updatedAt = Date.now();
  next();
});

// Include virtuals in json output
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

// Static method to get order counts by status
OrderSchema.statics.getCountsByStatus = async function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
};

// Static method to get recent orders for a user
OrderSchema.statics.getRecentOrders = async function(userId, limit = 5) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get orders for a restaurant
OrderSchema.statics.getRestaurantOrders = async function(restaurantId, status) {
  const query = { restaurantId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', OrderSchema); 