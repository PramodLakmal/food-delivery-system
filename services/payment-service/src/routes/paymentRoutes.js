const express = require('express');
const router = express.Router();
const { 
  getPaymentConfig, 
  createPaymentIntent, 
  confirmPayment, 
  getPaymentDetails, 
  getPaymentByOrderId, 
  processWebhook 
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/config', getPaymentConfig);
router.post('/webhook', processWebhook);

// Protected routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm/:paymentId', protect, confirmPayment);
router.get('/:paymentId', protect, getPaymentDetails);
router.get('/order/:orderId', protect, getPaymentByOrderId);

module.exports = router; 