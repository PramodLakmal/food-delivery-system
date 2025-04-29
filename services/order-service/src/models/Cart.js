const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
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
    default: 1,
    min: 1
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: '',
    maxlength: [1000, 'Image URL must be less than 1000 characters']
  },
  notes: {
    type: String,
    default: ''
  }
});

// Calculate item subtotal
CartItemSchema.virtual('subtotal').get(function() {
  return this.price * this.quantity;
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate cart total
CartSchema.virtual('total').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Check if cart has items from multiple restaurants
CartSchema.virtual('hasMultipleRestaurants').get(function() {
  if (this.items.length <= 1) return false;
  
  const restaurantIds = new Set(this.items.map(item => item.restaurantId.toString()));
  return restaurantIds.size > 1;
});

// Get the restaurant ID if all items are from the same restaurant
CartSchema.virtual('singleRestaurantId').get(function() {
  if (this.items.length === 0) return null;
  
  const restaurantIds = new Set(this.items.map(item => item.restaurantId.toString()));
  return restaurantIds.size === 1 ? this.items[0].restaurantId : null;
});

// Include virtuals in json output
CartSchema.set('toJSON', { virtuals: true });
CartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', CartSchema); 