const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Order'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required']
  },
  isCartPayment: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['card', 'wallet', 'paypal'],
    default: 'card'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentIntentId: {
    type: String
  },
  stripeClientSecret: {
    type: String
  },
  receiptUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt whenever a payment is updated
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get payment by order ID
PaymentSchema.statics.getPaymentByOrderId = async function(orderId) {
  return this.findOne({ orderId });
};

module.exports = mongoose.model('Payment', PaymentSchema); 